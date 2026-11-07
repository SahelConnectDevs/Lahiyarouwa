import { Schema, model, type HydratedDocumentFromSchema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions';

export const CONTRACEPTION_STATUSES = ['en_cours', 'arretee'] as const;

/** Méthode de planification familiale suivie par une utilisatrice (historique conservé). */
const contraceptionRecordSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    methode: { type: Schema.Types.ObjectId, ref: 'ContraceptiveMethod', required: true },
    statut: { type: String, enum: CONTRACEPTION_STATUSES, default: 'en_cours' },
    /** Début de la méthode (pose de l'implant, première injection, début de plaquette...). */
    dateDebut: { type: Date, required: true },
    dateFin: { type: Date },
    raisonArret: { type: String, trim: true, maxlength: 300 },
    /** Durée propre à cette femme si elle diffère de la méthode (implant 3 ans au lieu de 5). */
    dureeJours: { type: Number, min: 1, max: 5000 },
    /** Heure du rappel quotidien, "HH:MM" (pilule). */
    heureRappel: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    /** Dernier renouvellement : dernière injection, début de la dernière plaquette... */
    dernierRenouvellement: { type: Date },
    renouvellements: [{ type: Date }],
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  baseSchemaOptions,
);

// Au plus une méthode en cours par utilisatrice.
contraceptionRecordSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { statut: 'en_cours' }, name: 'une_methode_en_cours' },
);

export type ContraceptionRecordDocument = HydratedDocumentFromSchema<typeof contraceptionRecordSchema>;

export const ContraceptionRecord = model('ContraceptionRecord', contraceptionRecordSchema);
