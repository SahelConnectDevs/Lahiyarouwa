// Outils partagés par les fichiers de test : MongoDB en mémoire
// (mongodb-memory-server, pas de Mongo local ni de service Docker en CI) et
// création rapide d'utilisatrices authentifiées.
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

import { createApp } from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/db';
import { User } from '../src/models/User';

export const app = createApp();

/** À appeler en tête de chaque fichier de test. */
export function useTestDatabase(): void {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDatabase(mongoServer.getUri());
    // Crée les index (uniques partiels) avant les tests qui en dépendent.
    await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
  });

  afterEach(async () => {
    await Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));
  });

  afterAll(async () => {
    await disconnectDatabase();
    await mongoServer.stop();
  });
}

let phoneCounter = 0;

/** Inscrit une utilisatrice via l'API et renvoie son token. */
export async function registerUser(
  overrides: Partial<{ name: string; phone: string; password: string }> = {},
): Promise<{ token: string; userId: string; phone: string }> {
  phoneCounter += 1;
  const phone = overrides.phone ?? `9${String(phoneCounter).padStart(7, '0')}`;
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name: overrides.name ?? 'Awa', phone, password: overrides.password ?? 'secret1' });
  if (response.status !== 201) {
    throw new Error(`Inscription échouée (${response.status}) : ${JSON.stringify(response.body)}`);
  }
  return { token: response.body.token, userId: response.body.user.id, phone: response.body.user.phone };
}

/** Crée un admin directement en base (comme le script create-admin) puis le connecte par e-mail. */
export async function loginAdmin(): Promise<{ token: string; userId: string }> {
  const email = `admin${Date.now()}@example.com`;
  await User.create({
    email,
    name: 'Admin',
    role: 'admin',
    passwordHash: await bcrypt.hash('admin-password', 4),
  });
  const response = await request(app).post('/api/auth/login').send({ email, password: 'admin-password' });
  return { token: response.body.token, userId: response.body.user.id };
}

/** Inscrit un compte puis le passe en agent communautaire (comme le ferait un admin). */
export async function registerRelais(
  name = 'Moussa',
): Promise<{ token: string; userId: string; phone: string }> {
  const account = await registerUser({ name });
  await User.updateOne({ _id: account.userId }, { role: 'relais' });
  return account;
}

/** Rattache une bénéficiaire à un agent et règle son consentement, directement en base. */
export async function assignToRelais(
  userId: string,
  relaisId: string,
  partageRelais: boolean,
): Promise<void> {
  await User.updateOne({ _id: userId }, { relais: relaisId, partageRelais });
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Date ISO (AAAA-MM-JJ) décalée de `days` jours par rapport à aujourd'hui. */
export function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
