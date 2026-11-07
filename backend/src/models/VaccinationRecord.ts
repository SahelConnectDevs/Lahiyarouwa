import { Schema, model, type HydratedDocumentFromSchema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions';

/** Dose effectivement reçue, par la maman (enfant absent) ou par un de ses enfants. */
const vaccinationRecordSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    enfant: { type: Schema.Types.ObjectId, ref: 'Child' },
    vaccin: { type: Schema.Types.ObjectId, ref: 'Vaccine', required: true },
    date: { type: Date, required: true },
    lieu: { type: String, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  baseSchemaOptions,
);

export type VaccinationRecordDocument = HydratedDocumentFromSchema<typeof vaccinationRecordSchema>;

export const VaccinationRecord = model('VaccinationRecord', vaccinationRecordSchema);
