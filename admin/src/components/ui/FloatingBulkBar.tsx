import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface FloatingBulkBarProps {
  selectedCount: number;
  onActivate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onClear: () => void;
  busy?: boolean;
}

/**
 * PROD-902 — Dribbble-grade Floating Bulk Action Bar.
 * Renders an elevated capsule bar pinned to the bottom of the viewport
 * when one or more table items are selected.
 */
export function FloatingBulkBar({
  selectedCount,
  onActivate,
  onArchive,
  onDelete,
  onClear,
  busy = false,
}: FloatingBulkBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || selectedCount <= 0) {
    return null;
  }

  return createPortal(
    <div
      role="region"
      aria-label="Bulk actions toolbar"
      className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 max-w-[calc(100vw-32px)]"
    >
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-[var(--border-outline-variant)] bg-[var(--bg-surface)]/95 px-4 py-2.5 shadow-2xl backdrop-blur-xl sm:gap-3 sm:px-6 sm:py-3">
        {/* Selected count badge */}
        <div className="flex items-center gap-2 rounded-full bg-[var(--brand-primary-container)] px-3 py-1 text-xs font-bold text-[var(--brand-on-primary-container)]">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>
            {selectedCount} <span className="hidden sm:inline">item{selectedCount > 1 ? 's' : ''}</span> selected
          </span>
        </div>

        {/* Action: Activate */}
        <button
          type="button"
          disabled={busy}
          onClick={onActivate}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text-on-surface)] hover:bg-emerald-500/10 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-50 transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>Activate</span>
        </button>

        {/* Action: Archive */}
        <button
          type="button"
          disabled={busy}
          onClick={onArchive}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text-on-surface)] hover:bg-amber-500/10 hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-50 transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
          <span>Archive</span>
        </button>

        {/* Action: Delete */}
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-status-error hover:bg-status-error-container/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error disabled:opacity-50 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete</span>
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-[var(--border-outline-variant)]" aria-hidden="true" />

        {/* Clear selection */}
        <button
          type="button"
          disabled={busy}
          onClick={onClear}
          aria-label="Clear selection"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-surface-variant)] hover:text-[var(--text-on-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  );
}
