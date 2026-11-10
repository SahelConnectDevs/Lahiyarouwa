import { Link } from 'react-router';

import { api } from '../../api/client';
import type { AgentDashboard } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Badge, Empty, ErrorBox, Loading, PageHeader, StatCard } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import { formatDate, REMINDER_LABELS, telHref } from '../../utils/format';

/** Accueil de l'agent : chiffres clés et femmes à contacter cette semaine. */
export function AgentHomePage() {
  const { user } = useAuth();
  const dashboard = useApi((signal) => api<AgentDashboard>('/relais/tableau-de-bord', { signal }), 'agent-home');
  const d = dashboard.data;

  return (
    <>
      <PageHeader
        title={`Bonjour ${user?.name.split(' ')[0] ?? ''}`}
        subtitle="Vos bénéficiaires, vos alertes et les rendez-vous de la semaine."
        actions={
          <button type="button" className="btn" onClick={dashboard.reload} disabled={dashboard.loading}>
            Actualiser
          </button>
        }
      />
      {dashboard.error && <ErrorBox message={dashboard.error} onRetry={dashboard.reload} />}
      {dashboard.loading && !d && <Loading />}
      {d && (
        <>
          {d.alertesNouvelles > 0 && (
            <Link to="/alertes?statut=nouvelle" className="callout callout-red agent-callout">
              <strong>
                {d.alertesNouvelles} nouvelle{d.alertesNouvelles > 1 ? 's' : ''} alerte
                {d.alertesNouvelles > 1 ? 's' : ''} à traiter
              </strong>
              <span>Contactez la femme au plus vite →</span>
            </Link>
          )}

          <div className="stat-grid">
            <StatCard label="Bénéficiaires" value={d.beneficiaires} tone="pink" />
            <StatCard
              label="Partage du suivi"
              value={d.consentantes}
              hint={`sur ${d.beneficiaires} ont donné leur accord`}
              tone="green"
            />
            <StatCard label="Alertes nouvelles" value={d.alertesNouvelles} tone="orange" />
            <StatCard label="Alertes en cours" value={d.alertesEnCours} tone="blue" />
          </div>

          <section className="card">
            <h2 className="section-title">À faire cette semaine</h2>
            <p className="muted small">
              Rendez-vous des 7 prochains jours et rendez-vous manqués, pour les femmes qui ont accepté de partager leur
              suivi avec vous.
            </p>
            {d.rappels.length === 0 ? (
              <Empty>Rien de prévu cette semaine.</Empty>
            ) : (
              <ul className="item-list">
                {d.rappels.map((r) => (
                  <li key={`${r.beneficiaire.id}-${r.type}-${r.ref}`} className="item">
                    <div className="item-main">
                      <Link to={`/beneficiaires/${r.beneficiaire.id}`} className="strong-link">
                        {r.beneficiaire.name}
                      </Link>
                      <span>{r.titre}</span>
                      <span className="muted small">
                        {REMINDER_LABELS[r.type]} · {formatDate(r.date)}{' '}
                        {r.enRetard && <Badge tone="red">En retard</Badge>}
                      </span>
                    </div>
                    {r.beneficiaire.phone && (
                      <a className="btn btn-small" href={telHref(r.beneficiaire.phone)}>
                        Appeler
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
