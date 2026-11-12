import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminSalesReport } from '../../api/reports';
import { ApiError } from '../../api/http';
import type { SalesReport } from '../../api/types';
import { EmptyPanel, ErrorPanel } from '../../components/StatePanels';
import { DateRangePicker } from '../../components/ui';
import { formatUsd } from '../../lib/format';
import { OrderStatusBadge } from '../orders/OrderBadges';
import {
  cardClass,
  fieldErrorClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../lib/ui';

const PRESETS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
];

const MONEY_PATTERN = /^(\d+)\.(\d{2})$/;

/** Parse the contract's fixed-precision money string into integer cents. */
function toCents(value: string): number {
  const match = MONEY_PATTERN.exec(value);
  return match ? Number(match[1]) * 100 + Number(match[2]) : 0;
}

/** UTC calendar date `offsetDays` before today, as `YYYY-MM-DD`. */
function utcDay(offsetDays: number): string {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(todayUtc - offsetDays * 86_400_000).toISOString().slice(0, 10);
}

function lastDays(days: number): { from: string; to: string } {
  return { from: utcDay(days - 1), to: utcDay(0) };
}

/** `2026-10-29` → `Oct 29`, parsed and rendered in UTC. */
function formatShortDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** Fixed-height KPI/report skeleton so the first paint matches the loaded layout. */
function ReportSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading sales report" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className={`${cardClass} h-32 animate-pulse bg-bg-surface-variant/70`}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className={`${cardClass} h-80 animate-pulse bg-bg-surface-variant/70`}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          aria-hidden="true"
          className={`${cardClass} h-72 animate-pulse bg-bg-surface-variant/70`}
        />
        <div
          aria-hidden="true"
          className={`${cardClass} h-72 animate-pulse bg-bg-surface-variant/70`}
        />
      </div>
    </div>
  );
}

function SummaryCards({ report }: { report: SalesReport }) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Gross Sales / Revenue */}
      <div className={`${cardClass} p-5 flex flex-col justify-between hover:border-brand-primary/30 transition-colors`}>
        <dt className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Revenue
        </dt>
        <div className="mt-2">
          <dd className="text-2xl font-extrabold tabular-nums tracking-tight text-text-on-surface">
            {formatUsd(report.summary.revenue)}
          </dd>
          <p className="mt-1 text-xs text-text-secondary">Paid orders incl. shipping</p>
        </div>
      </div>

      {/* Paid Orders */}
      <div className={`${cardClass} p-5 flex flex-col justify-between hover:border-brand-primary/30 transition-colors`}>
        <dt className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Paid orders
        </dt>
        <div className="mt-2">
          <dd className="text-2xl font-extrabold tabular-nums tracking-tight text-text-on-surface">
            {report.summary.paidOrders}
          </dd>
          <p className="mt-1 text-xs text-text-secondary">
            of {report.summary.totalOrders} orders in range
          </p>
        </div>
      </div>

      {/* Items Sold */}
      <div className={`${cardClass} p-5 flex flex-col justify-between hover:border-brand-primary/30 transition-colors`}>
        <dt className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Items sold
        </dt>
        <div className="mt-2">
          <dd className="text-2xl font-extrabold tabular-nums tracking-tight text-text-on-surface">
            {report.summary.itemsSold}
          </dd>
          <p className="mt-1 text-xs text-text-secondary">Units in paid orders</p>
        </div>
      </div>

      {/* Average Order Value */}
      <div className={`${cardClass} p-5 flex flex-col justify-between hover:border-brand-primary/30 transition-colors`}>
        <dt className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Average order value
        </dt>
        <div className="mt-2">
          <dd className="text-2xl font-extrabold tabular-nums tracking-tight text-text-on-surface">
            {formatUsd(report.summary.averageOrderValue)}
          </dd>
          <p className="mt-1 text-xs text-text-secondary">Per paid order</p>
        </div>
      </div>
    </dl>
  );
}

