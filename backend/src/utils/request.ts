import type { Request } from 'express';
import { matchedData } from 'express-validator';

import { AppError } from './AppError';

/**
 * Corps de requête restreint aux seuls champs déclarés dans les validators
 * de la route (déjà nettoyés/convertis). Empêche un client d'injecter un
 * champ non prévu (ex: `role: "admin"` à l'inscription, `user` sur une
 * ressource).
 */
export function bodyData<T>(req: Request): T {
  return matchedData(req, { locations: ['body'], includeOptionals: false }) as T;
}

/** Query string validée et convertie (pagination, filtres). */
export function queryData<T>(req: Request): T {
  return matchedData(req, { locations: ['query'], includeOptionals: false }) as T;
}

/** Utilisateur authentifié — garanti par requireAuth() en amont. */
export function currentUser(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export function currentUserId(req: Request): string {
  return currentUser(req)._id.toString();
}

/** Paramètre de route (Express 5 le type `string | string[]`). */
export function routeParam(req: Request, name: string): string {
  return String(req.params[name]);
}
