import { Schema, model, type HydratedDocumentFromSchema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions';

/** Signes proposés par "Signaler un signe inquiétant" dans l'app (contraction_page.dart). */
export const ALERT_SIGNS = [
  'Saignement vaginal',
  'Forte fièvre',
  'Maux de tête sévères',
  'Vision trouble',
  'Douleur abdominale intense',
  'Absence de mouvements du bébé',
  'Perte de liquide',
  'Convulsions',
  'Autre signe',
] as const;
export type AlertSign = (typeof ALERT_SIGNS)[number];

export const ALERT_STATUSES = ['nouvelle', 'en_cours', 'traitee'] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

/** Signe inquiétant signalé par une utilisatrice, suivi par l'équipe depuis l'admin-web. */
const alertSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    /** Agent communautaire de l'utilisatrice au moment du signalement (destinataire de l'alerte). */
    relais: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    signe: { type: String, enum: ALERT_SIGNS, required: true },
    details: { type: String, trim: true, maxlength: 1000 },
    statut: { type: String, enum: ALERT_STATUSES, default: 'nouvelle', index: true },
    noteSuivi: { type: String, trim: true, maxlength: 2000 },
    traiteePar: { type: Schema.Types.ObjectId, ref: 'User' },
    traiteeLe: { type: Date },
  },
  baseSchemaOptions,
);

export type AlertDocument = HydratedDocumentFromSchema<typeof alertSchema>;

export const Alert = model('Alert', alertSchema);
