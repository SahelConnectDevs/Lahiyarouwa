import { body, param, query } from 'express-validator';

import { ALERT_SIGNS } from '../models/Alert';
import { SEXES } from '../models/Child';
import { CONSEIL_CATEGORIES, LANGUES } from '../models/Conseil';
import { VACCINE_TARGETS } from '../models/Vaccine';
import { dateField, notInFuture, optionalText } from './common';

// --- Grossesse -------------------------------------------------------------

/** Une DDR plausible : pas dans le futur, et pas plus de 44 semaines en arrière. */
export const ddrValidator = [
  notInFuture(
    dateField('ddr', 'Date des dernières règles'),
    'La date des dernières règles ne peut pas être dans le futur.',
  )
    .custom((value: Date) => Date.now() - value.getTime() <= 44 * 7 * 24 * 60 * 60 * 1000)
    .withMessage('La date des dernières règles doit dater de moins de 44 semaines.'),
];

export const finishPregnancyValidator = [notInFuture(dateField('dateAccouchement', "Date d'accouchement"))];

export const markCpnValidator = [
  param('numero').isInt({ min: 1, max: 20 }).withMessage('Numéro de CPN invalide.').toInt(),
  body('effectuee').isBoolean({ strict: true }).withMessage('effectuee doit valoir true ou false.'),
  notInFuture(dateField('date').optional()),
  optionalText('notes', 1000),
];

// --- Enfants ---------------------------------------------------------------

const childFields = (optional: boolean) => {
  const opt = <T extends { optional: () => T }>(chain: T): T => (optional ? chain.optional() : chain);
  return [
    opt(
      body('prenom').isString().trim().notEmpty().withMessage('Le prénom est requis.').isLength({ max: 100 }),
    ),
    opt(notInFuture(dateField('dateNaissance', 'Date de naissance'))),
    body('sexe').optional().isIn(SEXES).withMessage('Sexe invalide (F ou M).'),
    body('poidsNaissanceGrammes')
      .optional()
      .isInt({ min: 300, max: 7000 })
      .withMessage('Poids de naissance invalide (en grammes, 300 à 7000).')
      .toInt(),
  ];
};

export const createChildValidator = childFields(false);
export const updateChildValidator = childFields(true);

// --- Vaccination -----------------------------------------------------------

export const vaccineQueryValidator = [
  query('cible').optional().isIn(VACCINE_TARGETS).withMessage('Cible invalide (maman ou enfant).'),
];

export const enfantQueryValidator = [query('enfant').optional().isMongoId().withMessage('Enfant invalide.')];

export const createVaccinationValidator = [
  body('vaccin').isMongoId().withMessage('Vaccin invalide.'),
  body('enfant').optional({ values: 'falsy' }).isMongoId().withMessage('Enfant invalide.'),
  notInFuture(dateField('date', 'Date de vaccination')),
  optionalText('lieu', 200),
  optionalText('notes', 1000),
];

// --- Contractions ----------------------------------------------------------

export const createContractionSessionValidator = [
  dateField('debut', 'Début'),
  dateField('fin', 'Fin'),
  body('contractions').isArray({ max: 300 }).withMessage('Liste de contractions invalide (300 maximum).'),
  body('contractions.*.debut').isISO8601().withMessage('Début de contraction invalide.').toDate(),
  body('contractions.*.fin').isISO8601().withMessage('Fin de contraction invalide.').toDate(),
];

// --- Alertes ---------------------------------------------------------------

export const createAlertValidator = [
  body('signe').isIn(ALERT_SIGNS).withMessage('Signe inconnu.'),
  optionalText('details', 1000),
];

// --- Conseils (lecture côté app) -------------------------------------------

export const listConseilsValidator = [
  query('categorie').optional().isIn(CONSEIL_CATEGORIES).withMessage('Catégorie invalide.'),
  query('langue').optional().isIn(LANGUES).withMessage('Langue invalide.'),
  query('semaine').optional().isInt({ min: 0, max: 45 }).withMessage('Semaine invalide.').toInt(),
];
