import type { Mail } from '../services/mail.service';
import { MAIL_LOGO_CID, MAIL_LOGO_PNG } from './logo';

const BRAND = 'Lahiyar Ouwa Da Yaro';

// Couleurs de l'admin-web (admin-web/src/index.css). Styles en ligne et mise
// en page en tableaux : seul format compris par tous les clients mail.
const C = {
  pink: '#d81b60',
  pinkSoft: '#fce4ec',
  bg: '#f6f4f5',
  surface: '#ffffff',
  text: '#1f1a1c',
  muted: '#6b6266',
  border: '#e7e1e4',
  warnBg: '#fff3e0',
  warnText: '#8a3a00',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** « mardi 10 novembre 2026 à 21:05 », heure du Niger. */
function formatNiger(date: Date): string {
  const day = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Niamey',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  const time = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Niamey',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  return `${day} à ${time}`;
}

/** Mail du code de double authentification envoyé aux admins. */
export function loginCodeMail(input: {
  to: string;
  name: string;
  code: string;
  minutes: number;
  requestedAt?: Date;
}): Mail {
  const { to, code, minutes } = input;
  const name = escapeHtml(input.name);
  const when = formatNiger(input.requestedAt ?? new Date());
  const digits = code
    .split('')
    .map(
      (d) =>
        `<td align="center" style="width:40px;height:54px;background:${C.surface};border:1px solid ${C.border};border-radius:10px;font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:bold;color:${C.text}">${d}</td>`,
    )
    .join('<td style="width:6px"></td>');

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Votre code de connexion</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg}">Votre code de connexion : ${code}. Valable ${minutes} minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${C.surface};border:1px solid ${C.border};border-radius:16px;overflow:hidden">
    <tr><td style="height:6px;background:${C.pink};font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td align="center" style="padding:32px 32px 8px">
      <img src="cid:${MAIL_LOGO_CID}" width="72" height="72" alt="${BRAND}" style="display:block;border:0;border-radius:16px">
      <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${C.pink}">${BRAND}</p>
    </td></tr>
    <tr><td style="padding:16px 32px 0;font-family:Arial,Helvetica,sans-serif;color:${C.text}">
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;text-align:center">Votre code de connexion</h1>
      <p style="margin:0;font-size:15px;line-height:1.6;color:${C.muted};text-align:center">Bonjour ${name}, saisissez ce code pour terminer votre connexion à l'administration.</p>
    </td></tr>
    <tr><td align="center" style="padding:24px 12px 8px">
      <table role="presentation" cellpadding="0" cellspacing="0" style="background:${C.pinkSoft};border-radius:14px">
        <tr><td style="padding:12px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digits}</tr></table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:4px 32px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.muted}">
      Valable <strong style="color:${C.text}">${minutes} minutes</strong>, pour une seule connexion.
    </td></tr>
    <tr><td style="padding:0 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.warnBg};border-radius:10px">
        <tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${C.warnText}">
          <strong>Ne communiquez ce code à personne.</strong> Notre équipe ne vous le demandera jamais, ni par téléphone ni par message.
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${C.muted}">
      Connexion demandée le ${when} (heure du Niger).<br>
      Ce n'est pas vous ? Quelqu'un d'autre connaît votre mot de passe : changez-le sans attendre.
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
    <tr><td align="center" style="padding:20px 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${C.muted}">
      ${BRAND} · Santé de la mère et de l'enfant au Niger<br>
      E-mail automatique, merci de ne pas y répondre.
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    `Bonjour ${input.name},`,
    '',
    `Votre code de connexion à l'administration ${BRAND} est : ${code}`,
    '',
    `Il est valable ${minutes} minutes, pour une seule connexion.`,
    'Ne le communiquez à personne : notre équipe ne vous le demandera jamais.',
    '',
    `Connexion demandée le ${when} (heure du Niger).`,
    "Ce n'est pas vous ? Quelqu'un d'autre connaît votre mot de passe : changez-le sans attendre.",
    '',
    `${BRAND} · E-mail automatique, merci de ne pas y répondre.`,
  ].join('\n');

  return {
    to,
    subject: `${code} est votre code de connexion ${BRAND}`,
    text,
    html,
    attachments: [
      { filename: 'logo.png', content: MAIL_LOGO_PNG, cid: MAIL_LOGO_CID, contentType: 'image/png' },
    ],
  };
}
