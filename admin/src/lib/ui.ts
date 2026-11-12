/**
 * Shared class strings for the admin controls so buttons, inputs, and cards
 * stay consistent across pages (docs/DESIGN_SYSTEM.md — Web Dashboard
 * Components). Minimum web target is 44 CSS px, satisfied with min-h-11.
 */

export const primaryButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-brand-primary px-5 text-sm font-bold text-brand-on-primary shadow-xs transition-all hover:bg-brand-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-60';

export const secondaryButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border-outline/70 bg-bg-surface px-5 text-sm font-semibold text-text-on-surface hover:bg-bg-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-60 transition-colors';

export const dangerButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-status-error px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error disabled:cursor-not-allowed disabled:opacity-60';

export const actionButtonClass =
  'inline-flex min-h-9 items-center rounded-xl px-3 text-xs font-semibold text-brand-primary hover:bg-brand-primary-container/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors';

export const inputClass =
  'min-h-11 w-full rounded-2xl border border-border-outline/60 bg-bg-surface px-3.5 text-sm text-text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-colors';

export const labelClass = 'block text-xs font-bold uppercase tracking-wider text-text-secondary';

export const helperTextClass = 'mt-1 text-xs text-text-secondary';

export const fieldErrorClass = 'mt-1 text-xs font-semibold text-status-error';

export const cardClass = 'rounded-3xl border border-border-outline/50 bg-bg-surface shadow-xs';

export const statusBadgeBase = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold';
