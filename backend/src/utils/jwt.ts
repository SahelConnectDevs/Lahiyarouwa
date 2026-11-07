import jwt from 'jsonwebtoken';

import { env } from '../config/env';

export interface JwtPayload {
  /** id Mongo de l'utilisateur (subject). */
  sub: string;
  /**
   * User.tokenVersion au moment de la signature. Incrémenté au changement de
   * mot de passe ou à la désactivation du compte : tous les anciens tokens
   * deviennent alors invalides (vérifié par requireAuth).
   */
  v: number;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
