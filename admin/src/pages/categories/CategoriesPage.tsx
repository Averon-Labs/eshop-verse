import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  archiveAdminCategory,
  createAdminCategory,
  listAdminCategories,
  restoreAdminCategory,
  updateAdminCategory,
} from '../../api/catalog';
import { ApiError } from '../../api/http';
import type { AdminCategory, CategoryInput, CategoryStatus } from '../../api/types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Dialog } from '../../components/Dialog';
import { EmptyPanel, ErrorPanel, FeedbackBanner, TableSkeleton } from '../../components/StatePanels';
import { StatusBadge } from '../../components/StatusBadge';
import { CustomSelect } from '../../components/ui';
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

function CategoryStatusBadge({ status }: { status: CategoryStatus }) {
  if (status === 'active') {
    return <StatusBadge tone="success">Active</StatusBadge>;
  }

  return <StatusBadge tone="neutral">Archived</StatusBadge>;
}

/** Android standard category presets that map to CategoryIconResolver.java */
const ANDROID_PRESETS = [
  'T-Shirts',
  'Shirts',
  'Pants',
  'Dresses',
  'Jackets',
  'Activewear',
  'Shoes',
  'Accessories',
  'Bags',
];

/** Merge the documented `details[]` messages with the top-level message. */
function describeActionError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  const extra = error.details
    .map((detail) => detail.message)
    .filter((message) => message.length > 0)
    .join(' ');

  return extra ? `${error.message} ${extra}` : error.message;
}

