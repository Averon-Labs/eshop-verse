import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createAdminProduct,
  deleteAdminProductImage,
  getAdminProduct,
  listAdminCategories,
  updateAdminProduct,
  uploadAdminProductImage,
} from '../../api/catalog';
import { ApiError } from '../../api/http';
import type { AdminCategory, AdminProductInput, ProductImage } from '../../api/types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useNavigationGuard } from '../../components/NavigationGuard';
import { ErrorPanel } from '../../components/StatePanels';
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

const PRICE_PATTERN = /^\d{1,9}\.\d{2}$/;
const MAX_IMAGES = 8;
const DRAFT_STORAGE_KEY = 'eshopverse_admin_product_draft';

interface FormState {
  name: string;
  description: string;
  price: string;
  sku: string;
  categoryId: string;
  status: 'active' | 'inactive';
  images: ProductImage[];
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  price: '',
  sku: '',
  categoryId: '',
  status: 'active',
  images: [],
};

/** Accepted upload types, mirroring the API's `mimes:` rule. */
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

/** Small demo-URL preview; a broken URL shows a placeholder instead. */
function ImagePreview({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const trimmed = url.trim();

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!trimmed || failed) {
    return (
      <span
        aria-hidden="true"
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-border-outline/60 bg-bg-surface-variant text-[10px] text-text-disabled"
      >
        {trimmed ? 'No preview' : 'Preview'}
      </span>
    );
  }

  return (
    <img
      src={trimmed}
      alt=""
      onError={() => setFailed(true)}
      className="h-16 w-16 shrink-0 rounded-xl border border-border-outline/40 object-cover shadow-xs"
    />
  );
}

/**
 * PROD-102 — Create/edit product form with Figma Screen 12 two-column Bento Grid layout.
 * Includes auto-draft recovery in sessionStorage for new products,
 * strict pricing validation (2-decimal), SKU conflict handling, and image dropzone.
 */
