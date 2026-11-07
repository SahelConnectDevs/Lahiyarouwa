/* eslint-disable no-console -- script en ligne de commande */
import { once } from 'node:events';
import { createWriteStream } from 'node:fs';
import { chmod, mkdir, readdir, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createGzip } from 'node:zlib';

import mongoose from 'mongoose';

import { connectDatabase, disconnectDatabase } from '../config/db';

/**
 * Sauvegarde complète de la base, sans outil externe (pas de mongodump à
 * installer en root sur le VPS) : chaque document est écrit en EJSON — qui
 * conserve ObjectId et dates — une ligne par document, le tout compressé
 * en gzip. Restauration : src/scripts/restore.ts.
 *
 * Sur le VPS (cron de l'utilisateur deploy, voir backend/README.md) :
 *   BACKUP_DIR=/var/www/api.lahiyarouwadayaro.com/shared/backups npm run backup
 */

export const BACKUP_FORMAT = 'lahiyarouwa-backup';
export const BACKUP_PREFIX = 'lahiyarouwa-';
export const BACKUP_SUFFIX = '.ejson.gz';

const { EJSON } = mongoose.mongo.BSON;

/** Écrit la sauvegarde dans `file` et renvoie le nombre de documents par collection. */
export async function backupDatabase(db: mongoose.mongo.Db, file: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  // Fichier temporaire renommé à la fin : une sauvegarde interrompue ne
  // laisse jamais un fichier tronqué qui ressemblerait à une sauvegarde valide.
  const tmp = `${file}.partial`;
  const output = createWriteStream(tmp, { mode: 0o600 });
  const gzip = createGzip();
  gzip.pipe(output);

  const write = async (line: string) => {
    if (!gzip.write(`${line}\n`)) await once(gzip, 'drain');
  };

  try {
    const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
      .map((c) => c.name)
      .filter((name) => !name.startsWith('system.'))
      .sort();
    // La liste complète (collections vides comprises) permet à la
    // restauration de remettre aussi à zéro ce qui était vide.
    await write(JSON.stringify({ format: BACKUP_FORMAT, version: 1, createdAt: new Date(), collections }));

    for (const name of collections) {
      counts[name] = 0;
      for await (const doc of db.collection(name).find({})) {
        await write(JSON.stringify({ c: name, d: EJSON.serialize(doc, { relaxed: false }) }));
        counts[name] += 1;
      }
    }
    gzip.end();
    await once(output, 'close');
    await rename(tmp, file);
    await chmod(file, 0o600);
    return counts;
  } catch (error) {
    gzip.destroy();
    output.destroy();
    await unlink(tmp).catch(() => undefined);
    throw error;
  }
}

/** Supprime les sauvegardes les plus anciennes pour n'en garder que `keep`. */
export async function pruneBackups(dir: string, keep: number): Promise<string[]> {
  const files = (await readdir(dir))
    .filter((f) => f.startsWith(BACKUP_PREFIX) && f.endsWith(BACKUP_SUFFIX))
    .sort(); // horodatage dans le nom : l'ordre alphabétique est chronologique
  const removed = files.slice(0, Math.max(0, files.length - keep));
  await Promise.all(removed.map((f) => unlink(path.join(dir, f))));
  return removed;
}

/** `lahiyarouwa-20261107-023000.ejson.gz` (heure UTC). */
export function backupFileName(date = new Date()): string {
  const stamp = date.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  return `${BACKUP_PREFIX}${stamp}${BACKUP_SUFFIX}`;
}

if (require.main === module) {
  (async () => {
    const dir = process.env.BACKUP_DIR;
    if (!dir) throw new Error('BACKUP_DIR manquant (dossier des sauvegardes).');
    const keep = Number(process.env.BACKUP_KEEP ?? 14);

    await mkdir(dir, { recursive: true, mode: 0o700 });
    await connectDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('Connexion MongoDB indisponible.');

    const file = path.join(dir, backupFileName());
    const started = Date.now();
    const counts = await backupDatabase(db, file);
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    const removed = await pruneBackups(dir, keep);
    console.log(
      `[${new Date().toISOString()}] Sauvegarde OK : ${path.basename(file)} — ${total} document(s), ` +
        `${Object.keys(counts).length} collection(s), ${Date.now() - started} ms` +
        (removed.length ? ` ; ${removed.length} ancienne(s) supprimée(s)` : ''),
    );
    await disconnectDatabase();
  })().catch(async (error: unknown) => {
    console.error(`[${new Date().toISOString()}] Échec de la sauvegarde :`, error);
    await disconnectDatabase();
    process.exit(1);
  });
}
