import request from 'supertest';

import { ContraceptionRecord } from '../src/models/ContraceptionRecord';
import { User } from '../src/models/User';
import { seedContent } from '../src/scripts/seed';
import { app, bearer, isoDaysAgo, registerUser, useTestDatabase } from './helpers';

useTestDatabase();

beforeEach(async () => {
  await seedContent();
});

describe('Catalogue des méthodes', () => {
  it('liste les 8 méthodes sans authentification', async () => {
    const response = await request(app).get('/api/planification/methodes');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(8);
    expect(response.body[0]).toMatchObject({ code: 'implant', efficacite: 'tres_efficace' });
  });

  it('renvoie une méthode par son code, 404 si inconnue', async () => {
    const injectable = await request(app).get('/api/planification/methodes/injectable');
    expect(injectable.body.rappel).toMatchObject({ mode: 'intervalle', intervalleJours: 91 });
    expect((await request(app).get('/api/planification/methodes/inconnue')).status).toBe(404);
  });
});

describe('Méthode suivie et rappels', () => {
  it("renvoie null tant qu'aucune méthode n'est enregistrée", async () => {
    const { token } = await registerUser();
    const response = await request(app).get('/api/planification/ma-methode').set(bearer(token));
    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
  });

  it('calcule la prochaine injection et la repousse après un renouvellement', async () => {
    const { token } = await registerUser();

    const started = await request(app)
      .post('/api/planification/ma-methode')
      .set(bearer(token))
      .send({ methode: 'injectable', dateDebut: isoDaysAgo(86) });
    expect(started.status).toBe(201);
    expect(started.body.methode.code).toBe('injectable');
    expect(started.body.prochainRappel).toMatchObject({
      mode: 'intervalle',
      enRetard: false,
      aPrevoir: true,
    });
    expect(started.body.prochainRappel.joursRestants).toBeGreaterThanOrEqual(4);
    expect(started.body.prochainRappel.joursRestants).toBeLessThanOrEqual(5);

    const renewed = await request(app)
      .post('/api/planification/ma-methode/renouvellement')
      .set(bearer(token))
      .send({ date: isoDaysAgo(0) });
    expect(renewed.status).toBe(200);
    expect(renewed.body.renouvellements).toHaveLength(1);
    expect(renewed.body.prochainRappel.joursRestants).toBeGreaterThanOrEqual(90);
    expect(renewed.body.prochainRappel.aPrevoir).toBe(false);
  });

  it('signale une injection en retard', async () => {
    const { token } = await registerUser();
    const response = await request(app)
      .post('/api/planification/ma-methode')
      .set(bearer(token))
      .send({ methode: 'injectable', dateDebut: isoDaysAgo(100) });
    expect(response.body.prochainRappel.enRetard).toBe(true);
  });

  it("respecte une durée propre (implant de 3 ans) et l'heure du rappel de pilule", async () => {
    const { token } = await registerUser();
    const implant = await request(app)
      .post('/api/planification/ma-methode')
      .set(bearer(token))
      .send({ methode: 'implant', dateDebut: isoDaysAgo(0), dureeJours: 1095 });
    expect(implant.body.prochainRappel.joursRestants).toBeGreaterThanOrEqual(1094);
    expect(implant.body.prochainRappel.joursRestants).toBeLessThanOrEqual(1095);

    const pilule = await request(app)
      .post('/api/planification/ma-methode')
      .set(bearer(token))
      .send({ methode: 'pilule', dateDebut: isoDaysAgo(0), heureRappel: '21:30' });
    expect(pilule.body.prochainRappel).toMatchObject({ mode: 'quotidien', heure: '21:30' });
  });

  it("changer de méthode arrête l'ancienne et garde l'historique", async () => {
    const { token, userId } = await registerUser();
    await request(app)
      .post('/api/planification/ma-methode')
      .set(bearer(token))
      .send({ methode: 'pilule', dateDebut: isoDaysAgo(60) });
    await request(app)
      .post('/api/planification/ma-methode')
      .set(bearer(token))
      .send({ methode: 'implant', dateDebut: isoDaysAgo(1) });

    const history = await request(app).get('/api/planification/historique').set(bearer(token));
    expect(history.body).toHaveLength(2);
    expect(history.body[0]).toMatchObject({ statut: 'en_cours', methode: { code: 'implant' } });
    expect(history.body[1]).toMatchObject({ statut: 'arretee', raisonArret: 'Changement de méthode' });
    expect(await ContraceptionRecord.countDocuments({ user: userId, statut: 'en_cours' })).toBe(1);
  });

  it('modifie puis arrête la méthode ; une méthode sans rappel ne se renouvelle pas', async () => {
    const { token } = await registerUser();
    await request(app)
      .post('/api/planification/ma-methode')
      .set(bearer(token))
      .send({ methode: 'preservatif', dateDebut: isoDaysAgo(3) });

    const renew = await request(app)
      .post('/api/planification/ma-methode/renouvellement')
      .set(bearer(token))
      .send({ date: isoDaysAgo(0) });
    expect(renew.status).toBe(422);

    const updated = await request(app)
      .patch('/api/planification/ma-methode')
      .set(bearer(token))
      .send({ notes: 'Avec mon mari' });
    expect(updated.body.notes).toBe('Avec mon mari');
    const cleared = await request(app)
      .patch('/api/planification/ma-methode')
      .set(bearer(token))
      .send({ notes: null });
    expect(cleared.body.notes).toBeNull();

    const stopped = await request(app)
      .post('/api/planification/ma-methode/arret')
      .set(bearer(token))
      .send({ date: isoDaysAgo(0), raison: 'Désir de grossesse' });
    expect(stopped.body).toMatchObject({ statut: 'arretee', raisonArret: 'Désir de grossesse' });
    expect((await request(app).get('/api/planification/ma-methode').set(bearer(token))).body).toBeNull();
  });

  it('refuse une méthode inconnue, une date future ou une heure invalide (422)', async () => {
    const { token } = await registerUser();
    for (const body of [
      { methode: 'inconnue', dateDebut: isoDaysAgo(1) },
      { methode: 'pilule', dateDebut: isoDaysAgo(-5) },
      { methode: 'pilule', dateDebut: isoDaysAgo(1), heureRappel: '25:00' },
    ]) {
      const response = await request(app).post('/api/planification/ma-methode').set(bearer(token)).send(body);
      expect(response.status).toBe(422);
    }
  });

  it('regroupe les rappels PF, CPN et vaccins, du plus urgent au moins urgent', async () => {
    const { token } = await registerUser();
    await request(app)
      .put('/api/grossesse')
      .set(bearer(token))
      .send({ ddr: isoDaysAgo(16 * 7) });
    await request(app)
      .post('/api/enfants')
      .set(bearer(token))
      .send({ prenom: 'Ali', dateNaissance: isoDaysAgo(50) });
    await request(app)
      .post('/api/planification/ma-methode')
      .set(bearer(token))
      .send({ methode: 'injectable', dateDebut: isoDaysAgo(86) });

    const response = await request(app).get('/api/rappels').set(bearer(token));
    expect(response.status).toBe(200);
    const types = new Set(response.body.map((r: { type: string }) => r.type));
    expect(types).toEqual(new Set(['pf', 'cpn', 'vaccin']));
    const dates = response.body.map((r: { date: string }) => new Date(r.date).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => a - b));
  });

  it('supprime les méthodes avec le compte', async () => {
    const { token, userId } = await registerUser();
    await request(app)
      .post('/api/planification/ma-methode')
      .set(bearer(token))
      .send({ methode: 'pilule', dateDebut: isoDaysAgo(1) });
    await request(app).delete('/api/auth/me').set(bearer(token)).send({ password: 'secret1' });
    expect(await ContraceptionRecord.countDocuments({ user: userId })).toBe(0);
    expect(await User.exists({ _id: userId })).toBeNull();
  });
});
