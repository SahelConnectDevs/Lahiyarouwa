import type { Request } from 'express';

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Lit ?page= et ?limit= (bornés), pour les listes de l'admin-web. */
export function readPagination(req: Request, defaultLimit = 20, maxLimit = 100): Pagination {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const rawLimit = Number.parseInt(String(req.query.limit ?? defaultLimit), 10) || defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, rawLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginated<T>(items: T[], total: number, { page, limit }: Pagination): Paginated<T> {
  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** Échappe une saisie utilisateur avant de l'utiliser dans une RegExp Mongo (recherche). */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
