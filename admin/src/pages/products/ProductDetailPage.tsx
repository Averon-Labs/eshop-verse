import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAdminProduct } from '../../api/catalog';
import { ApiError } from '../../api/http';
import type { AdminProduct, ProductStatus } from '../../api/types';
import { ErrorPanel } from '../../components/StatePanels';
import { formatUsd } from '../../lib/format';
import {
  actionButtonClass,
  cardClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../lib/ui';

function ProductStatusBadge({ status }: { status: ProductStatus }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary-container px-3.5 py-1 text-xs font-bold text-brand-on-primary-container border border-brand-primary/20">
        <span className="h-2 w-2 rounded-full bg-brand-primary" aria-hidden="true" />
        Active
      </span>
    );
  }

  if (status === 'inactive') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-surface-variant px-3.5 py-1 text-xs font-semibold text-text-secondary border border-border-outline/40">
        <span className="h-2 w-2 rounded-full bg-text-disabled" aria-hidden="true" />
        Inactive
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-surface-variant/80 px-3.5 py-1 text-xs font-semibold text-text-disabled border border-border-outline/30">
      <span className="h-2 w-2 rounded-full bg-text-disabled/70" aria-hidden="true" />
      Archived
    </span>
  );
}

/**
 * PROD-103 — Product Details Page replicating Figma Screen 13.
 * Shows high-resolution primary image with gallery strip, product overview,
 * large price, stock indicators, and quick edit shortcut.
 */
