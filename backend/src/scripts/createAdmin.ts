/* eslint-disable no-console -- script en ligne de commande */
import bcrypt from 'bcryptjs';
import { createInterface } from 'node:readline/promises';

import { connectDatabase, disconnectDatabase } from '../config/db';
import { User } from '../models/User';

/**
 * Crée (ou promeut) le compte administrateur qui se connectera à l'admin-web.
 * À lancer sur le VPS, jamais exposé via l'API :
 *   npm run create-admin -- --email admin@lahiyarouwadayaro.com --name "Nom Prénom"
 * Le mot de passe est demandé de façon interactive (ou lu dans
 * ADMIN_PASSWORD pour un usage non interactif) — jamais passé en argument,
 * pour ne pas finir dans l'historique du shell.
 */
function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const email = readArg('email')?.trim().toLowerCase();
  const name = readArg('name')?.trim() || 'Administrateur';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage : npm run create-admin -- --email <email> [--name "<nom>"]');
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question('Mot de passe admin (12 caractères minimum) : ');
    rl.close();
  }
  if (password.length < 12) throw new Error('Mot de passe trop court (12 caractères minimum pour un admin).');

  await connectDatabase();
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = 'admin';
    existing.isActive = true;
    existing.passwordHash = passwordHash;
    existing.tokenVersion += 1;
    await existing.save();
    console.log(`Compte existant ${email} promu administrateur (mot de passe réinitialisé).`);
  } else {
    await User.create({ email, name, passwordHash, role: 'admin' });
    console.log(`Administrateur ${email} créé.`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
