import { useState, type FormEvent } from 'react';

import { api, ApiError, errorMessage } from '../api/client';
import type { Agent, CreatedAccount } from '../api/types';
import { useApi } from '../hooks/useApi';
import { ErrorBox, Modal } from './ui';

/**
 * Mot de passe provisoire affiché une seule fois (création de compte ou
 * réinitialisation), avec bouton de copie et consignes de transmission.
 */
export function TemporaryPassword({
  name,
  login,
  password,
}: {
  name: string;
  /** Identifiant de connexion à rappeler (e-mail ou téléphone). */
  login: string | null;
  password: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé) : le mot de passe reste lisible.
    }
  }

  return (
    <div className="temp-password">
      <p>
        Mot de passe provisoire de <strong>{name}</strong>
        {login && (
          <>
            {' '}
            (identifiant : <strong className="nowrap">{login}</strong>)
          </>
        )}{' '}
        :
      </p>
      <div className="temp-password-value">
        <code aria-label="Mot de passe provisoire">{password.replace(/(\d{4})(\d{4})/, '$1 $2')}</code>
        <button type="button" className="btn btn-small" onClick={copy}>
          {copied ? 'Copié ✓' : 'Copier'}
        </button>
      </div>
      <div className="notice notice-info">
        Notez-le maintenant : il <strong>ne sera plus affiché</strong>. Transmettez-le en personne ou par appel, jamais
        par un message visible par d’autres. Il devra être changé à la première connexion.
      </div>
    </div>
  );
}

/** Création d'un compte agent ou bénéficiaire, puis affichage du mot de passe provisoire. */
export function CreateUserModal({
  open,
  defaultRole,
  onClose,
  onCreated,
}: {
  open: boolean;
  defaultRole: 'user' | 'relais';
  onClose(): void;
  /** Appelé à la fermeture de la fenêtre après une création réussie. */
  onCreated(account: CreatedAccount): void;
}) {
  return (
    <Modal title={defaultRole === 'relais' ? 'Nouvel agent communautaire' : 'Nouveau compte'} open={open} onClose={onClose}>
      {/* Remonté à chaque ouverture : formulaire vierge. */}
      {open && <CreateUserForm defaultRole={defaultRole} onClose={onClose} onCreated={onCreated} />}
    </Modal>
  );
}

function CreateUserForm({
  defaultRole,
  onClose,
  onCreated,
}: {
  defaultRole: 'user' | 'relais';
  onClose(): void;
  onCreated(account: CreatedAccount): void;
}) {
  const agents = useApi((signal) => api<Agent[]>('/admin/relais', { signal }), 'agents');
  const [role, setRole] = useState<'user' | 'relais'>(defaultRole);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [secteur, setSecteur] = useState('');
  const [relais, setRelais] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<CreatedAccount | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const result = await api<CreatedAccount>('/admin/users', {
        method: 'POST',
        body: {
          name: name.trim(),
          phone: phone.trim(),
          role,
          ...(email.trim() && { email: email.trim() }),
          ...(secteur.trim() && { secteur: secteur.trim() }),
          ...(role === 'user' && relais && { relais }),
        },
      });
      setCreated(result);
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <>
        <div className="notice notice-success" role="status">
          Compte créé.
        </div>
        <TemporaryPassword
          name={created.user.name}
          login={created.user.role === 'relais' ? created.user.email : created.user.phone}
          password={created.temporaryPassword}
        />
        <div className="form-actions">
          <button type="button" className="btn btn-primary" onClick={() => onCreated(created)}>
            J’ai noté le mot de passe
          </button>
        </div>
      </>
    );
  }

  const activeAgents = (agents.data ?? []).filter((agent) => agent.isActive);

  return (
    <form onSubmit={onSubmit} noValidate>
      {error && <ErrorBox message={error} />}
      <div className="form-grid">
        <label className="field field-wide">
          <span>Type de compte</span>
          <select value={role} onChange={(e) => setRole(e.target.value as 'user' | 'relais')}>
            <option value="relais">Agent communautaire</option>
            <option value="user">Bénéficiaire (femme suivie)</option>
          </select>
        </label>
        <label className="field field-wide">
          <span>Nom complet *</span>
          <input value={name} required maxLength={100} autoFocus onChange={(e) => setName(e.target.value)} />
          {errors.name && <small className="field-error">{errors.name}</small>}
        </label>
        <label className="field">
          <span>Téléphone *</span>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            required
            placeholder="90 12 34 56"
            onChange={(e) => setPhone(e.target.value)}
          />
          <small className="hint">Sert d’identifiant de connexion dans l’application.</small>
          {errors.phone && <small className="field-error">{errors.phone}</small>}
        </label>
        <label className="field">
          <span>{role === 'relais' ? 'E-mail *' : 'E-mail (facultatif)'}</span>
          <input type="email" value={email} required={role === 'relais'} onChange={(e) => setEmail(e.target.value)} />
          {role === 'relais' && (
            <small className="hint">L’agent s’en sert pour se connecter ; son code de connexion y est envoyé.</small>
          )}
          {errors.email && <small className="field-error">{errors.email}</small>}
        </label>
        <label className="field field-wide">
          <span>{role === 'relais' ? 'Zone d’intervention' : 'Lieu de résidence'} (facultatif)</span>
          <input
            value={secteur}
            maxLength={120}
            placeholder="Ex : Niamey, commune V"
            onChange={(e) => setSecteur(e.target.value)}
          />
          {errors.secteur && <small className="field-error">{errors.secteur}</small>}
        </label>
        {role === 'user' && (
          <label className="field field-wide">
            <span>Agent communautaire (facultatif)</span>
            <select value={relais} onChange={(e) => setRelais(e.target.value)}>
              <option value="">Aucun pour l’instant</option>
              {activeAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                  {agent.secteur ? ` — ${agent.secteur}` : ''}
                </option>
              ))}
            </select>
            <small className="hint">
              L’agent ne verra son suivi de santé que si elle donne son accord dans l’application.
            </small>
            {errors.relais && <small className="field-error">{errors.relais}</small>}
          </label>
        )}
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onClose}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving || !name.trim() || !phone.trim() || (role === 'relais' && !email.trim())}
        >
          {saving ? 'Création…' : 'Créer le compte'}
        </button>
      </div>
    </form>
  );
}
