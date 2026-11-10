import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Mails « envoyés » pendant les tests (NODE_ENV=test) : aucun réseau, les
 * tests y lisent les codes de connexion. Toujours vide hors tests.
 */
export const testOutbox: Mail[] = [];

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    // Refuse un serveur sans TLS valide : le mail contient un code de connexion.
    requireTLS: !env.smtp.secure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

/** Vrai si un serveur SMTP est configuré (SMTP_HOST, SMTP_USER, SMTP_PASS). */
export function isMailConfigured(): boolean {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

/**
 * Envoie un mail via le SMTP configuré. Sans SMTP en développement, le mail
 * est affiché dans la console (pratique pour tester la connexion admin en
 * local) ; en production, l'absence de configuration est une erreur 503.
 */
export async function sendMail(mail: Mail): Promise<void> {
  if (env.nodeEnv === 'test') {
    testOutbox.push(mail);
    return;
  }
  if (!isMailConfigured()) {
    if (env.isProduction) {
      throw AppError.unavailable(
        "L'envoi d'e-mails n'est pas configuré sur le serveur. Contactez le support.",
      );
    }
    // eslint-disable-next-line no-console
    console.info(`[mail non envoyé — SMTP non configuré] À : ${mail.to}\n${mail.subject}\n${mail.text}`);
    return;
  }
  try {
    await getTransporter().sendMail({ from: env.smtp.from, ...mail });
  } catch (error) {
    // Le détail (identifiants refusés, réseau...) va dans les logs du
    // serveur, jamais dans la réponse.
    // eslint-disable-next-line no-console
    console.error("Échec de l'envoi d'un e-mail :", error instanceof Error ? error.message : error);
    throw AppError.unavailable(
      "Impossible d'envoyer l'e-mail pour le moment. Réessayez dans quelques minutes.",
    );
  }
}
