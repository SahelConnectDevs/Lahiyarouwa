import { Schema, model, type HydratedDocumentFromSchema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions';

/** Suivi d'une CPN (consultation prénatale) par l'utilisatrice, référencée par son numéro dans CpnStep. */
const cpnVisitSchema = new Schema(
  {
    numero: { type: Number, required: true, min: 1 },
    effectueeLe: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false },
);

export const PREGNANCY_STATUSES = ['en_cours', 'terminee'] as const;

const pregnancySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    /** Date des dernières règles : point de départ de tous les calculs (semaine, terme, CPN). */
    ddr: { type: Date, required: true },
    status: { type: String, enum: PREGNANCY_STATUSES, default: 'en_cours' },
    dateAccouchement: { type: Date },
    cpn: { type: [cpnVisitSchema], default: [] },
  },
  baseSchemaOptions,
);

// Au plus une grossesse en cours par utilisatrice.
pregnancySchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { status: 'en_cours' }, name: 'une_grossesse_en_cours' },
);

export type PregnancyDocument = HydratedDocumentFromSchema<typeof pregnancySchema>;

export const Pregnancy = model('Pregnancy', pregnancySchema);
