import { Schema, model, type HydratedDocumentFromSchema } from 'mongoose';

export const ROLES = ['user', 'relais', 'admin'] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    // Identifiant principal de connexion, normalisé en "+227XXXXXXXX" (voir
    // utils/phone.ts). Optionnel au niveau du schéma uniquement pour laisser
    // un admin s'inscrire par e-mail ; l'inscription mobile l'exige.
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    // select: false : jamais renvoyé par une requête User.find() par défaut,
    // il faut explicitement .select('+passwordHash') (voir auth.service.ts).
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    birthDate: { type: Date },
    // 'relais' correspond à la feature lib/features/relais côté mobile
    // (agent de santé communautaire) ; 'admin' est pour l'admin-web, qui
    // s'authentifie contre cette même collection.
    role: { type: String, enum: ROLES, default: 'user' },
    // Un compte désactivé par un admin ne peut plus se connecter, et ses
    // tokens en cours sont refusés (voir requireAuth).
    isActive: { type: Boolean, default: true },
    // Incrémenté au changement de mot de passe / à la désactivation pour
    // invalider tous les JWT déjà émis (voir utils/jwt.ts).
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
    // Agent communautaire (compte de rôle 'relais') qui suit cette
    // bénéficiaire, assigné depuis l'admin-web. Ses alertes lui sont routées.
    relais: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    /** Zone d'intervention (agent) ou de résidence (bénéficiaire), texte libre. */
    secteur: { type: String, trim: true, maxlength: 120 },
    // Consentement explicite de la bénéficiaire : tant qu'il est à false, son
    // agent ne voit que son identité et les alertes qu'elle a elle-même
    // envoyées — jamais son suivi (grossesse, méthode de PF, rappels).
    partageRelais: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Uniques seulement quand le champ existe : un compte peut n'avoir qu'un
// téléphone ou qu'un e-mail.
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } });
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });

export type UserDocument = HydratedDocumentFromSchema<typeof userSchema>;

export const User = model('User', userSchema);
