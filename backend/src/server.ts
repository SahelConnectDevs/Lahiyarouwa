import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/db';
import { env } from './config/env';

async function main(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  // 127.0.0.1 en prod : l'API n'est joignable que via nginx (HTTPS), jamais
  // directement depuis Internet sur le port 3000.
  const host = env.isProduction ? '127.0.0.1' : '0.0.0.0';
  const server = app.listen(env.port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`API démarrée sur http://${host}:${env.port} (${env.nodeEnv})`);
  });

  // Arrêt propre (PM2 envoie SIGINT au redémarrage / déploiement) : on
  // termine les requêtes en cours avant de couper la connexion MongoDB.
  const shutdown = (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`${signal} reçu, arrêt en cours...`);
    server.close(() => {
      disconnectDatabase()
        .catch(() => undefined)
        .finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Échec du démarrage du serveur:', error);
  process.exit(1);
});
