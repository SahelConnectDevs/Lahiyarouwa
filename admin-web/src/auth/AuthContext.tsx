import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, ApiError, getToken, setToken, setUnauthorizedHandler } from '../api/client';
import type { AuthResult, LoginChallenge, PublicUser, ResendResult } from '../api/types';

type Status = 'unknown' | 'unauthenticated' | 'authenticated';

interface AuthState {
  status: Status;
  user: PublicUser | null;
  /**
   * Première étape : e-mail + mot de passe. Renvoie la connexion en attente
   * du code envoyé par e-mail (double authentification des admins).
   */
  login(email: string, password: string): Promise<LoginChallenge>;
  /** Deuxième étape : code à 6 chiffres reçu par e-mail. */
  verifyCode(challengeToken: string, code: string): Promise<void>;
  resendCode(challengeToken: string): Promise<ResendResult>;
  /** Remplace token et profil (après un changement de mot de passe). */
  updateSession(result: AuthResult): void;
  logout(): void;
}

const AuthContext = createContext<AuthState | null>(null);

const NOT_ADMIN = "Ce compte n'a pas accès à l'administration.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<Status>(getToken() ? 'unknown' : 'unauthenticated');

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Un 401 sur n'importe quelle requête (token expiré, compte désactivé,
  // mot de passe changé) renvoie à l'écran de connexion.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Session existante (onglet rechargé) : on revalide le token auprès de l'API.
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    api<PublicUser>('/auth/me')
      .then((me) => {
        if (cancelled) return;
        if (me.role !== 'admin') return logout();
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api<AuthResult | LoginChallenge>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    // L'API connecte directement les comptes sans double authentification,
    // c.-à-d. les non-admins : ils n'ont pas accès à l'administration.
    if (!('mfaRequired' in result)) throw new ApiError(403, NOT_ADMIN);
    return result;
  }, []);

  const verifyCode = useCallback(async (challengeToken: string, code: string) => {
    const result = await api<AuthResult>('/auth/login/verify', {
      method: 'POST',
      body: { challengeToken, code },
    });
    if (result.user.role !== 'admin') throw new ApiError(403, NOT_ADMIN);
    setToken(result.token);
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const resendCode = useCallback(
    (challengeToken: string) =>
      api<ResendResult>('/auth/login/resend', { method: 'POST', body: { challengeToken } }),
    [],
  );

  const updateSession = useCallback((result: AuthResult) => {
    setToken(result.token);
    setUser(result.user);
  }, []);

  const value = useMemo(
    () => ({ status, user, login, verifyCode, resendCode, updateSession, logout }),
    [status, user, login, verifyCode, resendCode, updateSession, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Le hook vit avec son provider : c'est le seul accès prévu au contexte.
// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans <AuthProvider>.');
  return context;
}
