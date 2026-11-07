/**
 * Client HTTP unique de l'admin-web : toutes les pages passent par `api()`,
 * jamais par `fetch` directement.
 *
 * - Ajoute `Authorization: Bearer <token>` à chaque requête.
 * - Transforme les erreurs de l'API (`{ message, errors? }`, voir
 *   backend/src/middlewares/error.middleware.ts) en `ApiError`, avec la map
 *   `errors` champ → raison pour les 422.
 * - Sur un 401, appelle le callback enregistré par `AuthProvider` (déconnexion).
 *
 * En dev, Vite proxifie `/api` vers l'API locale ; en prod, nginx proxifie
 * `/api` vers l'API sur le même VPS : l'admin et l'API partagent donc la même
 * origine (pas de CORS, CSP `connect-src 'self'`).
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || '/api';
const TOKEN_KEY = 'lahiyarouwa-admin-token';

export class ApiError extends Error {
  readonly status: number;
  /** Erreurs par champ (HTTP 422 uniquement). */
  readonly errors?: Record<string, string>;

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Le token vit en sessionStorage : il disparaît à la fermeture de l'onglet,
// ce qui limite l'exposition d'une session admin sur un poste partagé.
function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

let token: string | null = readStoredToken();
let onUnauthorized: (() => void) | null = null;

export function getToken(): string | null {
  return token;
}

export function setToken(value: string | null): void {
  token = value;
  try {
    if (value) sessionStorage.setItem(TOKEN_KEY, value);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Stockage indisponible (navigation privée stricte) : la session reste en mémoire.
  }
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

export function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Serveur injoignable. Vérifiez votre connexion.');
  }

  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);
  if (response.ok) return data as T;

  const payload = (data ?? {}) as { message?: string; errors?: Record<string, string> };
  if (response.status === 401 && token) onUnauthorized?.();
  throw new ApiError(
    response.status,
    payload.message || `Erreur ${response.status}`,
    response.status === 422 ? payload.errors : undefined,
  );
}

/** Message lisible pour n'importe quelle erreur attrapée dans une page. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Une erreur inattendue est survenue.';
}
