import { randomInt } from 'node:crypto';

import bcrypt from 'bcryptjs';

/** Coût bcrypt de tous les mots de passe stockés. */
export const SALT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Mot de passe provisoire donné par un admin (création de compte ou
 * réinitialisation) : 8 chiffres, faciles à dicter au téléphone et à taper
 * sur un clavier numérique. Le compte est marqué `mustChangePassword` ; la
 * connexion reste limitée à 10 essais / 15 min par IP.
 */
export function temporaryPassword(): string {
  return Array.from({ length: 8 }, () => randomInt(0, 10)).join('');
}
