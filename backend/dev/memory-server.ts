/**
 * API locale de démonstration, sans MongoDB à installer : `npm run dev:memory`.
 *
 * - Base MongoDB en mémoire (mongodb-memory-server), vide à chaque démarrage.
 * - Contenus de départ (CPN, vaccins, conseils, méthodes PF) et comptes fictifs.
 * - Aucun mail envoyé : codes de connexion et liens de réinitialisation
 *   s'affichent dans ce terminal.
 * - N'utilise jamais la base de production, même si un .env existe.
 *
 * Puis, dans un autre terminal : `cd admin-web && npm run dev` → http://localhost:5173
 */
import { randomBytes } from 'node:crypto';

const PORT = 3000;
const PASSWORD = 'demo-password';

async function main(): Promise<void> {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongo = await MongoMemoryServer.create();

  // Avant tout import de src/ (env.ts lit ces variables au chargement), et
  // en écrasant un éventuel .env : jamais de vraie base ni de vrai SMTP ici.
  Object.assign(process.env, {
    NODE_ENV: 'development',
    MONGODB_URI: mongo.getUri('lahiyarouwa-demo'),
    JWT_SECRET: randomBytes(32).toString('hex'),
    CORS_ORIGIN: '*',
    WEB_APP_URL: 'http://localhost:5173',
    SMTP_HOST: '',
  });

  const { connectDatabase } = await import('../src/config/db');
  const { seedContent } = await import('../src/scripts/seed');
  const { User } = await import('../src/models/User');
  const auth = await import('../src/services/auth.service');
  const alerte = await import('../src/services/alerte.service');
  const pf = await import('../src/services/pf.service');
  const grossesse = await import('../src/services/grossesse.service');
  const { createApp } = await import('../src/app');

  await connectDatabase();
  await seedContent();

  const account = async (name: string, phone: string, extra: Record<string, unknown> = {}) => {
    const { user } = await auth.register({ name, phone, password: PASSWORD });
    const doc = (await User.findById(user.id))!;
    doc.set(extra);
    await doc.save();
    return doc;
  };
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

  await account('Aïchatou Admin', '+22790000001', { role: 'admin', email: 'admin@demo.local' });
  const agent = await account('Moussa Agent', '+22790000002', {
    role: 'relais',
    email: 'agent@demo.local',
    secteur: 'Niamey, commune V',
  });
  await account('Hadiza Agent', '+22790000003', {
    role: 'relais',
    email: 'hadiza@demo.local',
    secteur: 'Tillabéri',
  });

  const fatouma = await account('Fatouma Issa', '+22791000001', { relais: agent._id, partageRelais: true });
  const mariama = await account('Mariama Hamani', '+22791000002', { relais: agent._id, partageRelais: true });
  await account('Rakia Seydou', '+22791000003', { relais: agent._id, partageRelais: false });
  const zeinabou = await account('Zeinabou Ali', '+22791000004');

  await grossesse.setDdr(mariama.id, daysAgo(150));
  await pf.start(fatouma.id, { methode: 'injectable', dateDebut: daysAgo(80) });
  await alerte.create(fatouma, { signe: 'Forte fièvre', details: 'Fièvre depuis hier soir, frissons.' });
  await alerte.create(zeinabou, { signe: 'Saignement vaginal' });

  createApp().listen(PORT, '127.0.0.1', () => {
    // eslint-disable-next-line no-console
    console.log(`
API de démo prête sur http://127.0.0.1:${PORT}  (base en mémoire, vidée à l'arrêt)

Comptes (mot de passe : ${PASSWORD}) :
  Admin  : admin@demo.local
  Agent  : agent@demo.local   (3 bénéficiaires, 1 alerte)
  Agent  : hadiza@demo.local  (aucune bénéficiaire)
  Femme  : 91 00 00 01 (téléphone, pour l'app mobile)

Les codes de connexion et liens « mot de passe oublié » s'affichent ci-dessous.
Lancez maintenant le site : cd admin-web && npm run dev  →  http://localhost:5173
`);
  });

  const stop = async () => {
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
