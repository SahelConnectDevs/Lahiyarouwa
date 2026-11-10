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
  /** Mot de passe provisoire (donné par un admin) à changer à la prochaine connexion. */
  mustChangePassword: boolean;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

/** Réponse de POST /admin/users : le mot de passe provisoire n'est renvoyé qu'ici. */
export interface CreatedAccount {
  user: AdminUser;
  temporaryPassword: string;
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

export interface UserRef {
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

// --- Espace agent communautaire (backend/src/services/relais.service.ts) ---

export type FollowUpType = 'appel' | 'visite' | 'orientation' | 'autre';
export type ReminderType = 'pf' | 'cpn' | 'vaccin';

/** Rappel unifié (PF, CPN, vaccin) d'une bénéficiaire consentante. */
export interface Reminder {
  type: ReminderType;
  titre: string;
  date: string;
  enRetard: boolean;
  ref: string;
}

export interface AgentReminder extends Reminder {
  beneficiaire: { id: string; name: string; phone: string | null };
}

export interface AgentDashboard {
  beneficiaires: number;
  consentantes: number;
  alertesNouvelles: number;
  alertesEnCours: number;
  /** Rappels des 7 prochains jours (et en retard) des bénéficiaires consentantes. */
  rappels: AgentReminder[];
}

export interface PfReminder {
  echeance: string;
  joursRestants: number;
  enRetard: boolean;
  aPrevoir: boolean;
}

export interface BeneficiarySummary {
  id: string;
  name: string;
  phone: string | null;
  secteur: string | null;
  partageRelais: boolean;
  alertesOuvertes: number;
  /** null tant que la bénéficiaire n'a pas autorisé le partage. */
  suivi: {
    grossesse: { semaine: number; termePrevu: string } | null;
    planification: { methode: string; prochainRappel: PfReminder | null } | null;
  } | null;
}

export interface FollowUp {
  id: string;
  type: FollowUpType;
  date: string;
  note?: string;
  orienteVers?: string;
  alerte?: string;
  relais: UserRef | null;
  createdAt: string;
}

export interface BeneficiaryDetail extends BeneficiarySummary {
  alertes: Alert[];
  suivis: FollowUp[];
  rappels: Reminder[] | null;
}
