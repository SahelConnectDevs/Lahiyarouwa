import { mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import mongoose from 'mongoose';
import request from 'supertest';

import { Conseil } from '../src/models/Conseil';
import { Pregnancy } from '../src/models/Pregnancy';
import { User } from '../src/models/User';
import { backupDatabase, backupFileName, pruneBackups } from '../src/scripts/backup';
import { inspectBackup, restoreDatabase } from '../src/scripts/restore';
import { app, bearer, isoDaysAgo, registerUser, useTestDatabase } from './helpers';

describe('Sauvegarde / restauration', () => {
  useTestDatabase();

  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'lahiyarouwa-backup-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const db = () => {
    if (!mongoose.connection.db) throw new Error('pas de connexion');
    return mongoose.connection.db;
  };

  it('restaure exactement les données sauvegardées (ObjectId et dates compris)', async () => {
    const { token, userId } = await registerUser({ name: 'Mariama' });
    // DDR relative : l'API refuse une DDR de plus de 44 semaines.
    await request(app)
      .put('/api/grossesse')
      .set(bearer(token))
      .send({ ddr: isoDaysAgo(70) })
      .expect(201);
    const before = await Pregnancy.findOne({ user: userId }).lean();

    const file = path.join(dir, backupFileName());
    const counts = await backupDatabase(db(), file);
    expect(counts.users).toBe(1);
    expect(counts.pregnancies).toBe(1);
    expect((await stat(file)).size).toBeGreaterThan(0);
    expect(await inspectBackup(file)).toEqual(counts);

    // Perte de données simulée : une collection vidée, une autre modifiée,
    // et un ajout dans une collection qui était vide lors de la sauvegarde.
    await Pregnancy.deleteMany({});
    await User.updateOne({ _id: userId }, { name: 'Modifié' });
    await Conseil.create({ titre: 'Ajout', contenu: 'Après la sauvegarde', categorie: 'general' });

    await restoreDatabase(db(), file);

    expect(await Conseil.countDocuments()).toBe(0);

    const user = await User.findById(userId).lean();
    expect(user?.name).toBe('Mariama');
    const after = await Pregnancy.findOne({ user: userId }).lean();
    expect(after?._id.equals(before!._id)).toBe(true);
    expect(after?.user).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(after?.ddr).toBeInstanceOf(Date);
    expect(after?.ddr.getTime()).toBe(before!.ddr.getTime());

    // L'app fonctionne avec les données restaurées (mot de passe compris).
    await request(app).post('/api/auth/login').send({ phone: user!.phone, password: 'secret1' }).expect(200);
  });

  it("refuse un fichier qui n'est pas une sauvegarde", async () => {
    const file = path.join(dir, 'faux.ejson.gz');
    const { gzipSync } = await import('node:zlib');
    await writeFile(file, gzipSync('{"hello":"world"}\n'));
    await expect(inspectBackup(file)).rejects.toThrow("n'est pas une sauvegarde");
  });

  it('ne garde que les N sauvegardes les plus récentes', async () => {
    const names = ['20261101', '20261102', '20261103', '20261104'].map(
      (d) => `lahiyarouwa-${d}-023000.ejson.gz`,
    );
    await Promise.all([...names, 'autre-fichier.txt'].map((n) => writeFile(path.join(dir, n), 'x')));

    const removed = await pruneBackups(dir, 2);

    expect(removed).toEqual(names.slice(0, 2));
    expect((await readdir(dir)).sort()).toEqual(['autre-fichier.txt', ...names.slice(2)].sort());
  });

  it('nomme les fichiers avec un horodatage UTC triable', () => {
    expect(backupFileName(new Date('2026-11-07T02:30:05Z'))).toBe('lahiyarouwa-20261107-023005.ejson.gz');
  });
});
