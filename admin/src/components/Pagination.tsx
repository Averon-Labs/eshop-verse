import type { Pagination as PaginationMeta } from '../api/types';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  busy?: boolean;
  itemNoun: string;
}

/** API-driven pagination: page controls follow `pagination` metadata only. */
export function Pagination({
  pagination,
  onPageChange,
  busy = false,
  itemNoun,
}: PaginationProps) {
  const { currentPage, totalItems, totalPages } = pagination;
  const lastPage = Math.max(totalPages, 1);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border-outline/40 bg-bg-surface px-6 py-4"
    >
      <p className="text-xs font-semibold text-text-secondary">
        {totalItems} {totalItems === 1 ? itemNoun : `${itemNoun}s`}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl border border-border-outline/60 bg-bg-surface px-3.5 text-xs font-bold text-text-on-surface hover:bg-bg-surface-variant disabled:cursor-not-allowed disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={busy || currentPage <= 1}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        <span className="px-3 text-xs font-bold text-text-on-surface" aria-live="polite">
          Page {currentPage} of {lastPage}
        </span>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl border border-border-outline/60 bg-bg-surface px-3.5 text-xs font-bold text-text-on-surface hover:bg-bg-surface-variant disabled:cursor-not-allowed disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={busy || currentPage >= lastPage}
        >
          Next
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
