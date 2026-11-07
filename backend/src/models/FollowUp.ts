import { Schema, model, type HydratedDocumentFromSchema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions';

export const FOLLOW_UP_TYPES = ['appel', 'visite', 'orientation', 'autre'] as const;
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];

/** Trace d'un accompagnement par l'agent communautaire (appel, visite, orientation vers un centre). */
const followUpSchema = new Schema(
  {
    beneficiaire: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    relais: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    /** Alerte à l'origine de ce suivi, le cas échéant. */
    alerte: { type: Schema.Types.ObjectId, ref: 'Alert' },
    type: { type: String, enum: FOLLOW_UP_TYPES, required: true },
    date: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 2000 },
    /** Structure vers laquelle la femme a été orientée, ex: "CSI de Lazaret, sage-femme". */
    orienteVers: { type: String, trim: true, maxlength: 200 },
  },
  baseSchemaOptions,
);

export type FollowUpDocument = HydratedDocumentFromSchema<typeof followUpSchema>;

export const FollowUp = model('FollowUp', followUpSchema);
