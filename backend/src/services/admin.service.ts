import type { QueryFilter } from 'mongoose';

import { Alert } from '../models/Alert';
import { Child } from '../models/Child';
import { ContractionSession } from '../models/ContractionSession';
import { ContraceptionRecord } from '../models/ContraceptionRecord';
import { ContraceptiveMethod } from '../models/ContraceptiveMethod';
import { Pregnancy } from '../models/Pregnancy';
import { User, type Role, type UserDocument } from '../models/User';
import { VaccinationRecord } from '../models/VaccinationRecord';
import { AppError } from '../utils/AppError';
import { addDays } from '../utils/dates';
import { escapeRegex, paginated, type Paginated, type Pagination } from '../utils/pagination';
import { toPublicUser, type PublicUser } from './auth.service';
import { deleteUserAndData } from './userData.service';

export interface AdminUser extends PublicUser {
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  /** Id de l'agent communautaire assigné (bénéficiaire). */
  relais: string | null;
  secteur: string | null;
}

function toAdminUser(user: UserDocument): AdminUser {
  return {
    ...toPublicUser(user),
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    relais: user.relais?.toString() ?? null,
    secteur: user.secteur ?? null,
  };
}

/** Chiffres du tableau de bord de l'admin-web. */
export async function stats(now = new Date()) {
  const since30 = addDays(now, -30);
  const [
    usersByRole,
    nouveaux30j,
    actifs30j,
    grossessesEnCours,
    enfants,
    vaccinations,
    seancesContractions,
    alertes,
    methodesEnCours,
    sansAgent,
  ] = await Promise.all([
    User.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.countDocuments({ createdAt: { $gte: since30 } }),
    User.countDocuments({ lastLoginAt: { $gte: since30 } }),
    Pregnancy.countDocuments({ status: 'en_cours' }),
    Child.countDocuments(),
    VaccinationRecord.countDocuments(),
    ContractionSession.countDocuments(),
    Alert.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$statut', count: { $sum: 1 } } }]),
    ContraceptionRecord.aggregate<{ _id: unknown; count: number }>([
      { $match: { statut: 'en_cours' } },
      { $group: { _id: '$methode', count: { $sum: 1 } } },
    ]),
    User.countDocuments({ role: 'user', relais: { $exists: false } }),
  ]);
  const methodNames = await ContraceptiveMethod.find(
    { _id: { $in: methodesEnCours.map((row) => row._id) } },
    { nom: 1 },
  );

  const byKey = (rows: { _id: string; count: number }[]) =>
    Object.fromEntries(rows.map((row) => [row._id, row.count])) as Record<string, number>;
  const roles = byKey(usersByRole);

  return {
    utilisateurs: {
      total: Object.values(roles).reduce((sum, n) => sum + n, 0),
      parRole: { user: roles.user ?? 0, relais: roles.relais ?? 0, admin: roles.admin ?? 0 },
      nouveaux30j,
      actifs30j,
    },
    grossessesEnCours,
    enfants,
    vaccinations,
    seancesContractions,
    alertes: byKey(alertes),
    planification: {
      methodesEnCours: methodesEnCours.reduce((sum, row) => sum + row.count, 0),
      parMethode: Object.fromEntries(
        methodesEnCours.map((row) => [
          methodNames.find((m) => m._id.equals(row._id as never))?.nom ?? 'Méthode supprimée',
          row.count,
        ]),
      ),
    },
    beneficiairesSansAgent: sansAgent,
  };
}

