import { Child } from '../models/Child';
import { Pregnancy } from '../models/Pregnancy';
import { addDays } from '../utils/dates';
import * as grossesseService from './grossesse.service';
import * as pfService from './pf.service';
import * as vaccinationService from './vaccination.service';

export type ReminderType = 'pf' | 'cpn' | 'vaccin';

/** Rappel unifié, quelle que soit sa source — consommé par l'app, le tableau de bord agent et, plus tard, le SVI. */
export interface Reminder {
  type: ReminderType;
  titre: string;
  /** Date de l'échéance (ou début de la fenêtre recommandée pour une CPN à venir). */
  date: Date;
  enRetard: boolean;
  /** Identifiant de l'objet concerné : n° de CPN, id d'enfant, id de la méthode suivie. */
  ref: string;
}

/**
 * Rappels d'une utilisatrice : en retard, ou à échéance dans les `horizonJours`
 * jours. Agrège planification familiale, CPN de la grossesse en cours et
 * vaccins de ses enfants, triés du plus urgent au moins urgent.
 */
export async function upcoming(userId: string, horizonJours = 30, now = new Date()): Promise<Reminder[]> {
  const limit = addDays(now, horizonJours);
  const reminders: Reminder[] = [];

  const pf = await pfService.getCurrent(userId);
  if (pf?.prochainRappel && pf.prochainRappel.echeance <= limit) {
    const labels = {
      quotidien: 'Nouvelle plaquette',
      intervalle: 'Renouvellement',
      echeance: 'Fin de protection',
    };
    reminders.push({
      type: 'pf',
      titre: `${labels[pf.prochainRappel.mode]} : ${pf.methode.nom}`,
      date: pf.prochainRappel.echeance,
      enRetard: pf.prochainRappel.enRetard,
      ref: pf.id,
    });
  }

  if (await Pregnancy.exists({ user: userId, status: 'en_cours' })) {
    for (const cpn of await grossesseService.listCpn(userId)) {
      if (!cpn.fenetre || cpn.statut === 'effectuee') continue;
      if (cpn.statut === 'en_retard' || cpn.statut === 'en_cours' || cpn.fenetre.debut <= limit) {
        reminders.push({
          type: 'cpn',
          titre: `${cpn.titre} (${cpn.periode})`,
          date: cpn.statut === 'a_venir' ? cpn.fenetre.debut : cpn.fenetre.fin,
          enRetard: cpn.statut === 'en_retard',
          ref: String(cpn.numero),
        });
      }
    }
  }

  const children = await Child.find({ user: userId });
  for (const child of children) {
    for (const entry of await vaccinationService.calendar(userId, child._id.toString(), now)) {
      if (entry.statut === 'fait' || !entry.datePrevue || entry.datePrevue > limit) continue;
      const dose = entry.vaccin.dose ? ` ${entry.vaccin.dose}` : '';
      reminders.push({
        type: 'vaccin',
        titre: `${entry.vaccin.nom}${dose} — ${child.prenom}`,
        date: entry.datePrevue,
        enRetard: entry.statut === 'en_retard',
        ref: child._id.toString(),
      });
    }
  }

  return reminders.sort((a, b) => a.date.getTime() - b.date.getTime());
}
