import { useState } from 'react';
import { Link } from 'react-router';

import { api, errorMessage } from '../api/client';
import type { AdminUser, Agent, Paginated } from '../api/types';
import { Badge, Empty, ErrorBox, Loading, PageHeader, Pagination } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { formatDate } from '../utils/format';

export function AgentsPage() {
  const agents = useApi((signal) => api<Agent[]>('/admin/relais', { signal }), 'agents');

  return (
    <>
      <PageHeader
        title="Agents communautaires"
        subtitle="Les relais qui accompagnent les femmes sur le terrain, et leur charge de suivi."
      />

      <div className="notice notice-info">
        Pour ajouter un agent : il crée d’abord son compte dans l’application, puis vous ouvrez sa fiche dans{' '}
        <Link to="/utilisateurs">Utilisatrices et comptes</Link> et choisissez le rôle « Agent communautaire ».
      </div>

      {agents.error && <ErrorBox message={agents.error} onRetry={agents.reload} />}
      {agents.loading && !agents.data && <Loading />}
      {agents.data && (
        <div className="card card-flush">
          {agents.data.length === 0 ? (
            <Empty>Aucun agent communautaire pour l’instant.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Téléphone</th>
                    <th>Secteur</th>
                    <th className="num">Bénéficiaires</th>
                    <th className="num">Alertes ouvertes</th>
                    <th>État</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.data.map((agent) => (
                    <tr key={agent.id}>
                      <td>
                        <Link to={`/utilisateurs/${agent.id}`} className="strong-link">
                          {agent.name}
                        </Link>
                      </td>
                      <td className="nowrap">{agent.phone ?? '—'}</td>
                      <td>{agent.secteur ?? <span className="muted">—</span>}</td>
                      <td className="num">
                        <Link to={`/utilisateurs?relais=${agent.id}`}>{agent.beneficiaires}</Link>
                      </td>
                      <td className="num">
                        {agent.alertesOuvertes > 0 ? (
                          <Badge tone="orange">{agent.alertesOuvertes}</Badge>
                        ) : (
                          <span className="muted">0</span>
                        )}
                      </td>
                      <td>{agent.isActive ? <Badge tone="green">Actif</Badge> : <Badge tone="red">Désactivé</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {agents.data && agents.data.some((a) => a.isActive) && (
        <Unassigned agents={agents.data.filter((a) => a.isActive)} onAssigned={agents.reload} />
      )}
    </>
  );
}

/** Utilisatrices sans agent, avec affectation directe depuis la liste. */
function Unassigned({ agents, onAssigned }: { agents: Agent[]; onAssigned(): void }) {
  const [page, setPage] = useState(1);
  const users = useApi(
    (signal) =>
      api<Paginated<AdminUser>>('/admin/users', {
        query: { role: 'user', sansAgent: true, isActive: true, page, limit: 10 },
        signal,
      }),
    `unassigned-${page}`,
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function assign(userId: string, relais: string) {
    if (!relais) return;
    setBusy(userId);
    setError(null);
    try {
      await api(`/admin/users/${userId}`, { method: 'PATCH', body: { relais } });
      users.reload();
      onAssigned();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card card-flush">
      <div className="card-head">
        <h2 className="section-title">Utilisatrices sans agent</h2>
        <p className="muted small">Affectez chaque femme à l’agent de son secteur.</p>
      </div>
      {error && <ErrorBox message={error} />}
      {users.error && <ErrorBox message={users.error} onRetry={users.reload} />}
      {users.loading && !users.data && <Loading />}
      {users.data &&
        (users.data.items.length === 0 ? (
          <Empty>Toutes les utilisatrices actives ont un agent assigné.</Empty>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Téléphone</th>
                    <th>Inscription</th>
                    <th>Affecter à</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.items.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <Link to={`/utilisateurs/${user.id}`} className="strong-link">
                          {user.name}
                        </Link>
                      </td>
                      <td className="nowrap">{user.phone ?? '—'}</td>
                      <td className="nowrap">{formatDate(user.createdAt)}</td>
                      <td>
                        <select
                          aria-label={`Agent pour ${user.name}`}
                          defaultValue=""
                          disabled={busy === user.id}
                          onChange={(e) => assign(user.id, e.target.value)}
                        >
                          <option value="">Choisir un agent…</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name}
                              {agent.secteur ? ` — ${agent.secteur}` : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={users.data.page}
              totalPages={users.data.totalPages}
              total={users.data.total}
              onChange={setPage}
            />
          </>
        ))}
    </section>
  );
}
