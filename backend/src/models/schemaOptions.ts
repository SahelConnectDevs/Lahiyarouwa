import type { SchemaOptions } from 'mongoose';

/**
 * Options communes à tous les schémas : createdAt/updatedAt, et une
 * sérialisation JSON propre pour les clients (mobile et admin-web) —
 * `id` en chaîne au lieu de `_id`, pas de `__v`.
 */
export const baseSchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: false,
    versionKey: false,
    transform(_doc: unknown, ret: Record<string, unknown>) {
      ret.id = String(ret._id);
      delete ret._id;
      return ret;
    },
  },
} satisfies SchemaOptions;
