import { Schema, model } from 'mongoose';

/**
 * Demande « mot de passe oublié » : le lien envoyé par e-mail porte un jeton
 * aléatoire dont seule l'empreinte HMAC est stockée. Usage unique (supprimée
 * à l'utilisation) et purgée automatiquement à expiration (index TTL).
 */
const passwordResetSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true },
);

export const PasswordReset = model('PasswordReset', passwordResetSchema);
