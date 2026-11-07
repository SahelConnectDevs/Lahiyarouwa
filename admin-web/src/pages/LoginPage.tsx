import { useState, type FormEvent } from 'react';

import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={onSubmit} noValidate={false}>
        <img src="/logo.png" alt="Lahiyar Ouwa Da Yaro" width="72" height="72" />
        <h1>Administration</h1>
        <p className="muted">Connectez-vous avec votre compte administrateur.</p>

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
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
    </div>
  );
}
