import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../api/http';
import { getAdminOrder, updateAdminOrderStatus } from '../../api/orders';
import type { AdminOrder, OrderStatus } from '../../api/types';
import { Dialog } from '../../components/Dialog';
import { EmptyPanel, ErrorPanel, FeedbackBanner, TableSkeleton } from '../../components/StatePanels';
import { CustomSelect } from '../../components/ui';
import { formatDateTime, formatUsd } from '../../lib/format';
import {
  actionButtonClass,
  cardClass,
  dangerButtonClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../lib/ui';
import { OrderStatusBadge, PaymentStatusBadge, orderStatusLabel, paymentStatusLabel } from './OrderBadges';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border-outline/20 py-2.5 last:border-b-0">
      <dt className="text-sm font-medium text-text-secondary">{label}</dt>
      <dd className="text-sm font-semibold text-text-on-surface">{value}</dd>
    </div>
  );
}

function ItemsTable({ order }: { order: AdminOrder }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">Order items</caption>
          <thead className="border-b border-border-outline/40 bg-bg-surface-variant/40 text-xs uppercase tracking-wide text-text-secondary">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold">
                Product
              </th>
              <th scope="col" className="px-4 py-3 font-bold">
                Quantity
              </th>
              <th scope="col" className="px-4 py-3 font-bold">
                Unit price (USD)
              </th>
              <th scope="col" className="px-4 py-3 font-bold">
                Line total (USD)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-outline/30">
            {order.items.map((item) => (
              <tr key={item.productId} className="hover:bg-bg-surface-variant/30 transition-colors">
                <td className="px-4 py-3.5 font-bold text-text-on-surface">{item.productName}</td>
                <td className="px-4 py-3.5 tabular-nums text-text-on-surface">{item.quantity}</td>
                <td className="px-4 py-3.5 tabular-nums text-text-on-surface">{formatUsd(item.unitPrice)}</td>
                <td className="px-4 py-3.5 font-bold tabular-nums text-text-on-surface">{formatUsd(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border-outline/30 md:hidden" aria-label="Order items list">
        {order.items.map((item) => (
          <li key={item.productId} className="p-4 hover:bg-bg-surface-variant/30 transition-colors">
            <p className="font-bold text-text-on-surface">{item.productName}</p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-text-secondary">Quantity</dt>
                <dd className="font-semibold tabular-nums text-text-on-surface">{item.quantity}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Unit price (USD)</dt>
                <dd className="font-semibold tabular-nums text-text-on-surface">{formatUsd(item.unitPrice)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-text-secondary">Line total (USD)</dt>
                <dd className="font-bold tabular-nums text-text-on-surface">{formatUsd(item.lineTotal)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * ORD-102 — Order Details & State Machine Transitions (`/orders/:id`).
 * High-clarity Bento Grid layout with customer shipping snapshot, items breakdown,
 * payment confirmation, and state machine transitions.
 */
export default function OrderDetailPage() {
  const { orderId } = useParams();
  const parsedOrderId = Number(orderId);
  const validOrderId = Number.isInteger(parsedOrderId) && parsedOrderId > 0;

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!validOrderId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    setNotFound(false);

    getAdminOrder(parsedOrderId, controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) {
          return;
        }
        setOrder(payload);
        setTargetStatus(payload.allowedTransitions[0] ?? '');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof ApiError && error.status === 401) {
          return; // The session handler routes back to sign-in.
        }
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
          return;
        }
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'The order could not be loaded. Check your connection and try again.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [parsedOrderId, validOrderId, reloadToken]);

  async function applyTransition() {
    if (!order || targetStatus === '') {
      return;
    }

    setSaving(true);
    setActionError(null);

    try {
      const updated = await updateAdminOrderStatus(order.id, targetStatus as OrderStatus);
      setOrder(updated);
      setTargetStatus(updated.allowedTransitions[0] ?? '');
      setConfirmOpen(false);
      setFeedback(
        `${updated.reference} is now ${orderStatusLabel(updated.status).toLowerCase()}.`,
      );
    } catch (error) {
      setConfirmOpen(false);
      if (error instanceof ApiError && error.status === 401) {
        return; // The session handler routes back to sign-in.
      }
      setActionError(
        error instanceof ApiError
          ? error.message
          : 'The status could not be updated. Refresh the order and try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (!validOrderId || notFound) {
    return (
      <EmptyPanel
        title="Order not found"
        description="The requested order does not exist or is no longer available."
      >
        <Link to="/orders" className={secondaryButtonClass}>
          Back to orders
        </Link>
      </EmptyPanel>
    );
  }

  if (loading) {
    return (
      <div className={cardClass}>
        <TableSkeleton label="Loading order" rows={6} />
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <ErrorPanel
        title="Order could not be loaded"
        message={loadError}
        onRetry={() => setReloadToken((token) => token + 1)}
      />
    );
  }

  const confirmTarget = targetStatus === '' ? null : (targetStatus as OrderStatus);

  return (
    <section aria-labelledby="order-title" className="space-y-6">
      {/* Top Navigation & Action Header */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-on-surface transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to orders</span>
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 id="order-title" className="text-3xl font-extrabold tracking-tight tabular-nums text-text-on-surface">
              {order.reference}
            </h1>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Placed {formatDateTime(order.createdAt)} · Last updated {formatDateTime(order.updatedAt)}
          </p>
        </div>
      </div>

      {feedback && <FeedbackBanner message={feedback} />}
      {actionError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-status-error/30 bg-status-error-container/20 px-4 py-3 text-sm text-status-error shadow-xs"
        >
          <span>{actionError}</span>
          <button
            type="button"
            className={actionButtonClass}
            onClick={() => {
              setActionError(null);
              setReloadToken((token) => token + 1);
            }}
          >
            Refresh order
          </button>
        </div>
      )}

      {/* Bento Grid — Orders Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Items breakdown and summary totals */}
        <div className="space-y-6 lg:col-span-2">
          <div className={cardClass}>
            <div className="border-b border-border-outline/30 px-6 py-4">
              <h2 className="text-base font-bold text-text-on-surface">Order items</h2>
            </div>
            <div aria-busy={loading}>
              <ItemsTable order={order} />
            </div>
            <dl className="border-t border-border-outline/30 bg-bg-surface-variant/20 px-6 py-4">
              <DetailRow label="Subtotal" value={formatUsd(order.subtotal)} />
              <DetailRow label="Sample shipping" value={formatUsd(order.shipping)} />
              <div className="flex flex-wrap items-baseline justify-between gap-2 pt-3 text-base font-bold text-text-on-surface">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {formatUsd(order.total)} {order.currency}
                </dd>
              </div>
            </dl>
          </div>

          {/* Payment Card */}
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-on-surface">Payment</h2>
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            {order.payment ? (
              <>
                <p className="mt-1 text-xs text-text-secondary">
                  Demo method only — no card data is ever collected.
                </p>
                <dl className="mt-3">
                  <DetailRow label="Status" value={paymentStatusLabel(order.payment.status)} />
                  <DetailRow label="Amount" value={formatUsd(order.payment.amount)} />
                  <DetailRow label="Transaction" value={order.payment.transactionId ?? '—'} />
                  <DetailRow label="Recorded" value={formatDateTime(order.payment.createdAt)} />
                </dl>
              </>
            ) : (
              <p className="mt-3 text-sm text-text-secondary">
                No payment attempt recorded yet. The order awaits the customer&apos;s simulated
                payment outcome.
              </p>
            )}
          </div>
        </div>

        {/* Right 1 Column: Fulfillment status transition & Customer Snapshot */}
        <div className="space-y-6">
          {/* Status Machine Transitions & Timeline Card */}
          <div className={`${cardClass} p-6`}>
            <h2 className="text-base font-bold text-text-on-surface">Fulfillment status</h2>
            <div className="mt-3">
              <OrderStatusBadge status={order.status} />
            </div>

            {/* Status Flow Pipeline Indicator */}
            <div className="mt-4 rounded-2xl border border-border-outline/30 bg-bg-surface-variant/20 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2.5">
                Fulfillment pipeline
              </p>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {(['pending_payment', 'confirmed', 'processing', 'shipped', 'delivered'] as OrderStatus[]).map(
                  (step, idx, arr) => {
                    const isCurrent = order.status === step;
                    const isPassed = order.timeline.some((t) => t.status === step);
                    return (
                      <div key={step} className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={[
                            'inline-flex items-center gap-1 rounded-xl px-2.5 py-1 font-semibold text-[11px] transition-all',
                            isCurrent
                              ? 'bg-brand-primary text-white shadow-xs font-bold'
                              : isPassed
                                ? 'bg-status-success-container/70 text-status-success'
                                : 'bg-bg-surface-variant text-text-disabled',
                          ].join(' ')}
                        >
                          {isPassed && !isCurrent && <span>✓</span>}
                          {orderStatusLabel(step)}
                        </span>
                        {idx < arr.length - 1 && (
                          <span className="text-text-disabled/40 font-bold">→</span>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            {order.allowedTransitions.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-border-outline/30 bg-bg-surface-variant/30 p-4">
                <label htmlFor="order-next-status" className={labelClass}>
                  Next status
                </label>
                <div className="mt-1">
                  <CustomSelect
                    id="order-next-status-custom"
                    name="next-status"
                    value={targetStatus}
                    placeholder="Choose next status"
                    onChange={(val) => {
                      setTargetStatus(val);
                      setActionError(null);
                    }}
                    options={order.allowedTransitions.map((status) => ({
                      value: status,
                      label: orderStatusLabel(status),
                    }))}
                  />
                </div>
                {/* Synchronized native select connected with label for tests and screen readers */}
                <select
                  id="order-next-status"
                  className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
                  value={targetStatus}
                  onChange={(event) => {
                    setTargetStatus(event.target.value);
                    setActionError(null);
                  }}
                >
                  {order.allowedTransitions.map((status) => (
                    <option key={status} value={status}>
                      {orderStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-text-secondary">
                  Only the transitions the server currently permits are offered here.
                </p>
                <button
                  type="button"
                  className={`${primaryButtonClass} mt-4 w-full`}
                  onClick={() => setConfirmOpen(true)}
                  disabled={saving || targetStatus === ''}
                >
                  Update status
                </button>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-border-outline/20 bg-bg-surface-variant/20 p-4 text-sm text-text-secondary">
                This order is in a terminal state; no further status changes are available.
              </p>
            )}

            <div className="mt-6 border-t border-border-outline/30 pt-4">
              <h3 className="text-sm font-bold text-text-on-surface">Timeline</h3>
              <ol className="mt-3 space-y-3">
                {order.timeline.map((event, index) => (
                  <li key={`${event.status}-${event.at}-${index}`} className="flex items-center justify-between gap-3">
                    <OrderStatusBadge status={event.status} />
                    <span className="text-xs text-text-secondary tabular-nums">
                      {formatDateTime(event.at)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Customer & Shipping Address Card */}
          <div className={`${cardClass} p-6`}>
            <h2 className="text-base font-bold text-text-on-surface">Customer</h2>
            <dl className="mt-3">
              <DetailRow
                label="Name"
                value={`${order.customer.firstName} ${order.customer.lastName}`}
              />
              <DetailRow label="Email" value={order.customer.email} />
            </dl>

            <h2 className="mt-6 border-t border-border-outline/30 pt-4 text-base font-bold text-text-on-surface">
              Shipping address
            </h2>
            <address className="mt-2 text-sm not-italic text-text-on-surface space-y-0.5">
              <p className="font-semibold">{order.shippingAddress.recipientName}</p>
              <p className="text-text-secondary">{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 ? <p className="text-text-secondary">{order.shippingAddress.line2}</p> : null}
              <p className="text-text-secondary">
                {order.shippingAddress.city}, {order.shippingAddress.region}{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p className="text-text-secondary">{order.shippingAddress.country}</p>
            </address>
            <p className="mt-3 text-xs text-text-disabled">
              Snapshotted for this order; later address edits do not change it.
            </p>

            {order.notes ? (
              <div className="mt-6 border-t border-border-outline/30 pt-4">
                <h2 className="text-base font-bold text-text-on-surface">Customer notes</h2>
                <p className="mt-2 rounded-2xl bg-bg-surface-variant/40 p-3 text-sm text-text-on-surface">
                  {order.notes}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        title={
          confirmTarget
            ? `Move ${order.reference} to ${orderStatusLabel(confirmTarget)}?`
            : 'Update order status?'
        }
        onClose={saving ? () => undefined : () => setConfirmOpen(false)}
        footer={
          <>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => setConfirmOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={confirmTarget === 'cancelled' ? dangerButtonClass : primaryButtonClass}
              onClick={() => void applyTransition()}
              disabled={saving}
              aria-busy={saving}
            >
              {saving ? 'Saving…' : confirmTarget ? `Move to ${orderStatusLabel(confirmTarget)}` : 'Save'}
            </button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          The server records this transition in the order timeline and returns the refreshed
          order. Status changes are never applied optimistically.
        </p>
      </Dialog>
    </section>
  );
}
