import { ContractionSession, type ContractionSessionDocument } from '../models/ContractionSession';
import { AppError } from '../utils/AppError';

export interface ContractionSessionInput {
  debut: Date;
  fin: Date;
  contractions: { debut: Date; fin: Date }[];
}

export async function list(userId: string, limit = 50): Promise<ContractionSessionDocument[]> {
  return ContractionSession.find({ user: userId }).sort({ debut: -1 }).limit(limit);
}

/** Enregistre une séance terminée du compteur de contractions. */
export async function create(
  userId: string,
  input: ContractionSessionInput,
): Promise<ContractionSessionDocument> {
  if (input.fin < input.debut) {
    throw AppError.validation('Données invalides.', { fin: 'La fin doit être après le début.' });
  }
  const invalid = input.contractions.findIndex((c) => c.fin < c.debut);
  if (invalid !== -1) {
    throw AppError.validation('Données invalides.', {
      [`contractions[${invalid}].fin`]: 'La fin doit être après le début.',
    });
  }
  return ContractionSession.create({ ...input, user: userId });
}

export async function remove(userId: string, sessionId: string): Promise<void> {
  const result = await ContractionSession.deleteOne({ _id: sessionId, user: userId });
  if (result.deletedCount === 0) throw AppError.notFound('Séance introuvable.');
}
