import type { Mail } from '../services/mail.service';
import { BRAND, C, escapeHtml, FONT, formatNiger, logoAttachment, renderMail } from './layout';

/** Mail du code de double authentification (admins et agents communautaires). */
export function loginCodeMail(input: {
  to: string;
  name: string;
  code: string;
  minutes: number;
  requestedAt?: Date;
}): Mail {
  const { to, code, minutes } = input;
  const when = formatNiger(input.requestedAt ?? new Date());
  const digits = code
    .split('')
    .map(
      (d) =>
        `<td align="center" style="width:40px;height:54px;background:${C.surface};border:1px solid ${C.border};border-radius:10px;font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:bold;color:${C.text}">${d}</td>`,
    )
    .join('<td style="width:6px"></td>');

  const html = renderMail({
    title: 'Votre code de connexion',
    preheader: `Votre code de connexion : ${code}. Valable ${minutes} minutes.`,
    intro: `Bonjour ${escapeHtml(input.name)}, saisissez ce code pour terminer votre connexion à votre espace.`,
    main: `<tr><td align="center" style="padding:24px 12px 8px">
      <table role="presentation" cellpadding="0" cellspacing="0" style="background:${C.pinkSoft};border-radius:14px">
        <tr><td style="padding:12px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digits}</tr></table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:4px 32px 24px;font-family:${FONT};font-size:14px;color:${C.muted}">
      Valable <strong style="color:${C.text}">${minutes} minutes</strong>, pour une seule connexion.
    </td></tr>`,
    notice:
      '<strong>Ne communiquez ce code à personne.</strong> Notre équipe ne vous le demandera jamais, ni par téléphone ni par message.',
    footnote: `Connexion demandée le ${when} (heure du Niger).<br>
      Ce n'est pas vous ? Quelqu'un d'autre connaît votre mot de passe : changez-le sans attendre.`,
  });

  const text = [
    `Bonjour ${input.name},`,
    '',
    `Votre code de connexion à votre espace ${BRAND} est : ${code}`,
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
    attachments: [logoAttachment],
  };
}
