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

/**
 * CORS_ORIGIN accepte une liste séparée par des virgules (ex: l'admin-web en
 * prod + localhost en dev). '*' autorise tout — à réserver au développement :
 * l'app mobile n'est pas soumise au CORS, seul le navigateur de l'admin l'est.
 */
function parseCorsOrigin(raw: string | undefined): string | string[] {
  if (!raw || raw.trim() === '*') return '*';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  mongodbUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  /**
   * Nombre de proxies de confiance devant l'API (1 derrière nginx sur le VPS).
   * Nécessaire pour que req.ip — et donc le rate limiting — voie l'IP réelle
   * du client et non celle de nginx (127.0.0.1).
   */
  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
  /**
   * Serveur SMTP qui envoie les codes de connexion (double authentification
   * des admins). En prod : relais SMTP Brevo (smtp-relay.brevo.com, port
   * 587 STARTTLS), SMTP_USER = identifiant SMTP Brevo, SMTP_PASS = clé SMTP
   * Brevo (jamais le mot de passe du compte). Sans SMTP_HOST, les mails sont
   * affichés dans la console en développement et l'envoi échoue (503) en
   * production.
   */
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 465),
    // true pour le port 465 (TLS direct), false pour 587 (STARTTLS).
    secure: (process.env.SMTP_SECURE ?? String(Number(process.env.SMTP_PORT ?? 465) === 465)) === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM || process.env.SMTP_USER || '',
  },
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },
} as const;
