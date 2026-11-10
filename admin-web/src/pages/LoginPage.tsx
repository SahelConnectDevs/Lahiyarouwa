import { useEffect, useState, type FormEvent } from 'react';

import { ApiError, errorMessage } from '../api/client';
import type { LoginChallenge } from '../api/types';
import { useAuth } from '../auth/AuthContext';

/**
 * Connexion en deux étapes : e-mail + mot de passe, puis code à 6 chiffres
 * envoyé à l'e-mail de connexion (double authentification des admins).
 */
export function LoginPage() {
  const { login, verifyCode, resendCode } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Compte à rebours avant de pouvoir redemander un code.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  function backToPassword(message: string | null) {
    setChallenge(null);
    setCode('');
    setCodeError(null);
    setInfo(null);
    setPassword('');
    setError(message);
  }

  async function onSubmitPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(identifier.trim(), password);
      // null : agent connecté directement, le routeur affiche son espace.
      if (!result) return;
      setChallenge(result);
      setResendIn(result.resendIn);
      setCode('');
      setInfo(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitCode(event: FormEvent) {
    event.preventDefault();
    if (!challenge) return;
    setError(null);
    setCodeError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await verifyCode(challenge.challengeToken, code);
      // Connecté : le routeur affiche l'administration.
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError && err.status === 401) return backToPassword(err.message);
      if (err instanceof ApiError && err.errors?.code) {
        setCodeError(err.errors.code);
        setCode('');
        return;
      }
      setError(errorMessage(err));
    }
  }

  async function onResend() {
    if (!challenge) return;
    setError(null);
    setCodeError(null);
    setInfo(null);
    try {
      const result = await resendCode(challenge.challengeToken);
      setResendIn(result.resendIn);
      setCode('');
      setInfo(`Nouveau code envoyé à ${result.email}.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return backToPassword(err.message);
      setError(errorMessage(err));
    }
  }

  return (
    <div className="login">
      {challenge ? (
        <form className="login-card" onSubmit={onSubmitCode}>
          <img src="/logo.png" alt="Lahiyar Ouwa Da Yaro" width="72" height="72" />
          <h1>Code de vérification</h1>
          <p className="muted">
            Un code à 6 chiffres a été envoyé à <strong>{challenge.email}</strong>. Il est valable
            10 minutes.
          </p>

          {error && (
            <div className="notice notice-error" role="alert">
              {error}
            </div>
          )}
          {info && (
            <div className="notice notice-success" role="status">
              {info}
            </div>
          )}

          <label className="field">
            <span>Code reçu par e-mail</span>
            <input
              className="code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              value={code}
              aria-invalid={codeError ? true : undefined}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            {codeError && <span className="field-error">{codeError}</span>}
          </label>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting || code.length !== 6}
          >
            {submitting ? 'Vérification…' : 'Valider'}
          </button>

          <div className="login-actions">
            <button type="button" className="btn btn-ghost" onClick={() => backToPassword(null)}>
              ← Retour
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onResend}
              disabled={resendIn > 0 || submitting}
            >
              {resendIn > 0 ? `Renvoyer le code (${resendIn} s)` : 'Renvoyer le code'}
            </button>
          </div>
        </form>
      ) : (
        <form className="login-card" onSubmit={onSubmitPassword}>
          <img src="/logo.png" alt="Lahiyar Ouwa Da Yaro" width="72" height="72" />
          <h1>Connexion</h1>
          <p className="muted">Espace des administrateurs et des agents communautaires.</p>

          {error && (
            <div className="notice notice-error" role="alert">
              {error}
            </div>
          )}

          <label className="field">
            <span>E-mail ou numéro de téléphone</span>
            <input
              type="text"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              placeholder="nom@exemple.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <small className="hint">Un code de vérification vous sera envoyé par e-mail.</small>
          </label>
          <label className="field">
            <span>Mot de passe</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      )}
    </div>
  );
}
