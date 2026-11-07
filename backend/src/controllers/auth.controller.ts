import type { Request, Response } from 'express';

import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { bodyData, currentUser, currentUserId } from '../utils/request';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(bodyData<Parameters<typeof authService.register>[0]>(req));
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(bodyData<Parameters<typeof authService.login>[0]>(req));
  res.status(200).json(result);
});

// GET /auth/me renvoie l'utilisateur nu (pas de wrapper { user }), pour
// matcher UserModel.fromJson(response.data) côté Flutter.
export const me = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(authService.toPublicUser(currentUser(req)));
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updateProfile(currentUser(req), bodyData(req));
  res.status(200).json(user);
});

/** Renvoie { token, user } : le nouveau token remplace l'ancien, invalidé avec toutes les autres sessions. */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.changePassword(
    currentUserId(req),
    bodyData<{ currentPassword: string; newPassword: string }>(req),
  );
  res.status(200).json(result);
});

export const deleteMe = asyncHandler(async (req: Request, res: Response) => {
  await authService.deleteAccount(currentUserId(req), bodyData<{ password: string }>(req).password);
  res.status(204).end();
});
