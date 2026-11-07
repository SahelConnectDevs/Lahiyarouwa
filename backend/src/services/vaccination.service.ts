import { Vaccine, type VaccineDocument } from '../models/Vaccine';
import { VaccinationRecord, type VaccinationRecordDocument } from '../models/VaccinationRecord';
import { AppError } from '../utils/AppError';
import { addDays } from '../utils/dates';
import * as enfantService from './enfant.service';

export type VaccineTarget = 'maman' | 'enfant';

/** Calendrier vaccinal actif (contenu public de l'app), filtré par cible si précisée. */
export async function listVaccines(cible?: VaccineTarget): Promise<VaccineDocument[]> {
  return Vaccine.find({ actif: true, ...(cible ? { cible } : {}) }).sort({ ordre: 1, nom: 1 });
}

/**
 * Doses enregistrées par l'utilisatrice. `enfantId` absent = vaccins de la
 * maman ; présent = vaccins de cet enfant (qui doit lui appartenir).
 */
export async function listRecords(userId: string, enfantId?: string): Promise<VaccinationRecordDocument[]> {
  if (enfantId) await enfantService.getOwned(userId, enfantId);
  return VaccinationRecord.find({ user: userId, enfant: enfantId ?? { $exists: false } })
    .sort({ date: -1 })
    .populate('vaccin');
}

export async function createRecord(
  userId: string,
  input: { vaccin: string; enfant?: string; date: Date; lieu?: string; notes?: string },
): Promise<VaccinationRecordDocument> {
  const vaccine = await Vaccine.findOne({ _id: input.vaccin, actif: true });
  if (!vaccine) {
    throw AppError.validation('Données invalides.', { vaccin: 'Vaccin inconnu.' });
  }

  const expectedTarget: VaccineTarget = input.enfant ? 'enfant' : 'maman';
  if (vaccine.cible !== expectedTarget) {
    throw AppError.validation('Données invalides.', {
      vaccin:
        expectedTarget === 'enfant'
          ? "Ce vaccin n'est pas un vaccin de l'enfant."
          : "Ce vaccin n'est pas un vaccin de la maman.",
    });
  }
  if (input.enfant) await enfantService.getOwned(userId, input.enfant);

  const record = await VaccinationRecord.create({ ...input, user: userId });
  return record.populate('vaccin');
}

export async function removeRecord(userId: string, recordId: string): Promise<void> {
  const result = await VaccinationRecord.deleteOne({ _id: recordId, user: userId });
  if (result.deletedCount === 0) throw AppError.notFound('Vaccination introuvable.');
}

export type CalendarStatus = 'fait' | 'en_retard' | 'a_venir';

export interface CalendarEntry {
  vaccin: VaccineDocument;
  /** Date recommandée (naissance + ageSemaines), null si le vaccin n'a pas d'âge fixe (vaccins de la maman). */
  datePrevue: Date | null;
  statut: CalendarStatus;
  doseRecue: VaccinationRecordDocument | null;
}

/**
 * Calendrier vaccinal personnalisé : chaque vaccin du calendrier, avec sa
 * date prévue et s'il a déjà été reçu. Pour la maman si `enfantId` est
 * absent, sinon pour l'enfant.
 */
export async function calendar(
  userId: string,
  enfantId?: string,
  now = new Date(),
): Promise<CalendarEntry[]> {
  const child = enfantId ? await enfantService.getOwned(userId, enfantId) : null;
  const [vaccines, records] = await Promise.all([
    listVaccines(child ? 'enfant' : 'maman'),
    VaccinationRecord.find({ user: userId, enfant: child?._id ?? { $exists: false } }),
  ]);

  return vaccines.map((vaccin) => {
    const doseRecue = records.find((r) => r.vaccin.toString() === vaccin._id.toString()) ?? null;
    const datePrevue =
      child && vaccin.ageSemaines != null ? addDays(child.dateNaissance, vaccin.ageSemaines * 7) : null;
    const statut: CalendarStatus = doseRecue
      ? 'fait'
      : datePrevue && datePrevue < now
        ? 'en_retard'
        : 'a_venir';
    return { vaccin, datePrevue, statut, doseRecue };
  });
}
