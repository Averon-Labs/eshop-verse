import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { listAdminProducts } from '../api/catalog';
import { listAdminOrders } from '../api/orders';
import type { AdminOrderSummary, AdminProduct } from '../api/types';
import { formatUsd } from '../lib/format';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface PaletteAction {
  id: string;
  section: 'Pages' | 'Products' | 'Orders';
  title: string;
  subtitle?: string;
  badge?: string;
  path: string;
  icon?: 'page' | 'product' | 'order' | 'plus';
}

const STATIC_PAGES: Array<{ title: string; subtitle: string; path: string; icon: 'page' | 'plus' }> = [
  { title: 'Overview', subtitle: 'Dashboard metrics and overview', path: '/', icon: 'page' },
  { title: 'Products', subtitle: 'Browse and manage catalog products', path: '/products', icon: 'page' },
  { title: 'Create Product', subtitle: 'Add a new product to the catalog', path: '/products/new', icon: 'plus' },
  { title: 'Orders', subtitle: 'Customer orders and fulfillments', path: '/orders', icon: 'page' },
  { title: 'Inventory', subtitle: 'Stock availability and adjustments', path: '/inventory', icon: 'page' },
  { title: 'Categories', subtitle: 'Catalog categories and organization', path: '/categories', icon: 'page' },
  { title: 'Settings', subtitle: 'Store profile and regional settings', path: '/settings', icon: 'page' },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const searchInputId = useId();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Focus search input on open and reset state
  useEffect(() => {
    if (open) {
      setQuery('');
      setProducts([]);
      setOrders([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Lock body scroll when palette is open
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Debounced API search when query changes
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setProducts([]);
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const [prodResult, orderResult] = await Promise.allSettled([
          listAdminProducts({ q: trimmed, perPage: 5 }, controller.signal),
          listAdminOrders({ q: trimmed, perPage: 5 }, controller.signal),
        ]);

        if (controller.signal.aborted) return;

        if (prodResult.status === 'fulfilled') {
          setProducts(prodResult.value.data);
        }
        if (orderResult.status === 'fulfilled') {
          setOrders(orderResult.value.data);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  // Assemble unified list of actions
  const filteredPages = STATIC_PAGES.filter(
    (page) =>
      page.title.toLowerCase().includes(query.toLowerCase()) ||
      page.subtitle.toLowerCase().includes(query.toLowerCase()),
  );

  const items: PaletteAction[] = [
    ...filteredPages.map((p) => ({
      id: `page-${p.path}`,
      section: 'Pages' as const,
      title: p.title,
      subtitle: p.subtitle,
      path: p.path,
      icon: p.icon,
    })),
    ...products.map((prod) => ({
      id: `prod-${prod.id}`,
      section: 'Products' as const,
      title: prod.name,
      subtitle: `SKU: ${prod.sku ?? '—'} · ${formatUsd(prod.price)}`,
      badge: prod.status,
      path: `/products/${prod.id}`,
      icon: 'product' as const,
    })),
    ...orders.map((ord) => ({
      id: `order-${ord.id}`,
      section: 'Orders' as const,
      title: ord.reference,
      subtitle: `${ord.customer?.email ?? '—'} · ${formatUsd(ord.total)}`,
      badge: ord.status,
      path: `/orders/${ord.id}`,
      icon: 'order' as const,
    })),
  ];

  // Adjust activeIndex if items shrink
  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, activeIndex]);

  // Scroll active item into view
  useEffect(() => {
    const el = itemRefs.current.get(activeIndex);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  function handleSelect(action: PaletteAction) {
    onClose();
    navigate(action.path);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (items.length > 0 ? (prev - 1 + items.length) % items.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (items[activeIndex]) {
        handleSelect(items[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 overflow-y-auto"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--border-outline-variant)] bg-[var(--bg-surface)] shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[var(--border-outline-variant)] px-4 py-3 sm:px-6">
          <svg
            className="h-5 w-5 shrink-0 text-[var(--text-secondary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            id={searchInputId}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search products, orders, pages, or actions..."
            className="w-full border-none bg-transparent px-3.5 py-1 text-sm sm:text-base font-medium text-[var(--text-on-surface)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-0"
            autoComplete="off"
            spellCheck="false"
          />
          {loading && (
            <div
              role="status"
              aria-label="Searching"
              className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border-outline-variant)] bg-[var(--bg-surface-variant)] px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--border-outline-variant)] transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 sm:p-3 divide-y divide-[var(--border-outline-variant)]/30">
          {items.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
              {loading ? 'Searching catalog and orders...' : `No results found for "${query}".`}
            </div>
          ) : (
            (() => {
              let itemCounter = 0;
              const sections: Array<'Pages' | 'Products' | 'Orders'> = ['Pages', 'Products', 'Orders'];

              return sections.map((sec) => {
                const secItems = items.filter((it) => it.section === sec);
                if (secItems.length === 0) return null;

                return (
                  <div key={sec} className="py-2 first:pt-0 last:pb-0">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      {sec}
                    </div>
                    <ul className="space-y-1" role="listbox">
                      {secItems.map((action) => {
                        const currentIndex = itemCounter++;
                        const isActive = currentIndex === activeIndex;

                        return (
                          <li key={action.id} role="option" aria-selected={isActive}>
                            <button
                              ref={(node) => {
                                if (node) itemRefs.current.set(currentIndex, node);
                                else itemRefs.current.delete(currentIndex);
                              }}
                              type="button"
                              onClick={() => handleSelect(action)}
                              onMouseEnter={() => setActiveIndex(currentIndex)}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                                isActive
                                  ? 'bg-[var(--brand-primary-container)]/30 text-[var(--brand-on-primary-container)]'
                                  : 'text-[var(--text-on-surface)] hover:bg-[var(--bg-surface-variant)]'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-outline-variant)] ${
                                    isActive
                                      ? 'bg-[var(--brand-primary)] text-white'
                                      : 'bg-[var(--bg-surface-variant)] text-[var(--text-secondary)]'
                                  }`}
                                >
                                  {action.icon === 'product' ? (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                  ) : action.icon === 'order' ? (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                  ) : action.icon === 'plus' ? (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold">{action.title}</p>
                                  {action.subtitle && (
                                    <p className="truncate text-xs text-[var(--text-secondary)]">
                                      {action.subtitle}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {action.badge && (
                                <span className="ml-2 shrink-0 rounded-full bg-[var(--bg-surface-variant)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] border border-[var(--border-outline-variant)]">
                                  {action.badge}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              });
            })()
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between border-t border-[var(--border-outline-variant)] bg-[var(--bg-surface-variant)]/40 px-4 py-2.5 text-[11px] text-[var(--text-secondary)]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-[var(--border-outline-variant)] bg-[var(--bg-surface)] px-1 py-0.5 font-mono font-bold">
                ↑
              </kbd>{' '}
              <kbd className="rounded border border-[var(--border-outline-variant)] bg-[var(--bg-surface)] px-1 py-0.5 font-mono font-bold">
                ↓
              </kbd>{' '}
              navigate
            </span>
            <span>
              <kbd className="rounded border border-[var(--border-outline-variant)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono font-bold">
                ↵
              </kbd>{' '}
              select
            </span>
          </div>
          <span>
            <kbd className="rounded border border-[var(--border-outline-variant)] bg-[var(--bg-surface)] px-1 py-0.5 font-mono font-bold">
              Esc
            </kbd>{' '}
            close
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
