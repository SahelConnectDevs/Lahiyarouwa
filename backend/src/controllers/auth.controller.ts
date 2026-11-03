import type { Request, Response } from 'express';

import * as authService from '../services/auth.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body as { name: string; email: string; password: string });
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body as { email: string; password: string });
  res.status(200).json(result);
});

// GET /auth/me renvoie l'utilisateur nu (pas de wrapper { user }), pour
// matcher UserModel.fromJson(response.data) côté Flutter.
export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  res.status(200).json(authService.toPublicUser(req.user));
});
