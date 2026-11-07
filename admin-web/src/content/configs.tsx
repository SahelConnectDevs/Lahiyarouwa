import type { ReactNode } from 'react';

import type { ContentItem } from '../api/types';
import { Badge } from '../components/ui';
import type { Field, Option } from './contentForm';

export interface ContentConfig {
  /** Segment d'URL, identique côté API (/admin/<path>) et côté admin-web (/contenus/<path>). */
  path: string;
  title: string;
  subtitle: string;
  singular: string;
  /** Article + nom, pour les messages : "ce conseil", "cette méthode". */
  thisOne: string;
  titleField: string;
  fields: Field[];
  columns: { label: string; render(item: ContentItem): ReactNode; className?: string }[];
  filters?: { name: string; label: string; options: Option[] }[];
}

const opts = (labels: Record<string, string>): Option[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const CATEGORIES_CONSEIL = {
  grossesse: 'Grossesse',
  bebe: 'Bébé',
  nutrition: 'Nutrition',
  planning_familial: 'Planification familiale',
  hygiene: 'Hygiène',
  general: 'Général',
};
const LANGUES = { fr: 'Français', ha: 'Hausa', dje: 'Zarma' };
const CIBLES = { maman: 'Maman', enfant: 'Enfant' };
const PF_CATEGORIES = { longue: 'Longue durée', courte: 'Courte durée', urgence: 'Urgence' };
const PF_EFFICACITES = { tres_efficace: 'Très efficace', efficace: 'Efficace', depend_usage: 'Dépend de l’usage' };
const RAPPEL_MODES = {
  aucun: 'Aucun rappel',
  quotidien: 'Quotidien (prise chaque jour)',
  intervalle: 'Intervalle (geste à refaire)',
  echeance: 'Échéance (date de fin)',
};

const label = (labels: Record<string, string>, value: unknown) => labels[String(value)] ?? String(value ?? '—');
const yesNo = (value: unknown, yes: string, no: string) =>
  value ? <Badge tone="green">{yes}</Badge> : <Badge>{no}</Badge>;
const weeks = (min: unknown, max: unknown) =>
  min == null && max == null ? <span className="muted">Toutes</span> : `${min ?? 0} – ${max ?? '…'} SA`;

const CODE_HINT = 'Identifiant stable utilisé par l’app : minuscules, chiffres et tirets. Évitez de le modifier.';

export const CONTENT_CONFIGS: Record<string, ContentConfig> = {
  conseils: {
    path: 'conseils',
    title: 'Conseils santé',
    subtitle: 'Les conseils affichés aux femmes dans l’application. Seuls les conseils publiés sont visibles.',
    singular: 'conseil',
    thisOne: 'ce conseil',
    titleField: 'titre',
    fields: [
      { name: 'titre', label: 'Titre', type: 'text', required: true, max: 200, wide: true },
      { name: 'contenu', label: 'Contenu', type: 'textarea', required: true, max: 10000, rows: 6, wide: true },
      { name: 'categorie', label: 'Catégorie', type: 'select', required: true, options: opts(CATEGORIES_CONSEIL) },
      { name: 'langue', label: 'Langue', type: 'select', options: opts(LANGUES), defaultValue: 'fr' },
      {
        name: 'semaineMin',
        label: 'À partir de la semaine',
        type: 'number',
        min: 0,
        max: 45,
        nullable: true,
        hint: 'Semaine de grossesse (facultatif).',
      },
      { name: 'semaineMax', label: 'Jusqu’à la semaine', type: 'number', min: 0, max: 45, nullable: true },
      { name: 'icone', label: 'Icône', type: 'text', max: 60, placeholder: 'water_drop', hint: 'Nom d’icône Material.' },
      { name: 'ordre', label: 'Ordre d’affichage', type: 'number' },
      { name: 'publie', label: 'Publié dans l’application', type: 'checkbox', defaultValue: false, wide: true },
    ],
    columns: [
      { label: 'Titre', render: (c) => <strong>{String(c.titre)}</strong> },
      { label: 'Catégorie', render: (c) => label(CATEGORIES_CONSEIL, c.categorie) },
      { label: 'Langue', render: (c) => label(LANGUES, c.langue) },
      { label: 'Semaines', render: (c) => weeks(c.semaineMin, c.semaineMax), className: 'nowrap' },
      { label: 'État', render: (c) => yesNo(c.publie, 'Publié', 'Brouillon') },
    ],
    filters: [
      { name: 'categorie', label: 'Toutes les catégories', options: opts(CATEGORIES_CONSEIL) },
      { name: 'langue', label: 'Toutes les langues', options: opts(LANGUES) },
    ],
  },

  'methodes-pf': {
    path: 'methodes-pf',
    title: 'Méthodes de planification familiale',
    subtitle: 'Le catalogue présenté dans l’app, et la façon dont chaque méthode génère des rappels.',
    singular: 'méthode',
    thisOne: 'cette méthode',
    titleField: 'nom',
    fields: [
      { name: 'nom', label: 'Nom', type: 'text', required: true, max: 120 },
      { name: 'code', label: 'Code', type: 'text', required: true, pattern: '[a-z0-9\\-]{2,40}', hint: CODE_HINT },
      { name: 'categorie', label: 'Catégorie', type: 'select', required: true, options: opts(PF_CATEGORIES) },
      { name: 'efficacite', label: 'Efficacité', type: 'select', required: true, options: opts(PF_EFFICACITES) },
      { name: 'resume', label: 'Résumé', type: 'text', max: 300, wide: true, placeholder: 'Une injection tous les 3 mois' },
      { name: 'dureeProtection', label: 'Durée de protection', type: 'text', max: 120 },
      { name: 'hormonale', label: 'Méthode hormonale', type: 'checkbox' },
      { name: 'avantages', label: 'Avantages', type: 'list', hint: 'Un élément par ligne.', wide: true },
      { name: 'effetsSecondaires', label: 'Effets secondaires possibles', type: 'list', hint: 'Un élément par ligne.', wide: true },
      { name: 'conditions', label: 'Conditions / précautions', type: 'list', hint: 'Un élément par ligne.', wide: true },
      { name: 'rappel.mode', label: 'Type de rappel', type: 'select', options: opts(RAPPEL_MODES), defaultValue: 'aucun' },
      {
        name: 'rappel.intervalleJours',
        label: 'Intervalle (jours)',
        type: 'number',
        min: 1,
        max: 3650,
        nullable: true,
        hint: 'Quotidien : renouvellement de la plaquette. Intervalle : délai entre deux gestes.',
      },
      {
        name: 'rappel.dureeJours',
        label: 'Durée de protection (jours)',
        type: 'number',
        min: 1,
        max: 5000,
        nullable: true,
        hint: 'Échéance : nombre de jours après la pose.',
      },
      {
        name: 'rappel.avanceJours',
        label: 'Prévenir (jours avant)',
        type: 'number',
        min: 0,
        max: 90,
        hint: 'La femme et son agent sont prévenus avant l’échéance.',
      },
      { name: 'ordre', label: 'Ordre d’affichage', type: 'number' },
      { name: 'actif', label: 'Proposée dans l’application', type: 'checkbox', defaultValue: true },
    ],
    columns: [
      { label: 'Méthode', render: (m) => <strong>{String(m.nom)}</strong> },
      { label: 'Catégorie', render: (m) => label(PF_CATEGORIES, m.categorie) },
      { label: 'Efficacité', render: (m) => label(PF_EFFICACITES, m.efficacite) },
      {
        label: 'Rappel',
        render: (m) => label(RAPPEL_MODES, (m.rappel as { mode?: string } | undefined)?.mode ?? 'aucun').split(' (')[0],
      },
      { label: 'État', render: (m) => yesNo(m.actif, 'Active', 'Masquée') },
    ],
    filters: [{ name: 'categorie', label: 'Toutes les catégories', options: opts(PF_CATEGORIES) }],
  },

  vaccins: {
    path: 'vaccins',
    title: 'Calendrier vaccinal',
    subtitle: 'Les vaccins de la maman et de l’enfant, utilisés pour calculer les dates prévues dans l’app.',
    singular: 'vaccin',
    thisOne: 'ce vaccin',
    titleField: 'nom',
    fields: [
      { name: 'nom', label: 'Nom', type: 'text', required: true, max: 120 },
      { name: 'code', label: 'Code', type: 'text', required: true, pattern: '[a-z0-9\\-]{2,40}', hint: CODE_HINT },
      { name: 'cible', label: 'Pour', type: 'select', required: true, options: opts(CIBLES) },
      { name: 'dose', label: 'Dose', type: 'text', max: 60, placeholder: 'Dose 1, Rappel…' },
      { name: 'moment', label: 'Moment recommandé', type: 'text', required: true, max: 120, placeholder: '6 semaines' },
      {
        name: 'ageSemaines',
        label: 'Âge (semaines)',
        type: 'number',
        min: 0,
        max: 520,
        nullable: true,
        hint: 'Enfant : sert à calculer la date prévue depuis la naissance.',
      },
      { name: 'description', label: 'Description', type: 'textarea', max: 2000, rows: 3, wide: true },
      { name: 'ordre', label: 'Ordre d’affichage', type: 'number' },
      { name: 'actif', label: 'Affiché dans l’application', type: 'checkbox', defaultValue: true },
    ],
    columns: [
      { label: 'Vaccin', render: (v) => <strong>{String(v.nom)}</strong> },
      { label: 'Dose', render: (v) => String(v.dose ?? '—') },
      { label: 'Pour', render: (v) => label(CIBLES, v.cible) },
      { label: 'Moment', render: (v) => String(v.moment ?? '—') },
      { label: 'État', render: (v) => yesNo(v.actif, 'Actif', 'Masqué') },
    ],
    filters: [{ name: 'cible', label: 'Maman et enfant', options: opts(CIBLES) }],
  },

  'cpn-etapes': {
    path: 'cpn-etapes',
    title: 'Étapes des consultations prénatales',
    subtitle: 'Le calendrier des CPN : les dates sont calculées pour chaque femme à partir de ses dernières règles.',
    singular: 'étape',
    thisOne: 'cette étape',
    titleField: 'titre',
    fields: [
      { name: 'numero', label: 'Numéro', type: 'number', required: true, min: 1, max: 20 },
      { name: 'titre', label: 'Titre', type: 'text', required: true, max: 120 },
      { name: 'periode', label: 'Période affichée', type: 'text', required: true, max: 120, placeholder: '14 – 20 semaines', wide: true },
      { name: 'semaineDebut', label: 'Semaine de début', type: 'number', min: 0, max: 45, nullable: true, hint: 'Vide pour une consultation après l’accouchement.' },
      { name: 'semaineFin', label: 'Semaine de fin', type: 'number', min: 0, max: 45, nullable: true },
      { name: 'examens', label: 'Examens', type: 'list', hint: 'Un examen par ligne.', wide: true },
      { name: 'aApporter', label: 'À apporter', type: 'list', hint: 'Un élément par ligne.', wide: true },
      { name: 'actif', label: 'Affichée dans l’application', type: 'checkbox', defaultValue: true },
    ],
    columns: [
      { label: 'N°', render: (s) => <strong>{String(s.numero)}</strong>, className: 'num' },
      { label: 'Titre', render: (s) => String(s.titre) },
      { label: 'Période', render: (s) => String(s.periode) },
      { label: 'Examens', render: (s) => (Array.isArray(s.examens) ? s.examens.length : 0), className: 'num' },
      { label: 'État', render: (s) => yesNo(s.actif, 'Active', 'Masquée') },
    ],
  },
};
