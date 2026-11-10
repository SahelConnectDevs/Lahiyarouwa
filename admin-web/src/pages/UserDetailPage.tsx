import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { api, ApiError, errorMessage } from '../api/client';
import type { AdminUser, AdminUserDetail, Agent, Paginated, Role } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { TemporaryPassword } from '../components/accounts';
import { Badge, Empty, ErrorBox, Loading, Modal, PageHeader } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { formatDate, formatDateTime, ROLE_LABELS } from '../utils/format';

export function UserDetailPage() {
  const { id = '' } = useParams();
  const user = useApi((signal) => api<AdminUserDetail>(`/admin/users/${id}`, { signal }), id);

  return (
    <>
      <p className="breadcrumb">
        <Link to="/utilisateurs">← Utilisatrices et comptes</Link>
      </p>
      {user.error && <ErrorBox message={user.error} onRetry={user.reload} />}
      {user.loading && !user.data && <Loading />}
      {user.data && <UserDetail key={user.data.id} user={user.data} onSaved={user.reload} />}
    </>
  );
}

function UserDetail({ user, onSaved }: { user: AdminUserDetail; onSaved(): void }) {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const isSelf = me?.id === user.id;
  const agents = useApi((signal) => api<Agent[]>('/admin/relais', { signal }), 'agents');

  const [role, setRole] = useState<Role>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [relais, setRelais] = useState(user.relais ?? '');
  const [secteur, setSecteur] = useState(user.secteur ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const dirty =
    role !== user.role ||
    isActive !== user.isActive ||
    relais !== (user.relais ?? '') ||
    secteur !== (user.secteur ?? '') ||
    email.trim() !== (user.email ?? '');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setFieldErrors({});
    const body: Record<string, unknown> = {};
    if (role !== user.role) body.role = role;
    if (isActive !== user.isActive) body.isActive = isActive;
    if (relais !== (user.relais ?? '')) body.relais = relais || null;
    if (secteur !== (user.secteur ?? '')) body.secteur = secteur.trim() || null;
    if (email.trim() !== (user.email ?? '')) body.email = email.trim() || null;
    try {
      await api<AdminUser>(`/admin/users/${user.id}`, { method: 'PATCH', body });
      setMessage({ tone: 'success', text: 'Modifications enregistrées.' });
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.errors) setFieldErrors(err.errors);
      setMessage({ tone: 'error', text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  const activeAgents = (agents.data ?? []).filter((agent) => agent.isActive && agent.id !== user.id);

  return (
    <>
      <PageHeader
        title={user.name}
        subtitle={`${ROLE_LABELS[user.role]} · inscrit le ${formatDate(user.createdAt)}`}
        actions={
          !isSelf && (
            <>
              <button type="button" className="btn" onClick={() => setResetOpen(true)}>
                Réinitialiser le mot de passe
              </button>
              <button type="button" className="btn btn-danger" onClick={() => setDeleteOpen(true)}>
                Supprimer le compte
              </button>
            </>
          )
        }
      />

      <div className="two-cols">
        <section className="card">
          <h2 className="section-title">Profil</h2>
          <ul className="kv">
            <li>
              <span>Téléphone</span>
              <strong>{user.phone ?? '—'}</strong>
            </li>
            <li>
              <span>E-mail</span>
              <strong>{user.email ?? '—'}</strong>
            </li>
            <li>
              <span>Date de naissance</span>
              <strong>{formatDate(user.birthDate)}</strong>
            </li>
            <li>
              <span>Dernière connexion</span>
              <strong>{formatDateTime(user.lastLoginAt)}</strong>
            </li>
            <li>
              <span>Mot de passe</span>
              <strong>
                {user.mustChangePassword ? (
                  <Badge tone="orange">Provisoire, à changer</Badge>
                ) : (
                  <Badge tone="green">Personnel</Badge>
                )}
              </strong>
            </li>
            <li>
              <span>Partage avec l’agent</span>
              <strong>{user.partageRelais ? <Badge tone="green">Autorisé</Badge> : <Badge>Non autorisé</Badge>}</strong>
            </li>
          </ul>

          <h2 className="section-title">Données dans l’app</h2>
          <ul className="kv">
            <li>
              <span>Grossesse en cours</span>
              <strong>{user.resume.grossesseEnCours ? 'Oui' : 'Non'}</strong>
            </li>
            <li>
              <span>Enfants</span>
              <strong>{user.resume.enfants}</strong>
            </li>
            <li>
              <span>Vaccinations enregistrées</span>
              <strong>{user.resume.vaccinations}</strong>
            </li>
            <li>
              <span>Alertes signalées</span>
              <strong>{user.resume.alertes}</strong>
            </li>
          </ul>
          <p className="muted small">
            Le détail du suivi de santé n’est pas affiché ici : seul l’agent communautaire de l’utilisatrice y a accès, et
            uniquement si elle a autorisé le partage.
          </p>
        </section>

        <form className="card" onSubmit={onSubmit}>
          <h2 className="section-title">Gestion du compte</h2>
          {message && (
            <div className={`notice notice-${message.tone}`} role={message.tone === 'error' ? 'alert' : 'status'}>
              {message.text}
            </div>
          )}

          <label className="field">
            <span>Rôle</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={isSelf}>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            {isSelf && <small className="hint">Vous ne pouvez pas modifier votre propre rôle.</small>}
            {user.role === 'relais' && role !== 'relais' && (
              <small className="hint hint-warning">
                Ses bénéficiaires et ses alertes ouvertes n’auront plus d’agent assigné.
              </small>
            )}
            {fieldErrors.role && <small className="field-error">{fieldErrors.role}</small>}
          </label>

          {role === 'user' && (
            <label className="field">
              <span>Agent communautaire</span>
              <select value={relais} onChange={(e) => setRelais(e.target.value)}>
                <option value="">Aucun agent assigné</option>
                {activeAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                    {agent.secteur ? ` — ${agent.secteur}` : ''} ({agent.beneficiaires} suivie
                    {agent.beneficiaires > 1 ? 's' : ''})
                  </option>
                ))}
              </select>
              <small className="hint">Ses alertes ouvertes suivront la bénéficiaire chez le nouvel agent.</small>
              {fieldErrors.relais && <small className="field-error">{fieldErrors.relais}</small>}
            </label>
          )}

          <label className="field">
            <span>E-mail{role === 'relais' || role === 'admin' ? ' *' : ''}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {(role === 'relais' || role === 'admin') && (
              <small className="hint">Identifiant de connexion à l’espace web : le code de connexion y est envoyé.</small>
            )}
            {role === 'relais' && !user.email && (
              <small className="hint hint-warning">
                Sans e-mail, cet agent se connecte avec son téléphone et sans code. Ajoutez son e-mail.
              </small>
            )}
            {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
          </label>

          <label className="field">
            <span>Secteur / zone</span>
            <input
              value={secteur}
              maxLength={120}
              placeholder="Ex : Niamey, commune V"
              onChange={(e) => setSecteur(e.target.value)}
            />
            {fieldErrors.secteur && <small className="field-error">{fieldErrors.secteur}</small>}
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={isActive}
              disabled={isSelf}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>
              Compte actif
              <small className="hint">Désactiver un compte le déconnecte immédiatement de tous ses appareils.</small>
            </span>
          </label>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={!dirty || saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      {user.role === 'relais' && <Beneficiaries agentId={user.id} />}

      <ResetPasswordModal
        open={resetOpen}
        user={user}
        onClose={() => {
          setResetOpen(false);
          onSaved();
        }}
      />

      <DeleteUserModal
        open={deleteOpen}
        user={user}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => navigate('/utilisateurs', { replace: true })}
      />
    </>
  );
}

function Beneficiaries({ agentId }: { agentId: string }) {
  const list = useApi(
    (signal) =>
      api<Paginated<AdminUser>>('/admin/users', { query: { relais: agentId, limit: 100 }, signal }),
    agentId,
  );
  return (
    <section className="card">
      <h2 className="section-title">Bénéficiaires suivies</h2>
      {list.error && <ErrorBox message={list.error} onRetry={list.reload} />}
      {list.loading && !list.data && <Loading />}
      {list.data &&
        (list.data.items.length === 0 ? (
          <Empty>Aucune bénéficiaire n’est encore assignée à cet agent.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Téléphone</th>
                  <th>Partage du suivi</th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link to={`/utilisateurs/${b.id}`} className="strong-link">
                        {b.name}
                      </Link>
                    </td>
                    <td>{b.phone ?? '—'}</td>
                    <td>{b.partageRelais ? <Badge tone="green">Autorisé</Badge> : <Badge>Non</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}

function ResetPasswordModal({ open, user, onClose }: { open: boolean; user: AdminUserDetail; onClose(): void }) {
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  async function onReset() {
    setResetting(true);
    setError(null);
    try {
      const result = await api<{ temporaryPassword: string }>(`/admin/users/${user.id}/reset-password`, {
        method: 'POST',
      });
      setPassword(result.temporaryPassword);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setResetting(false);
    }
  }

  function close() {
    setPassword(null);
    setError(null);
    onClose();
  }

  return (
    <Modal title="Réinitialiser le mot de passe" open={open} onClose={close}>
      {password ? (
        <>
          <TemporaryPassword
            name={user.name}
            login={user.role === 'user' ? (user.phone ?? user.email) : (user.email ?? user.phone)}
            password={password}
          />
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={close}>
              J’ai noté le mot de passe
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            Un <strong>mot de passe provisoire</strong> va remplacer celui de <strong>{user.name}</strong>. Son ancien
            mot de passe ne marchera plus et tous ses appareils seront déconnectés. Il devra choisir un nouveau mot de
            passe à sa prochaine connexion.
          </p>
          <p className="muted small">
            À faire uniquement à la demande de la personne, après avoir vérifié son identité (par exemple en la
            rappelant à son numéro).
          </p>
          {error && <ErrorBox message={error} />}
          <div className="form-actions">
            <button type="button" className="btn" onClick={close}>
              Annuler
            </button>
            <button type="button" className="btn btn-primary" disabled={resetting} onClick={onReset}>
              {resetting ? 'Réinitialisation…' : 'Générer un mot de passe provisoire'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function DeleteUserModal({
  open,
  user,
  onClose,
  onDeleted,
}: {
  open: boolean;
  user: AdminUserDetail;
  onClose(): void;
  onDeleted(): void;
}) {
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    setDeleting(true);
    setError(null);
    try {
      await api(`/admin/users/${user.id}`, { method: 'DELETE' });
      onDeleted();
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(false);
    }
  }

  return (
    <Modal
      title="Supprimer ce compte ?"
      open={open}
      onClose={() => {
        setConfirm('');
        setError(null);
        onClose();
      }}
    >
      <p>
        Le compte de <strong>{user.name}</strong> et <strong>toutes ses données</strong> (grossesse, enfants,
        vaccinations, contractions, planification familiale, alertes, notes de suivi) seront supprimés définitivement.
        Cette action est irréversible.
      </p>
      {error && <ErrorBox message={error} />}
      <label className="field">
        <span>
          Tapez <strong>SUPPRIMER</strong> pour confirmer
        </span>
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
      </label>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onClose}>
          Annuler
        </button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={confirm !== 'SUPPRIMER' || deleting}
          onClick={onDelete}
        >
          {deleting ? 'Suppression…' : 'Supprimer définitivement'}
        </button>
      </div>
    </Modal>
  );
}
