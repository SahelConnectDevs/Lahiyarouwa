// Formes des réponses de l'API (backend/src/services/*). À garder alignées
// avec le backend : ce fichier est le seul contrat côté admin-web.

export type Role = 'user' | 'relais' | 'admin';
export type AlertStatus = 'nouvelle' | 'en_cours' | 'traitee';

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PublicUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  role: Role;
  partageRelais: boolean;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

/** Réponse de /auth/login pour un admin : un code a été envoyé par e-mail. */
export interface LoginChallenge {
  mfaRequired: true;
  challengeToken: string;
  /** Adresse masquée où le code a été envoyé. */
  email: string;
  expiresAt: string;
  /** Secondes avant de pouvoir redemander un code. */
  resendIn: number;
}

/** Réponse de /auth/login/resend. */
export type ResendResult = Pick<LoginChallenge, 'email' | 'expiresAt' | 'resendIn'>;

export interface AdminUser extends PublicUser {
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  relais: string | null;
  secteur: string | null;
}

export interface AdminUserDetail extends AdminUser {
  resume: { grossesseEnCours: boolean; enfants: number; vaccinations: number; alertes: number };
}

export interface Agent extends AdminUser {
  beneficiaires: number;
  alertesOuvertes: number;
}

export interface Stats {
  utilisateurs: {
    total: number;
    parRole: Record<Role, number>;
    nouveaux30j: number;
    actifs30j: number;
  };
  grossessesEnCours: number;
  enfants: number;
  vaccinations: number;
  seancesContractions: number;
  alertes: Partial<Record<AlertStatus, number>>;
  planification: { methodesEnCours: number; parMethode: Record<string, number> };
  beneficiairesSansAgent: number;
}

interface UserRef {
  id: string;
  name: string;
  phone?: string | null;
}

export interface Alert {
  id: string;
  user: UserRef | null;
  relais: UserRef | null;
  signe: string;
  details?: string;
  statut: AlertStatus;
  noteSuivi?: string;
  traiteePar?: UserRef | null;
  traiteeLe?: string;
  createdAt: string;
  updatedAt: string;
}

/** Document de contenu éditable (conseil, vaccin, étape CPN, méthode PF). */
export interface ContentItem {
  id: string;
  [field: string]: unknown;
}
