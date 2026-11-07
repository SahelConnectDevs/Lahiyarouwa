import {
  ContraceptiveMethod,
  type ContraceptiveMethodDocument,
  type RappelMode,
} from '../models/ContraceptiveMethod';
import { ContraceptionRecord, type ContraceptionRecordDocument } from '../models/ContraceptionRecord';
import { AppError } from '../utils/AppError';
import { addDays, daysBetween } from '../utils/dates';

/** Prochain rappel calculé pour la méthode en cours (null si la méthode n'en prévoit pas). */
export interface PfReminder {
  mode: Exclude<RappelMode, 'aucun'>;
  /** Date du prochain geste : renouvellement, injection, retrait/remplacement. */
  echeance: Date;
  joursRestants: number;
  enRetard: boolean;
  /** true quand on entre dans la fenêtre de prévenance (`avanceJours`) ou en retard. */
  aPrevoir: boolean;
  /** Heure du rappel quotidien, pour la pilule. */
  heure: string | null;
}

export interface PfView {
  id: string;
  statut: string;
  methode: ContraceptiveMethodDocument;
  dateDebut: Date;
  dateFin: Date | null;
  raisonArret: string | null;
  dureeJours: number | null;
  heureRappel: string | null;
  dernierRenouvellement: Date | null;
  renouvellements: Date[];
  notes: string | null;
  prochainRappel: PfReminder | null;
}

const DEFAULT_DAILY_TIME = '20:00';

/** Calcule la prochaine échéance d'une méthode en cours, à partir de sa configuration de rappel. */
export function nextReminder(
  record: ContraceptionRecordDocument,
  method: ContraceptiveMethodDocument,
  now = new Date(),
): PfReminder | null {
  const config = method.rappel;
  const mode = (config?.mode ?? 'aucun') as RappelMode;
  if (mode === 'aucun' || record.statut !== 'en_cours') return null;

  let echeance: Date;
  if (mode === 'quotidien' || mode === 'intervalle') {
    if (!config?.intervalleJours) return null;
    echeance = addDays(record.dernierRenouvellement ?? record.dateDebut, config.intervalleJours);
  } else {
    const duree = record.dureeJours ?? config?.dureeJours;
    if (!duree) return null;
    echeance = addDays(record.dateDebut, duree);
  }

  const joursRestants = daysBetween(now, echeance);
  return {
    mode,
    echeance,
    joursRestants,
    enRetard: joursRestants < 0,
    aPrevoir: joursRestants <= (config?.avanceJours ?? 3),
    heure: mode === 'quotidien' ? (record.heureRappel ?? DEFAULT_DAILY_TIME) : null,
  };
}

function toView(record: ContraceptionRecordDocument, method: ContraceptiveMethodDocument): PfView {
  return {
    id: record._id.toString(),
    statut: record.statut,
    methode: method,
    dateDebut: record.dateDebut,
    dateFin: record.dateFin ?? null,
    raisonArret: record.raisonArret ?? null,
    dureeJours: record.dureeJours ?? null,
    heureRappel: record.heureRappel ?? null,
    dernierRenouvellement: record.dernierRenouvellement ?? null,
    renouvellements: [...record.renouvellements] as Date[],
    notes: record.notes ?? null,
    prochainRappel: nextReminder(record, method),
  };
}

async function withMethod(record: ContraceptionRecordDocument): Promise<PfView> {
  const method = await ContraceptiveMethod.findById(record.methode);
  if (!method) throw AppError.notFound('Méthode introuvable.');
  return toView(record, method);
}

// --- Catalogue -------------------------------------------------------------

export async function listMethods(): Promise<ContraceptiveMethodDocument[]> {
  return ContraceptiveMethod.find({ actif: true }).sort({ ordre: 1, nom: 1 });
}

export async function getMethod(code: string): Promise<ContraceptiveMethodDocument> {
  const method = await ContraceptiveMethod.findOne({ code, actif: true });
  if (!method) throw AppError.notFound('Méthode introuvable.');
  return method;
}

