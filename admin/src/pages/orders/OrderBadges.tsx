import type { OrderStatus, PaymentStatus } from '../../api/types';
import { StatusBadge } from '../../components/StatusBadge';

/** Human-readable labels for the reviewed `OrderStatus` enum. */
export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending_payment':
      return 'Pending payment';
    case 'confirmed':
      return 'Confirmed';
    case 'processing':
      return 'Processing';
    case 'shipped':
      return 'Shipped';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
  }
}

/** Human-readable labels for the reviewed `PaymentStatus` enum. */
export function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
  }
}

/**
 * Status badges matching the Figma screen palette and Evergreen Material 3 design:
 * - Pending payment: Light purple `#EBDDFF` with dark violet text.
 * - Confirmed / Processing: Blue `#D1E9FF` with deep cyan text.
 * - Shipped: Soft orange `#FFEDD5` with dark amber text.
 * - Delivered: Green `#B9F1CD` with dark forest green text.
 * - Cancelled: Rose `#FFE4E6` with dark red text.
 */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  if (status === 'delivered') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide bg-[#B9F1CD] text-[#0B4A26] border border-[#0B4A26]/10 dark:bg-[#063319] dark:text-[#B9F1CD]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#0B4A26] dark:bg-[#B9F1CD]" aria-hidden="true" />
        {orderStatusLabel(status)}
      </span>
    );
  }

  if (status === 'pending_payment') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide bg-[#EBDDFF] text-[#4A154B] border border-[#4A154B]/10 dark:bg-[#3D144A] dark:text-[#EBDDFF]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#4A154B] dark:bg-[#EBDDFF]" aria-hidden="true" />
        {orderStatusLabel(status)}
      </span>
    );
  }

  if (status === 'confirmed' || status === 'processing') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide bg-[#D1E9FF] text-[#004B87] border border-[#004B87]/10 dark:bg-[#002D54] dark:text-[#D1E9FF]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#004B87] dark:bg-[#D1E9FF]" aria-hidden="true" />
        {orderStatusLabel(status)}
      </span>
    );
  }

  if (status === 'shipped') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide bg-[#FFEDD5] text-[#8C3B00] border border-[#8C3B00]/10 dark:bg-[#4E2000] dark:text-[#FFEDD5]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#8C3B00] dark:bg-[#FFEDD5]" aria-hidden="true" />
        {orderStatusLabel(status)}
      </span>
    );
  }

  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide bg-[#FFE4E6] text-[#881337] border border-[#881337]/10 dark:bg-[#4C0519] dark:text-[#FFE4E6]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#881337] dark:bg-[#FFE4E6]" aria-hidden="true" />
        {orderStatusLabel(status)}
      </span>
    );
  }

  return <StatusBadge tone="neutral">{orderStatusLabel(status)}</StatusBadge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  if (status === 'completed') {
    return <StatusBadge tone="success">{paymentStatusLabel(status)}</StatusBadge>;
  }

  if (status === 'failed') {
    return <StatusBadge tone="error">{paymentStatusLabel(status)}</StatusBadge>;
  }

  return <StatusBadge tone="warning">{paymentStatusLabel(status)}</StatusBadge>;
}
