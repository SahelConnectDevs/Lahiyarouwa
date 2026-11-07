// Modèle à suivre pour les tests des autres features backend : app Express
// en mémoire (pas de vrai listen), MongoDB en mémoire — voir tests/helpers.ts.
import request from 'supertest';

import { Child } from '../src/models/Child';
import { Pregnancy } from '../src/models/Pregnancy';
import { User } from '../src/models/User';
import { app, bearer, isoDaysAgo, registerUser, useTestDatabase } from './helpers';

useTestDatabase();

describe('POST /api/auth/register', () => {
  it('crée un compte par téléphone et renvoie { token, user } comme attendu par le client mobile', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Awa', phone: '90 12 34 56', password: 'secret1', birthDate: '1998-04-02' });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      name: 'Awa',
      phone: '+22790123456',
      email: null,
      role: 'user',
    });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('refuse un numéro déjà utilisé, même saisi dans un autre format (409)', async () => {
    await registerUser({ phone: '90123456' });

    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Awa 2', phone: '+227 90 12 34 56', password: 'secret1' });

    expect(response.status).toBe(409);
    expect(response.body.message).toEqual(expect.any(String));
  });

  it('rejette un téléphone invalide au format { message, errors } attendu par ValidationException', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Awa', phone: '12', password: 'secret1' });

    expect(response.status).toBe(422);
    expect(response.body.errors).toHaveProperty('phone');
  });

  it("ignore un champ non prévu comme role: 'admin' (pas d'élévation de privilège)", async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Awa', phone: '90000001', password: 'secret1', role: 'admin' });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('user');
  });
});

describe('POST /api/auth/login puis GET /api/auth/me', () => {
  it('connecte par téléphone et renvoie le profil via le token', async () => {
    await registerUser({ phone: '90123456' });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ phone: '90123456', password: 'secret1' });
    expect(loginResponse.status).toBe(200);

    const meResponse = await request(app).get('/api/auth/me').set(bearer(loginResponse.body.token));
    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toMatchObject({ phone: '+22790123456', name: 'Awa' });
  });

  it('refuse un mauvais mot de passe (401)', async () => {
    await registerUser({ phone: '90123456' });
    const response = await request(app)
      .post('/api/auth/login')
      .send({ phone: '90123456', password: 'wrong' });
    expect(response.status).toBe(401);
  });

  it('répond pareil pour un numéro inconnu (pas d’énumération des comptes)', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ phone: '99999999', password: 'secret1' });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Identifiants invalides.');
  });

  it('exige un téléphone ou un e-mail (422)', async () => {
    const response = await request(app).post('/api/auth/login').send({ password: 'secret1' });
    expect(response.status).toBe(422);
    expect(response.body.errors).toHaveProperty('phone');
  });

  it('refuse un compte désactivé (403)', async () => {
    await registerUser({ phone: '90123456' });
    await User.updateOne({ phone: '+22790123456' }, { isActive: false });
    const response = await request(app)
      .post('/api/auth/login')
      .send({ phone: '90123456', password: 'secret1' });
    expect(response.status).toBe(403);
  });

  it('refuse /me sans token ou avec un token invalide (401)', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set(bearer('not-a-real-token'))).status).toBe(401);
  });
});

describe('Gestion du compte', () => {
  it('met à jour le profil (PATCH /me)', async () => {
    const { token } = await registerUser();
    const response = await request(app)
      .patch('/api/auth/me')
      .set(bearer(token))
      .send({ name: 'Awa Moussa', email: 'Awa@Example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'Awa Moussa', email: 'awa@example.com' });
  });

  it('change le mot de passe et invalide les anciens tokens', async () => {
    const { token, phone } = await registerUser();

    const response = await request(app)
      .post('/api/auth/me/password')
      .set(bearer(token))
      .send({ currentPassword: 'secret1', newPassword: 'nouveau-secret' });
    expect(response.status).toBe(200);

    expect((await request(app).get('/api/auth/me').set(bearer(token))).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set(bearer(response.body.token))).status).toBe(200);
    const relogin = await request(app).post('/api/auth/login').send({ phone, password: 'nouveau-secret' });
    expect(relogin.status).toBe(200);
  });

  it('refuse le changement si le mot de passe actuel est faux (422)', async () => {
    const { token } = await registerUser();
    const response = await request(app)
      .post('/api/auth/me/password')
      .set(bearer(token))
      .send({ currentPassword: 'faux', newPassword: 'nouveau-secret' });
    expect(response.status).toBe(422);
    expect(response.body.errors).toHaveProperty('currentPassword');
  });

  it('supprime le compte et toutes ses données (DELETE /me)', async () => {
    const { token, userId } = await registerUser();
    await request(app)
      .put('/api/grossesse')
      .set(bearer(token))
      .send({ ddr: isoDaysAgo(70) });
    await request(app)
      .post('/api/enfants')
      .set(bearer(token))
      .send({ prenom: 'Ali', dateNaissance: isoDaysAgo(400) });

    expect(
      (await request(app).delete('/api/auth/me').set(bearer(token)).send({ password: 'faux' })).status,
    ).toBe(422);

    const response = await request(app)
      .delete('/api/auth/me')
      .set(bearer(token))
      .send({ password: 'secret1' });
    expect(response.status).toBe(204);
    expect(await User.exists({ _id: userId })).toBeNull();
    expect(await Pregnancy.countDocuments({ user: userId })).toBe(0);
    expect(await Child.countDocuments({ user: userId })).toBe(0);
    expect((await request(app).get('/api/auth/me').set(bearer(token))).status).toBe(401);
  });
});
