import rateLimit from 'express-rate-limit';

import { env } from '../config/env';

// En test, chaque fichier enchaîne des dizaines de requêtes depuis la même
// IP : on garde les limiteurs actifs (pour que le code soit exercé) mais
// avec un plafond qui ne gêne pas la suite.
const isTest = env.nodeEnv === 'test';

/**
 * Anti brute-force sur /auth/login : 10 tentatives / 15 min par IP.
 * Répond au format { message } déjà géré par le client mobile
 * (ServerException, statusCode 429).
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion. Réessaie dans quelques minutes.' },
});

/**
 * Saisie et renvoi du code de double authentification : 20 requêtes / 15 min
 * par IP, en plus du plafond d'essais par connexion (twoFactor.service.ts).
 */
export const loginCodeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives. Réessaie dans quelques minutes.' },
});

/** Limite la création de comptes en masse : 10 inscriptions / heure par IP. */
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isTest ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop d'inscriptions depuis cette connexion. Réessaie plus tard." },
});

/** Garde-fou global sur toute l'API : 300 requêtes / 15 min par IP. */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 100000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de requêtes. Réessaie dans quelques minutes.' },
});
