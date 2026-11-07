import type { AlertStatus, Role } from '../api/types';

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
