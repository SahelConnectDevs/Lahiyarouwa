import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

import { AppError } from '../utils/AppError';

/**
 * À placer après les chaînes express-validator d'une route (voir
 * routes/auth.routes.ts). Convertit les erreurs de validation au format
 * { message, errors: { champ: raison } } attendu par le client mobile
 * (voir ValidationException côté Flutter).
 */
export function validate(req: Request, _res: Response, next: NextFunction): void {
  const result = validationResult(req);
  if (result.isEmpty()) {
    next();
    return;
  }

  const fieldErrors: Record<string, string> = {};
  for (const error of result.array()) {
    if (error.type === 'field' && !(error.path in fieldErrors)) {
      fieldErrors[error.path] = error.msg as string;
    }
  }

  next(AppError.validation('Données invalides.', fieldErrors));
}
