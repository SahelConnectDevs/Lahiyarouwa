import { body, query, type ValidationChain } from 'express-validator';

import { ALERT_STATUSES } from '../models/Alert';
import { CONSEIL_CATEGORIES, LANGUES } from '../models/Conseil';
import { ROLES } from '../models/User';
import { VACCINE_TARGETS } from '../models/Vaccine';
import { nullable, optionalText, paginationQuery, phoneField } from './common';

/** En création, les champs `required` sont obligatoires ; en modification (PATCH), tout est optionnel. */
const req = (chain: ValidationChain, partial: boolean): ValidationChain =>
  partial ? chain.optional() : chain;

const text = (field: string, max: number, label: string, partial: boolean) =>
  req(body(field), partial).isString().trim().notEmpty().withMessage(`${label} requis.`).isLength({ max });

const week = (field: string) =>
  body(field)
    .optional({ values: 'null' })
    .isInt({ min: 0, max: 45 })
    .withMessage('Semaine invalide (0 à 45).')
    .toInt();

const stringList = (field: string) => [
  body(field).optional().isArray({ max: 50 }).withMessage('Liste invalide.'),
  body(`${field}.*`).isString().trim().notEmpty().isLength({ max: 300 }),
];

// --- Utilisateurs ----------------------------------------------------------

export const listUsersValidator = [
  ...paginationQuery,
  query('search').optional().isString().trim().isLength({ max: 100 }),
  query('role').optional().isIn(ROLES).withMessage('Rôle invalide.'),
  query('isActive').optional().isBoolean().withMessage('isActive invalide.').toBoolean(),
  query('relais').optional().isMongoId().withMessage('Agent invalide.'),
  query('sansAgent').optional().isBoolean().withMessage('sansAgent invalide.').toBoolean(),
];

export const updateUserValidator = [
  body('role').optional().isIn(ROLES).withMessage('Rôle invalide.'),
  // null (ou '') retire l'e-mail ; refusé pour un admin ou un agent (service).
  body('email')
    .optional()
    .custom(
      (value) =>
        value === null ||
        value === '' ||
        (typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())),
    )
    .withMessage('E-mail invalide.')
    .customSanitizer((value: string | null) => (value ? value.trim().toLowerCase() : null)),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive doit valoir true ou false.'),
  // null retire l'agent assigné.
  nullable('relais', (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v), 'Agent invalide.'),
  nullable(
    'secteur',
    (v) => typeof v === 'string' && v.trim().length <= 120,
    'Secteur invalide (120 caractères maximum).',
  ),
];

/** Création d'un compte par l'admin : agent communautaire ou bénéficiaire. */
export const createUserValidator = [
  body('name').isString().trim().notEmpty().withMessage('Le nom est requis.').isLength({ max: 100 }),
  phoneField('phone'),
  body('role').isIn(['user', 'relais']).withMessage('Rôle invalide (bénéficiaire ou agent).'),
  // Obligatoire pour un agent : il se connecte avec, et reçoit son code de connexion.
  body('email')
    .if(body('role').equals('relais'))
    .exists({ values: 'falsy' })
    .withMessage("L'e-mail est obligatoire pour un agent (il s'en sert pour se connecter)."),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('E-mail invalide.').trim().toLowerCase(),
  body('secteur')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Secteur invalide (120 caractères maximum).'),
  body('relais').optional({ values: 'falsy' }).isMongoId().withMessage('Agent invalide.'),
];

// --- Alertes ---------------------------------------------------------------

export const listAlertsValidator = [
  ...paginationQuery,
  query('statut').optional().isIn(ALERT_STATUSES).withMessage('Statut invalide.'),
];

export const updateAlertValidator = [
  body('statut').optional().isIn(ALERT_STATUSES).withMessage('Statut invalide.'),
  optionalText('noteSuivi', 2000),
];

// --- Contenus --------------------------------------------------------------

export const conseilValidator = (partial: boolean) => [
  text('titre', 200, 'Titre', partial),
  text('contenu', 10000, 'Contenu', partial),
  req(body('categorie'), partial).isIn(CONSEIL_CATEGORIES).withMessage('Catégorie invalide.'),
  body('langue').optional().isIn(LANGUES).withMessage('Langue invalide.'),
  week('semaineMin'),
  week('semaineMax'),
  optionalText('icone', 60),
  body('ordre').optional().isInt().toInt(),
  body('publie').optional().isBoolean({ strict: true }).withMessage('publie doit valoir true ou false.'),
];

export const conseilListValidator = [
  ...paginationQuery,
  query('categorie').optional().isIn(CONSEIL_CATEGORIES),
  query('langue').optional().isIn(LANGUES),
];

export const vaccinValidator = (partial: boolean) => [
  req(body('code'), partial)
    .isString()
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9-]{2,40}$/)
    .withMessage('Code invalide (minuscules, chiffres et tirets).'),
  text('nom', 120, 'Nom', partial),
  req(body('cible'), partial).isIn(VACCINE_TARGETS).withMessage('Cible invalide (maman ou enfant).'),
  optionalText('dose', 60),
  text('moment', 120, 'Moment', partial),
  body('ageSemaines').optional({ values: 'null' }).isInt({ min: 0, max: 520 }).toInt(),
  optionalText('description', 2000),
  body('ordre').optional().isInt().toInt(),
  body('actif').optional().isBoolean({ strict: true }),
];

export const vaccinListValidator = [...paginationQuery, query('cible').optional().isIn(VACCINE_TARGETS)];

export const cpnStepValidator = (partial: boolean) => [
  req(body('numero'), partial).isInt({ min: 1, max: 20 }).withMessage('Numéro invalide (1 à 20).').toInt(),
  text('titre', 120, 'Titre', partial),
  text('periode', 120, 'Période', partial),
  week('semaineDebut'),
  week('semaineFin'),
  ...stringList('examens'),
  ...stringList('aApporter'),
  body('actif').optional().isBoolean({ strict: true }),
];
