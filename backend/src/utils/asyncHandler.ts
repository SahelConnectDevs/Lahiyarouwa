import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Évite un try/catch répété dans chaque controller. Express 5 transmet déjà
 * automatiquement les rejets de promesse d'un handler async à next(), mais
 * ce wrapper documente l'intention explicitement et reste inoffensif.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
