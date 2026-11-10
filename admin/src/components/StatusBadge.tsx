import type { ReactNode } from 'react';
import { statusBadgeBase } from '../lib/ui';

export type StatusTone = 'success' | 'warning' | 'error' | 'neutral';

/**
 * Status text plus container color from the Evergreen Material 3 status system.
 * The text label is always rendered; color never carries meaning alone.
 */
const TONE_CLASSES: Record<StatusTone, string> = {
  success:
    'bg-status-success-container/70 text-status-on-success-container border border-status-success/20 dark:bg-status-success-container dark:text-status-on-success-container',
  warning:
    'bg-status-warning-container/70 text-status-on-warning-container border border-status-warning/20 dark:bg-status-warning-container dark:text-status-on-warning-container',
  error:
    'bg-status-error-container/70 text-status-on-error-container border border-status-error/20 dark:bg-status-error-container dark:text-status-on-error-container',
  neutral:
    'bg-bg-surface-variant text-text-secondary border border-border-outline/40 dark:bg-bg-surface-variant dark:text-text-secondary',
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  error: 'bg-status-error',
  neutral: 'bg-text-disabled',
};

export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span className={`${statusBadgeBase} ${TONE_CLASSES[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone]}`} aria-hidden="true" />
      {children}
    </span>
  );
}
