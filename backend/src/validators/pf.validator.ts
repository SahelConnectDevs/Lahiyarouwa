import { body, param, query, type ValidationChain } from 'express-validator';

import { FOLLOW_UP_TYPES } from '../models/FollowUp';
import { ALERT_STATUSES } from '../models/Alert';
import { PF_CATEGORIES, PF_EFFICACITES, RAPPEL_MODES } from '../models/ContraceptiveMethod';
import { dateField, notInFuture, nullable, optionalText, paginationQuery } from './common';

const HOUR = /^([01]\d|2[0-3]):[0-5]\d$/;

// --- Planification familiale (utilisatrice) --------------------------------

export const methodCodeParam = [
  param('code')
    .matches(/^[a-z0-9-]{2,40}$/)
    .withMessage('Code de méthode invalide.'),
];

export const startMethodValidator = [
  body('methode')
    .isString()
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9-]{2,40}$/)
    .withMessage('Méthode invalide.'),
  notInFuture(dateField('dateDebut', 'Date de début')),
  body('dureeJours')
    .optional()
    .isInt({ min: 1, max: 5000 })
    .withMessage('Durée invalide (en jours).')
    .toInt(),
  body('heureRappel').optional().matches(HOUR).withMessage('Heure invalide (HH:MM).'),
  optionalText('notes', 1000),
];

export const updateMethodValidator = [
  nullable(
    'dureeJours',
    (v) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5000,
    'Durée invalide (en jours).',
  ),
  nullable('heureRappel', (v) => typeof v === 'string' && HOUR.test(v), 'Heure invalide (HH:MM).'),
  nullable('notes', (v) => typeof v === 'string' && v.length <= 1000, '1000 caractères maximum.'),
];

export const renewValidator = [notInFuture(dateField('date'))];

export const stopValidator = [notInFuture(dateField('date', "Date d'arrêt")), optionalText('raison', 300)];

export const remindersQueryValidator = [
  query('horizon')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Horizon invalide (1 à 365 jours).')
    .toInt(),
];

// --- Espace agent communautaire --------------------------------------------

export const beneficiariesQueryValidator = [
  query('search').optional().isString().trim().isLength({ max: 100 }),
];

export const relaisAlertsQueryValidator = [
  query('statut').optional().isIn(ALERT_STATUSES).withMessage('Statut invalide.'),
];

export const followUpValidator = [
  body('type').isIn(FOLLOW_UP_TYPES).withMessage('Type invalide (appel, visite, orientation, autre).'),
  notInFuture(dateField('date').optional()),
  optionalText('note', 2000),
  optionalText('orienteVers', 200),
  body('alerte').optional().isMongoId().withMessage('Alerte invalide.'),
];

// --- Admin : catalogue des méthodes ----------------------------------------

const req = (chain: ValidationChain, partial: boolean): ValidationChain =>
  partial ? chain.optional() : chain;

const list = (field: string) => [
  body(field).optional().isArray({ max: 30 }).withMessage('Liste invalide.'),
  body(`${field}.*`).isString().trim().notEmpty().isLength({ max: 300 }),
];

export const methodValidator = (partial: boolean) => [
  req(body('code'), partial)
    .isString()
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9-]{2,40}$/)
    .withMessage('Code invalide (minuscules, chiffres et tirets).'),
  req(body('nom'), partial).isString().trim().notEmpty().withMessage('Nom requis.').isLength({ max: 120 }),
  req(body('categorie'), partial).isIn(PF_CATEGORIES).withMessage('Catégorie invalide.'),
  req(body('efficacite'), partial).isIn(PF_EFFICACITES).withMessage('Efficacité invalide.'),
  body('hormonale').optional().isBoolean({ strict: true }),
  optionalText('resume', 300),
  optionalText('dureeProtection', 120),
  ...list('avantages'),
  ...list('effetsSecondaires'),
  ...list('conditions'),
  body('rappel').optional().isObject().withMessage('Rappel invalide.'),
  body('rappel.mode').optional().isIn(RAPPEL_MODES).withMessage('Mode de rappel invalide.'),
  body('rappel.intervalleJours').optional({ values: 'null' }).isInt({ min: 1, max: 3650 }).toInt(),
  body('rappel.dureeJours').optional({ values: 'null' }).isInt({ min: 1, max: 5000 }).toInt(),
  body('rappel.avanceJours').optional().isInt({ min: 0, max: 90 }).toInt(),
  body('ordre').optional().isInt().toInt(),
  body('actif').optional().isBoolean({ strict: true }),
];

export const methodListValidator = [...paginationQuery, query('categorie').optional().isIn(PF_CATEGORIES)];
