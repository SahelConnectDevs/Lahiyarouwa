import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';

import { api, ApiError, errorMessage } from '../../api/client';
import type { Alert, AlertStatus, BeneficiaryDetail, FollowUpType } from '../../api/types';
import { Badge, Empty, ErrorBox, Loading, Modal, PageHeader } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import {
  ALERT_STATUS_LABELS,
  FOLLOW_UP_LABELS,
  formatDate,
  formatDateTime,
  REMINDER_LABELS,
  telHref,
} from '../../utils/format';
import { AlertForm } from '../AlertsPage';

const STATUS_TONES: Record<AlertStatus, 'red' | 'orange' | 'green'> = {
  nouvelle: 'red',
  en_cours: 'orange',
  traitee: 'green',
};

/** Fiche d'une bénéficiaire pour son agent : suivi (si partagé), alertes et accompagnements. */
export function BeneficiaryPage() {
  const { id = '' } = useParams();
  const detail = useApi((signal) => api<BeneficiaryDetail>(`/relais/beneficiaires/${id}`, { signal }), id);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const b = detail.data;

  return (
    <>
      <p className="breadcrumb">
        <Link to="/beneficiaires">← Mes bénéficiaires</Link>
      </p>
      {detail.error && <ErrorBox message={detail.error} onRetry={detail.reload} />}
      {detail.loading && !b && <Loading />}
      {b && (
        <>
          <PageHeader
            title={b.name}
            subtitle={[b.phone, b.secteur].filter(Boolean).join(' · ') || undefined}
            actions={
              <>
                {b.phone && (
                  <a className="btn" href={telHref(b.phone)}>
                    Appeler
                  </a>
                )}
                <button type="button" className="btn btn-primary" onClick={() => setFollowUpOpen(true)}>
                  + Noter un suivi
                </button>
              </>
            }
          />

          {!b.partageRelais && (
            <div className="notice notice-info">
              {b.name} n’a pas encore autorisé le partage de son suivi avec vous : vous voyez seulement ses coordonnées,
              ses alertes et vos notes. Elle peut l’autoriser dans l’application (menu Plus).
            </div>
          )}

          <div className="two-cols">
            {b.partageRelais && (
              <section className="card">
                <h2 className="section-title">Son suivi</h2>
                <ul className="kv">
                  <li>
                    <span>Grossesse</span>
                    <strong>
                      {b.suivi?.grossesse
                        ? `${b.suivi.grossesse.semaine} SA · terme le ${formatDate(b.suivi.grossesse.termePrevu)}`
                        : 'Aucune en cours'}
                    </strong>
                  </li>
                  <li>
                    <span>Planification familiale</span>
                    <strong>{b.suivi?.planification?.methode ?? 'Aucune méthode'}</strong>
                  </li>
                  {b.suivi?.planification?.prochainRappel && (
                    <li>
                      <span>Prochaine échéance PF</span>
                      <strong>
                        {formatDate(b.suivi.planification.prochainRappel.echeance)}{' '}
                        {b.suivi.planification.prochainRappel.enRetard && <Badge tone="red">En retard</Badge>}
                      </strong>
                    </li>
                  )}
                </ul>

                <h2 className="section-title">Prochains rendez-vous</h2>
                {!b.rappels || b.rappels.length === 0 ? (
                  <Empty>Aucun rendez-vous à venir.</Empty>
                ) : (
                  <ul className="item-list">
                    {b.rappels.map((r) => (
                      <li key={`${r.type}-${r.ref}`} className="item">
                        <div className="item-main">
                          <strong>{r.titre}</strong>
                          <span className="muted small">
                            {REMINDER_LABELS[r.type]} · {formatDate(r.date)}{' '}
                            {r.enRetard && <Badge tone="red">En retard</Badge>}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <section className="card">
              <h2 className="section-title">Alertes</h2>
              {b.alertes.length === 0 ? (
                <Empty>Aucune alerte signalée.</Empty>
              ) : (
                <ul className="item-list">
                  {b.alertes.map((a) => (
                    <li key={a.id} className="item">
                      <div className="item-main">
                        <strong>{a.signe}</strong>
                        {a.details && <span className="small">{a.details}</span>}
                        <span className="muted small">
                          {formatDateTime(a.createdAt)}{' '}
                          <Badge tone={STATUS_TONES[a.statut]}>{ALERT_STATUS_LABELS[a.statut]}</Badge>
                        </span>
                        {a.noteSuivi && <span className="muted small">Note : {a.noteSuivi}</span>}
                      </div>
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => setAlert({ ...a, user: { id: b.id, name: b.name, phone: b.phone } })}
                      >
                        {a.statut === 'traitee' ? 'Voir' : 'Traiter'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="card">
            <h2 className="section-title">Historique des suivis</h2>
            {b.suivis.length === 0 ? (
              <Empty>Aucun suivi noté pour l’instant. Notez chaque appel, visite ou orientation.</Empty>
            ) : (
              <ul className="timeline">
                {b.suivis.map((s) => (
                  <li key={s.id}>
                    <div className="timeline-head">
                      <strong>{FOLLOW_UP_LABELS[s.type]}</strong>
                      <span className="muted small">
                        {formatDate(s.date)}
                        {s.relais && ` · ${s.relais.name}`}
                      </span>
                    </div>
                    {s.orienteVers && <p className="small">Orientée vers : {s.orienteVers}</p>}
                    {s.note && <p className="small">{s.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Modal title="Suivi de l’alerte" open={alert !== null} onClose={() => setAlert(null)}>
            {alert && (
              <AlertForm
                key={alert.id}
                alert={alert}
                endpoint="/relais/alertes"
                userLink={(userId) => `/beneficiaires/${userId}`}
                showAgent={false}
                onDone={() => {
                  setAlert(null);
                  detail.reload();
                }}
              />
            )}
          </Modal>

          <Modal title="Noter un suivi" open={followUpOpen} onClose={() => setFollowUpOpen(false)}>
            {followUpOpen && (
              <FollowUpForm
                beneficiary={b}
                onClose={() => setFollowUpOpen(false)}
                onSaved={() => {
                  setFollowUpOpen(false);
                  detail.reload();
                }}
              />
            )}
          </Modal>
        </>
      )}
    </>
  );
}

function todayInput(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function FollowUpForm({
  beneficiary,
  onClose,
  onSaved,
}: {
  beneficiary: BeneficiaryDetail;
  onClose(): void;
  onSaved(): void;
}) {
  const [type, setType] = useState<FollowUpType>('appel');
  const [date, setDate] = useState(todayInput());
  const [note, setNote] = useState('');
  const [orienteVers, setOrienteVers] = useState('');
  const [alerte, setAlerte] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const openAlerts = beneficiary.alertes.filter((a) => a.statut !== 'traitee');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      await api(`/relais/beneficiaires/${beneficiary.id}/suivis`, {
        method: 'POST',
        body: {
          type,
          // Aujourd'hui : l'instant présent (l'API refuse une date future, et
          // minuit UTC peut l'être juste après minuit au Niger).
          date: date === todayInput() ? new Date().toISOString() : date,
          ...(note.trim() && { note: note.trim() }),
          ...(type === 'orientation' && orienteVers.trim() && { orienteVers: orienteVers.trim() }),
          ...(alerte && { alerte }),
        },
      });
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {error && <ErrorBox message={error} />}
      <div className="form-grid">
        <label className="field">
          <span>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value as FollowUpType)}>
            {(Object.keys(FOLLOW_UP_LABELS) as FollowUpType[]).map((t) => (
              <option key={t} value={t}>
                {FOLLOW_UP_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Date</span>
          <input type="date" value={date} max={todayInput()} required onChange={(e) => setDate(e.target.value)} />
          {errors.date && <small className="field-error">{errors.date}</small>}
        </label>
        {type === 'orientation' && (
          <label className="field field-wide">
            <span>Orientée vers</span>
            <input
              value={orienteVers}
              maxLength={200}
              placeholder="Ex : CSI de Lazaret, sage-femme"
              onChange={(e) => setOrienteVers(e.target.value)}
            />
            {errors.orienteVers && <small className="field-error">{errors.orienteVers}</small>}
          </label>
        )}
        {openAlerts.length > 0 && (
          <label className="field field-wide">
            <span>Lié à une alerte (facultatif)</span>
            <select value={alerte} onChange={(e) => setAlerte(e.target.value)}>
              <option value="">Aucune</option>
              {openAlerts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.signe} · {formatDate(a.createdAt)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field field-wide">
          <span>Note</span>
          <textarea
            rows={4}
            maxLength={2000}
            value={note}
            placeholder="Ce qui a été dit ou fait, prochaine étape…"
            onChange={(e) => setNote(e.target.value)}
          />
          {errors.note && <small className="field-error">{errors.note}</small>}
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onClose}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
