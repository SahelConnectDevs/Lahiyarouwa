import { CpnStep, type CpnStepDocument } from '../models/CpnStep';
import { Pregnancy, type PregnancyDocument } from '../models/Pregnancy';
import { AppError } from '../utils/AppError';
import { PREGNANCY_DAYS, addDays, daysBetween } from '../utils/dates';

/** Grossesse telle que renvoyée à l'app : données stockées + valeurs calculées depuis la DDR. */
export interface PregnancyView {
  id: string;
  ddr: Date;
  status: string;
  dateAccouchement: Date | null;
  /** Date prévue d'accouchement (DDR + 280 jours). */
  termePrevu: Date;
  /** Semaines d'aménorrhée révolues (ex: 24 pour "24 SA + 3 j"). */
  semaine: number;
  /** Jours au-delà des semaines révolues (0 à 6). */
  jour: number;
  joursRestants: number;
  trimestre: 1 | 2 | 3;
}

export type CpnStatus = 'effectuee' | 'en_cours' | 'en_retard' | 'a_venir';

export interface CpnView {
  numero: number;
  titre: string;
  periode: string;
  examens: string[];
  aApporter: string[];
  /** Fenêtre de dates recommandée pour cette grossesse, null pour une CPN post-natale. */
  fenetre: { debut: Date; fin: Date } | null;
  statut: CpnStatus;
  effectueeLe: Date | null;
  notes: string | null;
}

export function toPregnancyView(pregnancy: PregnancyDocument, now = new Date()): PregnancyView {
  const ddr = pregnancy.ddr;
  const reference = pregnancy.dateAccouchement ?? now;
  const elapsed = Math.max(0, daysBetween(ddr, reference));
  const semaine = Math.floor(elapsed / 7);
  const termePrevu = addDays(ddr, PREGNANCY_DAYS);

  return {
    id: pregnancy._id.toString(),
    ddr,
    status: pregnancy.status,
    dateAccouchement: pregnancy.dateAccouchement ?? null,
    termePrevu,
    semaine,
    jour: elapsed % 7,
    // Dérivé du même `elapsed` que semaine/jour pour que "24 SA + 3 j" et le
    // décompte restent cohérents quelle que soit l'heure de la requête.
    joursRestants: Math.max(0, PREGNANCY_DAYS - elapsed),
    trimestre: semaine < 14 ? 1 : semaine < 28 ? 2 : 3,
  };
}

async function findCurrent(userId: string): Promise<PregnancyDocument | null> {
  return Pregnancy.findOne({ user: userId, status: 'en_cours' });
}

async function requireCurrent(userId: string): Promise<PregnancyDocument> {
  const pregnancy = await findCurrent(userId);
  if (!pregnancy) throw AppError.notFound('Aucune grossesse en cours.');
  return pregnancy;
}

export async function getCurrent(userId: string): Promise<PregnancyView | null> {
  const pregnancy = await findCurrent(userId);
  return pregnancy ? toPregnancyView(pregnancy) : null;
}

/** Crée la grossesse en cours, ou corrige sa DDR si elle existe déjà (écran "Date des dernières règles"). */
export async function setDdr(userId: string, ddr: Date): Promise<{ view: PregnancyView; created: boolean }> {
  const existing = await findCurrent(userId);
  if (existing) {
    existing.ddr = ddr;
    await existing.save();
    return { view: toPregnancyView(existing), created: false };
  }
  const pregnancy = await Pregnancy.create({ user: userId, ddr });
  return { view: toPregnancyView(pregnancy), created: true };
}

export async function finish(userId: string, dateAccouchement: Date): Promise<PregnancyView> {
  const pregnancy = await requireCurrent(userId);
  if (dateAccouchement < pregnancy.ddr) {
    throw AppError.validation('Données invalides.', {
      dateAccouchement: "La date d'accouchement doit être postérieure à la DDR.",
    });
  }
  pregnancy.status = 'terminee';
  pregnancy.dateAccouchement = dateAccouchement;
  await pregnancy.save();
  return toPregnancyView(pregnancy);
}

function cpnStatus(fenetre: CpnView['fenetre'], effectueeLe: Date | null, now: Date): CpnStatus {
  if (effectueeLe) return 'effectuee';
  if (!fenetre || now < fenetre.debut) return 'a_venir';
  return now <= fenetre.fin ? 'en_cours' : 'en_retard';
}

function toCpnViews(pregnancy: PregnancyDocument, steps: CpnStepDocument[], now = new Date()): CpnView[] {
  return steps.map((step) => {
    const visit = pregnancy.cpn.find((v) => v.numero === step.numero);
    const fenetre =
      step.semaineDebut != null && step.semaineFin != null
        ? {
            debut: addDays(pregnancy.ddr, step.semaineDebut * 7),
            fin: addDays(pregnancy.ddr, step.semaineFin * 7 + 6),
          }
        : null;
    const effectueeLe = visit?.effectueeLe ?? null;
    return {
      numero: step.numero,
      titre: step.titre,
      periode: step.periode,
      examens: step.examens,
      aApporter: step.aApporter,
      fenetre,
      statut: cpnStatus(fenetre, effectueeLe, now),
      effectueeLe,
      notes: visit?.notes ?? null,
    };
  });
}

async function activeSteps(): Promise<CpnStepDocument[]> {
  return CpnStep.find({ actif: true }).sort({ numero: 1 });
}

/** Calendrier des CPN de la grossesse en cours, avec dates recommandées et statut de chaque consultation. */
export async function listCpn(userId: string): Promise<CpnView[]> {
  const pregnancy = await requireCurrent(userId);
  return toCpnViews(pregnancy, await activeSteps());
}

/** Marque une CPN comme effectuée (avec sa date) ou annule ce marquage. */
export async function markCpn(
  userId: string,
  numero: number,
  input: { effectuee: boolean; date?: Date; notes?: string },
): Promise<CpnView> {
  const pregnancy = await requireCurrent(userId);
  const steps = await activeSteps();
  if (!steps.some((s) => s.numero === numero)) {
    throw AppError.notFound(`CPN ${numero} introuvable.`);
  }

  const others = pregnancy.cpn.filter((v) => v.numero !== numero);
  pregnancy.set(
    'cpn',
    input.effectuee
      ? [...others, { numero, effectueeLe: input.date ?? new Date(), notes: input.notes }]
      : others,
  );
  await pregnancy.save();

  const view = toCpnViews(pregnancy, steps).find((v) => v.numero === numero);
  if (!view) throw AppError.notFound(`CPN ${numero} introuvable.`);
  return view;
}
