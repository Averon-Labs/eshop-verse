import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAdminInventory, updateAdminInventory } from '../../api/catalog';
import { ApiError } from '../../api/http';
import type { InventoryRow, Pagination as PaginationMeta } from '../../api/types';
import { Dialog } from '../../components/Dialog';
import { Pagination } from '../../components/Pagination';
import { EmptyPanel, ErrorPanel, FeedbackBanner, TableSkeleton } from '../../components/StatePanels';
import { StatusBadge } from '../../components/StatusBadge';
import { CustomSelect } from '../../components/ui';
import { formatDateTime } from '../../lib/format';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import {
  actionButtonClass,
  cardClass,
  fieldErrorClass,
  helperTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../lib/ui';

const PER_PAGE = 20;
const MAX_QUANTITY = 1_000_000;

function AvailabilityBadge({ inStock }: { inStock: boolean }) {
  if (inStock) {
    return <StatusBadge tone="success">In stock</StatusBadge>;
  }

  return <StatusBadge tone="error">Out of stock</StatusBadge>;
}

function StockQuantityIndicator({ quantity, inStock }: { quantity: number; inStock: boolean }) {
  if (!inStock || quantity === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 font-bold tabular-nums text-status-error">
        <span className="h-2 w-2 rounded-full bg-status-error" aria-hidden="true" />
        <span>{quantity}</span>
      </span>
    );
  }

  const isLow = quantity <= 10;
  return (
    <span className="inline-flex items-center gap-1.5 font-bold tabular-nums text-text-on-surface">
      <span
        className={`h-2 w-2 rounded-full ${isLow ? 'bg-status-warning' : 'bg-status-success'}`}
        aria-hidden="true"
      />
      <span>{quantity}</span>
    </span>
  );
}

function validateQuantity(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed === '') {
    return 'Enter the new quantity.';
  }

  if (!/^\d+$/.test(trimmed)) {
    return 'Enter a whole number of 0 or more.';
  }

  if (Number(trimmed) > MAX_QUANTITY) {
    return `Keep the quantity to ${MAX_QUANTITY} or less.`;
  }

  return null;
}

/**
 * INV-101 — Inventory management with Bento Grid styling and Evergreen Material 3 tokens.
 * Real-time absolute stock adjustments and low-stock alerts.
 */
