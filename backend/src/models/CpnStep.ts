import { Schema, model, type HydratedDocumentFromSchema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions';

/**
 * Étape du calendrier des CPN (contenu géré depuis l'admin-web). Les dates
 * prévues sont calculées pour chaque utilisatrice à partir de sa DDR et de
 * semaineDebut/semaineFin (voir services/grossesse.service.ts).
 */
const cpnStepSchema = new Schema(
  {
    numero: { type: Number, required: true, unique: true, min: 1 },
    titre: { type: String, required: true, trim: true },
    /** Libellé affiché tel quel, ex: "14 – 20 semaines" ou "Après l'accouchement". */
    periode: { type: String, required: true, trim: true },
    /** Semaines d'aménorrhée ; absentes pour une consultation post-natale. */
    semaineDebut: { type: Number, min: 0, max: 45 },
    semaineFin: { type: Number, min: 0, max: 45 },
    examens: { type: [String], default: [] },
    aApporter: { type: [String], default: [] },
    actif: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

export type CpnStepDocument = HydratedDocumentFromSchema<typeof cpnStepSchema>;

export const CpnStep = model('CpnStep', cpnStepSchema);