/**
 * CAT-101 — Categories management with Bento Grid styling and Evergreen Material 3 tokens.
 * Organizes the catalog and ensures full compatibility with the Android customer app.
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formSortOrder, setFormSortOrder] = useState('0');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [archiveTarget, setArchiveTarget] = useState<AdminCategory | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    listAdminCategories(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setCategories(items);
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
            ? error.message
            : 'The categories could not be loaded. Check your connection and try again.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [reloadToken]);

  const hasFilters = search.trim() !== '' || statusFilter !== '';
  const visibleCategories = categories.filter((category) => {
    const matchesSearch =
      search.trim() === '' ||
      category.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesStatus = statusFilter === '' || category.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function clearFilters() {
    setSearch('');
    setStatusFilter('');
  }

  function nextSortOrder(): number {
    return categories.reduce((next, category) => Math.max(next, category.sortOrder + 1), 0);
  }

  function openCreate() {
    setEditing(null);
    setFormName('');
    setFormSortOrder(String(nextSortOrder()));
    setFormErrors({});
    setFormAlert(null);
    setFormOpen(true);
  }

  function openEdit(category: AdminCategory) {
    setEditing(category);
    setFormName(category.name);
    setFormSortOrder(String(category.sortOrder));
    setFormErrors({});
    setFormAlert(null);
    setFormOpen(true);
  }

  function validateCategoryForm(): boolean {
    const errors: Record<string, string> = {};
    const name = formName.trim();
    const order = formSortOrder.trim();

    if (!name) {
      errors.name = 'Name is required.';
    } else if (name.length > 80) {
      errors.name = 'Keep the name to 80 characters or fewer.';
    }

    if (order === '') {
      errors.sortOrder = 'Display order is required.';
    } else if (!/^\d+$/.test(order) || Number(order) > 9999) {
      errors.sortOrder = 'Enter a whole number between 0 and 9999.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormAlert(null);

    if (!validateCategoryForm()) {
      return;
    }

    setSaving(true);
    const input: CategoryInput = {
      name: formName.trim(),
      sortOrder: Number(formSortOrder.trim()),
    };

    try {
      if (editing) {
        const saved = await updateAdminCategory(editing.id, input);
        setFormOpen(false);
        setFeedback(`${saved.name} was saved.`);
      } else {
        const created = await createAdminCategory(input);
        setFormOpen(false);
        setFeedback(`${created.name} was created.`);
      }
      setReloadToken((token) => token + 1);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CATEGORY_NAME_TAKEN') {
        setFormErrors({ name: error.message });
      } else if (error instanceof ApiError && error.status === 422) {
        const mapped: Record<string, string> = {};
        for (const detail of error.details) {
          if (detail.field) {
            mapped[detail.field] = detail.message;
          }
        }
        setFormErrors(mapped);
        setFormAlert(
          Object.keys(mapped).length === 0 ? error.message : 'Check the highlighted fields.',
        );
      } else {
        setFormAlert(
          error instanceof ApiError ? error.message : 'The category could not be saved. Try again.',
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmArchive() {
    if (!archiveTarget) {
      return;
    }

    setArchiving(true);
    setActionError(null);

    try {
      const archived = await archiveAdminCategory(archiveTarget.id);
      setArchiveTarget(null);
      setFeedback(`${archived.name} was archived.`);
    } catch (error) {
      setArchiveTarget(null);
      setActionError(describeActionError(error, 'The category could not be archived. Try again.'));
    } finally {
      setArchiving(false);
      setReloadToken((token) => token + 1);
    }
  }

  async function restore(category: AdminCategory) {
    setRestoringId(category.id);
    setActionError(null);

    try {
      const restored = await restoreAdminCategory(category.id);
      setFeedback(`${restored.name} was restored.`);
    } catch (error) {
      setActionError(describeActionError(error, 'The category could not be restored. Try again.'));
    } finally {
      setRestoringId(null);
      setReloadToken((token) => token + 1);
    }
  }

  function renderActions(category: AdminCategory) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          aria-label={`Edit ${category.name}`}
          className={actionButtonClass}
          onClick={() => openEdit(category)}
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
        </button>
        {category.status === 'active' ? (
          <button
            type="button"
            aria-label={`Archive ${category.name}`}
            className={actionButtonClass}
            onClick={() => {
              setActionError(null);
              setArchiveTarget(category);
            }}
          >
            Archive
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Restore ${category.name}`}
            className="inline-flex min-h-9 items-center rounded-xl bg-status-success-container/70 px-3 text-xs font-bold text-status-on-success-container hover:bg-status-success-container transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void restore(category)}
            disabled={restoringId === category.id}
            aria-busy={restoringId === category.id}
          >
            {restoringId === category.id ? 'Restoring…' : 'Restore'}
          </button>
        )}
      </div>
    );
  }

  return (
    <section aria-labelledby="categories-title" className="space-y-5">
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
          <span className="text-brand-primary">Categories</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div>
            <h1 id="categories-title" className="text-2xl font-bold tracking-tight text-text-on-surface">
              Categories
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Organize your catalog for storefronts and Android customer application navigation.
            </p>
          </div>
          <button type="button" className={primaryButtonClass} onClick={openCreate}>
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
            <span>Add category</span>
          </button>
        </div>
      </div>

      {feedback && <FeedbackBanner message={feedback} />}
      {actionError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-2xl border border-status-error/30 bg-status-error-container/30 px-4 py-3 text-sm font-semibold text-status-on-error-container shadow-xs"
        >
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
      )}

      {/* Bento Search and Filters Bar */}
      <form
        className="grid grid-cols-1 gap-3 rounded-2xl border border-border-outline/50 bg-bg-surface p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Category filters"
        onSubmit={(event) => event.preventDefault()}
      >
        <div>
          <label htmlFor="categories-search" className={labelClass}>
            Search categories
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
              id="categories-search"
              type="search"
              className={`${inputClass} pl-10`}
              value={search}
              placeholder="Category name"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="categories-status" className={labelClass}>
            Status
          </label>
          <div className="mt-1">
            <CustomSelect
              id="categories-status-custom"
              value={statusFilter}
              placeholder="All statuses"
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          </div>
          <select
            id="categories-status"
            className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
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
      {loading && categories.length === 0 ? (
        <div className={cardClass}>
          <TableSkeleton label="Loading categories" rows={4} />
        </div>
      ) : loadError ? (
        <ErrorPanel
          title="Categories could not be loaded"
          message={loadError}
          onRetry={() => setReloadToken((token) => token + 1)}
        />
      ) : categories.length === 0 ? (
        <EmptyPanel
          title="No categories yet"
          description="Add the first category to organize the catalog for customers and mobile applications."
        >
          <button type="button" className={primaryButtonClass} onClick={openCreate}>
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
            <span>Add category</span>
          </button>
        </EmptyPanel>
      ) : visibleCategories.length === 0 ? (
        <EmptyPanel
          title="No categories match your filters"
          description="Try a different search or clear the filters."
        >
          <button type="button" className={secondaryButtonClass} onClick={clearFilters}>
            Clear filters
          </button>
        </EmptyPanel>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border-outline/50 bg-bg-surface shadow-xs">
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block" aria-busy={loading}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Categories</caption>
              <thead className="border-b border-border-outline/40 bg-bg-surface-variant/40 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Name
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Display order
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-bold">
                    Products
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
                {visibleCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-bg-surface-variant/30 transition-colors"
                  >
                    <td className="px-5 py-4 font-bold text-text-on-surface">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-primary-container/40 text-brand-primary text-xs font-bold">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{category.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs tabular-nums text-text-secondary">
                      <span className="rounded-lg bg-bg-surface-variant px-2.5 py-1 border border-border-outline/30">
                        #{category.sortOrder}
                      </span>
                    </td>
                    <td className="px-5 py-4 tabular-nums font-semibold text-text-on-surface">
                      {category.productCount}{' '}
                      {category.productCount === 1 ? 'product' : 'products'}
                    </td>
                    <td className="px-5 py-4">
                      <CategoryStatusBadge status={category.status} />
                    </td>
                    <td className="px-5 py-4">
                      {renderActions(category)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <ul className="divide-y divide-border-outline/30 md:hidden" aria-label="Categories list">
            {visibleCategories.map((category) => (
              <li key={category.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary-container/40 text-brand-primary text-sm font-bold">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-bold text-text-on-surface">{category.name}</p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        Display order #{category.sortOrder} · {category.productCount}{' '}
                        {category.productCount === 1 ? 'product' : 'products'}
                      </p>
                    </div>
                  </div>
                  <CategoryStatusBadge status={category.status} />
                </div>
                <div className="pt-1">{renderActions(category)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Category Create/Edit Modal with Android Preset Chips */}
      <Dialog
        open={formOpen}
        title={editing ? `Edit ${editing.name}` : 'Add category'}
        onClose={saving ? () => undefined : () => setFormOpen(false)}
      >
        <form
          noValidate
          aria-label={editing ? 'Edit category' : 'Add category'}
          onSubmit={(event) => void handleCategorySubmit(event)}
          className="space-y-4"
        >
          {formAlert && (
            <div
              role="alert"
              className="flex items-center gap-2.5 rounded-2xl border border-status-error/30 bg-status-error-container/30 px-3.5 py-2.5 text-xs font-semibold text-status-on-error-container"
            >
              <svg className="h-4 w-4 shrink-0 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formAlert}</span>
            </div>
          )}

          <div>
            <label htmlFor="category-name" className={labelClass}>
              Name
            </label>
            <input
              id="category-name"
              placeholder="e.g. Shirts, Pants, Accessories"
              className={`${inputClass} mt-1`}
              value={formName}
              maxLength={120}
              onChange={(event) => setFormName(event.target.value)}
              aria-invalid={formErrors.name !== undefined}
              aria-describedby={formErrors.name ? 'category-name-error' : undefined}
            />
            {formErrors.name && (
              <p id="category-name-error" className={fieldErrorClass}>
                {formErrors.name}
              </p>
            )}

            {/* Quick Android Preset Chips */}
            {!editing && (
              <div className="mt-3">
                <p className="text-[11px] font-semibold text-text-secondary">
                  Android App Presets:
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {ANDROID_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormName(preset)}
                      className="rounded-lg border border-border-outline/40 bg-bg-surface-variant/70 px-2 py-0.5 text-[11px] font-medium text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-colors"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="category-order" className={labelClass}>
              Display order
            </label>
            <input
              id="category-order"
              type="number"
              min={0}
              max={9999}
              inputMode="numeric"
              className={`${inputClass} mt-1`}
              value={formSortOrder}
              onChange={(event) => setFormSortOrder(event.target.value)}
              aria-invalid={formErrors.sortOrder !== undefined}
              aria-describedby={formErrors.sortOrder ? 'category-order-error' : undefined}
            />
            <p className={helperTextClass}>
              Determines sorting position on customer app bars and menus.
            </p>
            {formErrors.sortOrder && (
              <p id="category-order-error" className={fieldErrorClass}>
                {formErrors.sortOrder}
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={primaryButtonClass}
              disabled={saving}
              aria-busy={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Category Archive Confirmation Dialog */}
      <ConfirmDialog
        open={archiveTarget !== null}
        title={archiveTarget ? `Archive ${archiveTarget.name}?` : 'Archive category?'}
        description="The category is hidden from the storefront. It can only be archived after its active products are moved to another category or archived."
        confirmLabel="Archive category"
        busy={archiving}
        onCancel={() => {
          if (!archiving) {
            setArchiveTarget(null);
          }
        }}
        onConfirm={() => void confirmArchive()}
      />
    </section>
  );
}
