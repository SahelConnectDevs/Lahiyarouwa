import type { QueryFilter } from 'mongoose';

import { Alert, type AlertDocument, type AlertSign, type AlertStatus } from '../models/Alert';
import type { UserDocument } from '../models/User';
import { AppError } from '../utils/AppError';
import { paginated, type Paginated, type Pagination } from '../utils/pagination';

/** Enregistre un signalement et le route vers l'agent communautaire de l'utilisatrice, s'il y en a un. */
export async function create(
  user: UserDocument,
  input: { signe: AlertSign; details?: string },
): Promise<AlertDocument> {
  return Alert.create({ ...input, user: user._id, relais: user.relais });
}

export async function listMine(userId: string): Promise<AlertDocument[]> {
  return Alert.find({ user: userId }).sort({ createdAt: -1 }).limit(100);
}

/** Liste paginée pour l'admin-web, avec le nom et le téléphone de l'utilisatrice pour pouvoir la rappeler. */
export async function listAll(
  filter: { statut?: AlertStatus },
  pagination: Pagination,
): Promise<Paginated<AlertDocument>> {
  const query: QueryFilter<AlertDocument> = filter.statut ? { statut: filter.statut } : {};
  const [items, total] = await Promise.all([
    Alert.find(query)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('user', 'name phone')
      .populate('relais', 'name phone')
      .populate('traiteePar', 'name'),
    Alert.countDocuments(query),
  ]);
  return paginated(items, total, pagination);
}

/**
 * Met à jour le suivi d'une alerte. `scope.relais` restreint aux alertes
 * routées vers cet agent (404 sinon) ; l'admin n'a pas de restriction.
 */
export async function updateStatus(
  alertId: string,
  actorId: string,
  input: { statut?: AlertStatus; noteSuivi?: string },
  scope: { relais?: string } = {},
): Promise<AlertDocument> {
  const alert = await Alert.findOne({ _id: alertId, ...(scope.relais ? { relais: scope.relais } : {}) });
  if (!alert) throw AppError.notFound('Alerte introuvable.');

  if (input.statut !== undefined) alert.set('statut', input.statut);
  if (input.noteSuivi !== undefined) alert.noteSuivi = input.noteSuivi;
  if (input.statut === 'traitee') {
    alert.set('traiteePar', actorId);
    alert.traiteeLe = new Date();
  }
  await alert.save();
  return alert.populate([
    { path: 'user', select: 'name phone' },
    { path: 'traiteePar', select: 'name' },
  ]);
}
