import dotenv from 'dotenv';

// quiet: true supprime le message promotionnel ("tip: ...") que dotenv
// affiche par défaut à chaque démarrage — sans effet sur le chargement réel
// des variables.
dotenv.config({ quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${name} (voir .env.example)`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  mongodbUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },
} as const;
