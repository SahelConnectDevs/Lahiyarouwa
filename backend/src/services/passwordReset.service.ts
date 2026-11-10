import { createHmac, randomBytes } from 'node:crypto';

import { env } from '../config/env';
import { LoginChallenge } from '../models/LoginChallenge';
import { PasswordReset } from '../models/PasswordReset';
import { User } from '../models/User';
import { passwordResetMail } from '../templates/passwordResetMail';
import { AppError } from '../utils/AppError';
import { hashPassword } from '../utils/password';
import { sendMail } from './mail.service';

/** Durée de validité d'un lien de réinitialisation. */
export const RESET_TTL_MS = 30 * 60 * 1000;
/** Délai minimal entre deux liens envoyés au même compte. */
export const RESET_COOLDOWN_MS = 2 * 60 * 1000;

function digest(token: string): string {
  return createHmac('sha256', env.jwtSecret).update(`reset:${token}`).digest('hex');
}

/**
 * Envoie un lien de réinitialisation à l'adresse indiquée si elle correspond
 * à un compte actif. Ne dit jamais si le compte existe (même réponse dans
 * tous les cas) pour ne pas révéler les adresses inscrites.
 */
export async function requestReset(email: string): Promise<void> {
  const user = await User.findOne({ email, isActive: true });
  if (!user?.email) return;

  // Anti-spam : pas plus d'un lien toutes les 2 minutes par compte.
  const recent = await PasswordReset.exists({
    user: user._id,
    createdAt: { $gt: new Date(Date.now() - RESET_COOLDOWN_MS) },
  });
  if (recent) return;

  const token = randomBytes(32).toString('base64url');
  // Un seul lien valable à la fois : le nouveau remplace les précédents.
  await PasswordReset.deleteMany({ user: user._id });
  const reset = await PasswordReset.create({
    user: user._id,
    tokenHash: digest(token),
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
  });

  const link = `${env.webAppUrl}/reinitialiser-mot-de-passe#${token}`;
  try {
    await sendMail(
      passwordResetMail({ to: user.email, name: user.name, link, minutes: RESET_TTL_MS / 60_000 }),
    );
  } catch (error) {
    await reset.deleteOne();
    throw error;
  }
}

const INVALID = 'Ce lien n’est plus valable (expiré ou déjà utilisé). Demandez-en un nouveau.';

/**
 * Change le mot de passe avec le jeton du lien. Usage unique ; déconnecte
 * tous les appareils et annule les connexions en attente de code. Ne
 * connecte pas : il faut ensuite se connecter normalement (code compris).
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const reset = await PasswordReset.findOneAndDelete({ tokenHash: digest(token) });
  if (!reset || reset.expiresAt.getTime() <= Date.now()) throw AppError.badRequest(INVALID);

  const user = await User.findById(reset.user);
  if (!user || !user.isActive) throw AppError.badRequest(INVALID);

  user.set('passwordHash', await hashPassword(newPassword));
  user.mustChangePassword = false;
  user.tokenVersion += 1;
  await user.save();
  await Promise.all([
    PasswordReset.deleteMany({ user: user._id }),
    LoginChallenge.deleteMany({ user: user._id }),
  ]);
}
