import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api, ApiError, buildUrl, setToken, setUnauthorizedHandler } from './client';

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => setToken(null));
afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(null);
});

describe('buildUrl', () => {
  it('ignore les paramètres vides', () => {
    expect(buildUrl('/admin/users', { search: '', role: 'relais', page: 2, x: undefined, y: null })).toBe(
      '/api/admin/users?role=relais&page=2',
    );
  });
});

describe('api', () => {
  it('envoie le token et le corps JSON', async () => {
    const fetchMock = mockFetch(200, { ok: true });
    setToken('abc');
    await api('/admin/users/1', { method: 'PATCH', body: { isActive: false } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/users/1');
    expect(init.method).toBe('PATCH');
    expect(init.headers.Authorization).toBe('Bearer abc');
    expect(init.body).toBe('{"isActive":false}');
  });

  it('renvoie undefined sur un 204', async () => {
    mockFetch(204);
    await expect(api('/admin/users/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('transforme un 422 en ApiError avec les erreurs par champ', async () => {
    mockFetch(422, { message: 'Données invalides.', errors: { code: 'Cette valeur est déjà utilisée.' } });
    const error = await api('/admin/vaccins', { method: 'POST', body: {} }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
    expect((error as ApiError).errors).toEqual({ code: 'Cette valeur est déjà utilisée.' });
  });

  it('déclenche la déconnexion sur un 401 quand une session existe', async () => {
    mockFetch(401, { message: 'Session expirée.' });
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    setToken('expired');
    await expect(api('/admin/stats')).rejects.toThrow('Session expirée.');
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("ne déclenche pas la déconnexion sur un échec de connexion (pas encore de session)", async () => {
    mockFetch(401, { message: 'Identifiants invalides.' });
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    await expect(api('/auth/login', { method: 'POST', body: {} })).rejects.toThrow('Identifiants invalides.');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('signale un serveur injoignable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api('/admin/stats')).rejects.toMatchObject({ status: 0 });
  });
});
