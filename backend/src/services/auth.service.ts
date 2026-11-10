import bcrypt from 'bcryptjs';

import { User, type UserDocument } from '../models/User';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/jwt';
import {
  requiresTwoFactor,
  startChallenge,
  verifyChallenge,
  type TwoFactorChallenge,
} from './twoFactor.service';
import { deleteUserAndData } from './userData.service';

const SALT_ROUNDS = 12;

let cachedDummyHash: string | undefined;

/**
 * Hash valide d'un mot de passe que personne ne connaît : comparé quand le
 * compte n'existe pas, pour que la réponse prenne le même temps que pour un
 * compte existant (pas d'énumération des numéros inscrits par chronométrage).
 */
function dummyHash(): string {
  cachedDummyHash ??= bcrypt.hashSync(`absent-${Date.now()}`, SALT_ROUNDS);
  return cachedDummyHash;
}

export interface PublicUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthDate: Date | null;
  role: string;
  /** Consentement au partage du suivi avec l'agent communautaire. */
  partageRelais: boolean;
  /** Mot de passe provisoire (donné par un admin) à changer avant de continuer. */
  mustChangePassword: boolean;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    phone: user.phone ?? null,
    email: user.email ?? null,
    birthDate: user.birthDate ?? null,
    role: user.role,
    partageRelais: user.partageRelais,
    mustChangePassword: user.mustChangePassword,
  };
}

function issueToken(user: UserDocument): string {
  return signToken({ sub: user._id.toString(), v: user.tokenVersion });
}

/** Les champs `phone` et `email` reçus ici sont déjà normalisés par auth.validator.ts. */
export async function register(input: {
  name: string;
  phone: string;
  email?: string;
  birthDate?: Date;
  password: string;
}): Promise<AuthResult> {
  if (await User.exists({ phone: input.phone })) {
    throw AppError.conflict('Un compte existe déjà avec ce numéro de téléphone.');
  }
  if (input.email && (await User.exists({ email: input.email }))) {
    throw AppError.conflict('Un compte existe déjà avec cet e-mail.');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({
    name: input.name,
    phone: input.phone,
    email: input.email,
    birthDate: input.birthDate,
    passwordHash,
    lastLoginAt: new Date(),
  });

  return { token: issueToken(user), user: toPublicUser(user) };
}

/**
 * Connexion par téléphone (app mobile) ou par e-mail (admin-web). Pour un
 * compte à double authentification (admin), un mot de passe correct ne
 * connecte pas encore : un code est envoyé à son e-mail de connexion et la
 * réponse est un {@link TwoFactorChallenge}, à compléter par {@link verifyLoginCode}.
 */
export async function login(input: {
  phone?: string;
  email?: string;
  password: string;
}): Promise<AuthResult | TwoFactorChallenge> {
  const filter = input.phone ? { phone: input.phone } : { email: input.email };
  const user = await User.findOne(filter).select('+passwordHash');
  // Même message (et un hash comparé dans les deux cas) que le compte existe
  // ou non, pour ne pas révéler quels numéros sont inscrits.
  const isValid = await bcrypt.compare(input.password, user?.passwordHash ?? dummyHash());
  if (!user || !isValid) {
    throw AppError.unauthorized('Identifiants invalides.');
  }
  if (!user.isActive) {
    throw AppError.forbidden('Ce compte a été désactivé. Contactez le support.');
  }

  if (requiresTwoFactor(user)) return startChallenge(user);

  return completeLogin(user);
}

async function completeLogin(user: UserDocument): Promise<AuthResult> {
  user.lastLoginAt = new Date();
  await user.save();
  return { token: issueToken(user), user: toPublicUser(user) };
}

/** Deuxième étape de la connexion : code reçu par e-mail → { token, user }. */
export async function verifyLoginCode(input: { challengeToken: string; code: string }): Promise<AuthResult> {
  return completeLogin(await verifyChallenge(input.challengeToken, input.code));
}

export async function updateProfile(
  user: UserDocument,
  input: { name?: string; email?: string | null; birthDate?: Date | null; partageRelais?: boolean },
): Promise<PublicUser> {
  if (input.email && input.email !== user.email && (await User.exists({ email: input.email }))) {
    throw AppError.conflict('Un compte existe déjà avec cet e-mail.');
  }

  const update: Record<string, unknown> = {};
  const unset: Record<string, ''> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.partageRelais !== undefined) update.partageRelais = input.partageRelais;
  for (const key of ['email', 'birthDate'] as const) {
    if (input[key] === null || input[key] === '') unset[key] = '';
    else if (input[key] !== undefined) update[key] = input[key];
  }

  const updated = await User.findByIdAndUpdate(
    user._id,
    { $set: update, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { returnDocument: 'after', runValidators: true },
  );
  if (!updated) throw AppError.notFound('Utilisateur introuvable.');
  return toPublicUser(updated);
}

/**
 * Change le mot de passe et invalide toutes les sessions existantes (sur
 * tous les téléphones) : renvoie un nouveau token pour la session courante.
 */
export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
): Promise<AuthResult> {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw AppError.notFound('Utilisateur introuvable.');

  if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    throw AppError.validation('Données invalides.', { currentPassword: 'Mot de passe actuel incorrect.' });
  }

  if (input.newPassword === input.currentPassword) {
    throw AppError.validation('Données invalides.', {
      newPassword: "Choisissez un mot de passe différent de l'actuel.",
    });
  }

  user.passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  user.mustChangePassword = false;
  user.tokenVersion += 1;
  await user.save();

  return { token: issueToken(user), user: toPublicUser(user) };
}

/** Suppression du compte par l'utilisatrice elle-même, confirmée par son mot de passe. */
export async function deleteAccount(userId: string, password: string): Promise<void> {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw AppError.notFound('Utilisateur introuvable.');

  if (!(await bcrypt.compare(password, user.passwordHash))) {
    throw AppError.validation('Données invalides.', { password: 'Mot de passe incorrect.' });
  }

  await deleteUserAndData(user._id);
}
