import { Schema, model, type HydratedDocumentFromSchema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions';

export const PF_CATEGORIES = ['longue', 'courte', 'urgence'] as const;
export const PF_EFFICACITES = ['tres_efficace', 'efficace', 'depend_usage'] as const;

/**
 * Comment l'app rappelle cette méthode à l'utilisatrice :
 * - quotidien  : une prise par jour (pilule) + renouvellement tous les `intervalleJours` ;
 * - intervalle : un geste à refaire tous les `intervalleJours` (injectable) ;
 * - echeance   : une date de fin `dureeJours` après la pose (implant, DIU, MAMA) ;
 * - aucun      : pas de rappel (préservatif, collier du cycle, urgence).
 */
export const RAPPEL_MODES = ['quotidien', 'intervalle', 'echeance', 'aucun'] as const;
export type RappelMode = (typeof RAPPEL_MODES)[number];

/** Méthode de planification familiale (contenu géré depuis l'admin-web). */
const contraceptiveMethodSchema = new Schema(
  {
    /** Identifiant stable, ex: "injectable" — utilisé par l'app et le seed. */
    code: { type: String, required: true, unique: true, trim: true, lowercase: true },
    nom: { type: String, required: true, trim: true },
    categorie: { type: String, enum: PF_CATEGORIES, required: true },
    hormonale: { type: Boolean, default: false },
    efficacite: { type: String, enum: PF_EFFICACITES, required: true },
    /** Une phrase de présentation, ex: "Une injection tous les 3 mois". */
    resume: { type: String, trim: true },
    dureeProtection: { type: String, trim: true },
    avantages: { type: [String], default: [] },
    effetsSecondaires: { type: [String], default: [] },
    conditions: { type: [String], default: [] },
    // `mode` plutôt que `type` : `type` est réservé par Mongoose dans un sous-objet.
    rappel: {
      mode: { type: String, enum: RAPPEL_MODES, default: 'aucun' },
      intervalleJours: { type: Number, min: 1, max: 3650 },
      dureeJours: { type: Number, min: 1, max: 5000 },
      /** Combien de jours avant l'échéance la femme (et son agent) sont prévenus. */
      avanceJours: { type: Number, min: 0, max: 90, default: 3 },
    },
    ordre: { type: Number, default: 0 },
    actif: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

export type ContraceptiveMethodDocument = HydratedDocumentFromSchema<typeof contraceptiveMethodSchema>;

export const ContraceptiveMethod = model('ContraceptiveMethod', contraceptiveMethodSchema);