export default function ProductDetailPage() {
  const { productId: productIdParam } = useParams();
  const productId = productIdParam ? Number(productIdParam) : null;
  const invalidId = productId !== null && (!Number.isInteger(productId) || productId <= 0);

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (productId === null || invalidId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    setNotFound(false);

    getAdminProduct(productId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setProduct(data);
          setSelectedImageIndex(0);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
          return;
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

  if (invalidId || notFound) {
    return (
      <div className={`${cardClass} max-w-lg mx-auto p-12 text-center`}>
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-status-error-container text-status-error">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-text-on-surface">Product not found</h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          The requested product does not exist or has been permanently removed.
        </p>
        <Link to="/products" className={`${secondaryButtonClass} mt-6`}>
          Back to products
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <section aria-label="Loading product details" className="max-w-6xl space-y-6">
        <div className="h-8 w-1/4 animate-pulse rounded-full bg-bg-surface-variant" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-96 rounded-3xl animate-pulse bg-bg-surface-variant lg:col-span-7" />
          <div className="h-96 rounded-3xl animate-pulse bg-bg-surface-variant lg:col-span-5" />
        </div>
      </section>
    );
  }

  if (loadError || !product) {
    return (
      <ErrorPanel
        title="Product could not be loaded"
        message={loadError}
        onRetry={() => setReloadToken((token) => token + 1)}
      />
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const activeImage = images[selectedImageIndex] ?? (product.imageUrl ? { id: 0, url: product.imageUrl, sortOrder: 0 } : null);

  return (
    <section aria-labelledby="product-details-title" className="max-w-6xl space-y-6">
      {/* Breadcrumb & Action Header */}
      <div className="space-y-1.5">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary"
        >
          <Link to="/products" className="hover:text-brand-primary transition-colors">
            Catalog
          </Link>
          <span aria-hidden="true" className="text-border-outline">
            /
          </span>
          <Link to="/products" className="hover:text-brand-primary transition-colors">
            Products
          </Link>
          <span aria-hidden="true" className="text-border-outline">
            /
          </span>
          <span className="text-brand-primary truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              id="product-details-title"
              className="text-2xl font-bold tracking-tight text-text-on-surface"
            >
              {product.name}
            </h1>
            <ProductStatusBadge status={product.status} />
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to={`/products/${product.id}/edit`}
              className={primaryButtonClass}
              aria-label={`Edit ${product.name}`}
            >
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
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              <span>Edit product</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bento Grid: Screen 13 Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Image Gallery & Description */}
        <div className="space-y-6 lg:col-span-7">
          {/* Bento Card 1: Media Showcase */}
          <div className={`${cardClass} overflow-hidden p-6 sm:p-7 space-y-5`}>
            <div className="border-b border-border-outline/40 pb-3">
              <h2 className="text-base font-bold text-text-on-surface">Product Gallery</h2>
              <p className="mt-0.5 text-xs text-text-secondary">
                Customer presentation visuals and storefront media
              </p>
            </div>

            {/* Primary Main Image Preview (1:1 aspect ratio) */}
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border-outline/40 bg-bg-surface-variant/30 flex items-center justify-center shadow-inner">
              {activeImage ? (
                <img
                  src={activeImage.url}
                  alt={product.name}
                  className="h-full w-full object-cover transition-all"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-text-disabled">
                  <svg
                    className="h-16 w-16 opacity-40 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm font-semibold">No image available</p>
                  <p className="text-xs text-text-disabled mt-0.5">
                    Click &ldquo;Edit product&rdquo; to add storefront photos.
                  </p>
                </div>
              )}
            </div>

            {/* Gallery Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-brand-primary ring-2 ring-brand-primary/30 shadow-xs'
                        : 'border-border-outline/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bento Card 2: Description */}
          <div className={`${cardClass} p-6 sm:p-7 space-y-3`}>
            <h2 className="text-base font-bold text-text-on-surface">Description</h2>
            {product.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                {product.description}
              </p>
            ) : (
              <p className="text-sm italic text-text-disabled">
                No description provided for this product.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Overview, Pricing & Inventory */}
        <div className="space-y-6 lg:col-span-5">
          {/* Bento Card 3: Pricing & Overview */}
          <div className={`${cardClass} p-6 sm:p-7 space-y-5`}>
            <div className="border-b border-border-outline/40 pb-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
                SKU: {product.sku ?? '—'}
              </span>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-3xl font-extrabold tabular-nums tracking-tight text-text-on-surface">
                  {formatUsd(product.price)}
                </span>
                {product.inStock ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-status-success-container/70 px-3 py-1 text-xs font-bold text-status-on-success-container border border-status-success/20">
                    <span className="h-2 w-2 rounded-full bg-status-success" aria-hidden="true" />
                    In stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-status-error-container/70 px-3 py-1 text-xs font-bold text-status-on-error-container border border-status-error/20">
                    <span className="h-2 w-2 rounded-full bg-status-error" aria-hidden="true" />
                    Out of stock
                  </span>
                )}
              </div>
            </div>

            <dl className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border-outline/30">
                <dt className="text-text-secondary font-medium">Category</dt>
                <dd className="font-bold text-text-on-surface">
                  {product.categoryName ? (
                    <span className="rounded-lg bg-bg-surface-variant px-2.5 py-1 text-text-on-surface border border-border-outline/30">
                      {product.categoryName}
                    </span>
                  ) : (
                    'Uncategorized'
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border-outline/30">
                <dt className="text-text-secondary font-medium">Currency</dt>
                <dd className="font-bold text-text-on-surface">{product.currency ?? 'USD'}</dd>
              </div>
            </dl>
          </div>

          {/* Bento Card 4: Inventory Summary */}
          <div className={`${cardClass} p-6 sm:p-7 space-y-4`}>
            <div className="border-b border-border-outline/40 pb-3">
              <h2 className="text-base font-bold text-text-on-surface">Inventory Status</h2>
              <p className="mt-0.5 text-xs text-text-secondary">
                Real-time stock managed in the inventory matrix
              </p>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-bg-surface-variant/40 p-4 border border-border-outline/30">
              <div>
                <p className="text-xs font-medium text-text-secondary">Available Units</p>
                <p className="text-2xl font-bold tabular-nums text-text-on-surface mt-0.5">
                  {product.stockQuantity !== null ? product.stockQuantity : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-text-secondary">Threshold</p>
                <p className="text-xs font-semibold text-text-disabled mt-1">10 units</p>
              </div>
            </div>

            <div className="pt-1">
              <Link
                to="/inventory"
                className={`${actionButtonClass} w-full justify-center text-center`}
              >
                Go to Inventory restock →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
