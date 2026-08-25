import mongoose from 'mongoose';

import { env } from './env';

/**
 * uri est un paramètre (plutôt que de lire env.mongodbUri en dur) pour que
 * les tests puissent se connecter à une instance MongoDB en mémoire
 * (mongodb-memory-server) sans dépendre du .env — voir tests/auth.test.ts.
 */
export async function connectDatabase(uri: string = env.mongodbUri): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
