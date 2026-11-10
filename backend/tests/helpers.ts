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
import { testOutbox } from '../src/services/mail.service';

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

/** Code à 6 chiffres du dernier mail de connexion envoyé à `email` (outbox de test). */
export function lastLoginCode(email: string): string {
  const mail = [...testOutbox].reverse().find((m) => m.to === email);
  const code = mail?.text.match(/\b(\d{6})\b/)?.[1];
  if (!code) throw new Error(`Aucun code envoyé à ${email}`);
  return code;
}

let adminCounter = 0;

/** Crée un admin directement en base (comme le script create-admin), en renvoie l'e-mail. */
export async function createAdmin(password = 'admin-password'): Promise<string> {
  adminCounter += 1;
  const email = `admin${adminCounter}-${Date.now()}@example.com`;
  await User.create({ email, name: 'Admin', role: 'admin', passwordHash: await bcrypt.hash(password, 4) });
  return email;
}

/** Crée un admin puis le connecte par e-mail, double authentification comprise. */
export async function loginAdmin(): Promise<{ token: string; userId: string }> {
  const email = await createAdmin();
  const first = await request(app).post('/api/auth/login').send({ email, password: 'admin-password' });
  const response = await request(app)
    .post('/api/auth/login/verify')
    .send({ challengeToken: first.body.challengeToken, code: lastLoginCode(email) });
  if (response.status !== 200) {
    throw new Error(`Connexion admin échouée (${response.status}) : ${JSON.stringify(response.body)}`);
  }
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