// --- Méthode suivie par l'utilisatrice -------------------------------------

async function findCurrent(userId: string): Promise<ContraceptionRecordDocument | null> {
  return ContraceptionRecord.findOne({ user: userId, statut: 'en_cours' });
}

async function requireCurrent(userId: string): Promise<ContraceptionRecordDocument> {
  const record = await findCurrent(userId);
  if (!record) throw AppError.notFound('Aucune méthode en cours.');
  return record;
}

/** Méthode en cours avec son prochain rappel, ou null. */
export async function getCurrent(userId: string): Promise<PfView | null> {
  const record = await findCurrent(userId);
  return record ? withMethod(record) : null;
}

/**
 * Enregistre la méthode choisie (après consultation). Si une autre méthode
 * était en cours, elle est arrêtée à la date de début de la nouvelle.
 */
export async function start(
  userId: string,
  input: { methode: string; dateDebut: Date; dureeJours?: number; heureRappel?: string; notes?: string },
): Promise<PfView> {
  const method = await ContraceptiveMethod.findOne({ code: input.methode, actif: true });
  if (!method) throw AppError.validation('Données invalides.', { methode: 'Méthode inconnue.' });

  const previous = await findCurrent(userId);
  if (previous) {
    previous.statut = 'arretee';
    previous.dateFin = input.dateDebut;
    previous.raisonArret ??= 'Changement de méthode';
    await previous.save();
  }

  const record = await ContraceptionRecord.create({
    user: userId,
    methode: method._id,
    dateDebut: input.dateDebut,
    dureeJours: input.dureeJours,
    heureRappel: input.heureRappel,
    notes: input.notes,
  });
  return toView(record, method);
}

/** Modifie l'heure de rappel, la durée propre ou les notes de la méthode en cours. */
export async function update(
  userId: string,
  input: { dureeJours?: number | null; heureRappel?: string | null; notes?: string | null },
): Promise<PfView> {
  const record = await requireCurrent(userId);
  for (const key of ['dureeJours', 'heureRappel', 'notes'] as const) {
    if (input[key] !== undefined) record.set(key, input[key] ?? undefined);
  }
  await record.save();
  return withMethod(record);
}

/**
 * Note un renouvellement : injection faite, nouvelle plaquette commencée, ou
 * implant/DIU remplacé (la durée repart alors de cette date).
 */
export async function renew(userId: string, date: Date): Promise<PfView> {
  const record = await requireCurrent(userId);
  const method = await ContraceptiveMethod.findById(record.methode);
  if (!method) throw AppError.notFound('Méthode introuvable.');

  const mode = method.rappel?.mode ?? 'aucun';
  if (mode === 'aucun') {
    throw AppError.validation('Données invalides.', { date: 'Cette méthode ne se renouvelle pas.' });
  }
  if (date < record.dateDebut) {
    throw AppError.validation('Données invalides.', {
      date: 'La date doit être postérieure au début de la méthode.',
    });
  }

  record.renouvellements.push(date);
  if (mode === 'echeance') record.dateDebut = date;
  else record.dernierRenouvellement = date;
  await record.save();
  return toView(record, method);
}

export async function stop(userId: string, input: { date: Date; raison?: string }): Promise<PfView> {
  const record = await requireCurrent(userId);
  if (input.date < record.dateDebut) {
    throw AppError.validation('Données invalides.', {
      date: "La date d'arrêt doit être postérieure au début.",
    });
  }
  record.statut = 'arretee';
  record.dateFin = input.date;
  record.raisonArret = input.raison;
  await record.save();
  return withMethod(record);
}

export async function history(userId: string): Promise<PfView[]> {
  const records = await ContraceptionRecord.find({ user: userId }).sort({ dateDebut: -1 }).limit(50);
  const methods = await ContraceptiveMethod.find({ _id: { $in: records.map((r) => r.methode) } });
  return records.flatMap((record) => {
    const method = methods.find((m) => m._id.equals(record.methode));
    return method ? [toView(record, method)] : [];
  });
}
