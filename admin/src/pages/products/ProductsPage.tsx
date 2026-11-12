import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  archiveAdminProduct,
  deleteAdminProduct,
  listAdminCategories,
  listAdminProducts,
  updateAdminProduct,
} from '../../api/catalog';
import { ApiError } from '../../api/http';
import type {
  AdminCategory,
  AdminProduct,
  Pagination as PaginationMeta,
  ProductStatus,
} from '../../api/types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Pagination } from '../../components/Pagination';
import { EmptyPanel, ErrorPanel, FeedbackBanner, TableSkeleton } from '../../components/StatePanels';
import { CustomSelect, FloatingBulkBar } from '../../components/ui';
import { formatUsd } from '../../lib/format';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import {
  actionButtonClass,
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../lib/ui';

const PER_PAGE = 20;

function ProductStatusBadge({ status }: { status: ProductStatus }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary-container px-3 py-1 text-xs font-bold text-brand-on-primary-container border border-brand-primary/20">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" aria-hidden="true" />
        Active
      </span>
    );
  }

  if (status === 'inactive') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-surface-variant px-3 py-1 text-xs font-semibold text-text-secondary border border-border-outline/40">
        <span className="h-1.5 w-1.5 rounded-full bg-text-disabled" aria-hidden="true" />
        Inactive
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-surface-variant/80 px-3 py-1 text-xs font-semibold text-text-disabled border border-border-outline/30">
      <span className="h-1.5 w-1.5 rounded-full bg-text-disabled/70" aria-hidden="true" />
      Archived
    </span>
  );
}

function StockValue({ product }: { product: AdminProduct }) {
  if (!product.inStock) {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-status-error">
        <span className="h-2 w-2 rounded-full bg-status-error" aria-hidden="true" />
        <span className="font-semibold text-destructive">Out of stock</span>
      </span>
    );
  }

  const isLow = product.stockQuantity !== null && product.stockQuantity <= 10;
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-text-secondary">
      <span
        className={`h-2 w-2 rounded-full ${isLow ? 'bg-status-warning' : 'bg-status-success'}`}
        aria-hidden="true"
      />
      <span className="tabular-nums font-semibold text-text-on-surface">
        {product.stockQuantity} in stock
      </span>
    </span>
  );
}

