import { body } from 'express-validator';

import { dateField, notInFuture, phoneField } from './common';

const PASSWORD_MIN = 6;

const passwordRule = (field: string) =>
  body(field)
    .isString()
    .isLength({ min: PASSWORD_MIN, max: 128 })
    .withMessage(`Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`);

/** Inscription depuis l'app : nom, téléphone et mot de passe obligatoires ; e-mail et date de naissance facultatifs. */
export const registerValidator = [
  body('name').isString().trim().notEmpty().withMessage('Le nom est requis.').isLength({ max: 100 }),
  phoneField('phone'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('E-mail invalide.').trim().toLowerCase(),
  notInFuture(dateField('birthDate', 'Date de naissance').optional({ values: 'falsy' })),
  passwordRule('password'),
];

/** Connexion par téléphone (app mobile) ou par e-mail (admin-web) : l'un des deux est requis. */
export const loginValidator = [
  phoneField('phone', body('phone').if(body('email').not().exists({ values: 'falsy' }))),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('E-mail invalide.').trim().toLowerCase(),
  body('password').isString().notEmpty().withMessage('Mot de passe requis.'),
];

export const updateProfileValidator = [
  body('name')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Le nom ne peut pas être vide.')
    .isLength({ max: 100 }),
  body('email')
    .optional({ values: 'null' })
    .custom(
      (value) => value === '' || (typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)),
    )
    .withMessage('E-mail invalide.')
    .customSanitizer((value: string | null) => (value ? value.trim().toLowerCase() : null)),
  body('birthDate')
    .optional({ values: 'null' })
    .custom((value) => value === '' || !Number.isNaN(Date.parse(String(value))))
    .withMessage('Date de naissance invalide.')
    .customSanitizer((value: string | null) => (value ? new Date(value) : null)),
  body('partageRelais')
    .optional()
    .isBoolean({ strict: true })
    .withMessage('partageRelais doit valoir true ou false.'),
];

export const changePasswordValidator = [
  body('currentPassword').isString().notEmpty().withMessage('Mot de passe actuel requis.'),
  passwordRule('newPassword'),
];

export const deleteAccountValidator = [
  body('password').isString().notEmpty().withMessage('Confirmez avec votre mot de passe.'),
];
