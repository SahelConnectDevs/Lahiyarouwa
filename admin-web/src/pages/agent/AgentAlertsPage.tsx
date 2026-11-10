import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { api } from '../../api/client';
import type { Alert, AlertStatus } from '../../api/types';
import { Badge, Empty, ErrorBox, Loading, Modal, PageHeader } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import { ALERT_STATUS_LABELS, formatDateTime, telHref } from '../../utils/format';
import { AlertForm } from '../AlertsPage';

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

/** Alertes des bénéficiaires de l'agent. */
export function AgentAlertsPage() {
  const [params, setParams] = useSearchParams();
  const statut = (params.get('statut') ?? 'nouvelle') as '' | AlertStatus;
  const [selected, setSelected] = useState<Alert | null>(null);
  const alerts = useApi(
    (signal) => api<Alert[]>('/relais/alertes', { query: { statut }, signal }),
    `agent-alerts-${statut}`,
  );

  return (
    <>
      <PageHeader
        title="Mes alertes"
        subtitle="Signes inquiétants signalés par vos bénéficiaires. Contactez-les au plus vite."
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
            onClick={() => setParams({ statut: tab.value }, { replace: true })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {alerts.error && <ErrorBox message={alerts.error} onRetry={alerts.reload} />}
      {alerts.loading && !alerts.data && <Loading />}
      {alerts.data &&
        (alerts.data.length === 0 ? (
          <div className="card">
            <Empty>Aucune alerte dans cette catégorie.</Empty>
          </div>
        ) : (
          <ul className="item-list card">
            {alerts.data.map((a) => (
              <li key={a.id} className="item">
                <div className="item-main">
                  <strong>{a.signe}</strong>
                  {a.user ? (
                    <Link to={`/beneficiaires/${a.user.id}`} className="strong-link">
                      {a.user.name}
                    </Link>
                  ) : (
                    <span className="muted">Compte supprimé</span>
                  )}
                  {a.details && <span className="small">{a.details}</span>}
                  <span className="muted small">
                    {formatDateTime(a.createdAt)}{' '}
                    <Badge tone={STATUS_TONES[a.statut]}>{ALERT_STATUS_LABELS[a.statut]}</Badge>
                  </span>
                </div>
                <div className="item-actions">
                  {a.user?.phone && (
                    <a className="btn btn-small" href={telHref(a.user.phone)}>
                      Appeler
                    </a>
                  )}
                  <button type="button" className="btn btn-small btn-primary" onClick={() => setSelected(a)}>
                    {a.statut === 'traitee' ? 'Voir' : 'Traiter'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      <Modal title="Suivi de l’alerte" open={selected !== null} onClose={() => setSelected(null)}>
        {selected && (
          <AlertForm
            key={selected.id}
            alert={selected}
            endpoint="/relais/alertes"
            userLink={(userId) => `/beneficiaires/${userId}`}
            showAgent={false}
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