export async function listUsers(
  filter: { search?: string; role?: Role; isActive?: boolean; relais?: string; sansAgent?: boolean },
  pagination: Pagination,
): Promise<Paginated<AdminUser>> {
  const query: QueryFilter<UserDocument> = {};
  if (filter.role) query.role = filter.role;
  if (filter.isActive !== undefined) query.isActive = filter.isActive;
  if (filter.relais) query.relais = filter.relais;
  if (filter.sansAgent) query.relais = { $exists: false };
  if (filter.search) {
    const pattern = new RegExp(escapeRegex(filter.search), 'i');
    query.$or = [{ name: pattern }, { phone: pattern }, { email: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    User.countDocuments(query),
  ]);
  return paginated(users.map(toAdminUser), total, pagination);
}

/** Fiche d'une utilisatrice pour l'admin-web : profil + volume de données liées. */
export async function getUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('Utilisateur introuvable.');

  const [grossesseEnCours, enfants, vaccinations, alertes] = await Promise.all([
    Pregnancy.exists({ user: user._id, status: 'en_cours' }),
    Child.countDocuments({ user: user._id }),
    VaccinationRecord.countDocuments({ user: user._id }),
    Alert.countDocuments({ user: user._id }),
  ]);

  return {
    ...toAdminUser(user),
    resume: { grossesseEnCours: Boolean(grossesseEnCours), enfants, vaccinations, alertes },
  };
}

/**
 * Change le rôle, active/désactive un compte, assigne un agent communautaire
 * (`relais`, null pour retirer) ou un secteur. Un admin ne peut pas se
 * rétrograder ni se désactiver lui-même.
 */
export async function updateUser(
  adminId: string,
  userId: string,
  input: { role?: Role; isActive?: boolean; relais?: string | null; secteur?: string | null },
): Promise<AdminUser> {
  if (adminId === userId && (input.isActive === false || (input.role && input.role !== 'admin'))) {
    throw AppError.forbidden('Vous ne pouvez pas retirer vos propres droits administrateur.');
  }

  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('Utilisateur introuvable.');

  if (input.relais) {
    if (input.relais === userId) {
      throw AppError.validation('Données invalides.', {
        relais: 'Un compte ne peut pas être son propre agent.',
      });
    }
    if (!(await User.exists({ _id: input.relais, role: 'relais', isActive: true }))) {
      throw AppError.validation('Données invalides.', {
        relais: "Ce compte n'est pas un agent communautaire actif.",
      });
    }
  }

  if (input.role !== undefined && input.role !== user.role) {
    // Un agent qui perd son rôle libère ses bénéficiaires et ses alertes ouvertes.
    if (user.role === 'relais') await releaseBeneficiaries(user._id.toString());
    user.role = input.role;
  }
  if (input.relais !== undefined && String(user.relais ?? '') !== String(input.relais ?? '')) {
    user.set('relais', input.relais ?? undefined);
    // Les alertes encore ouvertes suivent la bénéficiaire chez son nouvel agent.
    await Alert.updateMany(
      { user: user._id, statut: { $ne: 'traitee' } },
      input.relais ? { $set: { relais: input.relais } } : { $unset: { relais: '' } },
    );
  }
  if (input.secteur !== undefined) user.set('secteur', input.secteur || undefined);
  if (input.isActive !== undefined && input.isActive !== user.isActive) {
    user.isActive = input.isActive;
    // Déconnecte immédiatement le compte désactivé sur tous ses appareils.
    if (!input.isActive) user.tokenVersion += 1;
  }
  await user.save();
  return toAdminUser(user);
}

async function releaseBeneficiaries(relaisId: string): Promise<void> {
  await Promise.all([
    User.updateMany({ relais: relaisId }, { $unset: { relais: '' } }),
    Alert.updateMany({ relais: relaisId, statut: { $ne: 'traitee' } }, { $unset: { relais: '' } }),
  ]);
}

/** Agents communautaires avec leur charge (bénéficiaires, alertes ouvertes), pour l'écran d'affectation. */
export async function listAgents() {
  const agents = await User.find({ role: 'relais' }).sort({ name: 1 });
  return Promise.all(
    agents.map(async (agent) => ({
      ...toAdminUser(agent),
      beneficiaires: await User.countDocuments({ relais: agent._id }),
      alertesOuvertes: await Alert.countDocuments({ relais: agent._id, statut: { $ne: 'traitee' } }),
    })),
  );
}

export async function deleteUser(adminId: string, userId: string): Promise<void> {
  if (adminId === userId) {
    throw AppError.forbidden('Utilisez une autre session admin pour supprimer ce compte.');
  }
  if (!(await User.exists({ _id: userId }))) throw AppError.notFound('Utilisateur introuvable.');
  await deleteUserAndData(userId);
}
