import type { QueryFilter } from 'mongoose';

import { ContraceptiveMethod, type ContraceptiveMethodDocument } from '../models/ContraceptiveMethod';
import { Conseil, type ConseilCategorie, type ConseilDocument, type Langue } from '../models/Conseil';
import { CpnStep, type CpnStepDocument } from '../models/CpnStep';
import { Vaccine, type VaccineDocument } from '../models/Vaccine';
import { makeContentService } from './content.service';

/** CRUD admin des contenus (utilisé par admin.controller.ts). */
export const conseilAdmin = makeContentService<ConseilDocument>(Conseil, {
  label: 'Conseil',
  sort: { categorie: 1, ordre: 1, createdAt: -1 },
});

export const vaccinAdmin = makeContentService<VaccineDocument>(Vaccine, {
  label: 'Vaccin',
  sort: { cible: 1, ordre: 1 },
  uniqueField: 'code',
});

export const cpnStepAdmin = makeContentService<CpnStepDocument>(CpnStep, {
  label: 'Étape CPN',
  sort: { numero: 1 },
  uniqueField: 'numero',
});

export const methodeAdmin = makeContentService<ContraceptiveMethodDocument>(ContraceptiveMethod, {
  label: 'Méthode',
  sort: { ordre: 1, nom: 1 },
  uniqueField: 'code',
});

/**
 * Conseils publiés pour l'app. `semaine` (semaine de grossesse en cours)
 * garde les conseils sans fenêtre + ceux dont la fenêtre inclut cette semaine.
 */
export async function listPublished(filter: {
  categorie?: ConseilCategorie;
  langue?: Langue;
  semaine?: number;
}): Promise<ConseilDocument[]> {
  const query: QueryFilter<ConseilDocument> = { publie: true, langue: filter.langue ?? 'fr' };
  if (filter.categorie) query.categorie = filter.categorie;
  if (filter.semaine !== undefined) {
    query.$and = [
      // `null` couvre à la fois un champ absent et un champ remis à null depuis l'admin.
      { $or: [{ semaineMin: null }, { semaineMin: { $lte: filter.semaine } }] },
      { $or: [{ semaineMax: null }, { semaineMax: { $gte: filter.semaine } }] },
    ];
  }
  return Conseil.find(query).sort({ ordre: 1, createdAt: -1 }).limit(200);
}
