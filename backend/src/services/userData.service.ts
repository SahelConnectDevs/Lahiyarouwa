import type { Types } from 'mongoose';

import { Alert } from '../models/Alert';
import { Child } from '../models/Child';
import { ContractionSession } from '../models/ContractionSession';
import { ContraceptionRecord } from '../models/ContraceptionRecord';
import { FollowUp } from '../models/FollowUp';
import { Pregnancy } from '../models/Pregnancy';
import { User } from '../models/User';
import { VaccinationRecord } from '../models/VaccinationRecord';

/**
 * Supprime un compte et TOUTES les données qui lui sont rattachées.
 * Utilisé par la suppression de compte côté app (DELETE /auth/me) et côté
 * admin-web (DELETE /admin/users/:id) — c'est l'engagement pris dans la
 * politique de confidentialité et sur la page /suppression-compte du site.
 * Toute nouvelle collection liée à un utilisateur doit être ajoutée ici.
 */
export async function deleteUserAndData(userId: Types.ObjectId | string): Promise<void> {
  await Promise.all([
    Pregnancy.deleteMany({ user: userId }),
    Child.deleteMany({ user: userId }),
    VaccinationRecord.deleteMany({ user: userId }),
    ContractionSession.deleteMany({ user: userId }),
    Alert.deleteMany({ user: userId }),
    ContraceptionRecord.deleteMany({ user: userId }),
    FollowUp.deleteMany({ beneficiaire: userId }),
    // Si le compte supprimé est un agent : ses bénéficiaires et alertes
    // ouvertes perdent leur agent (à réassigner depuis l'admin) ; ses notes
    // de suivi restent dans le dossier des bénéficiaires, sans auteur.
    User.updateMany({ relais: userId }, { $unset: { relais: '' } }),
    Alert.updateMany({ relais: userId }, { $unset: { relais: '' } }),
    FollowUp.updateMany({ relais: userId }, { $unset: { relais: '' } }),
  ]);
  await User.deleteOne({ _id: userId });
}
