// Création de comptes et mots de passe provisoires depuis l'admin-web.
import request from 'supertest';

import { LoginChallenge } from '../src/models/LoginChallenge';
import { User } from '../src/models/User';
import {
  app,
  bearer,
  createAdmin,
  loginAdmin,
  registerRelais,
  registerUser,
  useTestDatabase,
} from './helpers';

useTestDatabase();

describe('POST /api/admin/users', () => {
  it('crée un agent avec un mot de passe provisoire à 8 chiffres, utilisable pour se connecter', async () => {
    const admin = await loginAdmin();
    const response = await request(app)
      .post('/api/admin/users')
      .set(bearer(admin.token))
      .send({ name: 'Moussa', phone: '90 11 22 33', role: 'relais', secteur: 'Tillabéri' });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      name: 'Moussa',
      phone: '+22790112233',
      role: 'relais',
      secteur: 'Tillabéri',
      mustChangePassword: true,
      partageRelais: false,
    });
    expect(response.body.temporaryPassword).toMatch(/^\d{8}$/);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ phone: '90112233', password: response.body.temporaryPassword });
    expect(login.status).toBe(200);
    expect(login.body.user.mustChangePassword).toBe(true);

    // Le changement de mot de passe lève l'obligation.
    const changed = await request(app)
      .post('/api/auth/me/password')
      .set(bearer(login.body.token))
      .send({ currentPassword: response.body.temporaryPassword, newPassword: 'mon-secret' });
    expect(changed.status).toBe(200);
    expect(changed.body.user.mustChangePassword).toBe(false);
  });

  it('crée une bénéficiaire rattachée à un agent, sans consentement au partage', async () => {
    const admin = await loginAdmin();
    const agent = await registerRelais();
    const response = await request(app)
      .post('/api/admin/users')
      .set(bearer(admin.token))
      .send({ name: 'Fatouma', phone: '91000099', role: 'user', relais: agent.userId });
    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ relais: agent.userId, partageRelais: false });
  });

  it("refuse un numéro déjà inscrit (422 sur phone) et un agent qui n'en est pas un", async () => {
    const admin = await loginAdmin();
    const existing = await registerUser({ phone: '90777777' });

    const dup = await request(app)
      .post('/api/admin/users')
      .set(bearer(admin.token))
      .send({ name: 'X', phone: '+227 90 77 77 77', role: 'user' });
    expect(dup.status).toBe(422);
    expect(dup.body.errors).toHaveProperty('phone');

    const notAgent = await request(app)
      .post('/api/admin/users')
      .set(bearer(admin.token))
      .send({ name: 'Y', phone: '90777778', role: 'user', relais: existing.userId });
    expect(notAgent.status).toBe(422);
    expect(notAgent.body.errors).toHaveProperty('relais');
  });

  it("ne permet pas de créer un admin, ni de choisir le consentement à la place de l'utilisatrice", async () => {
    const admin = await loginAdmin();
    const asAdmin = await request(app)
      .post('/api/admin/users')
      .set(bearer(admin.token))
      .send({ name: 'Z', phone: '90777779', role: 'admin', email: 'z@example.com' });
    expect(asAdmin.status).toBe(422);
    expect(asAdmin.body.errors).toHaveProperty('role');

    const withConsent = await request(app)
      .post('/api/admin/users')
      .set(bearer(admin.token))
      .send({ name: 'Z', phone: '90777779', role: 'user', partageRelais: true, mustChangePassword: false });
    expect(withConsent.status).toBe(201);
    expect(withConsent.body.user).toMatchObject({ partageRelais: false, mustChangePassword: true });
  });

  it('est réservé aux admins', async () => {
    const agent = await registerRelais();
    const response = await request(app)
      .post('/api/admin/users')
      .set(bearer(agent.token))
      .send({ name: 'X', phone: '90777780', role: 'user' });
    expect(response.status).toBe(403);
  });
});

describe('POST /api/admin/users/:id/reset-password', () => {
  it("remplace le mot de passe, déconnecte l'utilisatrice et l'oblige à le changer", async () => {
    const admin = await loginAdmin();
    const user = await registerUser({ phone: '90888888' });

    const response = await request(app)
      .post(`/api/admin/users/${user.userId}/reset-password`)
      .set(bearer(admin.token));
    expect(response.status).toBe(200);
    expect(response.body.temporaryPassword).toMatch(/^\d{8}$/);

    // L'ancienne session et l'ancien mot de passe ne marchent plus.
    expect((await request(app).get('/api/auth/me').set(bearer(user.token))).status).toBe(401);
    const old = await request(app).post('/api/auth/login').send({ phone: '90888888', password: 'secret1' });
    expect(old.status).toBe(401);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ phone: '90888888', password: response.body.temporaryPassword });
    expect(login.status).toBe(200);
    expect(login.body.user.mustChangePassword).toBe(true);
  });

  it('annule les connexions admin en attente de code', async () => {
    const admin = await loginAdmin();
    const email = await createAdmin();
    await request(app).post('/api/auth/login').send({ email, password: 'admin-password' });
    const other = await User.findOne({ email });
    expect(await LoginChallenge.countDocuments({ user: other!._id })).toBe(1);

    await request(app)
      .post(`/api/admin/users/${other!.id}/reset-password`)
      .set(bearer(admin.token))
      .expect(200);
    expect(await LoginChallenge.countDocuments({ user: other!._id })).toBe(0);
  });

  it('refuse de réinitialiser son propre compte, et répond 404 pour un compte inconnu', async () => {
    const admin = await loginAdmin();
    const self = await request(app)
      .post(`/api/admin/users/${admin.userId}/reset-password`)
      .set(bearer(admin.token));
    expect(self.status).toBe(403);

    const unknown = await request(app)
      .post('/api/admin/users/64b7f0000000000000000000/reset-password')
      .set(bearer(admin.token));
    expect(unknown.status).toBe(404);
  });
});

describe('Garde-fous de rôle et de mot de passe', () => {
  it('refuse de promouvoir admin un compte sans e-mail (pas de code de connexion possible)', async () => {
    const admin = await loginAdmin();
    const user = await registerUser();
    const response = await request(app)
      .patch(`/api/admin/users/${user.userId}`)
      .set(bearer(admin.token))
      .send({ role: 'admin' });
    expect(response.status).toBe(422);
    expect(response.body.errors).toHaveProperty('role');
  });

  it("refuse un nouveau mot de passe identique à l'actuel", async () => {
    const user = await registerUser();
    const response = await request(app)
      .post('/api/auth/me/password')
      .set(bearer(user.token))
      .send({ currentPassword: 'secret1', newPassword: 'secret1' });
    expect(response.status).toBe(422);
    expect(response.body.errors).toHaveProperty('newPassword');
  });
});
