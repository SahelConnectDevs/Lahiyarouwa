// Mot de passe oublié : lien de réinitialisation envoyé par e-mail.
import request from 'supertest';

import { PasswordReset } from '../src/models/PasswordReset';
import { User } from '../src/models/User';
import { testOutbox } from '../src/services/mail.service';
import { app, bearer, createAdmin, lastLoginCode, registerUser, useTestDatabase } from './helpers';

useTestDatabase();

beforeEach(() => {
  testOutbox.length = 0;
});

/** Jeton du dernier lien envoyé à `email` (après le # de l'URL). */
function lastResetToken(email: string): string {
  const mail = [...testOutbox].reverse().find((m) => m.to === email && m.subject.includes('Réinitialiser'));
  const token = mail?.text.match(/reinitialiser-mot-de-passe#([\w-]+)/)?.[1];
  if (!token) throw new Error(`Aucun lien envoyé à ${email}`);
  return token;
}

describe('POST /api/auth/password/forgot puis /reset', () => {
  it('envoie un lien, change le mot de passe, puis la connexion (avec code) marche avec le nouveau', async () => {
    const email = await createAdmin('ancien-secret');

    const forgot = await request(app).post('/api/auth/password/forgot').send({ email: email.toUpperCase() });
    expect(forgot.status).toBe(200);
    expect(testOutbox).toHaveLength(1);
    expect(testOutbox[0]!.text).toContain('https://admin.lahiyarouwadayaro.com/reinitialiser-mot-de-passe#');

    const token = lastResetToken(email);
    const reset = await request(app)
      .post('/api/auth/password/reset')
      .send({ token, newPassword: 'nouveau-secret' });
    expect(reset.status).toBe(200);

    const old = await request(app).post('/api/auth/login').send({ email, password: 'ancien-secret' });
    expect(old.status).toBe(401);

    const login = await request(app).post('/api/auth/login').send({ email, password: 'nouveau-secret' });
    expect(login.body).toMatchObject({ mfaRequired: true });
    const verified = await request(app)
      .post('/api/auth/login/verify')
      .send({ challengeToken: login.body.challengeToken, code: lastLoginCode(email) });
    expect(verified.status).toBe(200);

    // Lien à usage unique.
    const again = await request(app)
      .post('/api/auth/password/reset')
      .send({ token, newPassword: 'autre-secret' });
    expect(again.status).toBe(400);
  });

  it('répond pareil pour une adresse inconnue, sans envoyer de mail', async () => {
    const response = await request(app)
      .post('/api/auth/password/forgot')
      .send({ email: 'inconnu@example.com' });
    expect(response.status).toBe(200);
    expect(response.body.message).toEqual(expect.any(String));
    expect(testOutbox).toHaveLength(0);
  });

  it("n'envoie qu'un lien toutes les 2 minutes, et rien pour un compte désactivé", async () => {
    const email = await createAdmin();
    await request(app).post('/api/auth/password/forgot').send({ email }).expect(200);
    await request(app).post('/api/auth/password/forgot').send({ email }).expect(200);
    expect(testOutbox).toHaveLength(1);

    const other = await createAdmin();
    await User.updateOne({ email: other }, { isActive: false });
    await request(app).post('/api/auth/password/forgot').send({ email: other }).expect(200);
    expect(testOutbox).toHaveLength(1);
  });

  it('refuse un lien expiré et un faux jeton', async () => {
    const email = await createAdmin();
    await request(app).post('/api/auth/password/forgot').send({ email });
    const token = lastResetToken(email);
    await PasswordReset.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });

    const expired = await request(app)
      .post('/api/auth/password/reset')
      .send({ token, newPassword: 'nouveau-secret' });
    expect(expired.status).toBe(400);

    const fake = await request(app)
      .post('/api/auth/password/reset')
      .send({ token: 'x'.repeat(43), newPassword: 'nouveau-secret' });
    expect(fake.status).toBe(400);
  });

  it('déconnecte les sessions existantes et lève le mot de passe provisoire', async () => {
    const { token, userId } = await registerUser();
    await User.updateOne({ _id: userId }, { email: 'awa@example.com', mustChangePassword: true });

    await request(app).post('/api/auth/password/forgot').send({ email: 'awa@example.com' });
    await request(app)
      .post('/api/auth/password/reset')
      .send({ token: lastResetToken('awa@example.com'), newPassword: 'nouveau-secret' })
      .expect(200);

    expect((await request(app).get('/api/auth/me').set(bearer(token))).status).toBe(401);
    expect((await User.findById(userId))!.mustChangePassword).toBe(false);
  });

  it('valide le nouveau mot de passe (6 caractères minimum)', async () => {
    const email = await createAdmin();
    await request(app).post('/api/auth/password/forgot').send({ email });
    const response = await request(app)
      .post('/api/auth/password/reset')
      .send({ token: lastResetToken(email), newPassword: '123' });
    expect(response.status).toBe(422);
    expect(response.body.errors).toHaveProperty('newPassword');
  });
});
