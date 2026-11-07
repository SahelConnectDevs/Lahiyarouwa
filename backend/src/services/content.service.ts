import type { Model } from 'mongoose';

import { AppError } from '../utils/AppError';
import { paginated, type Paginated, type Pagination } from '../utils/pagination';

/**
 * CRUD générique des contenus gérés depuis l'admin-web (conseils, calendrier
 * vaccinal, calendrier des CPN). Évite trois services quasi identiques : la
 * logique propre à chaque contenu reste dans ses validators et dans les
 * services de lecture côté app (grossesse.service, vaccination.service...).
 */
export interface ContentService<T> {
  list(filter: Record<string, unknown>, pagination: Pagination): Promise<Paginated<T>>;
  get(id: string): Promise<T>;
  create(input: Record<string, unknown>): Promise<T>;
  update(id: string, input: Record<string, unknown>): Promise<T>;
  remove(id: string): Promise<void>;
}

export function makeContentService<T>(
  // Mongoose ne permet pas d'exprimer simplement "n'importe quel modèle" sans any.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>,
  options: { label: string; sort: Record<string, 1 | -1>; uniqueField?: string },
): ContentService<T> {
  const notFound = () => AppError.notFound(`${options.label} introuvable.`);

  /** Transforme une violation d'index unique Mongo en erreur 409 lisible. */
  function rethrowDuplicate(error: unknown): never {
    if (typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000) {
      const field = options.uniqueField ?? 'champ';
      throw AppError.validation('Données invalides.', { [field]: 'Cette valeur est déjà utilisée.' });
    }
    throw error;
  }

  return {
    async list(filter, pagination) {
      const [items, total] = await Promise.all([
        model.find(filter).sort(options.sort).skip(pagination.skip).limit(pagination.limit),
        model.countDocuments(filter),
      ]);
      return paginated(items as T[], total, pagination);
    },

    async get(id) {
      const doc = await model.findById(id);
      if (!doc) throw notFound();
      return doc as T;
    },

    async create(input) {
      try {
        return (await model.create(input)) as T;
      } catch (error) {
        rethrowDuplicate(error);
      }
    },

    async update(id, input) {
      const doc = await model.findById(id);
      if (!doc) throw notFound();
      doc.set(input);
      try {
        await doc.save();
      } catch (error) {
        rethrowDuplicate(error);
      }
      return doc as T;
    },

    async remove(id) {
      const result = await model.deleteOne({ _id: id });
      if (result.deletedCount === 0) throw notFound();
    },
  };
}
