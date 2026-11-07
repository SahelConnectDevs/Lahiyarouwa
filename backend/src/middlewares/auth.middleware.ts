import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { User, type Role } from '../models/User';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';

/**
 * Vérifie le JWT "Authorization: Bearer <token>" et attache l'utilisateur à
 * req.user. Toute réponse 401 ici déclenche côté mobile
 * ApiClient.onUnauthorized -> AuthProvider.forceLogout (voir
 * lib/core/network/api_client.dart).
 *
 * Refuse aussi un token émis avant un changement de mot de passe (tokenVersion)
 * ou appartenant à un compte désactivé par un admin.
 */
export function requireAuth(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    void (async () => {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        next(AppError.unauthorized('Token manquant.'));
        return;
      }

      try {
        const payload = verifyToken(header.slice('Bearer '.length));
        const user = await User.findById(payload.sub);
        if (!user) {
          next(AppError.unauthorized('Utilisateur introuvable.'));
          return;
        }
        if ((payload.v ?? 0) !== user.tokenVersion) {
          next(AppError.unauthorized('Session expirée, reconnectez-vous.'));
          return;
        }
        if (!user.isActive) {
          next(AppError.unauthorized('Ce compte a été désactivé.'));
          return;
        }
        req.user = user;
        next();
      } catch {
        next(AppError.unauthorized('Token invalide ou expiré.'));
      }
    })();
  };
}

/** Restreint une route à un ou plusieurs rôles, ex: requireRole('admin'). À poser après requireAuth(). */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      next(AppError.forbidden());
      return;
    }
    next();
  };
}
