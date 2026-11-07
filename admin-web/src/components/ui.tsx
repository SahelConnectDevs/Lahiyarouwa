import { useEffect, useRef, type ReactNode } from 'react';

/** Petits composants d'interface partagés par toutes les pages. */

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="notice notice-error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-small" onClick={onRetry}>
          Réessayer
        </button>
      )}
    </div>
  );
}

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'green' | 'orange' | 'red' | 'blue' | 'pink'; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange(page: number): void;
}) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted">
        {total} résultat{total > 1 ? 's' : ''}
      </span>
      <div>
        <button type="button" className="btn btn-small" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ← Précédent
        </button>
        <span className="pagination-page">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-small"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Suivant →
        </button>
      </div>
    </nav>
  );
}

/** Fenêtre modale basée sur <dialog> (focus, Échap et fond gérés par le navigateur). */
export function Modal({
  title,
  open,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  open: boolean;
  onClose(): void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className={`modal${wide ? ' modal-wide' : ''}`} onClose={onClose} aria-labelledby="modal-title">
      {open && (
        <>
          <div className="modal-header">
            <h2 id="modal-title">{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
              ×
            </button>
          </div>
          <div className="modal-body">{children}</div>
        </>
      )}
    </dialog>
  );
}

export function StatCard({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'pink' | 'green' | 'orange' | 'blue' }) {
  return (
    <div className={`stat-card${tone ? ` stat-${tone}` : ''}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}
