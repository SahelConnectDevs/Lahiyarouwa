import type { Request, Response } from 'express';

import * as authService from '../services/auth.service';
import * as passwordResetService from '../services/passwordReset.service';
import * as twoFactorService from '../services/twoFactor.service';
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

export const verifyLoginCode = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.verifyLoginCode(bodyData<{ challengeToken: string; code: string }>(req));
  res.status(200).json(result);
});

export const resendLoginCode = asyncHandler(async (req: Request, res: Response) => {
  const result = await twoFactorService.resendChallenge(
    bodyData<{ challengeToken: string }>(req).challengeToken,
  );
  res.status(200).json(result);
});

/** Toujours la même réponse, que le compte existe ou non (pas d'énumération des e-mails). */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await passwordResetService.requestReset(bodyData<{ email: string }>(req).email);
  res.status(200).json({
    message: 'Si un compte correspond à cette adresse, un lien de réinitialisation vient de lui être envoyé.',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = bodyData<{ token: string; newPassword: string }>(req);
  await passwordResetService.resetPassword(token, newPassword);
  res.status(200).json({ message: 'Mot de passe changé. Vous pouvez vous connecter.' });
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
