import request from 'supertest';

import { Alert } from '../src/models/Alert';
import { User } from '../src/models/User';
import { seedContent } from '../src/scripts/seed';
import {
  app,
  assignToRelais,
  bearer,
  isoDaysAgo,
  loginAdmin,
  registerRelais,
  registerUser,
  useTestDatabase,
} from './helpers';

useTestDatabase();

beforeEach(async () => {
  await seedContent();
});

describe("Accès à l'espace agent", () => {
  it('est réservé au rôle relais', async () => {
    const { token } = await registerUser();
    expect((await request(app).get('/api/relais/tableau-de-bord').set(bearer(token))).status).toBe(403);
    expect((await request(app).get('/api/relais/tableau-de-bord')).status).toBe(401);
  });

  it('un agent ne voit que ses propres bénéficiaires', async () => {
    const moussa = await registerRelais('Moussa');
    const ibrahim = await registerRelais('Ibrahim');
    const aicha = await registerUser({ name: 'Aïcha' });
    await assignToRelais(aicha.userId, moussa.userId, true);

    const mine = await request(app).get('/api/relais/beneficiaires').set(bearer(moussa.token));
    expect(mine.body.map((b: { name: string }) => b.name)).toEqual(['Aïcha']);

    const other = await request(app).get('/api/relais/beneficiaires').set(bearer(ibrahim.token));
    expect(other.body).toEqual([]);
    expect(
      (await request(app).get(`/api/relais/beneficiaires/${aicha.userId}`).set(bearer(ibrahim.token))).status,
    ).toBe(404);
  });
});

describe('Consentement de la bénéficiaire', () => {
  it("sans consentement, l'agent ne voit que l'identité ; avec, il voit le suivi", async () => {
    const moussa = await registerRelais();
    const aicha = await registerUser({ name: 'Aïcha' });
    await assignToRelais(aicha.userId, moussa.userId, false);
    await request(app)
      .post('/api/planification/ma-methode')
      .set(bearer(aicha.token))
      .send({ methode: 'injectable', dateDebut: isoDaysAgo(86) });

    const hidden = await request(app)
      .get(`/api/relais/beneficiaires/${aicha.userId}`)
      .set(bearer(moussa.token));
    expect(hidden.body).toMatchObject({ name: 'Aïcha', partageRelais: false, suivi: null, rappels: null });

    // La bénéficiaire donne son accord depuis l'app.
    const consent = await request(app)
      .patch('/api/auth/me')
      .set(bearer(aicha.token))
      .send({ partageRelais: true });
    expect(consent.body.partageRelais).toBe(true);

    const shared = await request(app)
      .get(`/api/relais/beneficiaires/${aicha.userId}`)
      .set(bearer(moussa.token));
    expect(shared.body.suivi.planification).toMatchObject({ methode: 'Injectable' });
    expect(shared.body.rappels).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'pf' })]));

    const dashboard = await request(app).get('/api/relais/tableau-de-bord').set(bearer(moussa.token));
    expect(dashboard.body).toMatchObject({ beneficiaires: 1, consentantes: 1 });
    expect(dashboard.body.rappels[0]).toMatchObject({ type: 'pf', beneficiaire: { name: 'Aïcha' } });
  });

  it('la bénéficiaire voit qui est son agent', async () => {
    const moussa = await registerRelais('Moussa');
    const aicha = await registerUser();
    expect((await request(app).get('/api/auth/me/agent').set(bearer(aicha.token))).body).toBeNull();

    await assignToRelais(aicha.userId, moussa.userId, false);
    const agent = await request(app).get('/api/auth/me/agent').set(bearer(aicha.token));
    expect(agent.body).toMatchObject({ name: 'Moussa', phone: moussa.phone });
  });
});

describe('Alertes et accompagnement', () => {
  it("route l'alerte vers l'agent, qui la traite et note l'orientation", async () => {
    const moussa = await registerRelais();
    const ibrahim = await registerRelais('Ibrahim');
    const aicha = await registerUser({ name: 'Aïcha' });
    await assignToRelais(aicha.userId, moussa.userId, false);

    const created = await request(app)
      .post('/api/alertes')
      .set(bearer(aicha.token))
      .send({ signe: 'Autre signe', details: "Saignements irréguliers depuis l'injection" });
    expect(created.status).toBe(201);

    const dashboard = await request(app).get('/api/relais/tableau-de-bord').set(bearer(moussa.token));
    expect(dashboard.body.alertesNouvelles).toBe(1);

    const alerts = await request(app).get('/api/relais/alertes?statut=nouvelle').set(bearer(moussa.token));
    expect(alerts.body).toHaveLength(1);
    expect(alerts.body[0].user).toMatchObject({ name: 'Aïcha' });
    // Utilisatrice incluse avec son id (lien vers la fiche dans l'espace agent).
    expect(alerts.body[0].user.id).toEqual(expect.any(String));
    expect(alerts.body[0].user._id).toBeUndefined();

    // Un autre agent ne peut pas la traiter.
    const forbidden = await request(app)
      .patch(`/api/relais/alertes/${created.body.id}`)
      .set(bearer(ibrahim.token))
      .send({ statut: 'en_cours' });
    expect(forbidden.status).toBe(404);

    const treated = await request(app)
      .patch(`/api/relais/alertes/${created.body.id}`)
      .set(bearer(moussa.token))
      .send({ statut: 'traitee', noteSuivi: 'Rappelée, rassurée' });
    expect(treated.body).toMatchObject({ statut: 'traitee', traiteePar: { name: 'Moussa' } });

    const followUp = await request(app)
      .post(`/api/relais/beneficiaires/${aicha.userId}/suivis`)
      .set(bearer(moussa.token))
      .send({ type: 'orientation', orienteVers: 'CSI, sage-femme', alerte: created.body.id });
    expect(followUp.status).toBe(201);

    const followUps = await request(app)
      .get(`/api/relais/beneficiaires/${aicha.userId}/suivis`)
      .set(bearer(moussa.token));
    expect(followUps.body[0]).toMatchObject({ type: 'orientation', relais: { name: 'Moussa' } });
  });

  it("refuse un suivi pour la bénéficiaire d'un autre agent", async () => {
    const moussa = await registerRelais();
    const ibrahim = await registerRelais('Ibrahim');
    const aicha = await registerUser();
    await assignToRelais(aicha.userId, moussa.userId, true);

    const response = await request(app)
      .post(`/api/relais/beneficiaires/${aicha.userId}/suivis`)
      .set(bearer(ibrahim.token))
      .send({ type: 'appel' });
    expect(response.status).toBe(404);
  });
});

