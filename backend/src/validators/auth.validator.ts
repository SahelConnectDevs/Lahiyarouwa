import { body } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Le nom est requis.'),
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('6 caractères minimum.'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password').notEmpty().withMessage('Mot de passe requis.'),
];
