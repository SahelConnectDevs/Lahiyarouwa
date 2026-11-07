import { Schema, model, type HydratedDocumentFromSchema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions';

const contractionSchema = new Schema(
  {
    debut: { type: Date, required: true },
    fin: { type: Date, required: true },
  },
  { _id: false },
);

/** Séance du compteur de contractions (lib/view/contraction_page.dart), enregistrée une fois terminée. */
const contractionSessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    debut: { type: Date, required: true },
    fin: { type: Date, required: true },
    contractions: { type: [contractionSchema], default: [] },
  },
  baseSchemaOptions,
);

export type ContractionSessionDocument = HydratedDocumentFromSchema<typeof contractionSessionSchema>;

export const ContractionSession = model('ContractionSession', contractionSessionSchema);
