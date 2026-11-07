import request from 'supertest';

import { seedContent } from '../src/scripts/seed';
import { app, bearer, isoDaysAgo, registerUser, useTestDatabase } from './helpers';

useTestDatabase();

beforeEach(async () => {
  await seedContent();
});

describe('Grossesse et CPN', () => {
  it("renvoie null tant qu'aucune DDR n'est saisie", async () => {
    const { token } = await registerUser();
    const response = await request(app).get('/api/grossesse').set(bearer(token));
    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
  });

  it('calcule semaine, terme et trimestre depuis la DDR, puis corrige la DDR', async () => {
    const { token } = await registerUser();

    const created = await request(app)
      .put('/api/grossesse')
      .set(bearer(token))
      .send({ ddr: isoDaysAgo(24 * 7 + 3) });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ semaine: 24, jour: 3, trimestre: 2, status: 'en_cours' });
    expect(created.body.joursRestants).toBe(280 - (24 * 7 + 3));

    const updated = await request(app)
      .put('/api/grossesse')
      .set(bearer(token))
      .send({ ddr: isoDaysAgo(30 * 7) });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ id: created.body.id, semaine: 30, trimestre: 3 });
  });

  it('refuse une DDR dans le futur ou trop ancienne (422)', async () => {
    const { token } = await registerUser();
    for (const ddr of [isoDaysAgo(-10), isoDaysAgo(320)]) {
      const response = await request(app).put('/api/grossesse').set(bearer(token)).send({ ddr });
      expect(response.status).toBe(422);
      expect(response.body.errors).toHaveProperty('ddr');
    }
  });

  it('liste les 8 CPN avec statut, et marque une CPN comme effectuée', async () => {
    const { token } = await registerUser();
    await request(app)
      .put('/api/grossesse')
      .set(bearer(token))
      .send({ ddr: isoDaysAgo(16 * 7) });

    const list = await request(app).get('/api/grossesse/cpn').set(bearer(token));
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(8);
    expect(list.body[0]).toMatchObject({ numero: 1, statut: 'en_retard' });
    expect(list.body[1]).toMatchObject({ numero: 2, statut: 'en_cours' });
    expect(list.body[2]).toMatchObject({ numero: 3, statut: 'a_venir' });
    expect(list.body[7]).toMatchObject({ numero: 8, fenetre: null, statut: 'a_venir' });

    const marked = await request(app)
      .put('/api/grossesse/cpn/1')
      .set(bearer(token))
      .send({ effectuee: true, date: isoDaysAgo(60), notes: 'RAS' });
    expect(marked.status).toBe(200);
    expect(marked.body).toMatchObject({ numero: 1, statut: 'effectuee', notes: 'RAS' });

    const unmarked = await request(app)
      .put('/api/grossesse/cpn/1')
      .set(bearer(token))
      .send({ effectuee: false });
    expect(unmarked.body.statut).toBe('en_retard');
  });

  it('termine la grossesse', async () => {
    const { token } = await registerUser();
    await request(app)
      .put('/api/grossesse')
      .set(bearer(token))
      .send({ ddr: isoDaysAgo(275) });

    const response = await request(app)
      .post('/api/grossesse/terminer')
      .set(bearer(token))
      .send({ dateAccouchement: isoDaysAgo(1) });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('terminee');
    expect((await request(app).get('/api/grossesse').set(bearer(token))).body).toBeNull();
  });
});

