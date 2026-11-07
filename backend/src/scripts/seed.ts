/* eslint-disable no-console -- script en ligne de commande */
import { connectDatabase, disconnectDatabase } from '../config/db';
import { Conseil } from '../models/Conseil';
import { ContraceptiveMethod } from '../models/ContraceptiveMethod';
import { CpnStep } from '../models/CpnStep';
import { Vaccine } from '../models/Vaccine';
import { CONSEILS, CPN_STEPS, PF_METHODS, VACCINES } from './seedData';

/**
 * Insère les contenus de départ manquants. Idempotent : relancer le script
 * ne crée pas de doublon et n'écrase pas ce qui a été modifié depuis l'admin.
 *   npm run seed            (prod, depuis dist/)
 *   npm run seed:dev        (dev, depuis src/)
 */
export async function seedContent(): Promise<{
  cpn: number;
  vaccins: number;
  conseils: number;
  methodes: number;
}> {
  let cpn = 0;
  for (const step of CPN_STEPS) {
    const res = await CpnStep.updateOne({ numero: step.numero }, { $setOnInsert: step }, { upsert: true });
    cpn += res.upsertedCount;
  }

  let vaccins = 0;
  for (const vaccine of VACCINES) {
    const res = await Vaccine.updateOne({ code: vaccine.code }, { $setOnInsert: vaccine }, { upsert: true });
    vaccins += res.upsertedCount;
  }

  // Les conseils n'ont pas de clé naturelle : on n'en insère que si la collection est vide.
  let conseils = 0;
  if ((await Conseil.estimatedDocumentCount()) === 0) {
    conseils = (await Conseil.insertMany(CONSEILS)).length;
  }

  let methodes = 0;
  for (const method of PF_METHODS) {
    const res = await ContraceptiveMethod.updateOne(
      { code: method.code },
      { $setOnInsert: method },
      { upsert: true },
    );
    methodes += res.upsertedCount;
  }

  return { cpn, vaccins, conseils, methodes };
}

if (require.main === module) {
  (async () => {
    await connectDatabase();
    const added = await seedContent();
    console.log(
      `Seed terminé : ${added.cpn} étape(s) CPN, ${added.vaccins} vaccin(s), ${added.conseils} conseil(s), ` +
        `${added.methodes} méthode(s) de PF ajouté(s).`,
    );
    await disconnectDatabase();
  })().catch(async (error: unknown) => {
    console.error('Échec du seed :', error);
    await disconnectDatabase();
    process.exit(1);
  });
}
