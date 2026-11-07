import { Child, type ChildDocument } from '../models/Child';
import { VaccinationRecord } from '../models/VaccinationRecord';
import { AppError } from '../utils/AppError';

export interface ChildInput {
  prenom?: string;
  dateNaissance?: Date;
  sexe?: 'F' | 'M';
  poidsNaissanceGrammes?: number;
}

export async function list(userId: string): Promise<ChildDocument[]> {
  return Child.find({ user: userId }).sort({ dateNaissance: -1 });
}

/** Renvoie l'enfant s'il appartient bien à l'utilisatrice, 404 sinon (même s'il existe pour un autre compte). */
export async function getOwned(userId: string, childId: string): Promise<ChildDocument> {
  const child = await Child.findOne({ _id: childId, user: userId });
  if (!child) throw AppError.notFound('Enfant introuvable.');
  return child;
}

export async function create(
  userId: string,
  input: Required<Pick<ChildInput, 'prenom' | 'dateNaissance'>> & ChildInput,
) {
  return Child.create({ ...input, user: userId });
}

export async function update(userId: string, childId: string, input: ChildInput): Promise<ChildDocument> {
  const child = await getOwned(userId, childId);
  child.set(input);
  await child.save();
  return child;
}

/** Supprime l'enfant et ses vaccinations enregistrées. */
export async function remove(userId: string, childId: string): Promise<void> {
  const child = await getOwned(userId, childId);
  await VaccinationRecord.deleteMany({ user: userId, enfant: child._id });
  await child.deleteOne();
}
