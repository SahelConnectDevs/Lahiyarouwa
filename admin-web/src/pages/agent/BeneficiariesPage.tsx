import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { api } from '../../api/client';
import type { BeneficiarySummary } from '../../api/types';
import { Badge, Empty, ErrorBox, Loading, PageHeader } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import { formatDate, telHref } from '../../utils/format';

/** Liste des femmes suivies par l'agent, celles avec une alerte ouverte en premier. */
export function BeneficiariesPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('search') ?? '';
  const [search, setSearch] = useState(query);

  const list = useApi(
    (signal) => api<BeneficiarySummary[]>('/relais/beneficiaires', { query: { search: query }, signal }),
    query,
  );

  useEffect(() => {
    if (search === query) return;
    const timer = setTimeout(() => setParams(search ? { search } : {}, { replace: true }), 350);
    return () => clearTimeout(timer);
    // Seule la saisie déclenche la recherche.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <>
      <PageHeader title="Mes bénéficiaires" subtitle="Les femmes que vous accompagnez." />
      <div className="filters">
        <input
          type="search"
          className="filter-search"
          placeholder="Rechercher un nom ou un numéro…"
          aria-label="Rechercher"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {list.error && <ErrorBox message={list.error} onRetry={list.reload} />}
      {list.loading && !list.data && <Loading />}
      {list.data &&
        (list.data.length === 0 ? (
          <div className="card">
            <Empty>
              {query
                ? 'Aucune bénéficiaire ne correspond à cette recherche.'
                : 'Aucune bénéficiaire ne vous est encore assignée. L’équipe vous les attribue depuis l’administration.'}
            </Empty>
          </div>
        ) : (
          <ul className="item-list card">
            {list.data.map((b) => (
              <li key={b.id} className="item">
                <div className="item-main">
                  <Link to={`/beneficiaires/${b.id}`} className="strong-link">
                    {b.name}
                  </Link>
                  <span className="muted small">
                    {b.phone ?? 'Pas de numéro'}
                    {b.secteur && ` · ${b.secteur}`}
                  </span>
                  <span className="badges">
                    {b.alertesOuvertes > 0 && (
                      <Badge tone="red">
                        {b.alertesOuvertes} alerte{b.alertesOuvertes > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {b.suivi?.grossesse && <Badge tone="pink">Enceinte · {b.suivi.grossesse.semaine} SA</Badge>}
                    {b.suivi?.planification && (
                      <Badge tone={b.suivi.planification.prochainRappel?.enRetard ? 'orange' : 'blue'}>
                        {b.suivi.planification.methode}
                        {b.suivi.planification.prochainRappel &&
                          ` · ${b.suivi.planification.prochainRappel.enRetard ? 'en retard depuis le' : 'prochain le'} ${formatDate(b.suivi.planification.prochainRappel.echeance)}`}
                      </Badge>
                    )}
                    {!b.partageRelais && <Badge>Suivi non partagé</Badge>}
                  </span>
                </div>
                {b.phone && (
                  <a className="btn btn-small" href={telHref(b.phone)}>
                    Appeler
                  </a>
                )}
              </li>
            ))}
          </ul>
        ))}
    </>
  );
}
