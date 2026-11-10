import type { Mail } from '../services/mail.service';
import { BRAND, C, escapeHtml, FONT, formatNiger, logoAttachment, renderMail } from './layout';

/** Mail « mot de passe oublié » : lien de réinitialisation à usage unique. */
export function passwordResetMail(input: {
  to: string;
  name: string;
  link: string;
  minutes: number;
  requestedAt?: Date;
}): Mail {
  const { to, link, minutes } = input;
  const when = formatNiger(input.requestedAt ?? new Date());
  const href = escapeHtml(link);

  const html = renderMail({
    title: 'Réinitialiser votre mot de passe',
    preheader: `Lien valable ${minutes} minutes pour choisir un nouveau mot de passe.`,
    intro: `Bonjour ${escapeHtml(input.name)}, vous avez demandé à changer le mot de passe de votre espace. Cliquez sur le bouton pour en choisir un nouveau.`,
    main: `<tr><td align="center" style="padding:24px 32px 8px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td align="center" style="border-radius:10px;background:${C.pink}">
          <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px">Choisir un nouveau mot de passe</a>
        </td>
      </tr></table>
    </td></tr>
    <tr><td align="center" style="padding:8px 32px 24px;font-family:${FONT};font-size:14px;color:${C.muted}">
      Lien valable <strong style="color:${C.text}">${minutes} minutes</strong>, utilisable une seule fois.
    </td></tr>
    <tr><td style="padding:0 32px 20px;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted};word-break:break-all">
      Le bouton ne marche pas ? Copiez ce lien dans votre navigateur :<br>
      <a href="${href}" style="color:${C.pink}">${href}</a>
    </td></tr>`,
    notice:
      '<strong>Ne transférez pas ce mail.</strong> Toute personne qui a ce lien peut changer votre mot de passe tant qu’il est valable.',
    footnote: `Demande faite le ${when} (heure du Niger).<br>
      Ce n'est pas vous ? Ignorez ce mail : votre mot de passe actuel reste valable.`,
  });

  const text = [
    `Bonjour ${input.name},`,
    '',
    `Vous avez demandé à changer le mot de passe de votre espace ${BRAND}.`,
    `Ouvrez ce lien pour en choisir un nouveau (valable ${minutes} minutes, une seule fois) :`,
    link,
    '',
    'Ne transférez pas ce mail.',
    `Demande faite le ${when} (heure du Niger).`,
    "Ce n'est pas vous ? Ignorez ce mail : votre mot de passe actuel reste valable.",
    '',
    `${BRAND} · E-mail automatique, merci de ne pas y répondre.`,
  ].join('\n');

  return {
    to,
    subject: `Réinitialiser votre mot de passe ${BRAND}`,
    text,
    html,
    attachments: [logoAttachment],
  };
}
