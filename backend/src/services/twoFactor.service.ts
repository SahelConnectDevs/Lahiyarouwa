import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

import { env } from '../config/env';
import { LoginChallenge } from '../models/LoginChallenge';
import { User, type UserDocument } from '../models/User';
import { AppError } from '../utils/AppError';
import { loginCodeMail } from '../templates/loginCodeMail';
import { sendMail } from './mail.service';

/** Durée de validité d'un code (et de la connexion en attente). */
export const CODE_TTL_MS = 10 * 60 * 1000;
/** Délai minimal entre deux envois de code. */
export const RESEND_COOLDOWN_MS = 60 * 1000;
/** Codes faux tolérés par connexion avant de devoir ressaisir le mot de passe. */
export const MAX_ATTEMPTS = 5;
/** Codes envoyés au plus par connexion (premier envoi compris). */
export const MAX_SENDS = 5;

/** Réponse de POST /auth/login quand un code est attendu. */
export interface TwoFactorChallenge {
  mfaRequired: true;
  /** Jeton opaque à renvoyer avec le code (POST /auth/login/verify). */
  challengeToken: string;
  /** Adresse masquée où le code a été envoyé, ex. « ad***@example.com ». */
  email: string;
  expiresAt: Date;
  /** Secondes avant de pouvoir redemander un code. */
  resendIn: number;
}

/** La double authentification est exigée pour les comptes administrateurs. */
export function requiresTwoFactor(user: UserDocument): boolean {
  return user.role === 'admin';
}

function digest(value: string): string {
  return createHmac('sha256', env.jwtSecret).update(value).digest('hex');
}

function sameDigest(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}

/** « admin@example.com » → « ad***@example.com ». */
export function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function newCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

async function sendCode(user: UserDocument, code: string): Promise<void> {
  await sendMail(loginCodeMail({ to: user.email!, name: user.name, code, minutes: CODE_TTL_MS / 60_000 }));
}

/**
 * Mot de passe validé pour un compte à double authentification : envoie un
 * code à son e-mail de connexion et renvoie le jeton de la connexion en attente.
 */
export async function startChallenge(user: UserDocument): Promise<TwoFactorChallenge> {
  if (!user.email) {
    // Un admin est toujours créé avec un e-mail (script create-admin) ; un
    // compte promu admin sans e-mail ne peut pas recevoir de code.
    throw AppError.forbidden(
      "Ce compte administrateur n'a pas d'adresse e-mail pour recevoir le code de connexion.",
    );
  }
  const code = newCode();
  const challengeToken = randomBytes(32).toString('base64url');
  const now = Date.now();
  const challenge = await LoginChallenge.create({
    user: user._id,
    tokenHash: digest(challengeToken),
    codeHash: digest(code),
    lastSentAt: new Date(now),
    expiresAt: new Date(now + CODE_TTL_MS),
  });
  try {
    await sendCode(user, code);
  } catch (error) {
    await challenge.deleteOne();
    throw error;
  }
  return {
    mfaRequired: true,
    challengeToken,
    email: maskEmail(user.email),
    expiresAt: challenge.expiresAt,
    resendIn: RESEND_COOLDOWN_MS / 1000,
  };
}

const EXPIRED = 'Ce code a expiré ou a été trop souvent mal saisi. Reconnectez-vous.';

async function findChallenge(challengeToken: string) {
  const challenge = await LoginChallenge.findOne({ tokenHash: digest(challengeToken) });
  // L'index TTL ne passe qu'environ toutes les minutes : on vérifie aussi ici.
  if (!challenge || challenge.expiresAt.getTime() <= Date.now()) {
    throw AppError.unauthorized(EXPIRED);
  }
  return challenge;
}

/**
 * Vérifie le code et renvoie l'utilisateur à connecter. Un code faux compte
 * un essai (422 sur le champ `code`) ; au-delà de MAX_ATTEMPTS la connexion
 * en attente est annulée (401 : il faut ressaisir le mot de passe).
 */
export async function verifyChallenge(challengeToken: string, code: string): Promise<UserDocument> {
  const challenge = await findChallenge(challengeToken);

  if (!sameDigest(digest(code), challenge.codeHash)) {
    // Incrément atomique : des essais envoyés en parallèle comptent tous.
    const updated = await LoginChallenge.findOneAndUpdate(
      { _id: challenge._id },
      { $inc: { attempts: 1 } },
      { returnDocument: 'after' },
    );
    const remaining = MAX_ATTEMPTS - (updated?.attempts ?? MAX_ATTEMPTS);
    if (remaining <= 0) {
      await LoginChallenge.deleteOne({ _id: challenge._id });
      throw AppError.unauthorized(EXPIRED);
    }
    const s = remaining > 1 ? 's' : '';
    throw AppError.validation('Code incorrect.', {
      code: `Code incorrect. ${remaining} essai${s} restant${s}.`,
    });
  }

  // Usage unique : seule la première requête qui supprime le challenge se connecte.
  const consumed = await LoginChallenge.deleteOne({ _id: challenge._id });
  if (consumed.deletedCount !== 1) throw AppError.unauthorized(EXPIRED);

  const user = await User.findById(challenge.user);
  if (!user) throw AppError.unauthorized(EXPIRED);
  if (!user.isActive) throw AppError.forbidden('Ce compte a été désactivé. Contactez le support.');
  return user;
}

/** Envoie un nouveau code pour la même connexion (le précédent ne marche plus). */
export async function resendChallenge(
  challengeToken: string,
): Promise<Pick<TwoFactorChallenge, 'email' | 'expiresAt' | 'resendIn'>> {
  const challenge = await findChallenge(challengeToken);

  const wait = challenge.lastSentAt.getTime() + RESEND_COOLDOWN_MS - Date.now();
  if (wait > 0) {
    throw AppError.tooManyRequests(
      `Patientez ${Math.ceil(wait / 1000)} secondes avant de demander un nouveau code.`,
    );
  }
  if (challenge.sends >= MAX_SENDS) {
    await challenge.deleteOne();
    throw AppError.unauthorized('Trop de codes demandés. Reconnectez-vous.');
  }

  const user = await User.findById(challenge.user);
  if (!user?.email || !user.isActive) throw AppError.unauthorized(EXPIRED);

  const code = newCode();
  const now = Date.now();
  challenge.codeHash = digest(code);
  challenge.sends += 1;
  challenge.lastSentAt = new Date(now);
  challenge.expiresAt = new Date(now + CODE_TTL_MS);
  await challenge.save();
  await sendCode(user, code);

  return {
    email: maskEmail(user.email),
    expiresAt: challenge.expiresAt,
    resendIn: RESEND_COOLDOWN_MS / 1000,
  };
}
