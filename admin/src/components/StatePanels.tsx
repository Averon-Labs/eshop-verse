import type { ReactNode } from 'react';
import { cardClass } from '../lib/ui';

/** Static skeleton rows while a list loads (zero layout shift). */
export function TableSkeleton({ label, rows = 5 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="space-y-3 p-6">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-12 animate-pulse rounded-2xl bg-bg-surface-variant/80"
        />
      ))}
    </div>
  );
}

/** Recoverable loading failure with an explicit retry. */
export function ErrorPanel({
  title,
  message,
  onRetry,
}: {
  title: string;
  message?: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-3xl border border-status-error/30 bg-status-error-container/20 p-8 text-center shadow-xs"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-status-error-container text-status-error">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-base font-bold text-text-on-surface">{title}</p>
      {message ? <p className="mt-1 max-w-md text-sm text-text-secondary">{message}</p> : null}
      <button
        type="button"
        className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on-primary hover:bg-brand-primary-hover active:scale-[0.98] transition-all"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}

/** Empty state for both “nothing exists yet” and “no results for filters”. */
export function EmptyPanel({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={`${cardClass} flex flex-col items-center justify-center p-12 text-center`}>
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary-container text-brand-primary shadow-xs">
          {icon}
        </div>
      ) : (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary-container/60 text-brand-primary">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      )}
      <p className="text-lg font-bold text-text-on-surface">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-text-secondary">{description}</p>
      {children ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
      ) : null}
    </div>
  );
}

/** Non-blocking success feedback announced to assistive technology. */
export function FeedbackBanner({ message }: { message: string }) {
  return (
    <p
      role="status"
      className="flex items-center gap-2.5 rounded-2xl border border-status-success/30 bg-status-success-container/40 px-4 py-3 text-sm font-semibold text-status-on-success-container shadow-xs"
    >
      <svg
        className="h-5 w-5 shrink-0 text-status-success"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span>{message}</span>
    </p>
  );
}
