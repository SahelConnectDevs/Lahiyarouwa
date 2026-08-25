import bcrypt from 'bcryptjs';

import { User, type UserDocument } from '../models/User';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/jwt';

const SALT_ROUNDS = 12;

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export function toPublicUser(user: UserDocument): PublicUser {
  return { id: user._id.toString(), email: user.email, name: user.name, role: user.role };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw AppError.conflict('Un compte existe déjà avec cet email.');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({ name: input.name, email: input.email, passwordHash });

  return { token: signToken({ sub: user._id.toString() }), user: toPublicUser(user) };
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user) {
    throw AppError.unauthorized('Identifiants invalides.');
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw AppError.unauthorized('Identifiants invalides.');
  }

  return { token: signToken({ sub: user._id.toString() }), user: toPublicUser(user) };
}
