import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { api } from '../api/client';
import type { AdminUser, Agent, Paginated, Role } from '../api/types';
import { CreateUserModal } from '../components/accounts';
import { Badge, Empty, ErrorBox, Loading, PageHeader, Pagination } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { formatDate, ROLE_LABELS } from '../utils/format';

const ROLE_TONES: Record<Role, 'pink' | 'green' | 'blue'> = { user: 'pink', relais: 'green', admin: 'blue' };

export function UsersPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [createOpen, setCreateOpen] = useState(false);

  const filters = {
    search: params.get('search') ?? '',
    role: params.get('role') ?? '',
    isActive: params.get('isActive') ?? '',
    relais: params.get('relais') ?? '',
    sansAgent: params.get('sansAgent') ?? '',
    page: Number(params.get('page') ?? '1') || 1,
  };

  const users = useApi(
    (signal) => api<Paginated<AdminUser>>('/admin/users', { query: { ...filters, limit: 20 }, signal }),
    JSON.stringify(filters),
  );
  const agents = useApi((signal) => api<Agent[]>('/admin/relais', { signal }), 'agents');
  const agentNames = useMemo(
    () => new Map((agents.data ?? []).map((agent) => [agent.id, agent.name])),
    [agents.data],
  );

  // Recherche déclenchée après une courte pause de frappe.
  useEffect(() => {
    if (search === filters.search) return;
    const timer = setTimeout(() => update({ search }), 350);
    return () => clearTimeout(timer);
    // update/filters changent à chaque rendu ; seule la saisie compte ici.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function update(changes: Record<string, string>, resetPage = true) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (resetPage && !('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  }

  const hasFilters = Object.entries(filters).some(([key, value]) => key !== 'page' && value);

  return (
    <>
      <PageHeader
        title="Utilisatrices et comptes"
        subtitle="Tous les comptes de l’application : utilisatrices, agents communautaires et administrateurs."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            + Nouveau compte
          </button>
        }
      />
      <CreateUserModal
        open={createOpen}
        defaultRole="user"
        onClose={() => setCreateOpen(false)}
        onCreated={(account) => navigate(`/utilisateurs/${account.user.id}`)}
      />

      <div className="filters">
        <input
          type="search"
          className="filter-search"
          placeholder="Rechercher un nom, un téléphone, un e-mail…"
          aria-label="Rechercher"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select aria-label="Rôle" value={filters.role} onChange={(e) => update({ role: e.target.value })}>
          <option value="">Tous les rôles</option>
          {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <select aria-label="État" value={filters.isActive} onChange={(e) => update({ isActive: e.target.value })}>
          <option value="">Actifs et désactivés</option>
          <option value="true">Actifs</option>
          <option value="false">Désactivés</option>
        </select>
        <select
          aria-label="Agent communautaire"
          value={filters.sansAgent ? '__none' : filters.relais}
          onChange={(e) =>
            e.target.value === '__none'
              ? update({ relais: '', sansAgent: 'true' })
              : update({ relais: e.target.value, sansAgent: '' })
          }
        >
          <option value="">Tous les agents</option>
          <option value="__none">Sans agent assigné</option>
          {(agents.data ?? []).map((agent) => (
            <option key={agent.id} value={agent.id}>
              Suivies par {agent.name}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setSearch('');
              setParams(new URLSearchParams(), { replace: true });
            }}
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {users.error && <ErrorBox message={users.error} onRetry={users.reload} />}
      {users.loading && !users.data && <Loading />}
      {users.data && (
        <div className="card card-flush">
          {users.data.items.length === 0 ? (
            <Empty>Aucun compte ne correspond à ces critères.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="table table-clickable">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Téléphone</th>
                    <th>Rôle</th>
                    <th>Agent / secteur</th>
                    <th>Inscription</th>
                    <th>État</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.items.map((user) => (
                    <tr key={user.id} onClick={() => navigate(`/utilisateurs/${user.id}`)}>
                      <td>
                        <Link to={`/utilisateurs/${user.id}`} onClick={(e) => e.stopPropagation()} className="strong-link">
                          {user.name}
                        </Link>
                        {user.email && <div className="muted small">{user.email}</div>}
                      </td>
                      <td className="nowrap">{user.phone ?? '—'}</td>
                      <td>
                        <Badge tone={ROLE_TONES[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                      </td>
                      <td>
                        {user.role === 'user'
                          ? (user.relais && agentNames.get(user.relais)) || <span className="muted">Aucun</span>
                          : user.secteur || <span className="muted">—</span>}
                      </td>
                      <td className="nowrap">{formatDate(user.createdAt)}</td>
                      <td>{user.isActive ? <Badge tone="green">Actif</Badge> : <Badge tone="red">Désactivé</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            page={users.data.page}
            totalPages={users.data.totalPages}
            total={users.data.total}
            onChange={(page) => update({ page: String(page) }, false)}
          />
        </div>
      )}
    </>
  );
}
