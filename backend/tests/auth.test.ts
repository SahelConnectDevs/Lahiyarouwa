// Modèle à suivre pour les tests des autres features backend : app Express
// en mémoire (pas de vrai listen), MongoDB en mémoire (mongodb-memory-server,
// pas de dépendance à un Mongo local ou à un service Docker en CI).
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { createApp } from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/db';
import { User } from '../src/models/User';

let mongoServer: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDatabase(mongoServer.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

describe('POST /api/auth/register', () => {
  it('crée un compte et renvoie { token, user } comme attendu par le client mobile', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Awa', email: 'awa@example.com', password: 'secret1' });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ email: 'awa@example.com', name: 'Awa', role: 'user' });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('refuse un email déjà utilisé (409)', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Awa', email: 'awa@example.com', password: 'secret1' });

    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Awa 2', email: 'awa@example.com', password: 'secret1' });

    expect(response.status).toBe(409);
    expect(response.body.message).toEqual(expect.any(String));
  });

  it('rejette un email invalide au format { message, errors } attendu par ValidationException', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Awa', email: 'pas-un-email', password: 'secret1' });

    expect(response.status).toBe(422);
    expect(response.body.errors).toHaveProperty('email');
  });
});

describe('POST /api/auth/login puis GET /api/auth/me', () => {
  async function registerAwa(): Promise<void> {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Awa', email: 'awa@example.com', password: 'secret1' });
  }

  it('connecte un utilisateur existant et renvoie son profil via le token', async () => {
    await registerAwa();

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'awa@example.com', password: 'secret1' });

    expect(loginResponse.status).toBe(200);
    const token = loginResponse.body.token as string;

    const meResponse = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toMatchObject({ email: 'awa@example.com', name: 'Awa' });
  });

  it('refuse un mauvais mot de passe (401)', async () => {
    await registerAwa();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'awa@example.com', password: 'wrong' });

    expect(response.status).toBe(401);
  });

  it('refuse /me sans token (401)', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });

  it('refuse /me avec un token invalide (401)', async () => {
    const response = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(response.status).toBe(401);
  });
});
