// Double authentification des admins : mot de passe puis code reçu par e-mail.
import request from 'supertest';

import { LoginChallenge } from '../src/models/LoginChallenge';
import { User } from '../src/models/User';
import { testOutbox } from '../src/services/mail.service';
import { MAX_ATTEMPTS } from '../src/services/twoFactor.service';
import { app, bearer, createAdmin, lastLoginCode, registerUser, useTestDatabase } from './helpers';

useTestDatabase();

beforeEach(() => {
  testOutbox.length = 0;
});

async function startLogin(email: string) {
  const response = await request(app).post('/api/auth/login').send({ email, password: 'admin-password' });
  expect(response.status).toBe(200);
  return response.body as { mfaRequired: boolean; challengeToken: string; email: string; token?: string };
}

describe('Connexion admin à double authentification', () => {
  it("n'émet pas de token au mot de passe, envoie un code à l'e-mail de connexion, puis connecte", async () => {
    const email = await createAdmin();

    const challenge = await startLogin(email);
    expect(challenge).toMatchObject({ mfaRequired: true, challengeToken: expect.any(String) });
    expect(challenge.token).toBeUndefined();
    expect(challenge.email).toMatch(/^ad\*\*\*@example\.com$/);
    expect(testOutbox).toHaveLength(1);
    expect(testOutbox[0]!.to).toBe(email);

    // Le code est accepté même saisi avec des espaces.
    const code = lastLoginCode(email);
    const verified = await request(app)
      .post('/api/auth/login/verify')
      .send({ challengeToken: challenge.challengeToken, code: `${code.slice(0, 3)} ${code.slice(3)}` });
    expect(verified.status).toBe(200);
    expect(verified.body.user).toMatchObject({ email, role: 'admin' });

    const me = await request(app).get('/api/admin/stats').set(bearer(verified.body.token));
    expect(me.status).toBe(200);

    // Usage unique : le même code ne reconnecte pas.
    const replay = await request(app)
      .post('/api/auth/login/verify')
      .send({ challengeToken: challenge.challengeToken, code });
    expect(replay.status).toBe(401);
  });

  it("n'envoie aucun code si le mot de passe est faux", async () => {
    const email = await createAdmin();
    const response = await request(app).post('/api/auth/login').send({ email, password: 'mauvais' });
    expect(response.status).toBe(401);
    expect(testOutbox).toHaveLength(0);
    expect(await LoginChallenge.countDocuments()).toBe(0);
  });

  it('exige aussi le code quand un admin se connecte par téléphone', async () => {
    const { phone, userId } = await registerUser();
    await User.updateOne({ _id: userId }, { role: 'admin', email: 'tel-admin@example.com' });
    const response = await request(app).post('/api/auth/login').send({ phone, password: 'secret1' });
    expect(response.body).toMatchObject({ mfaRequired: true });
    expect(response.body.token).toBeUndefined();
    expect(testOutbox[0]!.to).toBe('tel-admin@example.com');
  });

  it("ne change rien pour une utilisatrice de l'app (token direct, pas de mail)", async () => {
    const { phone } = await registerUser();
    const response = await request(app).post('/api/auth/login').send({ phone, password: 'secret1' });
    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(testOutbox).toHaveLength(0);
  });

  it('compte les codes faux (422 sur `code`) puis annule la connexion après trop d’essais', async () => {
    const email = await createAdmin();
    const { challengeToken } = await startLogin(email);
    const good = lastLoginCode(email);
    const wrong = good === '000000' ? '111111' : '000000';

    for (let i = 1; i < MAX_ATTEMPTS; i += 1) {
      const response = await request(app)
        .post('/api/auth/login/verify')
        .send({ challengeToken, code: wrong });
      expect(response.status).toBe(422);
      expect(response.body.errors.code).toContain(`${MAX_ATTEMPTS - i} essai`);
    }
    const last = await request(app).post('/api/auth/login/verify').send({ challengeToken, code: wrong });
    expect(last.status).toBe(401);

    // Même le bon code ne passe plus : il faut ressaisir le mot de passe.
    const after = await request(app).post('/api/auth/login/verify').send({ challengeToken, code: good });
    expect(after.status).toBe(401);
  });

  it('refuse un code expiré', async () => {
    const email = await createAdmin();
    const { challengeToken } = await startLogin(email);
    await LoginChallenge.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
    const response = await request(app)
      .post('/api/auth/login/verify')
      .send({ challengeToken, code: lastLoginCode(email) });
    expect(response.status).toBe(401);
  });

  it('valide le format du code (6 chiffres)', async () => {
    const email = await createAdmin();
    const { challengeToken } = await startLogin(email);
    const response = await request(app).post('/api/auth/login/verify').send({ challengeToken, code: '12ab' });
    expect(response.status).toBe(422);
    expect(response.body.errors).toHaveProperty('code');
  });

  it('renvoie un nouveau code après le délai, et seul le dernier code fonctionne', async () => {
    const email = await createAdmin();
    const { challengeToken } = await startLogin(email);
    const firstCode = lastLoginCode(email);

    const tooSoon = await request(app).post('/api/auth/login/resend').send({ challengeToken });
    expect(tooSoon.status).toBe(429);

    await LoginChallenge.updateMany({}, { lastSentAt: new Date(Date.now() - 61_000) });
    const resent = await request(app).post('/api/auth/login/resend').send({ challengeToken });
    expect(resent.status).toBe(200);
    expect(testOutbox).toHaveLength(2);
    const secondCode = lastLoginCode(email);

    if (firstCode !== secondCode) {
      const old = await request(app).post('/api/auth/login/verify').send({ challengeToken, code: firstCode });
      expect(old.status).toBe(422);
    }
    const ok = await request(app).post('/api/auth/login/verify').send({ challengeToken, code: secondCode });
    expect(ok.status).toBe(200);
  });

  it('refuse le code si le compte a été désactivé entre-temps', async () => {
    const email = await createAdmin();
    const { challengeToken } = await startLogin(email);
    await User.updateOne({ email }, { isActive: false });
    const response = await request(app)
      .post('/api/auth/login/verify')
      .send({ challengeToken, code: lastLoginCode(email) });
    expect(response.status).toBe(403);
  });

  it('ne stocke ni le code ni le jeton en clair', async () => {
    const email = await createAdmin();
    const { challengeToken } = await startLogin(email);
    const stored = await LoginChallenge.findOne().lean();
    expect(JSON.stringify(stored)).not.toContain(challengeToken);
    expect(JSON.stringify(stored)).not.toContain(`"${lastLoginCode(email)}"`);
  });
});
