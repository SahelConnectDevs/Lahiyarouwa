/* eslint-disable no-console -- script en ligne de commande */
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { createGunzip } from 'node:zlib';

import mongoose from 'mongoose';

import { connectDatabase, disconnectDatabase } from '../config/db';
import { BACKUP_FORMAT } from './backup';

/**
 * Restaure une sauvegarde faite par src/scripts/backup.ts dans la base de
 * MONGODB_URI. Les collections présentes dans la sauvegarde sont vidées puis
 * remplies : c'est un retour complet à l'état sauvegardé pour ces collections.
 *
 *   npm run restore -- <fichier.ejson.gz> --confirm
 *
 * Sans --confirm, le script se contente de lire le fichier et d'afficher ce
 * qu'il contient (vérification d'une sauvegarde sans rien modifier).
 */

const { EJSON } = mongoose.mongo.BSON;
const BATCH = 500;

type Doc = mongoose.mongo.Document;

/**
 * Lit la sauvegarde : `onCollections` reçoit d'abord la liste complète des
 * collections sauvegardées (vides comprises), puis `onBatch` les documents
 * par paquets d'une même collection.
 */
async function readBackup(
  file: string,
  onCollections: (collections: string[]) => Promise<void>,
  onBatch: (collection: string, docs: Doc[]) => Promise<void>,
): Promise<Record<string, number>> {
  const lines = createInterface({ input: createReadStream(file).pipe(createGunzip()), crlfDelay: Infinity });
  const counts: Record<string, number> = {};
  let header = true;
  let current: string | null = null;
  let batch: Doc[] = [];

  const flush = async () => {
    if (current && batch.length) await onBatch(current, batch);
    batch = [];
  };

  for await (const line of lines) {
    if (!line) continue;
    if (header) {
      const meta = JSON.parse(line) as { format?: string; collections?: string[] };
      if (meta.format !== BACKUP_FORMAT || !Array.isArray(meta.collections)) {
        throw new Error("Ce fichier n'est pas une sauvegarde Lahiyarouwa.");
      }
      for (const name of meta.collections) counts[name] = 0;
      await onCollections(meta.collections);
      header = false;
      continue;
    }
    const { c, d } = JSON.parse(line) as { c: string; d: Doc };
    if (c !== current) {
      await flush();
      current = c;
    }
    batch.push(EJSON.deserialize(d, { relaxed: false }) as Doc);
    counts[c] = (counts[c] ?? 0) + 1;
    if (batch.length >= BATCH) await flush();
  }
  await flush();
  if (header) throw new Error('Sauvegarde vide ou illisible.');
  return counts;
}

/** Compte les documents d'une sauvegarde sans toucher à la base. */
export function inspectBackup(file: string): Promise<Record<string, number>> {
  return readBackup(
    file,
    async () => undefined,
    async () => undefined,
  );
}

/**
 * Vide chaque collection sauvegardée (même celles qui étaient vides) puis
 * la remplit avec les documents de la sauvegarde.
 */
export async function restoreDatabase(db: mongoose.mongo.Db, file: string): Promise<Record<string, number>> {
  return readBackup(
    file,
    async (collections) => {
      for (const name of collections) await db.collection(name).deleteMany({});
    },
    async (collection, docs) => {
      await db.collection(collection).insertMany(docs, { ordered: true });
    },
  );
}

if (require.main === module) {
  (async () => {
    const [file] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
    const confirm = process.argv.includes('--confirm');
    if (!file) throw new Error('Usage : npm run restore -- <fichier.ejson.gz> [--confirm]');

    if (!confirm) {
      const counts = await inspectBackup(file);
      console.log('Contenu de la sauvegarde (rien n’a été modifié) :', counts);
      console.log('Relancer avec --confirm pour restaurer dans la base de MONGODB_URI.');
      return;
    }

    await connectDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('Connexion MongoDB indisponible.');
    const counts = await restoreDatabase(db, file);
    console.log('Restauration terminée :', counts);
    await disconnectDatabase();
  })().catch(async (error: unknown) => {
    console.error('Échec de la restauration :', error);
    await disconnectDatabase();
    process.exit(1);
  });
}