describe('Affectation par l’admin', () => {
  it('assigne un agent, déplace les alertes ouvertes, puis le retire avec null', async () => {
    const admin = await loginAdmin();
    const moussa = await registerRelais('Moussa');
    const ibrahim = await registerRelais('Ibrahim');
    const aicha = await registerUser();

    const assigned = await request(app)
      .patch(`/api/admin/users/${aicha.userId}`)
      .set(bearer(admin.token))
      .send({ relais: moussa.userId, secteur: 'Niamey, commune 3' });
    expect(assigned.status).toBe(200);
    expect(assigned.body).toMatchObject({ relais: moussa.userId, secteur: 'Niamey, commune 3' });

    const alert = await request(app)
      .post('/api/alertes')
      .set(bearer(aicha.token))
      .send({ signe: 'Forte fièvre' });
    expect((await Alert.findById(alert.body.id))?.relais?.toString()).toBe(moussa.userId);

    await request(app)
      .patch(`/api/admin/users/${aicha.userId}`)
      .set(bearer(admin.token))
      .send({ relais: ibrahim.userId });
    expect((await Alert.findById(alert.body.id))?.relais?.toString()).toBe(ibrahim.userId);

    const removed = await request(app)
      .patch(`/api/admin/users/${aicha.userId}`)
      .set(bearer(admin.token))
      .send({ relais: null });
    expect(removed.body.relais).toBeNull();

    const agents = await request(app).get('/api/admin/relais').set(bearer(admin.token));
    expect(agents.body.map((a: { name: string }) => a.name)).toEqual(['Ibrahim', 'Moussa']);
  });

  it("refuse d'assigner un compte qui n'est pas agent (422)", async () => {
    const admin = await loginAdmin();
    const aicha = await registerUser();
    const fati = await registerUser({ name: 'Fati' });
    const response = await request(app)
      .patch(`/api/admin/users/${aicha.userId}`)
      .set(bearer(admin.token))
      .send({ relais: fati.userId });
    expect(response.status).toBe(422);
    expect(response.body.errors).toHaveProperty('relais');
  });

  it('un agent qui perd son rôle libère ses bénéficiaires', async () => {
    const admin = await loginAdmin();
    const moussa = await registerRelais();
    const aicha = await registerUser();
    await assignToRelais(aicha.userId, moussa.userId, true);

    await request(app)
      .patch(`/api/admin/users/${moussa.userId}`)
      .set(bearer(admin.token))
      .send({ role: 'user' });
    expect((await User.findById(aicha.userId))?.relais).toBeUndefined();
  });

  it('gère le catalogue des méthodes et les statistiques de PF', async () => {
    const admin = await loginAdmin();
    const aicha = await registerUser();
    await request(app)
      .post('/api/planification/ma-methode')
      .set(bearer(aicha.token))
      .send({ methode: 'implant', dateDebut: isoDaysAgo(10) });

    const stats = await request(app).get('/api/admin/stats').set(bearer(admin.token));
    expect(stats.body.planification).toEqual({ methodesEnCours: 1, parMethode: { Implant: 1 } });
    expect(stats.body.beneficiairesSansAgent).toBe(1);

    const list = await request(app).get('/api/admin/methodes-pf?limit=100').set(bearer(admin.token));
    expect(list.body.total).toBe(8);
    const pilule = list.body.items.find((m: { code: string }) => m.code === 'pilule');

    const updated = await request(app)
      .patch(`/api/admin/methodes-pf/${pilule.id}`)
      .set(bearer(admin.token))
      .send({ rappel: { mode: 'quotidien', intervalleJours: 21, avanceJours: 2 } });
    expect(updated.status).toBe(200);
    expect(updated.body.rappel).toMatchObject({ intervalleJours: 21 });
  });

  it('supprimer un agent détache ses bénéficiaires sans effacer leurs données', async () => {
    const admin = await loginAdmin();
    const moussa = await registerRelais();
    const aicha = await registerUser();
    await assignToRelais(aicha.userId, moussa.userId, true);

    expect(
      (await request(app).delete(`/api/admin/users/${moussa.userId}`).set(bearer(admin.token))).status,
    ).toBe(204);
    const after = await User.findById(aicha.userId);
    expect(after).not.toBeNull();
    expect(after?.relais).toBeUndefined();
  });
});
