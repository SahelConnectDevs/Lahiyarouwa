import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';

import { api, errorMessage } from '../api/client';
import type { Alert, AlertStatus, Paginated } from '../api/types';
import { Badge, Empty, ErrorBox, Loading, Modal, PageHeader, Pagination } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { ALERT_STATUS_LABELS, formatDateTime } from '../utils/format';

const STATUS_TONES: Record<AlertStatus, 'red' | 'orange' | 'green'> = {
  nouvelle: 'red',
  en_cours: 'orange',
  traitee: 'green',
};

const TABS: { value: '' | AlertStatus; label: string }[] = [
  { value: 'nouvelle', label: 'Nouvelles' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'traitee', label: 'Traitées' },
  { value: '', label: 'Toutes' },
];

export function AlertsPage() {
  const [params, setParams] = useSearchParams();
  const statut = (params.get('statut') ?? '') as '' | AlertStatus;
  const page = Number(params.get('page') ?? '1') || 1;
  const [selected, setSelected] = useState<Alert | null>(null);

  const alerts = useApi(
    (signal) => api<Paginated<Alert>>('/admin/alertes', { query: { statut, page, limit: 20 }, signal }),
    `${statut}-${page}`,
  );

  function go(next: { statut?: string; page?: number }) {
    const p = new URLSearchParams();
    const s = next.statut ?? statut;
    if (s) p.set('statut', s);
    if (next.page && next.page > 1) p.set('page', String(next.page));
    setParams(p, { replace: true });
  }

  return (
    <>
      <PageHeader
        title="Alertes"
        subtitle="Signes inquiétants signalés par les femmes depuis l’application. Chaque alerte est aussi transmise à leur agent communautaire."
        actions={
          <button type="button" className="btn" onClick={alerts.reload} disabled={alerts.loading}>
            Actualiser
          </button>
        }
      />

      <div className="tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            type="button"
            role="tab"
            aria-selected={statut === tab.value}
            className={`tab${statut === tab.value ? ' active' : ''}`}
            onClick={() => go({ statut: tab.value, page: 1 })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {alerts.error && <ErrorBox message={alerts.error} onRetry={alerts.reload} />}
      {alerts.loading && !alerts.data && <Loading />}
      {alerts.data && (
        <div className="card card-flush">
          {alerts.data.items.length === 0 ? (
            <Empty>Aucune alerte dans cette catégorie.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="table table-clickable">
                <thead>
                  <tr>
                    <th>Signalée le</th>
                    <th>Femme</th>
                    <th>Signe</th>
                    <th>Agent</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.data.items.map((alert) => (
                    <tr key={alert.id} onClick={() => setSelected(alert)}>
                      <td className="nowrap">{formatDateTime(alert.createdAt)}</td>
                      <td>
                        {alert.user ? (
                          <>
                            <strong>{alert.user.name}</strong>
                            <div className="muted small">{alert.user.phone}</div>
                          </>
                        ) : (
                          <span className="muted">Compte supprimé</span>
                        )}
                      </td>
                      <td>
                        <strong>{alert.signe}</strong>
                        {alert.details && <div className="muted small clamp">{alert.details}</div>}
                      </td>
                      <td>{alert.relais?.name ?? <span className="muted">Aucun</span>}</td>
                      <td>
                        <Badge tone={STATUS_TONES[alert.statut]}>{ALERT_STATUS_LABELS[alert.statut]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            page={alerts.data.page}
            totalPages={alerts.data.totalPages}
            total={alerts.data.total}
            onChange={(p) => go({ page: p })}
          />
        </div>
      )}

      <Modal title="Suivi de l’alerte" open={selected !== null} onClose={() => setSelected(null)}>
        {selected && (
          <AlertForm
            key={selected.id}
            alert={selected}
            onDone={() => {
              setSelected(null);
              alerts.reload();
            }}
          />
        )}
      </Modal>
    </>
  );
}

/**
 * Mise à jour du statut et de la note d'une alerte. Partagé avec l'espace
 * agent, qui passe son propre endpoint et le lien vers sa fiche bénéficiaire.
 */
export function AlertForm({
  alert,
  onDone,
  endpoint = '/admin/alertes',
  userLink = (id: string) => `/utilisateurs/${id}`,
  showAgent = true,
}: {
  alert: Alert;
  onDone(): void;
  endpoint?: string;
  userLink?: (id: string) => string;
  showAgent?: boolean;
}) {
  const [statut, setStatut] = useState<AlertStatus>(alert.statut);
  const [note, setNote] = useState(alert.noteSuivi ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api(`${endpoint}/${alert.id}`, { method: 'PATCH', body: { statut, noteSuivi: note.trim() } });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <ul className="kv">
        <li>
          <span>Femme</span>
          <strong>
            {alert.user ? (
              <Link to={userLink(alert.user.id)}>
                {alert.user.name} · {alert.user.phone}
              </Link>
            ) : (
              'Compte supprimé'
            )}
          </strong>
        </li>
        <li>
          <span>Signe</span>
          <strong>{alert.signe}</strong>
        </li>
        <li>
          <span>Signalée le</span>
          <strong>{formatDateTime(alert.createdAt)}</strong>
        </li>
        {showAgent && (
          <li>
            <span>Agent</span>
            <strong>
              {alert.relais ? `${alert.relais.name} · ${alert.relais.phone ?? ''}` : 'Aucun agent assigné'}
            </strong>
          </li>
        )}
        {alert.traiteePar && (
          <li>
            <span>Traitée par</span>
            <strong>
              {alert.traiteePar.name} · {formatDateTime(alert.traiteeLe)}
            </strong>
          </li>
        )}
      </ul>
      {alert.details && <blockquote className="quote">{alert.details}</blockquote>}

      {error && <ErrorBox message={error} />}
      <label className="field">
        <span>Statut</span>
        <select value={statut} onChange={(e) => setStatut(e.target.value as AlertStatus)}>
          {(Object.keys(ALERT_STATUS_LABELS) as AlertStatus[]).map((s) => (
            <option key={s} value={s}>
              {ALERT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Note de suivi</span>
        <textarea
          rows={4}
          maxLength={2000}
          value={note}
          placeholder="Ex : appelée le 12/11, orientée vers le CSI de quartier."
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onDone}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
