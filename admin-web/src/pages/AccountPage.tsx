import { useState, type FormEvent } from 'react';

import { api, ApiError, errorMessage } from '../api/client';
import type { AuthResult } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui';

const MIN_LENGTH = 6;

/** « Mon compte » : changement du mot de passe de l'admin connecté. */
export function AccountPage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Mon compte" subtitle={user ? `${user.name} · ${user.email ?? ''}` : undefined} />
      <section className="card narrow">
        <h2 className="section-title">Changer mon mot de passe</h2>
        <ChangePasswordForm />
      </section>
    </>
  );
}

/**
 * Écran imposé après une connexion avec un mot de passe provisoire (donné
 * par un autre admin) : rien d'autre n'est accessible avant le changement.
 */
export function ForcedPasswordChange() {
  const { user, logout } = useAuth();
  return (
    <div className="login">
      <div className="login-card">
        <img src="/logo.png" alt="Lahiyar Ouwa Da Yaro" width="72" height="72" />
        <h1>Nouveau mot de passe</h1>
        <p className="muted">
          Bonjour {user?.name}, vous vous êtes connecté avec un mot de passe provisoire. Choisissez votre mot de passe
          pour continuer.
        </p>
        <ChangePasswordForm currentLabel="Mot de passe provisoire" />
        <div className="login-actions">
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordForm({ currentLabel = 'Mot de passe actuel' }: { currentLabel?: string }) {
  const { user, updateSession } = useAuth();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (newPassword !== confirm) {
      setErrors({ confirm: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const result = await api<AuthResult>('/auth/me/password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      // Le nouveau token remplace l'ancien, invalidé avec les autres sessions.
      updateSession(result);
      setCurrent('');
      setNew('');
      setConfirm('');
      setMessage({ tone: 'success', text: 'Mot de passe changé. Vos autres sessions ont été déconnectées.' });
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
      setMessage({ tone: 'error', text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="password-form">
      {/* Identifiant du compte (invisible) : sans lui, le gestionnaire de mots
          de passe du navigateur enregistre le nouveau mot de passe sous le
          dernier identifiant saisi sur le site, par ex. celui d'un autre compte. */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={user?.email ?? user?.phone ?? ''}
        readOnly
        hidden
      />
      {message && (
        <div className={`notice notice-${message.tone}`} role={message.tone === 'error' ? 'alert' : 'status'}>
          {message.text}
        </div>
      )}
      <label className="field">
        <span>{currentLabel}</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrent(e.target.value)}
        />
        {errors.currentPassword && <small className="field-error">{errors.currentPassword}</small>}
      </label>
      <label className="field">
        <span>Nouveau mot de passe</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_LENGTH}
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
        disabled={saving || !currentPassword || newPassword.length < MIN_LENGTH || !confirm}
      >
        {saving ? 'Enregistrement…' : 'Changer le mot de passe'}
      </button>
    </form>
  );
}
