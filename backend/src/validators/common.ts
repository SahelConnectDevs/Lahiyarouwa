import { body, param, query, type ValidationChain } from 'express-validator';

import { normalizePhone } from '../utils/phone';

/** :id (ou autre paramètre) doit être un ObjectId Mongo — sinon 422 plutôt qu'une CastError en 500. */
export const objectIdParam = (name = 'id'): ValidationChain =>
  param(name).isMongoId().withMessage('Identifiant invalide.');

/**
 * Champ téléphone normalisé en "+227XXXXXXXX" (voir utils/phone.ts).
 * `base` permet de préfixer la chaîne d'un .if(...) — qui ne s'applique
 * qu'aux règles posées APRÈS lui.
 */
export const phoneField = (field = 'phone', base: ValidationChain = body(field)): ValidationChain =>
  base
    .isString()
    .withMessage('Numéro de téléphone invalide.')
    .bail()
    .custom((value: string) => normalizePhone(value) !== null)
    .withMessage('Numéro de téléphone invalide.')
    .bail()
    .customSanitizer((value: string) => normalizePhone(value));

/** Date ISO 8601 ("2026-03-14" ou date-heure), convertie en Date. */
export const dateField = (field: string, label = 'Date'): ValidationChain =>
  body(field).isISO8601().withMessage(`${label} invalide.`).bail().toDate();

/** La date (déjà convertie par dateField) ne doit pas être dans le futur (marge d'un jour pour les fuseaux). */
export const notInFuture = (chain: ValidationChain, message = 'La date ne peut pas être dans le futur.') =>
  chain.custom((value: Date) => value.getTime() <= Date.now() + 24 * 60 * 60 * 1000).withMessage(message);

export const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide (1 à 100).').toInt(),
];

export const optionalText = (field: string, max: number): ValidationChain =>
  body(field)
    .optional({ values: 'null' })
    .isString()
    .withMessage('Texte invalide.')
    .bail()
    .trim()
    .isLength({ max })
    .withMessage(`${max} caractères maximum.`);

/**
 * Champ facultatif qui accepte `null` pour « effacer la valeur ».
 * (Avec optional({ values: 'null' }), express-validator considère null comme
 * absent et matchedData ne le transmet jamais au service.)
 */
export const nullable = (
  field: string,
  check: (value: unknown) => boolean,
  message: string,
): ValidationChain =>
  body(field)
    .optional()
    .custom((value) => value === null || check(value))
    .withMessage(message);
