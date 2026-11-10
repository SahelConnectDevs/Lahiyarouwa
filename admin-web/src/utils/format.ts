import type { AlertStatus, FollowUpType, ReminderType, Role } from '../api/types';

export const ROLE_LABELS: Record<Role, string> = {
  user: 'Utilisatrice',
  relais: 'Agent communautaire',
  admin: 'Administrateur',
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  nouvelle: 'Nouvelle',
  en_cours: 'En cours',
  traitee: 'Traitée',
};

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value: string | null | undefined): string {
  return value ? dateFormat.format(new Date(value)) : '—';
}

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTimeFormat.format(new Date(value)) : '—';
}

export function formatNumber(value: number | undefined): string {
  return new Intl.NumberFormat('fr-FR').format(value ?? 0);
}

export const FOLLOW_UP_LABELS: Record<FollowUpType, string> = {
  appel: 'Appel',
  visite: 'Visite à domicile',
  orientation: 'Orientation vers un centre',
  autre: 'Autre',
};

export const REMINDER_LABELS: Record<ReminderType, string> = {
  pf: 'Planification familiale',
  cpn: 'Consultation prénatale',
  vaccin: 'Vaccin',
};

/** Lien d'appel : le téléphone de l'agent compose directement le numéro. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}