export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [availability, setAvailability] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [adjustTarget, setAdjustTarget] = useState<InventoryRow | null>(null);
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    listAdminInventory(
      {
        page,
        perPage: PER_PAGE,
        q: debouncedSearch.trim() || undefined,
        inStock: availability === '' ? undefined : availability === 'in-stock',
      },
      controller.signal,
    )
      .then((payload) => {
        if (controller.signal.aborted) {
          return;
        }
        setRows(payload.data);
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
            : 'The inventory could not be loaded. Check your connection and try again.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [page, debouncedSearch, availability, reloadToken]);

  const hasFilters = search.trim() !== '' || availability !== '';

  function clearFilters() {
    setSearch('');
    setAvailability('');
    setPage(1);
  }

  function openAdjust(row: InventoryRow) {
    setAdjustTarget(row);
    setAdjustValue(String(row.quantity));
    setAdjustError(null);
  }

  async function saveQuantity() {
    if (!adjustTarget) {
      return;
    }

    const validationError = validateQuantity(adjustValue);
    setAdjustError(validationError);

    if (validationError) {
      return;
    }

    setSaving(true);

    try {
      const updated = await updateAdminInventory(
        adjustTarget.productId,
        Number(adjustValue.trim()),
      );
      setAdjustTarget(null);
      setFeedback(`Stock for ${updated.name} is now ${updated.quantity}.`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAdjustTarget(null); // The session handler routes back to sign-in.
        return;
      }
      setAdjustError(
        error instanceof ApiError ? error.message : 'The quantity could not be saved. Try again.',
      );
    } finally {
      setSaving(false);
      setReloadToken((token) => token + 1);
    }
  }

  return (
    <section aria-labelledby="inventory-title" className="space-y-5">
      {/* Breadcrumb & Header */}
      <div className="space-y-1.5">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary"
        >
          <span>Catalog</span>
          <span aria-hidden="true" className="text-border-outline">
            /
          </span>
          <span className="text-brand-primary">Inventory</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div>
            <h1 id="inventory-title" className="text-2xl font-bold tracking-tight text-text-on-surface">
              Inventory
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Set the absolute stock quantity per product. Zero means out of stock.
            </p>
          </div>
        </div>
      </div>

      {feedback && <FeedbackBanner message={feedback} />}

      {/* Bento Search and Filters Bar */}
      <form
        className="grid grid-cols-1 gap-3 rounded-2xl border border-border-outline/50 bg-bg-surface p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Inventory filters"
        onSubmit={(event) => event.preventDefault()}
      >
        <div>
          <label htmlFor="inventory-search" className={labelClass}>
            Search inventory
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-disabled">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              id="inventory-search"
              type="search"
              className={`${inputClass} pl-10`}
              value={search}
              placeholder="Product name or SKU"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="inventory-availability" className={labelClass}>
            Availability
          </label>
          <div className="mt-1">
            <CustomSelect
              id="inventory-availability-custom"
              value={availability}
              placeholder="All rows"
              onChange={(val) => {
                setAvailability(val);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All rows' },
                { value: 'in-stock', label: 'In stock' },
                { value: 'out-of-stock', label: 'Out of stock' },
              ]}
            />
          </div>
          <select
            id="inventory-availability"
            className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
            value={availability}
            onChange={(event) => {
              setAvailability(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All rows</option>
            <option value="in-stock">In stock</option>
            <option value="out-of-stock">Out of stock</option>
          </select>
        </div>

        {hasFilters && (
          <div className="flex items-end">
            <button
              type="button"
              className={`${secondaryButtonClass} w-full sm:w-auto`}
              onClick={clearFilters}
            >
              <svg
                className="h-4 w-4 text-text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          </div>
        )}
      </form>

      {/* Main Content Area */}
      {loading && rows.length === 0 ? (
        <div className={cardClass}>
          <TableSkeleton label="Loading inventory" rows={4} />
        </div>
      ) : loadError ? (
        <ErrorPanel
          title="Inventory could not be loaded"
          message={loadError}
          onRetry={() => setReloadToken((token) => token + 1)}
        />
      ) : rows.length === 0 ? (
        hasFilters ? (
          <EmptyPanel
            title="No inventory rows match your filters"
            description="Try a different search or clear the filters."
          >
            <button type="button" className={secondaryButtonClass} onClick={clearFilters}>
              Clear filters
            </button>
          </EmptyPanel>
        ) : (
          <EmptyPanel
            title="No inventory yet"
            description="Inventory rows appear with products. Add a product to get started."
          >
            <Link to="/products/new" className={primaryButtonClass}>
              Add a product
            </Link>
          </EmptyPanel>
        )
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border-outline/50 bg-bg-surface shadow-xs">
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block" aria-busy={loading}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Inventory</caption>
              <thead className="border-b border-border-outline/40 bg-bg-surface-variant/40 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Product
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    SKU
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Quantity
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Availability
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Updated
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-bold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-outline/30">
                {rows.map((row) => (
                  <tr
                    key={row.productId}
                    className="hover:bg-bg-surface-variant/30 transition-colors"
                  >
                    <td className="px-5 py-4 font-bold text-text-on-surface">
                      <Link
                        to={`/products/${row.productId}`}
                        className="hover:text-brand-primary transition-colors line-clamp-1"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-text-secondary">
                      {row.sku ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openAdjust(row)}
                        title="Click to adjust stock"
                        className="group flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 hover:bg-bg-surface-variant/80 transition-colors text-left"
                      >
                        <StockQuantityIndicator quantity={row.quantity} inStock={row.inStock} />
                        <svg
                          className="h-3 w-3 opacity-0 group-hover:opacity-100 text-text-disabled transition-opacity"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <AvailabilityBadge inStock={row.inStock} />
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-text-secondary">
                      {formatDateTime(row.updatedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          aria-label={`Adjust stock for ${row.name}`}
                          className={actionButtonClass}
                          onClick={() => openAdjust(row)}
                        >
                          <svg
                            className="mr-1 h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Adjust stock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <ul className="divide-y divide-border-outline/30 md:hidden" aria-label="Inventory list">
            {rows.map((row) => (
              <li key={row.productId} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-text-on-surface">{row.name}</p>
                    <p className="text-xs text-text-secondary font-mono">SKU {row.sku ?? '—'}</p>
                  </div>
                  <AvailabilityBadge inStock={row.inStock} />
                </div>
                <dl className="grid grid-cols-2 gap-2 rounded-2xl bg-bg-surface-variant/40 p-3 text-xs">
                  <div>
                    <dt className="text-text-secondary">Quantity</dt>
                    <dd className="mt-0.5">
                      <StockQuantityIndicator quantity={row.quantity} inStock={row.inStock} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">Updated</dt>
                    <dd className="font-mono text-text-secondary mt-0.5">
                      {formatDateTime(row.updatedAt)}
                    </dd>
                  </div>
                </dl>
                <div className="pt-1">
                  <button
                    type="button"
                    aria-label={`Adjust stock for ${row.name}`}
                    className={`${actionButtonClass} w-full justify-center`}
                    onClick={() => openAdjust(row)}
                  >
                    Adjust stock
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              busy={loading}
              itemNoun="inventory row"
            />
          )}
        </div>
      )}

      {/* Adjust Stock Dialog */}
      <Dialog
        open={adjustTarget !== null}
        title={adjustTarget ? `Adjust stock — ${adjustTarget.name}` : 'Adjust stock'}
        onClose={saving ? () => undefined : () => setAdjustTarget(null)}
        footer={
          <>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => setAdjustTarget(null)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => void saveQuantity()}
              disabled={saving}
              aria-busy={saving}
            >
              {saving ? 'Saving…' : 'Save quantity'}
            </button>
          </>
        }
      >
        {adjustTarget && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-bg-surface-variant/40 p-3.5 border border-border-outline/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Current quantity:</span>
              <span className="font-bold tabular-nums text-text-on-surface">
                {adjustTarget.quantity}
              </span>
            </div>

            <div>
              <label htmlFor="inventory-quantity" className={labelClass}>
                New quantity
              </label>
              <input
                id="inventory-quantity"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                className={`${inputClass} mt-1`}
                value={adjustValue}
                onChange={(event) => setAdjustValue(event.target.value)}
                aria-describedby={
                  adjustError
                    ? 'inventory-quantity-help inventory-quantity-error'
                    : 'inventory-quantity-help'
                }
              />
              <p id="inventory-quantity-help" className={helperTextClass}>
                The resulting quantity, not a change. Zero means out of stock.
              </p>
              {adjustError && (
                <p id="inventory-quantity-error" role="alert" className={fieldErrorClass}>
                  {adjustError}
                </p>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </section>
  );
}
