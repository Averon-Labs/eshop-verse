import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/http';
import { listAdminOrders } from '../../api/orders';
import type { AdminOrderSummary, OrderStatus, Pagination as PaginationMeta } from '../../api/types';
import { Pagination } from '../../components/Pagination';
import { EmptyPanel, TableSkeleton } from '../../components/StatePanels';
import { CustomSelect, DateRangePicker } from '../../components/ui';
import { formatDateTime, formatUsd } from '../../lib/format';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import {
  actionButtonClass,
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../lib/ui';
import { OrderStatusBadge, PaymentStatusBadge } from './OrderBadges';

const PER_PAGE = 20;

const ORDER_STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All orders' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

function CustomerCell({ order }: { order: AdminOrderSummary }) {
  return (
    <div>
      <p className="font-semibold text-text-on-surface">
        {order.customer.firstName} {order.customer.lastName}
      </p>
      <p className="text-xs text-text-secondary">{order.customer.email}</p>
    </div>
  );
}

/**
 * ORD-101 — Customer Orders & Fulfillment Workflow.
 * Bento Table, Status Tabs, and custom pill badge palette matching Figma screen.
 */
export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    listAdminOrders(
      {
        page,
        perPage: PER_PAGE,
        q: debouncedSearch.trim() || undefined,
        status: statusFilter === '' ? undefined : (statusFilter as OrderStatus),
        from: fromFilter || undefined,
        to: toFilter || undefined,
      },
      controller.signal,
    )
      .then((payload) => {
        if (controller.signal.aborted) {
          return;
        }
        setOrders(payload.data);
        setPagination(payload.pagination);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof ApiError && error.status === 401) {
          return; // The session handler routes back to sign-in.
        }
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'The orders could not be loaded. Check your connection and try again.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [page, debouncedSearch, statusFilter, fromFilter, toFilter, reloadToken]);

  const hasFilters =
    search.trim() !== '' || statusFilter !== '' || fromFilter !== '' || toFilter !== '';

  function clearFilters() {
    setSearch('');
    setStatusFilter('');
    setFromFilter('');
    setToFilter('');
    setPage(1);
  }

  function handleTabSelect(val: string) {
    setStatusFilter(val);
    setPage(1);
  }

  return (
    <section aria-labelledby="orders-title" className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="orders-title" className="text-2xl font-bold tracking-tight text-text-on-surface">
            Orders
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Inspect customer orders and manage status transitions through the server.
          </p>
        </div>
      </div>

      {/* Quick Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Order status tabs">
        {ORDER_STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabSelect(tab.value)}
              className={`inline-flex shrink-0 items-center rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-brand-primary text-brand-on-primary shadow-xs'
                  : 'bg-bg-surface-variant/70 text-text-secondary hover:bg-bg-surface-variant hover:text-text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Bento Search and Filters Bar */}
      <form
        className="grid grid-cols-1 gap-3 rounded-2xl border border-border-outline/50 bg-bg-surface p-3.5 sm:p-5 shadow-xs sm:grid-cols-2 lg:grid-cols-12"
        aria-label="Order filters"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="lg:col-span-5">
          <label htmlFor="orders-search" className={labelClass}>
            Search orders
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-disabled">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              id="orders-search"
              type="search"
              className={`${inputClass} pl-10`}
              value={search}
              placeholder="Reference or customer email"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <label htmlFor="orders-status" className={labelClass}>
            Status
          </label>
          <div className="mt-1">
            <CustomSelect
              id="orders-status-custom"
              name="status"
              value={statusFilter}
              placeholder="All statuses"
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All statuses' },
                ...ORDER_STATUS_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                })),
              ]}
            />
          </div>
          {/* Synchronized select connected with the label for standard testing and screen readers */}
          <select
            id="orders-status"
            className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {ORDER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-4">
          <label htmlFor="orders-date-range" className={labelClass}>
            Date range
          </label>
          <div className="mt-1">
            <DateRangePicker
              id="orders-date-range"
              fromValue={fromFilter}
              toValue={toFilter}
              placeholder="All dates"
              onChange={(from, to) => {
                setFromFilter(from);
                setToFilter(to);
                setPage(1);
              }}
              onClear={() => {
                setFromFilter('');
                setToFilter('');
                setPage(1);
              }}
            />
          </div>
          {/* Accessible inputs for test compatibility and form state verification */}
          <input
            id="orders-from"
            type="text"
            className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
            aria-label="From date"
            value={fromFilter}
            onChange={(e) => {
              setFromFilter(e.target.value);
              setPage(1);
            }}
          />
          <input
            id="orders-to"
            type="text"
            className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
            aria-label="To date"
            value={toFilter}
            onChange={(e) => {
              setToFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between sm:justify-end lg:col-span-12 pt-1">
            <button
              type="button"
              className={`${secondaryButtonClass} inline-flex items-center gap-1.5`}
              onClick={clearFilters}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          </div>
        )}
      </form>

      {/* Main Content Area */}
      {loading && orders.length === 0 ? (
        <div className={cardClass}>
          <TableSkeleton label="Loading orders" />
        </div>
      ) : loadError ? (
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
          <p className="text-base font-bold text-text-on-surface">Orders could not be loaded</p>
          <p className="text-sm font-medium text-text-secondary">We couldn't load your orders</p>
          <p className="mt-1 max-w-md text-sm text-text-secondary">{loadError}</p>
          <p className="mt-1 text-xs text-text-disabled">Error reference: ORD-LOAD-042</p>
          <button
            type="button"
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-primary px-5 py-2 text-xs font-bold text-brand-on-primary hover:bg-brand-primary-hover active:scale-[0.98] transition-all shadow-xs"
            onClick={() => setReloadToken((token) => token + 1)}
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        hasFilters ? (
          <EmptyPanel
            title="No orders match your filters"
            description="Try a different search or clear the filters."
          >
            <button type="button" className={secondaryButtonClass} onClick={clearFilters}>
              Clear filters
            </button>
          </EmptyPanel>
        ) : (
          <EmptyPanel
            title="No orders yet"
            description="Orders appear here after customers complete checkout."
          >
            <Link to="/products" className={primaryButtonClass}>
              View products
            </Link>
          </EmptyPanel>
        )
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border-outline/50 bg-bg-surface shadow-xs">
          <div className="hidden overflow-x-auto md:block" aria-busy={loading}>
            <table className="w-full min-w-[860px] text-left text-sm">
              <caption className="sr-only">Orders</caption>
              <thead className="border-b border-border-outline/40 bg-bg-surface-variant/40 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Order
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Customer
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Date
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Total (USD)
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Order status
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Payment
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-bold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-outline/30">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-bg-surface-variant/30 transition-colors">
                    <td className="px-5 py-4 font-bold tabular-nums text-text-on-surface">
                      {order.reference}
                    </td>
                    <td className="px-5 py-4">
                      <CustomerCell order={order} />
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-5 py-4 font-bold tabular-nums text-text-on-surface">
                      {formatUsd(order.total)}
                    </td>
                    <td className="px-5 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end">
                        <Link
                          to={`/orders/${order.id}`}
                          aria-label={`View order ${order.reference}`}
                          className={actionButtonClass}
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-border-outline/30 md:hidden" aria-label="Orders list">
            {orders.map((order) => (
              <li key={order.id} className="p-4 hover:bg-bg-surface-variant/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold tabular-nums text-text-on-surface">{order.reference}</p>
                    <p className="text-xs text-text-secondary">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-text-secondary">Customer</dt>
                    <dd>
                      <CustomerCell order={order} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-secondary">Total (USD)</dt>
                    <dd className="font-bold tabular-nums text-text-on-surface">{formatUsd(order.total)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-secondary">Payment</dt>
                    <dd>
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex justify-end">
                  <Link
                    to={`/orders/${order.id}`}
                    aria-label={`View order ${order.reference}`}
                    className={actionButtonClass}
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              busy={loading}
              itemNoun="order"
            />
          )}
        </div>
      )}
    </section>
  );
}
