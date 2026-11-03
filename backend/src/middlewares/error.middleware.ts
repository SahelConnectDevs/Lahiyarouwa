import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route introuvable: ${req.method} ${req.originalUrl}`));
}

// Express (v4 et v5) reconnaît un error handler à son arité de 4 paramètres :
// _next doit rester déclaré même s'il n'est pas appelé ici.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.fieldErrors ? { errors: err.fieldErrors } : {}),
    });
    return;
  }

  if (!env.isProduction) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(500).json({ message: 'Erreur interne du serveur.' });
}
