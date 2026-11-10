import { Schema, model } from 'mongoose';

/**
 * Deuxième étape d'une connexion à double authentification : créée quand le
 * mot de passe est correct, elle attend le code envoyé par e-mail. Le client
 * ne garde qu'un jeton opaque ; seuls des empreintes HMAC (jeton et code)
 * sont stockées. Supprimée dès la connexion réussie, après trop d'essais, ou
 * automatiquement par MongoDB à expiration (index TTL sur expiresAt).
 */
const loginChallengeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    codeHash: { type: String, required: true },
    /** Codes faux saisis, tous envois confondus (plafonné, voir auth.service). */
    attempts: { type: Number, default: 0 },
    /** Nombre de codes envoyés pour cette connexion (premier envoi compris). */
    sends: { type: Number, default: 1 },
    lastSentAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true },
);

export const LoginChallenge = model('LoginChallenge', loginChallengeSchema);
