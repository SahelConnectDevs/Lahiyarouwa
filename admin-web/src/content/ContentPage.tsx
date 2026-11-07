import { useState, type FormEvent } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router';

import { api, ApiError, errorMessage } from '../api/client';
import type { ContentItem, Paginated } from '../api/types';
import { Empty, ErrorBox, Loading, Modal, PageHeader, Pagination } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { CONTENT_CONFIGS, type ContentConfig } from './configs';
import { toFormValues, toPayload, type Field, type FormValues } from './contentForm';

/** Liste + création/modification/suppression d'un type de contenu de l'app. */
export function ContentPage() {
  const { type = '' } = useParams();
  const config = CONTENT_CONFIGS[type];
  if (!config) return <Navigate to="/" replace />;
  // key : repart d'un état vierge en changeant de type de contenu.
  return <ContentList key={config.path} config={config} />;
}

type Editing = { mode: 'create' } | { mode: 'update'; item: ContentItem };

function ContentList({ config }: { config: ContentConfig }) {
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<ContentItem | null>(null);

  const query: Record<string, string | number> = { page: Number(params.get('page') ?? '1') || 1, limit: 50 };
  for (const filter of config.filters ?? []) {
    const value = params.get(filter.name);
    if (value) query[filter.name] = value;
  }

  const list = useApi(
    (signal) => api<Paginated<ContentItem>>(`/admin/${config.path}`, { query, signal }),
    `${config.path}-${JSON.stringify(query)}`,
  );

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== 'page') next.delete('page');
    setParams(next, { replace: true });
  }

  return (
    <>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditing({ mode: 'create' })}>
            + Ajouter {config.singular === 'étape' || config.singular === 'méthode' ? 'une' : 'un'} {config.singular}
          </button>
        }
      />

      {config.filters && (
        <div className="filters">
          {config.filters.map((filter) => (
            <select
              key={filter.name}
              aria-label={filter.label}
              value={params.get(filter.name) ?? ''}
              onChange={(e) => setParam(filter.name, e.target.value)}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      {list.error && <ErrorBox message={list.error} onRetry={list.reload} />}
      {list.loading && !list.data && <Loading />}
      {list.data && (
        <div className="card card-flush">
          {list.data.items.length === 0 ? (
            <Empty>Aucun élément pour l’instant.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="table table-clickable">
                <thead>
                  <tr>
                    {config.columns.map((column) => (
                      <th key={column.label} className={column.className}>
                        {column.label}
                      </th>
                    ))}
                    <th className="actions-col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((item) => (
                    <tr key={item.id} onClick={() => setEditing({ mode: 'update', item })}>
                      {config.columns.map((column) => (
                        <td key={column.label} className={column.className}>
                          {column.render(item)}
                        </td>
                      ))}
                      <td className="actions-col">
                        <button
                          type="button"
                          className="btn btn-small btn-ghost-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleting(item);
                          }}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            page={list.data.page}
            totalPages={list.data.totalPages}
            total={list.data.total}
            onChange={(page) => setParam('page', String(page))}
          />
        </div>
      )}

      <Modal
        wide
        title={editing?.mode === 'update' ? `Modifier ${config.thisOne}` : `Nouveau contenu : ${config.singular}`}
        open={editing !== null}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <ContentForm
            key={editing.mode === 'update' ? editing.item.id : 'new'}
            config={config}
            editing={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              list.reload();
            }}
          />
        )}
      </Modal>

      <Modal title={`Supprimer ${config.thisOne} ?`} open={deleting !== null} onClose={() => setDeleting(null)}>
        {deleting && (
          <DeleteConfirm
            config={config}
            item={deleting}
            onCancel={() => setDeleting(null)}
            onDeleted={() => {
              setDeleting(null);
              list.reload();
            }}
          />
        )}
      </Modal>
    </>
  );
}

function ContentForm({
  config,
  editing,
  onCancel,
  onSaved,
}: {
  config: ContentConfig;
  editing: Editing;
  onCancel(): void;
  onSaved(): void;
}) {
  const [values, setValues] = useState<FormValues>(() =>
    toFormValues(config.fields, editing.mode === 'update' ? editing.item : undefined),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setErrors({});
    const body = toPayload(config.fields, values, editing.mode);
    try {
      if (editing.mode === 'create') await api(`/admin/${config.path}`, { method: 'POST', body });
      else await api(`/admin/${config.path}/${editing.item.id}`, { method: 'PATCH', body });
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  const set = (name: string, value: string | boolean) => setValues((prev) => ({ ...prev, [name]: value }));

  return (
    <form onSubmit={onSubmit}>
      {error && <ErrorBox message={error} />}
      <div className="form-grid">
        {config.fields.map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            value={values[field.name]}
            error={errors[field.name]}
            onChange={(value) => set(field.name, value)}
          />
        ))}
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: Field;
  value: string | boolean;
  error?: string;
  onChange(value: string | boolean): void;
}) {
  const id = `field-${field.name.replace('.', '-')}`;
  const className = `field${field.wide || field.type === 'list' || field.type === 'textarea' ? ' field-wide' : ''}`;
  const footer = (
    <>
      {field.hint && <small className="hint">{field.hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </>
  );

  if (field.type === 'checkbox') {
    return (
      <label className={`check${field.wide ? ' field-wide' : ''}`}>
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        <span>
          {field.label}
          {footer}
        </span>
      </label>
    );
  }

  const text = String(value ?? '');
  let control;
  switch (field.type) {
    case 'textarea':
      control = (
        <textarea
          id={id}
          rows={field.rows ?? 4}
          maxLength={field.max}
          required={field.required}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case 'list':
      control = (
        <textarea
          id={id}
          rows={Math.max(3, Math.min(8, text.split('\n').length + 1))}
          value={text}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case 'number':
      control = (
        <input
          id={id}
          type="number"
          inputMode="numeric"
          step={1}
          min={field.min}
          max={field.max}
          required={field.required}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case 'select':
      control = (
        <select id={id} required={field.required} value={text} onChange={(e) => onChange(e.target.value)}>
          {(field.required || field.defaultValue === undefined) && <option value="">Choisir…</option>}
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;
    default:
      control = (
        <input
          id={id}
          type="text"
          maxLength={field.max}
          pattern={field.pattern}
          placeholder={field.placeholder}
          required={field.required}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }

  return (
    <div className={className}>
      <label htmlFor={id}>
        {field.label}
        {field.required && <span className="required"> *</span>}
      </label>
      {control}
      {footer}
    </div>
  );
}

function DeleteConfirm({
  config,
  item,
  onCancel,
  onDeleted,
}: {
  config: ContentConfig;
  item: ContentItem;
  onCancel(): void;
  onDeleted(): void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/${config.path}/${item.id}`, { method: 'DELETE' });
      onDeleted();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <>
      <p>
        « <strong>{String(item[config.titleField] ?? '')}</strong> » sera supprimé définitivement de l’application.
      </p>
      {'actif' in item || 'publie' in item ? (
        <p className="muted small">
          Pour le retirer temporairement, vous pouvez plutôt le modifier et le décocher (masqué / brouillon).
        </p>
      ) : null}
      {error && <ErrorBox message={error} />}
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Annuler
        </button>
        <button type="button" className="btn btn-danger" disabled={busy} onClick={onDelete}>
          {busy ? 'Suppression…' : 'Supprimer'}
        </button>
      </div>
    </>
  );
}
