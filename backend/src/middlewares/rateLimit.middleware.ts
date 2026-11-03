import rateLimit from 'express-rate-limit';

/**
 * Anti brute-force sur /auth/login : 10 tentatives / 15 min par IP.
 * Répond au format { message } déjà géré par le client mobile
 * (ServerException, statusCode 429).
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion. Réessaie dans quelques minutes.' },
});
