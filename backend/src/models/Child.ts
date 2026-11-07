import { Schema, model, type HydratedDocumentFromSchema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions';

export const SEXES = ['F', 'M'] as const;

const childSchema = new Schema(
  {
    /** Compte de la maman / du parent qui suit l'enfant. */
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    prenom: { type: String, required: true, trim: true, maxlength: 100 },
    dateNaissance: { type: Date, required: true },
    sexe: { type: String, enum: SEXES },
    poidsNaissanceGrammes: { type: Number, min: 300, max: 7000 },
  },
  baseSchemaOptions,
);

export type ChildDocument = HydratedDocumentFromSchema<typeof childSchema>;

export const Child = model('Child', childSchema);
