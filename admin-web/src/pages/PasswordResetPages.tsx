import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { api, ApiError, errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const MIN_LENGTH = 6;

/** « Mot de passe oublié ? » : demande d'un lien de réinitialisation par e-mail. */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await api<{ message: string }>('/auth/password/forgot', {
        method: 'POST',
        body: { email: email.trim() },
      });
      setSent(result.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={onSubmit}>
        <img src="/logo.png" alt="Lahiyar Ouwa Da Yaro" width="72" height="72" />
        <h1>Mot de passe oublié</h1>
        {sent ? (
          <>
            <div className="notice notice-success" role="status">
              {sent}
            </div>
            <p className="muted small">
              Le lien est valable 30 minutes. Pensez à regarder dans les spams. Rien reçu ? Vérifiez l’adresse ou
              redemandez un lien dans 2 minutes.
            </p>
          </>
        ) : (
          <>
            <p className="muted">Saisissez l’e-mail de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
            {error && (
              <div className="notice notice-error" role="alert">
                {error}
              </div>
            )}
            <label className="field">
              <span>E-mail</span>
              <input
                type="email"
                autoComplete="username"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !email.trim()}>
              {submitting ? 'Envoi…' : 'Recevoir le lien'}
            </button>
          </>
        )}
        <div className="login-actions">
          <Link to="/" className="btn btn-ghost">
            ← Retour à la connexion
          </Link>
        </div>
      </form>
    </div>
  );
}

/** Lit le jeton dans le fragment de l'URL (#…) puis l'efface de la barre d'adresse et de l'historique. */
function takeTokenFromHash(): string {
  const token = window.location.hash.slice(1);
  if (token) window.history.replaceState(null, '', window.location.pathname);
  return token;
}

/** Page ouverte depuis le lien reçu par e-mail : choix du nouveau mot de passe. */
export function ResetPasswordPage() {
  const { status, logout } = useAuth();
  const navigate = useNavigate();
  const [token] = useState(takeTokenFromHash);
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setErrors({ confirm: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await api('/auth/password/reset', { method: 'POST', body: { token, newPassword } });
      // Toutes les sessions du compte sont invalidées : on repart de la connexion.
      if (status === 'authenticated') logout();
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={onSubmit}>
        <img src="/logo.png" alt="Lahiyar Ouwa Da Yaro" width="72" height="72" />
        <h1>Nouveau mot de passe</h1>
        {done ? (
          <>
            <div className="notice notice-success" role="status">
              Mot de passe changé. Vous pouvez maintenant vous connecter.
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={() => navigate('/', { replace: true })}>
              Se connecter
            </button>
          </>
        ) : !token ? (
          <>
            <div className="notice notice-error" role="alert">
              Ce lien est incomplet. Ouvrez le lien reçu par e-mail tel quel, ou demandez-en un nouveau.
            </div>
            <Link to="/mot-de-passe-oublie" className="btn btn-primary btn-block">
              Demander un nouveau lien
            </Link>
          </>
        ) : (
          <>
            <p className="muted">Choisissez le nouveau mot de passe de votre compte.</p>
            {error && (
              <div className="notice notice-error" role="alert">
                {error}{' '}
                {!errors.newPassword && <Link to="/mot-de-passe-oublie">Demander un nouveau lien</Link>}
              </div>
            )}
            <label className="field">
              <span>Nouveau mot de passe</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={MIN_LENGTH}
                autoFocus
                value={newPassword}
                onChange={(e) => setNew(e.target.value)}
              />
              <small className="hint">Au moins {MIN_LENGTH} caractères. Une phrase courte est plus sûre qu’un mot.</small>
              {errors.newPassword && <small className="field-error">{errors.newPassword}</small>}
            </label>
            <label className="field">
              <span>Confirmer le nouveau mot de passe</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {errors.confirm && <small className="field-error">{errors.confirm}</small>}
            </label>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting || newPassword.length < MIN_LENGTH || !confirm}
            >
              {submitting ? 'Enregistrement…' : 'Changer le mot de passe'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