describe('Enfants et vaccinations', () => {
  async function createChild(token: string, daysOld = 50) {
    const response = await request(app)
      .post('/api/enfants')
      .set(bearer(token))
      .send({ prenom: 'Ali', dateNaissance: isoDaysAgo(daysOld), sexe: 'M', poidsNaissanceGrammes: 3200 });
    expect(response.status).toBe(201);
    return response.body as { id: string };
  }

  it("crée, modifie et supprime un enfant ; une autre utilisatrice n'y a pas accès (404)", async () => {
    const { token } = await registerUser();
    const other = await registerUser();
    const child = await createChild(token);

    expect((await request(app).get(`/api/enfants/${child.id}`).set(bearer(other.token))).status).toBe(404);
    expect((await request(app).get('/api/enfants').set(bearer(other.token))).body).toEqual([]);

    const updated = await request(app)
      .patch(`/api/enfants/${child.id}`)
      .set(bearer(token))
      .send({ prenom: 'Aliou' });
    expect(updated.body.prenom).toBe('Aliou');

    expect((await request(app).delete(`/api/enfants/${child.id}`).set(bearer(token))).status).toBe(204);
    expect((await request(app).get(`/api/enfants/${child.id}`).set(bearer(token))).status).toBe(404);
  });

  it('rejette un identifiant mal formé (422 plutôt que 500)', async () => {
    const { token } = await registerUser();
    const response = await request(app).get('/api/enfants/pas-un-id').set(bearer(token));
    expect(response.status).toBe(422);
  });

  it("calcule le calendrier vaccinal de l'enfant et enregistre une dose", async () => {
    const { token } = await registerUser();
    const child = await createChild(token, 50); // ~7 semaines

    const vaccins = await request(app).get('/api/vaccins?cible=enfant').set(bearer(token));
    const bcg = vaccins.body.find((v: { code: string }) => v.code === 'bcg');
    const penta2 = vaccins.body.find((v: { code: string }) => v.code === 'penta-2');

    const dose = await request(app)
      .post('/api/vaccinations')
      .set(bearer(token))
      .send({ vaccin: bcg.id, enfant: child.id, date: isoDaysAgo(49), lieu: 'CSI Lazaret' });
    expect(dose.status).toBe(201);
    expect(dose.body.vaccin.code).toBe('bcg');

    const calendar = await request(app)
      .get(`/api/vaccinations/calendrier?enfant=${child.id}`)
      .set(bearer(token));
    expect(calendar.status).toBe(200);
    const byCode = (code: string) =>
      calendar.body.find((e: { vaccin: { code: string } }) => e.vaccin.code === code);
    expect(byCode('bcg').statut).toBe('fait');
    expect(byCode('vpo-0').statut).toBe('en_retard');
    expect(byCode('penta-2').statut).toBe('a_venir');
    expect(byCode('penta-2').datePrevue).toEqual(expect.any(String));
    expect(penta2).toBeDefined();
  });

  it("refuse un vaccin enfant enregistré pour la maman, ou pour l'enfant d'une autre (422 / 404)", async () => {
    const { token } = await registerUser();
    const other = await registerUser();
    const child = await createChild(token);
    const vaccins = await request(app).get('/api/vaccins?cible=enfant').set(bearer(token));
    const bcgId = vaccins.body[0].id;

    const forMother = await request(app)
      .post('/api/vaccinations')
      .set(bearer(token))
      .send({ vaccin: bcgId, date: isoDaysAgo(1) });
    expect(forMother.status).toBe(422);

    const forOthersChild = await request(app)
      .post('/api/vaccinations')
      .set(bearer(other.token))
      .send({ vaccin: bcgId, enfant: child.id, date: isoDaysAgo(1) });
    expect(forOthersChild.status).toBe(404);
  });
});

describe('Contractions, alertes et conseils', () => {
  it('enregistre une séance de contractions et la liste', async () => {
    const { token } = await registerUser();
    const t0 = Date.now() - 60 * 60 * 1000;
    const at = (minutes: number) => new Date(t0 + minutes * 60 * 1000).toISOString();

    const created = await request(app)
      .post('/api/contractions')
      .set(bearer(token))
      .send({
        debut: at(0),
        fin: at(30),
        contractions: [
          { debut: at(0), fin: at(1) },
          { debut: at(10), fin: at(11) },
        ],
      });
    expect(created.status).toBe(201);
    expect(created.body.contractions).toHaveLength(2);

    const list = await request(app).get('/api/contractions').set(bearer(token));
    expect(list.body).toHaveLength(1);

    const invalid = await request(app)
      .post('/api/contractions')
      .set(bearer(token))
      .send({ debut: at(30), fin: at(0), contractions: [] });
    expect(invalid.status).toBe(422);
  });

  it('signale un signe inquiétant et refuse un signe inconnu', async () => {
    const { token } = await registerUser();
    const created = await request(app)
      .post('/api/alertes')
      .set(bearer(token))
      .send({ signe: 'Forte fièvre', details: 'Depuis hier soir' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ signe: 'Forte fièvre', statut: 'nouvelle' });

    const unknown = await request(app).post('/api/alertes').set(bearer(token)).send({ signe: 'Inconnu' });
    expect(unknown.status).toBe(422);
  });

  it('liste les conseils publiés sans authentification, filtrés par catégorie', async () => {
    const response = await request(app).get('/api/conseils?categorie=nutrition');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.every((c: { categorie: string }) => c.categorie === 'nutrition')).toBe(true);
  });

  it('refuse les routes de données sans token (401)', async () => {
    for (const path of [
      '/api/grossesse',
      '/api/enfants',
      '/api/vaccinations',
      '/api/contractions',
      '/api/alertes',
    ]) {
      expect((await request(app).get(path)).status).toBe(401);
    }
  });
});
