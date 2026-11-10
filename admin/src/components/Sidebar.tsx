import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/* --- Evergreen Navigation Icons (Figma Specifications) --- */

function OverviewIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function CategoriesIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="currentColor"
    >
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

/* --- Inverted Border Radius (Inverse Fillet) SVGs --- */

function TopFillet() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -top-7 right-[6px] h-7 w-7"
      viewBox="0 0 28 28"
      fill="none"
    >
      <path d="M28 0 A 28 28 0 0 1 0 28 L 28 28 Z" fill="var(--bg-background)" />
    </svg>
  );
}

function BottomFillet() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-7 right-[6px] h-7 w-7"
      viewBox="0 0 28 28"
      fill="none"
    >
      <path d="M0 0 A 28 28 0 0 1 28 28 L 28 0 Z" fill="var(--bg-background)" />
    </svg>
  );
}

export interface NavItem {
  to: string;
  label: string;
  ariaLabel?: string;
  icon: ReactNode;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/reports', label: 'Overview', ariaLabel: 'Reports', icon: <OverviewIcon /> },
  { to: '/orders', label: 'Orders', icon: <OrdersIcon /> },
  { to: '/products', label: 'Products', icon: <ProductsIcon /> },
  { to: '/inventory', label: 'Inventory', icon: <InventoryIcon /> },
  { to: '/categories', label: 'Categories', icon: <CategoriesIcon /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon /> },
];

export type NavClickHandler = (event: ReactMouseEvent<HTMLAnchorElement>, to: string) => void;

interface SidebarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
  onItemClick?: NavClickHandler;
}

