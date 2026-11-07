import request from 'supertest';

import { User } from '../src/models/User';
import { seedContent } from '../src/scripts/seed';
import { app, bearer, isoDaysAgo, loginAdmin, registerUser, useTestDatabase } from './helpers';

useTestDatabase();

describe('Accès à /api/admin', () => {
  it('refuse une utilisatrice normale (403) et un visiteur (401)', async () => {
    const { token } = await registerUser();
    expect((await request(app).get('/api/admin/stats').set(bearer(token))).status).toBe(403);
    expect((await request(app).get('/api/admin/stats')).status).toBe(401);
  });

  it('renvoie les statistiques du tableau de bord', async () => {
    const admin = await loginAdmin();
    const { token } = await registerUser();
    await request(app)
      .put('/api/grossesse')
      .set(bearer(token))
      .send({ ddr: isoDaysAgo(100) });

    const response = await request(app).get('/api/admin/stats').set(bearer(admin.token));
    expect(response.status).toBe(200);
    expect(response.body.utilisateurs).toMatchObject({ total: 2, parRole: { user: 1, relais: 0, admin: 1 } });
    expect(response.body.grossessesEnCours).toBe(1);
  });
});

describe('Gestion des utilisateurs', () => {
  it('liste, recherche et pagine les comptes', async () => {
    const admin = await loginAdmin();
    await registerUser({ name: 'Awa Moussa' });
    await registerUser({ name: 'Fati Issa' });

    const all = await request(app).get('/api/admin/users?limit=2').set(bearer(admin.token));
    expect(all.status).toBe(200);
    expect(all.body).toMatchObject({ total: 3, page: 1, limit: 2, totalPages: 2 });
    expect(all.body.items).toHaveLength(2);

    const search = await request(app).get('/api/admin/users?search=fati&role=user').set(bearer(admin.token));
    expect(search.body.items).toHaveLength(1);
    expect(search.body.items[0].name).toBe('Fati Issa');

    // Une recherche contenant des caractères spéciaux de regex ne casse rien.
    const special = await request(app).get('/api/admin/users?search=(.*').set(bearer(admin.token));
    expect(special.status).toBe(200);
    expect(special.body.items).toHaveLength(0);
  });

  it('désactive un compte, ce qui coupe immédiatement ses sessions', async () => {
    const admin = await loginAdmin();
    const { token, userId } = await registerUser();

    const response = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set(bearer(admin.token))
      .send({ isActive: false });
    expect(response.status).toBe(200);
    expect(response.body.isActive).toBe(false);
    expect((await request(app).get('/api/auth/me').set(bearer(token))).status).toBe(401);
  });

  it('empêche un admin de se retirer ses propres droits', async () => {
    const admin = await loginAdmin();
    const response = await request(app)
      .patch(`/api/admin/users/${admin.userId}`)
      .set(bearer(admin.token))
      .send({ role: 'user' });
    expect(response.status).toBe(403);
  });

  it('supprime un compte et ses données', async () => {
    const admin = await loginAdmin();
    const { userId } = await registerUser();
    expect((await request(app).delete(`/api/admin/users/${userId}`).set(bearer(admin.token))).status).toBe(
      204,
    );
    expect(await User.exists({ _id: userId })).toBeNull();
    expect((await request(app).get(`/api/admin/users/${userId}`).set(bearer(admin.token))).status).toBe(404);
  });
});

describe('Alertes', () => {
  it("liste les alertes avec le contact de l'utilisatrice et les marque traitées", async () => {
    const admin = await loginAdmin();
    const { token } = await registerUser({ name: 'Awa' });
    const created = await request(app)
      .post('/api/alertes')
      .set(bearer(token))
      .send({ signe: 'Saignement vaginal' });

    const list = await request(app).get('/api/admin/alertes?statut=nouvelle').set(bearer(admin.token));
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].user).toMatchObject({ name: 'Awa', phone: expect.any(String) });

    const treated = await request(app)
      .patch(`/api/admin/alertes/${created.body.id}`)
      .set(bearer(admin.token))
      .send({ statut: 'traitee', noteSuivi: 'Rappelée, orientée vers le CSI.' });
    expect(treated.status).toBe(200);
    expect(treated.body).toMatchObject({ statut: 'traitee', traiteePar: { name: 'Admin' } });
    expect(treated.body.traiteeLe).toEqual(expect.any(String));
  });
});

describe('Contenus', () => {
  it("crée un conseil non publié (invisible dans l'app), puis le publie", async () => {
    const admin = await loginAdmin();
    const created = await request(app)
      .post('/api/admin/conseils')
      .set(bearer(admin.token))
      .send({ titre: 'Repos', contenu: 'Reposez-vous en début d’après-midi.', categorie: 'grossesse' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ publie: false, langue: 'fr' });
    expect(created.body._id).toBeUndefined();

    expect((await request(app).get('/api/conseils')).body).toHaveLength(0);

    const published = await request(app)
      .patch(`/api/admin/conseils/${created.body.id}`)
      .set(bearer(admin.token))
      .send({ publie: true });
    expect(published.body.publie).toBe(true);
    expect((await request(app).get('/api/conseils')).body).toHaveLength(1);
  });

  it('valide les contenus et refuse un code de vaccin en double', async () => {
    const admin = await loginAdmin();
    await seedContent();

    const invalid = await request(app)
      .post('/api/admin/conseils')
      .set(bearer(admin.token))
      .send({ titre: 'x' });
    expect(invalid.status).toBe(422);
    expect(invalid.body.errors).toHaveProperty('contenu');

    const duplicate = await request(app)
      .post('/api/admin/vaccins')
      .set(bearer(admin.token))
      .send({ code: 'bcg', nom: 'BCG', cible: 'enfant', moment: 'À la naissance' });
    expect(duplicate.status).toBe(422);
    expect(duplicate.body.errors).toHaveProperty('code');
  });

  it('modifie le calendrier des CPN', async () => {
    const admin = await loginAdmin();
    await seedContent();

    const list = await request(app).get('/api/admin/cpn-etapes').set(bearer(admin.token));
    expect(list.body.total).toBe(8);

    const updated = await request(app)
      .patch(`/api/admin/cpn-etapes/${list.body.items[0].id}`)
      .set(bearer(admin.token))
      .send({ examens: ['Tension artérielle', 'Échographie'] });
    expect(updated.status).toBe(200);
    expect(updated.body.examens).toEqual(['Tension artérielle', 'Échographie']);
  });

  it("le seed n'écrase pas une modification faite depuis l'admin", async () => {
    const admin = await loginAdmin();
    await seedContent();
    const list = await request(app).get('/api/admin/vaccins?cible=enfant&limit=100').set(bearer(admin.token));
    const bcg = list.body.items.find((v: { code: string }) => v.code === 'bcg');

    await request(app)
      .patch(`/api/admin/vaccins/${bcg.id}`)
      .set(bearer(admin.token))
      .send({ nom: 'BCG modifié' });
    await seedContent();

    const after = await request(app).get(`/api/admin/vaccins/${bcg.id}`).set(bearer(admin.token));
    expect(after.body.nom).toBe('BCG modifié');
  });
});
