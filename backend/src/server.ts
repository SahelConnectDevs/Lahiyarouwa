import { createApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';

async function main(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API démarrée sur http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Échec du démarrage du serveur:', error);
  process.exit(1);
});