function ProductThumb({ product }: { product: AdminProduct }) {
  if (product.imageUrl) {
    return (
      <img
        src={product.imageUrl}
        alt=""
        className="h-12 w-12 shrink-0 rounded-xl border border-border-outline/40 object-cover shadow-xs"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-border-outline/60 bg-bg-surface-variant text-text-disabled"
    >
      <svg
        className="h-5 w-5 opacity-50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
}

/**
 * PROD-101 — Products catalog list with Bento Grid styling and Evergreen Material 3 tokens.
 * Filters and pagination follow the admin API query parameters;
 * archiving keeps row data authoritative by refetching the page after every confirmed action.
 */
export default function ProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [reloadToken, setReloadToken] = useState(0);
  const [archiveTarget, setArchiveTarget] = useState<AdminProduct | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleteConflictProduct, setDeleteConflictProduct] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createdProduct, setCreatedProduct] = useState<{
    id: number;
    name: string;
    sku?: string | null;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkAction, setBulkAction] = useState<'activate' | 'archive' | 'delete' | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const isAllSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));
  const isSomeSelected = products.some((p) => selectedIds.has(p.id)) && !isAllSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        products.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        products.forEach((p) => next.add(p.id));
        return next;
      });
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  useEffect(() => {
    clearSelection();
  }, [page, debouncedSearch, categoryFilter, statusFilter]);

  async function confirmBulkAction() {
    if (!bulkAction || selectedIds.size === 0) return;
    setBulkBusy(true);
    setActionError(null);

    const ids = Array.from(selectedIds);
    let successCount = 0;
    const errors: string[] = [];

    for (const id of ids) {
      try {
        if (bulkAction === 'archive') {
          await archiveAdminProduct(id);
          successCount++;
        } else if (bulkAction === 'delete') {
          await deleteAdminProduct(id);
          successCount++;
        } else if (bulkAction === 'activate') {
          const prod = products.find((p) => p.id === id);
          if (prod && prod.status !== 'active') {
            await updateAdminProduct(id, {
              name: prod.name,
              description: prod.description ?? null,
              price: prod.price,
              sku: prod.sku ?? null,
              categoryId: prod.categoryId,
              status: 'active',
              imageUrls: [],
            });
            successCount++;
          } else {
            successCount++;
          }
        }
      } catch (err) {
        if (err instanceof ApiError) {
          errors.push(err.message);
        } else {
          errors.push('Action failed on one or more items.');
        }
      }
    }

    setBulkBusy(false);
    setBulkAction(null);
    clearSelection();
    setReloadToken((t) => t + 1);

    if (errors.length > 0) {
      setActionError(`${errors.length} product(s) could not be updated: ${errors[0]}`);
    }
    if (successCount > 0) {
      const actionPast =
        bulkAction === 'archive' ? 'archived' : bulkAction === 'delete' ? 'deleted' : 'activated';
      setFeedback(`${successCount} product(s) successfully ${actionPast}.`);
    }
  }

  // Feedback handed over by the product form after a create/update.
  useEffect(() => {
    const state = location.state as {
      feedback?: string;
      createdProduct?: { id: number; name: string; sku?: string | null };
    } | null;

    if (state?.feedback) {
      setFeedback(state.feedback);
      if (state.createdProduct) {
        setCreatedProduct(state.createdProduct);
      }
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location, navigate]);

  // Category options for the filter; a failure here is non-blocking.
  useEffect(() => {
    const controller = new AbortController();

    listAdminCategories(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setCategories(items);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    listAdminProducts(
      {
        page,
        perPage: PER_PAGE,
        q: debouncedSearch.trim() || undefined,
        categoryId: categoryFilter === '' ? undefined : Number(categoryFilter),
        status: statusFilter === '' ? undefined : (statusFilter as ProductStatus),
      },
      controller.signal,
    )
      .then((payload) => {
        if (controller.signal.aborted) {
          return;
        }
        setProducts(payload.data);
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
            : 'The products could not be loaded. Check your connection and try again.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [page, debouncedSearch, categoryFilter, statusFilter, reloadToken]);

  const hasFilters = search.trim() !== '' || categoryFilter !== '' || statusFilter !== '';

  function clearFilters() {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setPage(1);
  }

  function handleDuplicate(product: AdminProduct) {
    navigate('/products/new', {
      state: {
        duplicateProduct: {
          name: product.name,
          sku: product.sku,
          price: product.price,
          categoryId: product.categoryId,
          status: product.status,
          description: product.description ?? '',
        },
      },
    });
  }

  async function confirmArchive() {
    if (!archiveTarget) {
      return;
    }

    setArchiving(true);
    setActionError(null);

    try {
      const archived = await archiveAdminProduct(archiveTarget.id);
      setArchiveTarget(null);
      setFeedback(`${archived.name} was archived.`);
    } catch (error) {
      setArchiveTarget(null);
      setActionError(
        error instanceof ApiError ? error.message : 'The product could not be archived. Try again.',
      );
    } finally {
      setArchiving(false);
      setReloadToken((token) => token + 1);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setActionError(null);

    try {
      const removed = deleteTarget.name;
      await deleteAdminProduct(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteConflictProduct(null);
      setFeedback(`${removed} was deleted, including its images.`);
    } catch (error) {
      const conflictTarget = deleteTarget;
      setDeleteTarget(null);
      if (error instanceof ApiError && error.code === 'PRODUCT_HAS_ORDERS') {
        setDeleteConflictProduct(conflictTarget);
        setActionError(
          `${error.message} Would you like to archive it instead?`,
        );
      } else {
        setDeleteConflictProduct(null);
        setActionError(
          error instanceof ApiError ? error.message : 'The product could not be deleted. Try again.',
        );
      }
    } finally {
      setDeleting(false);
      setReloadToken((token) => token + 1);
    }
  }

  return (
    <section aria-labelledby="products-title" className="space-y-5">
      {/* Breadcrumb & Page Header */}
      <div className="space-y-1.5">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary"
        >
          <span>Catalog</span>
          <span aria-hidden="true" className="text-border-outline">
            /
          </span>
          <span className="text-brand-primary">Products</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div>
            <h1 id="products-title" className="text-2xl font-bold tracking-tight text-text-on-surface">
              Products
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Manage your catalog and keep product information up to date.
            </p>
          </div>
          <Link
            to="/products/new"
            aria-label="Add product"
            className={primaryButtonClass}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create product</span>
          </Link>
        </div>
      </div>

      {feedback && <FeedbackBanner message={feedback} />}

      {createdProduct && (
        <div
          role="region"
          aria-label="Product created successfully"
          className="relative overflow-hidden rounded-3xl border border-border-outline/50 bg-bg-surface p-6 sm:p-7 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary-container text-brand-primary">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-text-on-surface">Product created successfully</h2>
                <p className="mt-0.5 text-xs text-text-secondary max-w-lg">
                  Your new product{' '}
                  <span className="font-semibold text-text-on-surface">{createdProduct.name}</span> is
                  now saved in the catalog and ready for review before it appears in your storefront.
                </p>
                <p className="mt-1 text-[11px] font-mono text-text-disabled">
                  Product ID: EVG-{String(createdProduct.id).padStart(4, '0')} · Saved just now
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <Link
                to={`/products/${createdProduct.id}`}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-primary px-4 text-xs font-bold text-brand-on-primary hover:bg-brand-primary-hover transition-colors"
              >
                View product
              </Link>
              <Link
                to="/products/new"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-border-outline/60 bg-bg-surface px-4 text-xs font-semibold text-text-on-surface hover:bg-bg-surface-variant transition-colors"
              >
                Add another
              </Link>
              <button
                type="button"
                aria-label="Dismiss message"
                onClick={() => setCreatedProduct(null)}
                className="p-1.5 rounded-lg text-text-disabled hover:text-text-secondary hover:bg-bg-surface-variant transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-status-error/30 bg-status-error-container/30 px-4 py-3 text-sm font-semibold text-status-on-error-container shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <svg
              className="h-5 w-5 shrink-0 text-status-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{actionError}</span>
          </div>
          {deleteConflictProduct && (
            <button
              type="button"
              className="inline-flex min-h-8 items-center rounded-xl bg-status-error px-3.5 text-xs font-bold text-white hover:opacity-90 active:scale-95 transition-all"
              onClick={() => {
                const target = deleteConflictProduct;
                setDeleteConflictProduct(null);
                setActionError(null);
                setArchiveTarget(target);
              }}
            >
              Archive product instead
            </button>
          )}
        </div>
      )}

      {/* Bento Search and Filters Bar */}
      <form
        className="grid grid-cols-1 gap-3 rounded-2xl border border-border-outline/50 bg-bg-surface p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Product filters"
        onSubmit={(event) => event.preventDefault()}
      >
        <div>
          <label htmlFor="products-search" className={labelClass}>
            Search products
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
              id="products-search"
              type="search"
              className={`${inputClass} pl-10`}
              value={search}
              placeholder="Name or SKU"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="products-category" className={labelClass}>
            Category
          </label>
          <div className="mt-1">
            <CustomSelect
              id="products-category-custom"
              value={categoryFilter}
              placeholder="All categories"
              onChange={(val) => {
                setCategoryFilter(val);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All categories' },
                ...categories.map((c) => ({
                  value: String(c.id),
                  label: `${c.name}${c.status === 'archived' ? ' (archived)' : ''}`,
                })),
              ]}
            />
          </div>
          <select
            id="products-category"
            className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.status === 'archived' ? ' (archived)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="products-status" className={labelClass}>
            Status
          </label>
          <div className="mt-1">
            <CustomSelect
              id="products-status-custom"
              value={statusFilter}
              placeholder="All statuses"
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          </div>
          <select
            id="products-status"
            className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
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
      {loading && products.length === 0 ? (
        <div className={cardClass}>
          <TableSkeleton label="Loading products" />
        </div>
      ) : loadError ? (
        <ErrorPanel
          title="Products could not be loaded"
          message={loadError}
          onRetry={() => setReloadToken((token) => token + 1)}
        />
      ) : products.length === 0 ? (
        hasFilters ? (
          <EmptyPanel
            title="No products match your filters"
            description="Try a different search or clear the filters."
          >
            <button type="button" className={secondaryButtonClass} onClick={clearFilters}>
              Clear filters
            </button>
          </EmptyPanel>
        ) : (
          <EmptyPanel
            title="No products yet"
            description="Your catalog is ready for its first product. Add the first product to start building the catalog."
          >
            <Link to="/products/new" aria-label="Add product" className={primaryButtonClass}>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add product</span>
            </Link>
          </EmptyPanel>
        )
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border-outline/50 bg-bg-surface shadow-xs">
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block" aria-busy={loading}>
            <table className="w-full min-w-[780px] text-left text-sm">
              <caption className="sr-only">Products</caption>
              <thead className="border-b border-border-outline/40 bg-bg-surface-variant/40 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                <tr>
                  <th scope="col" className="w-12 px-5 py-3.5">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      aria-label="Select all products on this page"
                      className="h-4 w-4 rounded border-border-outline/60 text-brand-primary focus:ring-brand-primary"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Product
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    SKU
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Category
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Price (USD)
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Stock
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-bold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-outline/30">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={`transition-colors ${
                      selectedIds.has(product.id)
                        ? 'bg-brand-primary-container/20 hover:bg-brand-primary-container/30'
                        : 'hover:bg-bg-surface-variant/30'
                    }`}
                  >
                    <td className="w-12 px-5 py-4">
                      <input
                        type="checkbox"
                        aria-label={`Select ${product.name}`}
                        className="h-4 w-4 rounded border-border-outline/60 text-brand-primary focus:ring-brand-primary"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        <ProductThumb product={product} />
                        <div className="min-w-0">
                          <Link
                            to={`/products/${product.id}`}
                            className="font-bold text-text-on-surface hover:text-brand-primary transition-colors line-clamp-1"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-text-secondary">
                            SKU {product.sku ?? '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-text-secondary">
                      {product.sku ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-lg bg-bg-surface-variant px-2.5 py-1 text-xs font-semibold text-text-secondary border border-border-outline/30">
                        {product.categoryName ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold tabular-nums text-text-on-surface">
                      {formatUsd(product.price)}
                    </td>
                    <td className="px-5 py-4">
                      <StockValue product={product} />
                    </td>
                    <td className="px-5 py-4">
                      <ProductStatusBadge status={product.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/products/${product.id}/edit`}
                          aria-label={`Edit ${product.name}`}
                          className={actionButtonClass}
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
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                          Edit
                        </Link>
                        <button
                          type="button"
                          aria-label={`Duplicate ${product.name}`}
                          className={actionButtonClass}
                          onClick={() => handleDuplicate(product)}
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
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Duplicate
                        </button>
                        {product.status === 'archived' ? (
                          <span className="px-3 py-1.5 text-xs font-semibold text-text-disabled">
                            Archived
                          </span>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Archive ${product.name}`}
                            className={actionButtonClass}
                            onClick={() => {
                              setActionError(null);
                              setArchiveTarget(product);
                            }}
                          >
                            Archive
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Delete ${product.name}`}
                          className="inline-flex min-h-9 items-center rounded-xl px-3 text-xs font-semibold text-status-error hover:bg-status-error-container/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                          onClick={() => {
                            setActionError(null);
                            setDeleteTarget(product);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <ul className="divide-y divide-border-outline/30 md:hidden" aria-label="Products list">
            {products.map((product) => (
              <li
                key={product.id}
                className={`p-4 space-y-3 transition-colors ${
                  selectedIds.has(product.id) ? 'bg-brand-primary-container/15' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${product.name}`}
                      className="h-4 w-4 rounded border-border-outline/60 text-brand-primary focus:ring-brand-primary"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                    />
                    <ProductThumb product={product} />
                    <div>
                      <Link
                        to={`/products/${product.id}`}
                        className="font-bold text-text-on-surface hover:text-brand-primary transition-colors"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-text-secondary">SKU {product.sku ?? '—'}</p>
                    </div>
                  </div>
                  <ProductStatusBadge status={product.status} />
                </div>
                <dl className="grid grid-cols-2 gap-2 rounded-2xl bg-bg-surface-variant/40 p-3 text-xs">
                  <div>
                    <dt className="text-text-secondary">Category</dt>
                    <dd className="font-semibold text-text-on-surface">
                      {product.categoryName ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">Price (USD)</dt>
                    <dd className="font-bold tabular-nums text-text-on-surface">
                      {formatUsd(product.price)}
                    </dd>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-border-outline/30">
                    <dt className="text-text-secondary">Stock</dt>
                    <dd className="mt-0.5">
                      <StockValue product={product} />
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Link
                    to={`/products/${product.id}/edit`}
                    aria-label={`Edit ${product.name}`}
                    className={`${actionButtonClass} flex-1 justify-center`}
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    aria-label={`Duplicate ${product.name}`}
                    className={`${actionButtonClass} flex-1 justify-center`}
                    onClick={() => handleDuplicate(product)}
                  >
                    Duplicate
                  </button>
                  {product.status !== 'archived' && (
                    <button
                      type="button"
                      aria-label={`Archive ${product.name}`}
                      className={`${actionButtonClass} flex-1 justify-center`}
                      onClick={() => {
                        setActionError(null);
                        setArchiveTarget(product);
                      }}
                    >
                      Archive
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Delete ${product.name}`}
                    className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl px-3 text-xs font-semibold text-status-error hover:bg-status-error-container/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    onClick={() => {
                      setActionError(null);
                      setDeleteTarget(product);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Bento Pagination */}
          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              busy={loading}
              itemNoun="product"
            />
          )}
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmDialog
        open={archiveTarget !== null}
        title={archiveTarget ? `Archive ${archiveTarget.name}?` : 'Archive product?'}
        description="The product is hidden from the public catalog. Existing orders keep their snapshots and stock is not changed."
        confirmLabel="Archive product"
        busy={archiving}
        onCancel={() => {
          if (!archiving) {
            setArchiveTarget(null);
          }
        }}
        onConfirm={() => void confirmArchive()}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? `Delete ${deleteTarget.name}?` : 'Delete product?'}
        description="The product and its uploaded images are removed from the server for good. Archive it instead if an order already references it."
        confirmLabel="Delete product"
        busy={deleting}
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => void confirmDelete()}
      />

      {/* Floating Bulk Action Bar */}
      <FloatingBulkBar
        selectedCount={selectedIds.size}
        busy={bulkBusy}
        onActivate={() => setBulkAction('activate')}
        onArchive={() => setBulkAction('archive')}
        onDelete={() => setBulkAction('delete')}
        onClear={clearSelection}
      />

      {/* Bulk Action Confirmation Dialog */}
      <ConfirmDialog
        open={bulkAction !== null}
        title={
          bulkAction === 'archive'
            ? `Archive ${selectedIds.size} product${selectedIds.size > 1 ? 's' : ''}?`
            : bulkAction === 'delete'
              ? `Delete ${selectedIds.size} product${selectedIds.size > 1 ? 's' : ''}?`
              : `Activate ${selectedIds.size} product${selectedIds.size > 1 ? 's' : ''}?`
        }
        description={
          bulkAction === 'archive'
            ? 'Selected products will be hidden from the public catalog.'
            : bulkAction === 'delete'
              ? 'Selected products and their images will be permanently removed. Products with existing orders cannot be deleted.'
              : 'Selected products will be set to active and visible in the public catalog.'
        }
        confirmLabel={
          bulkAction === 'archive'
            ? 'Archive selected'
            : bulkAction === 'delete'
              ? 'Delete selected'
              : 'Activate selected'
        }
        busy={bulkBusy}
        onCancel={() => {
          if (!bulkBusy) {
            setBulkAction(null);
          }
        }}
        onConfirm={() => void confirmBulkAction()}
      />
    </section>
  );
}
