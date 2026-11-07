import { Link } from 'react-router';

import { api } from '../api/client';
import type { Stats } from '../api/types';
import { ErrorBox, Loading, PageHeader, StatCard } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { formatNumber } from '../utils/format';

export function DashboardPage() {
  const { data, error, loading, reload } = useApi((signal) => api<Stats>('/admin/stats', { signal }), 'stats');

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d’ensemble de l’activité de l’application."
        actions={
          <button type="button" className="btn" onClick={reload} disabled={loading}>
            Actualiser
          </button>
        }
      />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && <DashboardContent stats={data} />}
    </>
  );
}

function DashboardContent({ stats }: { stats: Stats }) {
  const alertesNouvelles = stats.alertes.nouvelle ?? 0;
  const alertesEnCours = stats.alertes.en_cours ?? 0;
  const methodes = Object.entries(stats.planification.parMethode).sort((a, b) => b[1] - a[1]);
  const maxMethode = Math.max(1, ...methodes.map(([, n]) => n));

  return (
    <div className="stack">
      {(alertesNouvelles > 0 || stats.beneficiairesSansAgent > 0) && (
        <div className="callouts">
          {alertesNouvelles > 0 && (
            <Link to="/alertes?statut=nouvelle" className="callout callout-red">
              <strong>{alertesNouvelles}</strong> alerte{alertesNouvelles > 1 ? 's' : ''} à traiter →
            </Link>
          )}
          {stats.beneficiairesSansAgent > 0 && (
            <Link to="/utilisateurs?role=user&sansAgent=true" className="callout callout-orange">
              <strong>{stats.beneficiairesSansAgent}</strong> utilisatrice{stats.beneficiairesSansAgent > 1 ? 's' : ''} sans agent
              communautaire →
            </Link>
          )}
        </div>
      )}

      <section>
        <h2 className="section-title">Comptes</h2>
        <div className="stat-grid">
          <StatCard label="Utilisatrices" value={formatNumber(stats.utilisateurs.parRole.user)} tone="pink" />
          <StatCard label="Agents communautaires" value={formatNumber(stats.utilisateurs.parRole.relais)} tone="green" />
          <StatCard label="Nouvelles inscriptions" value={formatNumber(stats.utilisateurs.nouveaux30j)} hint="30 derniers jours" />
          <StatCard label="Comptes actifs" value={formatNumber(stats.utilisateurs.actifs30j)} hint="connectés ces 30 jours" />
        </div>
      </section>

      <section>
        <h2 className="section-title">Suivi de santé</h2>
        <div className="stat-grid">
          <StatCard label="Grossesses en cours" value={formatNumber(stats.grossessesEnCours)} tone="pink" />
          <StatCard label="Enfants suivis" value={formatNumber(stats.enfants)} tone="blue" />
          <StatCard label="Vaccinations enregistrées" value={formatNumber(stats.vaccinations)} />
          <StatCard label="Séances de contractions" value={formatNumber(stats.seancesContractions)} />
        </div>
      </section>

      <div className="two-cols">
        <section className="card">
          <h2 className="section-title">Alertes</h2>
          <ul className="kv">
            <li>
              <span>Nouvelles</span>
              <strong className="text-red">{formatNumber(alertesNouvelles)}</strong>
            </li>
            <li>
              <span>En cours</span>
              <strong className="text-orange">{formatNumber(alertesEnCours)}</strong>
            </li>
            <li>
              <span>Traitées</span>
              <strong className="text-green">{formatNumber(stats.alertes.traitee)}</strong>
            </li>
          </ul>
          <Link to="/alertes" className="btn btn-small">
            Voir les alertes
          </Link>
        </section>

        <section className="card">
          <h2 className="section-title">Planification familiale</h2>
          <p className="muted">
            {formatNumber(stats.planification.methodesEnCours)} femme{stats.planification.methodesEnCours > 1 ? 's' : ''} suivent
            actuellement une méthode.
          </p>
          {methodes.length === 0 ? (
            <p className="muted">Aucune méthode en cours pour l’instant.</p>
          ) : (
            <ul className="bars">
              {methodes.map(([nom, count]) => (
                <li key={nom}>
                  <span className="bar-label">{nom}</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${(count / maxMethode) * 100}%` }} />
                  </span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
