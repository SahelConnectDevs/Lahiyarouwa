import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false : jamais renvoyé par une requête User.find() par défaut,
    // il faut explicitement .select('+passwordHash') (voir auth.service.ts).
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    // 'relais' correspond à la feature lib/features/relais côté mobile
    // (agent de santé communautaire) ; 'admin' est pour le futur admin-web,
    // qui s'authentifiera contre cette même collection.
    role: { type: String, enum: ['user', 'relais', 'admin'], default: 'user' },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

export const User = model('User', userSchema);
