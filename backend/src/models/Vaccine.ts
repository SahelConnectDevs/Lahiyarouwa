import { Schema, model, type HydratedDocumentFromSchema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions';

export const VACCINE_TARGETS = ['maman', 'enfant'] as const;

/** Vaccin du calendrier vaccinal (contenu géré depuis l'admin-web). */
const vaccineSchema = new Schema(
  {
    /** Identifiant stable, ex: "penta-1" — sert de clé pour le seed et les imports. */
    code: { type: String, required: true, unique: true, trim: true, lowercase: true },
    nom: { type: String, required: true, trim: true },
    cible: { type: String, enum: VACCINE_TARGETS, required: true },
    /** Libellé de dose, ex: "Dose 1", "Rappel". */
    dose: { type: String, trim: true },
    /** Moment recommandé, en clair : "À la naissance", "6 semaines", "Dès le 1er contact". */
    moment: { type: String, required: true, trim: true },
    /** Âge recommandé en semaines (enfant), pour calculer la date prévue depuis la naissance. */
    ageSemaines: { type: Number, min: 0 },
    description: { type: String, trim: true },
    ordre: { type: Number, default: 0 },
    actif: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

export type VaccineDocument = HydratedDocumentFromSchema<typeof vaccineSchema>;

export const Vaccine = model('Vaccine', vaccineSchema);