function RevenueChart({ report }: { report: SalesReport }) {
  const maxCents = Math.max(...report.daily.map((day) => toCents(day.revenue)), 0);

  return (
    <figure className={`${cardClass} p-6`} aria-labelledby="reports-revenue-title">
      <figcaption className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 id="reports-revenue-title" className="text-base font-bold text-text-on-surface">
            Daily revenue
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            {formatUsd(report.summary.revenue)} across {report.summary.paidOrders} paid orders ·{' '}
            {formatShortDate(report.range.from)}–{formatShortDate(report.range.to)} (UTC)
          </p>
        </div>
      </figcaption>

      <div aria-hidden="true" className="mt-6 h-60 border-b border-border-outline/30 pb-2">
        <div className="flex h-full items-end gap-1.5 sm:gap-2">
          {report.daily.map((day) => {
            const height = maxCents === 0 ? 0 : Math.max(4, (toCents(day.revenue) / maxCents) * 100);
            return (
              <div key={day.date} className="group relative flex h-full flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-brand-primary/80 group-hover:bg-brand-primary transition-all"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${formatUsd(day.revenue)}`}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex justify-between text-xs font-semibold text-text-secondary">
        <span>{formatShortDate(report.range.from)}</span>
        <span>{formatShortDate(report.range.to)}</span>
      </div>

      <table className="sr-only">
        <caption>Daily revenue values</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Revenue</th>
            <th scope="col">Paid orders</th>
            <th scope="col">Items sold</th>
          </tr>
        </thead>
        <tbody>
          {report.daily.map((day) => (
            <tr key={day.date}>
              <th scope="row">{day.date}</th>
              <td>{formatUsd(day.revenue)}</td>
              <td>{day.orders}</td>
              <td>{day.itemsSold}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function TopProducts({ report }: { report: SalesReport }) {
  return (
    <section aria-labelledby="top-products-title" className={`${cardClass} p-6`}>
      <h2 id="top-products-title" className="text-base font-bold text-text-on-surface">
        Top products
      </h2>
      <p className="mt-1 text-xs text-text-secondary">Ranked by revenue in the selected range.</p>

      {report.topProducts.length === 0 ? (
        <p className="mt-6 text-sm text-text-secondary">No paid products in this range.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Top products by revenue</caption>
            <thead className="border-b border-border-outline/40 bg-bg-surface-variant/30 text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th scope="col" className="px-3 py-2.5 font-bold">
                  Product
                </th>
                <th scope="col" className="px-3 py-2.5 text-right font-bold">
                  Units
                </th>
                <th scope="col" className="px-3 py-2.5 text-right font-bold">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-outline/30">
              {report.topProducts.map((product) => (
                <tr key={product.productId} className="hover:bg-bg-surface-variant/30 transition-colors">
                  <th scope="row" className="px-3 py-3 font-semibold text-text-on-surface">
                    {product.name}
                  </th>
                  <td className="px-3 py-3 text-right tabular-nums text-text-on-surface">{product.quantity}</td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-text-on-surface">{formatUsd(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusMix({ report }: { report: SalesReport }) {
  const maxOrders = Math.max(...report.ordersByStatus.map((row) => row.orders), 0);

  return (
    <section aria-labelledby="status-mix-title" className={`${cardClass} p-6`}>
      <h2 id="status-mix-title" className="text-base font-bold text-text-on-surface">
        Orders by status
      </h2>
      <p className="mt-1 text-xs text-text-secondary">
        Every order created in the range, including unpaid and cancelled orders.
      </p>

      <ul aria-label="Orders by status" className="mt-5 space-y-3.5">
        {report.ordersByStatus.map((row) => (
          <li key={row.status}>
            <div className="flex items-center justify-between gap-3">
              <OrderStatusBadge status={row.status} />
              <span className="text-sm font-bold tabular-nums text-text-on-surface">
                {row.orders} <span className="font-normal text-text-secondary">orders</span>
              </span>
            </div>
            <div aria-hidden="true" className="mt-2 h-2 rounded-full bg-bg-surface-variant">
              <div
                className="h-full rounded-full bg-brand-primary"
                style={{ width: maxOrders === 0 ? '0%' : `${(row.orders / maxOrders) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * DASH-101 / RPT-002 — Overview Command Center (Sales Reports).
 * KPI Bento Cards, Daily Revenue Chart, Top Products, and Status Mix.
 */
export default function ReportsPage() {
  const [range, setRange] = useState(() => lastDays(30));
  const [fromDraft, setFromDraft] = useState(() => range.from);
  const [toDraft, setToDraft] = useState(() => range.to);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    getAdminSalesReport({ from: range.from, to: range.to }, controller.signal)
      .then((payload) => {
        if (!controller.signal.aborted) {
          setReport(payload);
        }
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
            ? (error.fieldError('from') ?? error.message)
            : 'The sales report could not be loaded. Check your connection and try again.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [range, reloadToken]);

  function isPreset(days: number): boolean {
    const preset = lastDays(days);
    return range.from === preset.from && range.to === preset.to;
  }

  function selectPreset(days: number) {
    const preset = lastDays(days);
    setRange(preset);
    setFromDraft(preset.from);
    setToDraft(preset.to);
    setRangeError(null);
  }

  function applyRange() {
    if (fromDraft !== '' && toDraft !== '' && fromDraft > toDraft) {
      setRangeError('The from date must not be after the to date.');
      return;
    }

    setRangeError(null);
    setRange({ from: fromDraft, to: toDraft });
  }

  const hasReport = report !== null && !loadError;

  return (
    <section aria-labelledby="reports-title" className="space-y-6">
      {/* Overview Header with Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="reports-title" className="text-2xl font-bold tracking-tight text-text-on-surface">
            Sales reports
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Overview command center · Paid revenue and order mix from completed payments. Dates and daily buckets use UTC.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/products/new" className={primaryButtonClass}>
            + Create product
          </Link>
          <Link to="/orders" className={secondaryButtonClass}>
            View orders
          </Link>
        </div>
      </div>

      {/* Date Range & Presets Filter Card */}
      <form
        className={`${cardClass} p-5`}
        aria-label="Report range"
        onSubmit={(event) => {
          event.preventDefault();
          applyRange();
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary mr-1">
            Presets:
          </span>
          {PRESETS.map((preset) => {
            const active = isPreset(preset.days);
            return (
              <button
                key={preset.days}
                type="button"
                className={`inline-flex items-center rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-brand-primary text-brand-on-primary shadow-xs'
                    : 'bg-bg-surface-variant/70 text-text-secondary hover:bg-bg-surface-variant hover:text-text-on-surface'
                }`}
                aria-pressed={active}
                onClick={() => selectPreset(preset.days)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label htmlFor="reports-date-range" className={labelClass}>
              Custom date range
            </label>
            <div className="mt-1">
              <DateRangePicker
                id="reports-date-range"
                fromValue={fromDraft}
                toValue={toDraft}
                placeholder="Choose custom range"
                onChange={(from, to) => {
                  setFromDraft(from);
                  setToDraft(to);
                  setRangeError(null);
                }}
                onClear={() => {
                  setFromDraft('');
                  setToDraft('');
                  setRangeError(null);
                }}
              />
            </div>
            {/* Synchronized accessible inputs for form submit, validation, and test harness */}
            <input
              id="reports-from"
              type="text"
              className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
              aria-label="From date"
              value={fromDraft}
              onChange={(event) => {
                setFromDraft(event.target.value);
                setRangeError(null);
              }}
            />
            <input
              id="reports-to"
              type="text"
              className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
              aria-label="To date"
              value={toDraft}
              onChange={(event) => {
                setToDraft(event.target.value);
                setRangeError(null);
              }}
              aria-describedby={rangeError ? 'reports-range-error' : undefined}
            />
          </div>
          <button type="submit" className={primaryButtonClass}>
            Apply range
          </button>
        </div>
        <p className="mt-2 text-xs text-text-disabled">
          Inclusive UTC dates. With no dates, the server returns the last 30 days; the maximum span
          is 366 days.
        </p>
        {rangeError && (
          <p id="reports-range-error" role="alert" className={`${fieldErrorClass} mt-2`}>
            {rangeError}
          </p>
        )}
      </form>

      {/* Main Content Area */}
      {loading && report === null ? (
        <ReportSkeleton />
      ) : !hasReport ? (
        loadError ? (
          <ErrorPanel
            title="Sales report could not be loaded"
            message={loadError}
            onRetry={() => setReloadToken((token) => token + 1)}
          />
        ) : null
      ) : report.summary.totalOrders === 0 ? (
        <EmptyPanel
          title="No orders in this range"
          description="Orders appear in the report once customers check out in the selected UTC dates."
        />
      ) : (
        <div className="space-y-6" aria-busy={loading}>
          <SummaryCards report={report} />
          <RevenueChart report={report} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopProducts report={report} />
            <StatusMix report={report} />
          </div>
        </div>
      )}
    </section>
  );
}
