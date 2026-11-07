import type { QueryFilter } from 'mongoose';

import { Alert, type AlertDocument, type AlertStatus } from '../models/Alert';
import { FollowUp, type FollowUpDocument, type FollowUpType } from '../models/FollowUp';
import { User, type UserDocument } from '../models/User';
import { AppError } from '../utils/AppError';
import { escapeRegex } from '../utils/pagination';
import * as alerteService from './alerte.service';
import * as grossesseService from './grossesse.service';
import * as pfService from './pf.service';
import * as rappelService from './rappel.service';

// Espace de l'agent communautaire (rôle 'relais'). Règles d'accès :
// - un agent ne voit QUE les bénéficiaires qui lui sont assignées (User.relais) ;
// - sans consentement (User.partageRelais = false), il ne voit que leur
//   identité (nom, téléphone, secteur) et les alertes qu'elles ont envoyées ;
// - avec consentement, il voit aussi un résumé de suivi (grossesse, méthode
//   de PF, rappels) — jamais le détail des contractions ni des notes.

const OPEN_ALERT: QueryFilter<AlertDocument> = { statut: { $ne: 'traitee' } };

export interface BeneficiarySummary {
  id: string;
  name: string;
  phone: string | null;
  secteur: string | null;
  partageRelais: boolean;
  alertesOuvertes: number;
  /** Présent uniquement si la bénéficiaire a consenti au partage. */
  suivi: {
    grossesse: { semaine: number; termePrevu: Date } | null;
    planification: { methode: string; prochainRappel: pfService.PfReminder | null } | null;
  } | null;
}

async function requireBeneficiary(relaisId: string, beneficiaireId: string): Promise<UserDocument> {
  const user = await User.findOne({ _id: beneficiaireId, relais: relaisId });
  if (!user) throw AppError.notFound('Bénéficiaire introuvable.');
  return user;
}

async function summarize(user: UserDocument): Promise<BeneficiarySummary> {
  const userId = user._id.toString();
  const alertesOuvertes = await Alert.countDocuments({ user: user._id, ...OPEN_ALERT });

  let suivi: BeneficiarySummary['suivi'] = null;
  if (user.partageRelais) {
    const [grossesse, pf] = await Promise.all([
      grossesseService.getCurrent(userId),
      pfService.getCurrent(userId),
    ]);
    suivi = {
      grossesse: grossesse ? { semaine: grossesse.semaine, termePrevu: grossesse.termePrevu } : null,
      planification: pf ? { methode: pf.methode.nom, prochainRappel: pf.prochainRappel } : null,
    };
  }

  return {
    id: userId,
    name: user.name,
    phone: user.phone ?? null,
    secteur: user.secteur ?? null,
    partageRelais: user.partageRelais,
    alertesOuvertes,
    suivi,
  };
}

/** Bénéficiaires de l'agent, celles qui ont une alerte ouverte en premier. */
export async function listBeneficiaries(relaisId: string, search?: string): Promise<BeneficiarySummary[]> {
  const query: QueryFilter<UserDocument> = { relais: relaisId, isActive: true };
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ name: pattern }, { phone: pattern }];
  }
  const users = await User.find(query).sort({ name: 1 }).limit(500);
  const summaries = await Promise.all(users.map(summarize));
  return summaries.sort((a, b) => b.alertesOuvertes - a.alertesOuvertes);
}

/** Fiche d'une bénéficiaire : résumé, alertes, accompagnements et (avec consentement) rappels. */
export async function getBeneficiary(relaisId: string, beneficiaireId: string) {
  const user = await requireBeneficiary(relaisId, beneficiaireId);
  const [summary, alertes, suivis, rappels] = await Promise.all([
    summarize(user),
    Alert.find({ user: user._id }).sort({ createdAt: -1 }).limit(20),
    FollowUp.find({ beneficiaire: user._id }).sort({ date: -1 }).limit(50).populate('relais', 'name'),
    user.partageRelais ? rappelService.upcoming(user._id.toString()) : Promise.resolve(null),
  ]);
  return { ...summary, alertes, suivis, rappels };
}

/** Écran d'accueil de l'agent : compteurs + rappels de la semaine des bénéficiaires consentantes. */
export async function dashboard(relaisId: string, horizonJours = 7) {
  const beneficiaries = await User.find({ relais: relaisId, isActive: true });
  const [alertesNouvelles, alertesEnCours] = await Promise.all([
    Alert.countDocuments({ relais: relaisId, statut: 'nouvelle' }),
    Alert.countDocuments({ relais: relaisId, statut: 'en_cours' }),
  ]);

  const rappels = (
    await Promise.all(
      beneficiaries
        .filter((user) => user.partageRelais)
        .map(async (user) =>
          (await rappelService.upcoming(user._id.toString(), horizonJours)).map((rappel) => ({
            ...rappel,
            beneficiaire: { id: user._id.toString(), name: user.name, phone: user.phone ?? null },
          })),
        ),
    )
  )
    .flat()
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    beneficiaires: beneficiaries.length,
    consentantes: beneficiaries.filter((user) => user.partageRelais).length,
    alertesNouvelles,
    alertesEnCours,
    rappels,
  };
}

/** Alertes routées vers cet agent. */
export async function listAlerts(relaisId: string, statut?: AlertStatus): Promise<AlertDocument[]> {
  return Alert.find({ relais: relaisId, ...(statut ? { statut } : {}) })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('user', 'name phone secteur');
}

export async function updateAlert(
  relaisId: string,
  alertId: string,
  input: { statut?: AlertStatus; noteSuivi?: string },
): Promise<AlertDocument> {
  return alerteService.updateStatus(alertId, relaisId, input, { relais: relaisId });
}

/** Note un accompagnement (appel, visite, orientation). Une alerte liée doit concerner cette bénéficiaire. */
export async function addFollowUp(
  relaisId: string,
  beneficiaireId: string,
  input: { type: FollowUpType; date?: Date; note?: string; orienteVers?: string; alerte?: string },
): Promise<FollowUpDocument> {
  const user = await requireBeneficiary(relaisId, beneficiaireId);
  if (input.alerte && !(await Alert.exists({ _id: input.alerte, user: user._id }))) {
    throw AppError.validation('Données invalides.', {
      alerte: 'Alerte introuvable pour cette bénéficiaire.',
    });
  }
  return FollowUp.create({
    ...input,
    date: input.date ?? new Date(),
    beneficiaire: user._id,
    relais: relaisId,
  });
}

export async function listFollowUps(relaisId: string, beneficiaireId: string): Promise<FollowUpDocument[]> {
  const user = await requireBeneficiary(relaisId, beneficiaireId);
  return FollowUp.find({ beneficiaire: user._id }).sort({ date: -1 }).limit(100).populate('relais', 'name');
}

/** Agent de l'utilisatrice connectée (nom et téléphone pour pouvoir le joindre), ou null. */
export async function myAgent(user: UserDocument): Promise<{ name: string; phone: string | null } | null> {
  if (!user.relais) return null;
  const agent = await User.findOne({ _id: user.relais, role: 'relais', isActive: true });
  return agent ? { name: agent.name, phone: agent.phone ?? null } : null;
}
