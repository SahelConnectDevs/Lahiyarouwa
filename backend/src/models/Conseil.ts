import { Schema, model, type HydratedDocumentFromSchema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions';

export const CONSEIL_CATEGORIES = [
  'grossesse',
  'bebe',
  'nutrition',
  'planning_familial',
  'hygiene',
  'general',
] as const;
export type ConseilCategorie = (typeof CONSEIL_CATEGORIES)[number];

/** fr = français, ha = hausa, dje = zarma (codes ISO 639). */
export const LANGUES = ['fr', 'ha', 'dje'] as const;
export type Langue = (typeof LANGUES)[number];

/** Conseil santé publié dans l'app (contenu géré depuis l'admin-web). */
const conseilSchema = new Schema(
  {
    titre: { type: String, required: true, trim: true, maxlength: 200 },
    contenu: { type: String, required: true, trim: true, maxlength: 10000 },
    categorie: { type: String, enum: CONSEIL_CATEGORIES, required: true, index: true },
    langue: { type: String, enum: LANGUES, default: 'fr' },
    /** Fenêtre de semaines de grossesse où le conseil est pertinent (optionnelle). */
    semaineMin: { type: Number, min: 0, max: 45 },
    semaineMax: { type: Number, min: 0, max: 45 },
    /** Nom d'icône Material côté app, ex: "water_drop". */
    icone: { type: String, trim: true, maxlength: 60 },
    ordre: { type: Number, default: 0 },
    publie: { type: Boolean, default: false },
  },
  baseSchemaOptions,
);

export type ConseilDocument = HydratedDocumentFromSchema<typeof conseilSchema>;

export const Conseil = model('Conseil', conseilSchema);