export function Sidebar({ isMobile = false, onNavigate, onItemClick }: SidebarProps) {
  const location = useLocation();
  const asideRef = useRef<HTMLElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [asideHeight, setAsideHeight] = useState<number>(800);

  useEffect(() => {
    if (isMobile) return;

    function updateHeight() {
      const clientH = asideRef.current?.clientHeight ?? 0;
      if (clientH > 0) {
        setAsideHeight(clientH);
      } else if (typeof window !== 'undefined' && window.innerHeight > 0) {
        // Fallback for jsdom or initial layout before paint
        setAsideHeight(window.innerHeight > 200 ? window.innerHeight : 800);
      } else {
        setAsideHeight(800);
      }
    }

    updateHeight();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && asideRef.current) {
      resizeObserver = new ResizeObserver(() => updateHeight());
      resizeObserver.observe(asideRef.current);
    }

    window.addEventListener('resize', updateHeight);
    return () => {
      window.removeEventListener('resize', updateHeight);
      resizeObserver?.disconnect();
    };
  }, [isMobile]);

  // Close more popover on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  // Click outside and escape handling for more popover
  useEffect(() => {
    if (!moreOpen) return;

    function handleDocClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(target)
      ) {
        setMoreOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMoreOpen(false);
        moreButtonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  const isItemActive = (to: string): boolean => {
    if (to === '/products') {
      return location.pathname.startsWith('/products');
    }
    if (to === '/orders') {
      return location.pathname.startsWith('/orders');
    }
    if (to === '/reports') {
      return location.pathname === '/reports' || location.pathname === '/';
    }
    return location.pathname.startsWith(to);
  };

  // Determine if items need to collapse into "More"
  // Each item is 56px (h-14) + 8px (gap-2) = 64px.
  // Header: ~85px. Store status: ~80px. Margins: ~50px. Total fixed ~215px.
  // Full 6 items need ~215 + 6 * 64 = 599px (~600px).
  let visibleItems = NAV_ITEMS;
  let overflowItems: NavItem[] = [];

  if (!isMobile && asideHeight < 600) {
    // We need 1 slot for "More" button (64px)
    const availableForNav = Math.max(128, asideHeight - 215);
    const maxVisible = Math.max(1, Math.min(NAV_ITEMS.length - 1, Math.floor((availableForNav - 64) / 64)));
    visibleItems = NAV_ITEMS.slice(0, maxVisible);
    overflowItems = NAV_ITEMS.slice(maxVisible);
  }

  const isMoreActive = overflowItems.some((item) => isItemActive(item.to));

  return (
    <aside
      ref={asideRef}
      aria-label="Sidebar navigation"
      className={
        isMobile
          ? 'flex h-full w-full flex-col bg-[var(--bg-sidebar)] p-6'
          : 'fixed left-8 top-8 z-30 flex h-[calc(100vh-64px)] w-[228px] shrink-0 flex-col rounded-[32px] bg-[var(--bg-sidebar)] pb-8 pt-7 border-0 shadow-none transition-colors'
      }
    >
      {/* Brand Header */}
      <div className="px-6 mb-7">
        <h1 className="font-sans text-lg font-semibold tracking-tight text-[var(--text-on-background)]">
          EVERGREEN
        </h1>
        <p className="font-sans text-[11px] font-medium tracking-[0.2px] text-[var(--text-secondary)]">
          COMMERCE ADMIN
        </p>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Admin sections" className="relative flex flex-col gap-2 pl-6 overflow-y-auto scrollbar-none">
        {visibleItems.map((item) => {
          const active = isItemActive(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.ariaLabel ?? item.label}
              onClick={(event) => {
                onNavigate?.();
                onItemClick?.(event, item.to);
              }}
              className={[
                'relative flex h-14 items-center gap-3 rounded-l-[28px] px-4 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] border-0 shadow-none',
                active
                  ? 'bg-[var(--bg-background)] font-semibold text-[var(--navigation-selected-content)] -mr-[6px] w-[calc(100%+6px)] z-10'
                  : 'font-medium text-[var(--navigation-default-content)] hover:bg-[var(--interaction-hover-overlay)] hover:text-[var(--text-on-background)]',
              ].join(' ')}
            >
              {/* Inverted Fillet Curve for Active State */}
              {active && !isMobile && (
                <>
                  <TopFillet />
                  <BottomFillet />
                </>
              )}

              <span className={active ? 'text-[var(--brand-primary)]' : 'text-current'}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}

        {/* Three-dots "More" button when sidebar height is constricted by zoom */}
        {overflowItems.length > 0 && !isMobile && (
          <div className="relative">
            <button
              ref={moreButtonRef}
              type="button"
              aria-label="More navigation options"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((open: boolean) => !open)}
              className={[
                'relative flex h-14 w-full items-center gap-3 rounded-l-[28px] px-4 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] border-0 shadow-none text-left',
                isMoreActive
                  ? 'bg-[var(--bg-background)] font-semibold text-[var(--navigation-selected-content)] -mr-[6px] w-[calc(100%+6px)] z-10'
                  : 'font-medium text-[var(--navigation-default-content)] hover:bg-[var(--interaction-hover-overlay)] hover:text-[var(--text-on-background)]',
              ].join(' ')}
            >
              {isMoreActive && (
                <>
                  <TopFillet />
                  <BottomFillet />
                </>
              )}
              <span className={isMoreActive ? 'text-[var(--brand-primary)]' : 'text-current'}>
                <MoreIcon />
              </span>
              <span className="truncate">More</span>
              <span className="ml-auto mr-3 text-xs opacity-60">
                {moreOpen ? '‹' : '›'}
              </span>
            </button>

            {/* Floating Popover showing hidden navigation items */}
            {moreOpen && (
              <div
                ref={popoverRef}
                role="menu"
                aria-label="More navigation items"
                className="absolute left-[calc(100%+14px)] bottom-0 z-50 min-w-[210px] rounded-2xl border border-[var(--border-outline-variant)] bg-[var(--bg-surface)] p-2 shadow-2xl animate-scale-in"
              >
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)]">
                  More sections
                </p>
                <div className="flex flex-col gap-1">
                  {overflowItems.map((item) => {
                    const active = isItemActive(item.to);
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        aria-label={item.ariaLabel ?? item.label}
                        onClick={(event) => {
                          setMoreOpen(false);
                          onNavigate?.();
                          onItemClick?.(event, item.to);
                        }}
                        className={[
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                          active
                            ? 'bg-[var(--brand-primary-container)] font-bold text-[var(--brand-on-primary-container)]'
                            : 'font-medium text-[var(--text-on-background)] hover:bg-[var(--interaction-hover-overlay)]',
                        ].join(' ')}
                      >
                        <span className={active ? 'text-[var(--brand-primary)]' : 'text-[var(--text-secondary)]'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Bottom Store Status Indicator */}
      <div className={`mt-auto px-6 pt-4 ${asideHeight < 420 && !isMobile ? 'hidden' : 'block'}`}>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)]">
          Store status
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--status-success-container)] px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-[var(--status-success)]" />
          <span className="text-xs font-semibold text-[var(--status-on-success-container)]">
            Store online
          </span>
        </div>
      </div>
    </aside>
  );
}