export default function ProductFormPage() {
  const { productId: productIdParam } = useParams();
  const navigate = useNavigate();
  const { setBlocked } = useNavigationGuard();
  const productId = productIdParam ? Number(productIdParam) : null;
  const invalidId = productId !== null && (!Number.isInteger(productId) || productId <= 0);

  const [form, setForm] = useState<FormState>(() => {
    if (productId === null) {
      try {
        const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<FormState>;
          return { ...EMPTY_FORM, ...parsed, images: [] };
        }
      } catch {
        // Ignore JSON parse errors from storage.
      }
    }
    return EMPTY_FORM;
  });

  const [initialForm, setInitialForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(productId !== null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoriesFailed, setCategoriesFailed] = useState(false);
  const [loadedCategoryName, setLoadedCategoryName] = useState<string | null>(null);
  const [loadedArchived, setLoadedArchived] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Auto-save draft in sessionStorage when creating a new product
  useEffect(() => {
    if (productId === null) {
      const hasContent =
        form.name.trim() !== '' ||
        form.description.trim() !== '' ||
        form.price.trim() !== '' ||
        form.sku.trim() !== '' ||
        form.categoryId !== '';

      if (hasContent) {
        try {
          sessionStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
              name: form.name,
              description: form.description,
              price: form.price,
              sku: form.sku,
              categoryId: form.categoryId,
              status: form.status,
            }),
          );
        } catch {
          // Ignore quota errors.
        }
      }
    }
  }, [form, productId]);

  useEffect(() => {
    const controller = new AbortController();

    listAdminCategories(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setCategories(items);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCategoriesFailed(true);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (productId === null || invalidId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    getAdminProduct(productId, controller.signal)
      .then((product) => {
        if (controller.signal.aborted) {
          return;
        }

        const next: FormState = {
          name: product.name,
          description: product.description ?? '',
          price: product.price,
          sku: product.sku ?? '',
          categoryId: product.categoryId === null ? '' : String(product.categoryId),
          status: product.status === 'inactive' ? 'inactive' : 'active',
          images: product.images,
        };

        setForm(next);
        setInitialForm(next);
        setLoadedCategoryName(product.categoryName);
        setLoadedArchived(product.status === 'archived');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
          return;
        }
        if (error instanceof ApiError && error.status === 401) {
          return; // The session handler routes back to sign-in.
        }
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'The product could not be loaded. Check your connection and try again.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [productId, invalidId, reloadToken]);

  const isDirty =
    !invalidId && !notFound && JSON.stringify(form) !== JSON.stringify(initialForm);

  useEffect(() => {
    setBlocked(isDirty);
    return () => setBlocked(false);
  }, [isDirty, setBlocked]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const selectedCategory =
    form.categoryId === ''
      ? null
      : categories.find((category) => category.id === Number(form.categoryId)) ?? null;
  const archivedSelection =
    form.categoryId !== '' && (selectedCategory === null || selectedCategory.status !== 'active');

  function focusFirstError(errors: Record<string, string>) {
    const directTargets: Record<string, string> = {
      name: 'product-name',
      price: 'product-price',
      description: 'product-description',
      sku: 'product-sku',
      categoryId: 'product-category',
    };
    const firstKey = Object.keys(errors)[0];

    if (firstKey && directTargets[firstKey]) {
      document.getElementById(directTargets[firstKey])?.focus();
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    const name = form.name.trim();

    if (!name) {
      errors.name = 'Name is required.';
    } else if (name.length > 160) {
      errors.name = 'Keep the name to 160 characters or fewer.';
    }

    const price = form.price.trim();

    if (!price) {
      errors.price = 'Price is required.';
    } else if (!PRICE_PATTERN.test(price)) {
      errors.price = 'Enter the price as digits with exactly two decimals, for example 19.99.';
    }

    if (form.description.trim().length > 5000) {
      errors.description = 'Keep the description to 5000 characters or fewer.';
    }

    if (form.sku.trim().length > 64) {
      errors.sku = 'Keep the SKU to 64 characters or fewer.';
    }

    if (archivedSelection) {
      errors.categoryId = 'Choose an active category or “No category”.';
    }

    setFieldErrors(errors);
    focusFirstError(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    const payload: AdminProductInput = {
      name: form.name.trim(),
      description: form.description.trim() === '' ? null : form.description.trim(),
      price: form.price.trim(),
      sku: form.sku.trim() === '' ? null : form.sku.trim(),
      categoryId: form.categoryId === '' ? null : Number(form.categoryId),
      status: form.status,
      imageUrls: form.images.map((image) => image.url),
    };

    try {
      if (productId !== null) {
        const saved = await updateAdminProduct(productId, payload);
        setInitialForm(form);
        navigate('/products', { replace: true, state: { feedback: `${saved.name} was saved.` } });
      } else {
        const created = await createAdminProduct(payload);
        try {
          sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {
          // Ignore storage clearance errors.
        }
        navigate('/products', {
          replace: true,
          state: { feedback: `${created.name} was created. Set its stock in Inventory.` },
        });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped: Record<string, string> = {};
        if (error.code === 'SKU_TAKEN') {
          mapped.sku = error.message;
        } else if (error.status === 422) {
          for (const detail of error.details) {
            if (detail.field === 'imageUrls' || detail.field === 'image') {
              continue; // Array/file-level message: shown as the form alert below.
            }
            if (detail.field) {
              mapped[detail.field] = detail.message;
            }
          }
        }

        const hasFieldErrors = Object.keys(mapped).length > 0;
        setFieldErrors(mapped);
        setFormError(
          error.status === 401
            ? null
            : hasFieldErrors
              ? 'Check the highlighted fields and try again.'
              : error.message,
        );
      } else {
        setFormError('The product could not be saved. Check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }
    navigate('/products');
  }

  function discardAndLeave() {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setConfirmDiscard(false);
    setBlocked(false);
    navigate('/products');
  }

  /**
   * Persist an image change on the server and mirror it in both the form and
   * its baseline: uploads and deletions are immediate, so they never count as
   * unsaved edits to the rest of the form.
   */
  function applyImages(images: ProductImage[]) {
    setForm((current) => ({ ...current, images }));
    setInitialForm((current) => ({ ...current, images }));
  }

  async function handleImageFiles(files: FileList | null) {
    if (productId === null || !files || files.length === 0 || imageBusy) {
      return;
    }

    if (form.images.length + files.length > MAX_IMAGES) {
      setImageError(`A product can hold at most ${MAX_IMAGES} images. Remove one first.`);
      return;
    }

    setImageBusy(true);
    setImageError(null);

    let uploaded = [...form.images];

    try {
      for (const file of Array.from(files)) {
        uploaded = [...uploaded, await uploadAdminProductImage(productId, file)];
      }
      applyImages(uploaded);
    } catch (error) {
      // Files that were stored before the failure stay attached to the product.
      applyImages(uploaded);
      setImageError(
        error instanceof ApiError
          ? (error.fieldError('image') ?? error.message)
          : 'The image could not be uploaded. Check your connection and try again.',
      );
    } finally {
      setImageBusy(false);
    }
  }

  async function removeImage(index: number) {
    if (productId === null || imageBusy) {
      return;
    }

    const image = form.images[index];

    if (!image) {
      return;
    }

    setImageBusy(true);
    setImageError(null);

    try {
      await deleteAdminProductImage(productId, image.id);
      applyImages(form.images.filter((_, position) => position !== index));
    } catch (error) {
      setImageError(
        error instanceof ApiError
          ? error.message
          : 'The image could not be removed. Check your connection and try again.',
      );
    } finally {
      setImageBusy(false);
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    setForm((current) => {
      const next = [...current.images];
      const target = index + direction;

      if (target < 0 || target >= next.length) {
        return current;
      }

      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, images: next };
    });
  }

  const notFoundPanel = (
    <div className={`${cardClass} p-12 text-center`}>
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-status-error-container text-status-error">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-lg font-bold text-text-on-surface">Product not found</p>
      <p className="mt-1 text-sm text-text-secondary">
        The product does not exist or is no longer available.
      </p>
      <Link to="/products" className={`${secondaryButtonClass} mt-5`}>
        Back to products
      </Link>
    </div>
  );

  return (
    <section aria-labelledby="product-form-title" className="max-w-5xl space-y-6">
      {/* Header and Breadcrumbs */}
      <div className="space-y-1.5">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary"
        >
          <Link to="/products" className="hover:text-brand-primary transition-colors">
            Products
          </Link>
          <span aria-hidden="true" className="text-border-outline">
            /
          </span>
          <span className="text-brand-primary">
            {productId !== null ? 'Edit product' : 'New product'}
          </span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div>
            <h1 id="product-form-title" className="text-2xl font-bold tracking-tight text-text-on-surface">
              {productId !== null ? 'Edit product' : 'Create product'}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Fill in product information. Media and stock can be configured for Android storefronts.
            </p>
          </div>
        </div>
      </div>

      {invalidId || notFound ? (
        notFoundPanel
      ) : loading ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Loading product"
          className={`${cardClass} space-y-4 p-8`}
        >
          <div aria-hidden="true" className="h-6 w-1/3 animate-pulse rounded-full bg-bg-surface-variant" />
          <div aria-hidden="true" className="h-11 w-full animate-pulse rounded-2xl bg-bg-surface-variant" />
          <div aria-hidden="true" className="h-28 w-full animate-pulse rounded-2xl bg-bg-surface-variant" />
        </div>
      ) : loadError ? (
        <ErrorPanel
          title="Product could not be loaded"
          message={loadError}
          onRetry={() => setReloadToken((token) => token + 1)}
        />
      ) : (
        <form
          noValidate
          aria-label={productId !== null ? 'Edit product' : 'Create product'}
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-6"
        >
          {loadedArchived && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-border-outline/40 bg-bg-surface-variant px-4 py-3 text-sm text-text-secondary">
              <svg className="h-5 w-5 shrink-0 text-text-disabled" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                This product is archived. You can edit its details; the selected status is saved with
                your changes.
              </span>
            </div>
          )}

          {formError && (
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
              <span>{formError}</span>
            </div>
          )}

          {/* 2-Column Bento Grid Layout matching Figma Screen 12 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Product Information & Media */}
            <div className="space-y-6 lg:col-span-7">
              {/* Bento Card 1: Product Information */}
              <div className={`${cardClass} p-6 sm:p-7 space-y-5`}>
                <div className="border-b border-border-outline/40 pb-3">
                  <h2 className="text-base font-bold text-text-on-surface">Product information</h2>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Essential identity and customer-facing description
                  </p>
                </div>

                <div>
                  <label htmlFor="product-name" className={labelClass}>
                    Name
                  </label>
                  <input
                    id="product-name"
                    placeholder="e.g. Ceramic table lamp"
                    className={`${inputClass} mt-1`}
                    value={form.name}
                    maxLength={200}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    aria-invalid={fieldErrors.name !== undefined}
                    aria-describedby={fieldErrors.name ? 'product-name-error' : undefined}
                  />
                  {fieldErrors.name && (
                    <p id="product-name-error" className={fieldErrorClass}>
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="product-description" className={labelClass}>
                    Description <span className="font-normal text-text-disabled">(optional)</span>
                  </label>
                  <textarea
                    id="product-description"
                    rows={5}
                    placeholder="Provide a detailed description of the product, materials, and dimensions..."
                    className={`${inputClass} mt-1 min-h-[140px] py-2.5`}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    aria-invalid={fieldErrors.description !== undefined}
                    aria-describedby={
                      fieldErrors.description ? 'product-description-error' : undefined
                    }
                  />
                  {fieldErrors.description && (
                    <p id="product-description-error" className={fieldErrorClass}>
                      {fieldErrors.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Bento Card 2: Media Dropzone */}
              <div className={`${cardClass} p-6 sm:p-7 space-y-4`}>
                <div className="border-b border-border-outline/40 pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-text-on-surface">Media gallery</h2>
                    <span className="text-xs font-semibold text-text-secondary">
                      {form.images.length}/{MAX_IMAGES} images
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    1:1 square aspect ratio recommended for Android cards. Max 5 MB each.
                  </p>
                </div>

                <fieldset>
                  <legend className="sr-only">Images</legend>

                  <div className="space-y-3">
                    {form.images.length === 0 && (
                      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-outline/60 bg-bg-surface-variant/30 px-4 py-8 text-center">
                        <svg
                          className="h-10 w-10 text-text-disabled mb-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-sm font-semibold text-text-secondary">No images yet.</p>
                        <p className="mt-0.5 text-xs text-text-disabled">
                          Upload high-resolution photos for customer presentation.
                        </p>
                      </div>
                    )}

                    {form.images.map((image, index) => (
                      <div
                        key={image.id}
                        className="flex flex-wrap items-center gap-3 rounded-2xl border border-border-outline/40 bg-bg-surface p-2.5 shadow-xs"
                      >
                        <ImagePreview url={image.url} />
                        <span
                          className="min-w-[10rem] flex-1 truncate text-xs font-mono text-text-secondary"
                          title={image.url}
                        >
                          {image.url}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => moveImage(index, -1)}
                            disabled={imageBusy || index === 0}
                            aria-label={`Move image ${index + 1} up`}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => moveImage(index, 1)}
                            disabled={imageBusy || index === form.images.length - 1}
                            aria-label={`Move image ${index + 1} down`}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="inline-flex min-h-9 items-center rounded-xl px-3 text-xs font-semibold text-status-error hover:bg-status-error-container/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                            onClick={() => void removeImage(index)}
                            disabled={imageBusy}
                            aria-busy={imageBusy}
                            aria-label={`Remove image ${index + 1}`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label htmlFor="product-image-file" className={labelClass}>
                      Add images
                    </label>
                    <input
                      id="product-image-file"
                      type="file"
                      accept={IMAGE_ACCEPT}
                      multiple
                      className={`${inputClass} mt-1 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-primary-container file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand-on-primary-container hover:file:opacity-90`}
                      onChange={(event) => {
                        void handleImageFiles(event.target.files);
                        event.target.value = '';
                      }}
                      disabled={productId === null || imageBusy || form.images.length >= MAX_IMAGES}
                      aria-busy={imageBusy}
                      aria-describedby="product-image-help"
                    />
                    <p id="product-image-help" className={helperTextClass}>
                      {productId === null
                        ? 'Save the product first, then add its images.'
                        : 'JPEG, PNG, WebP, or GIF, up to 5 MB each.'}
                    </p>
                  </div>

                  {imageError && (
                    <p role="alert" className={`${fieldErrorClass} mt-2`}>
                      {imageError}
                    </p>
                  )}
                </fieldset>
              </div>
            </div>

            {/* Right Column: Pricing, Inventory & Organization */}
            <div className="space-y-6 lg:col-span-5">
              {/* Bento Card 3: Pricing & SKU */}
              <div className={`${cardClass} p-6 sm:p-7 space-y-5`}>
                <div className="border-b border-border-outline/40 pb-3">
                  <h2 className="text-base font-bold text-text-on-surface">Pricing & SKU</h2>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Price format and stock-keeping unit
                  </p>
                </div>

                <div>
                  <label htmlFor="product-price" className={labelClass}>
                    Price (USD)
                  </label>
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-text-disabled">
                      $
                    </span>
                    <input
                      id="product-price"
                      inputMode="decimal"
                      placeholder="19.99"
                      className={`${inputClass} pl-8`}
                      value={form.price}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, price: event.target.value }))
                      }
                      aria-invalid={fieldErrors.price !== undefined}
                      aria-describedby={
                        fieldErrors.price ? 'product-price-error' : 'product-price-help'
                      }
                    />
                  </div>
                  <p id="product-price-help" className={helperTextClass}>
                    Two decimals, for example 19.99.
                  </p>
                  {fieldErrors.price && (
                    <p id="product-price-error" className={fieldErrorClass}>
                      {fieldErrors.price}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="product-sku" className={labelClass}>
                    SKU <span className="font-normal text-text-disabled">(optional)</span>
                  </label>
                  <input
                    id="product-sku"
                    placeholder="e.g. EVG-LAMP-01"
                    className={`${inputClass} mt-1 font-mono text-xs`}
                    value={form.sku}
                    maxLength={80}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, sku: event.target.value }))
                    }
                    aria-invalid={fieldErrors.sku !== undefined}
                    aria-describedby={fieldErrors.sku ? 'product-sku-error' : undefined}
                  />
                  {fieldErrors.sku && (
                    <p id="product-sku-error" className={fieldErrorClass}>
                      {fieldErrors.sku}
                    </p>
                  )}
                </div>
              </div>

              {/* Bento Card 4: Product Organization */}
              <div className={`${cardClass} p-6 sm:p-7 space-y-5`}>
                <div className="border-b border-border-outline/40 pb-3">
                  <h2 className="text-base font-bold text-text-on-surface">Organization & Status</h2>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Categorization and storefront visibility
                  </p>
                </div>

                <div>
                  <label htmlFor="product-category" className={labelClass}>
                    Category
                  </label>
                  <select
                    id="product-category"
                    className={`${inputClass} mt-1`}
                    value={form.categoryId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, categoryId: event.target.value }))
                    }
                    aria-invalid={fieldErrors.categoryId !== undefined}
                    aria-describedby={
                      fieldErrors.categoryId
                        ? 'product-category-error'
                        : categoriesFailed
                          ? 'product-category-help'
                          : undefined
                    }
                  >
                    <option value="">No category</option>
                    {categories
                      .filter((category) => category.status === 'active')
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    {archivedSelection && (
                      <option value={form.categoryId}>
                        {selectedCategory
                          ? `${selectedCategory.name} (archived)`
                          : `${loadedCategoryName ?? 'Selected category'} (archived)`}
                      </option>
                    )}
                  </select>
                  {categoriesFailed && (
                    <p id="product-category-help" className={helperTextClass}>
                      Categories could not be loaded. You can still save with “No category”.
                    </p>
                  )}
                  {fieldErrors.categoryId && (
                    <p id="product-category-error" className={fieldErrorClass}>
                      {fieldErrors.categoryId}
                    </p>
                  )}
                </div>

                <fieldset>
                  <legend className={labelClass}>Status</legend>
                  <div className="mt-2.5 flex flex-wrap gap-4">
                    <label className="flex min-h-11 items-center gap-2.5 rounded-2xl border border-border-outline/40 bg-bg-surface-variant/40 px-4 py-2 text-sm font-semibold text-text-on-surface cursor-pointer hover:bg-bg-surface-variant transition-colors has-[:checked]:border-brand-primary has-[:checked]:bg-brand-primary-container/30">
                      <input
                        type="radio"
                        name="product-status"
                        value="active"
                        checked={form.status === 'active'}
                        className="text-brand-primary focus:ring-brand-primary"
                        onChange={() => setForm((current) => ({ ...current, status: 'active' }))}
                      />
                      <span>Active</span>
                    </label>
                    <label className="flex min-h-11 items-center gap-2.5 rounded-2xl border border-border-outline/40 bg-bg-surface-variant/40 px-4 py-2 text-sm font-semibold text-text-on-surface cursor-pointer hover:bg-bg-surface-variant transition-colors has-[:checked]:border-brand-primary has-[:checked]:bg-brand-primary-container/30">
                      <input
                        type="radio"
                        name="product-status"
                        value="inactive"
                        checked={form.status === 'inactive'}
                        className="text-brand-primary focus:ring-brand-primary"
                        onChange={() => setForm((current) => ({ ...current, status: 'inactive' }))}
                      />
                      <span>Inactive</span>
                    </label>
                  </div>
                </fieldset>
              </div>
            </div>
          </div>

          {/* Form Actions Bento Footer */}
          <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-border-outline/40 bg-bg-surface p-4 shadow-xs">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={primaryButtonClass}
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard unsaved changes?"
        description="Your edits will not be saved."
        confirmLabel="Discard changes"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={discardAndLeave}
      />
    </section>
  );
}
