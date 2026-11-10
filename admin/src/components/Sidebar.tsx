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

/* --- Inverted Border Radius (Inverse Fillet) SVGs --- */

function TopFillet() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -top-7 right-0 h-7 w-7"
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
      className="pointer-events-none absolute -bottom-7 right-0 h-7 w-7"
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

  return (
    <aside
      aria-label="Sidebar navigation"
      className={
        isMobile
          ? 'flex h-full w-full flex-col bg-[var(--bg-sidebar)] p-6'
          : 'fixed left-8 top-8 z-30 flex h-[calc(100vh-64px)] w-[228px] shrink-0 flex-col rounded-[32px] bg-[var(--bg-sidebar)] pb-8 pt-7 shadow-sm transition-colors'
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
      <nav aria-label="Admin sections" className="flex flex-col gap-2 pl-6">
        {NAV_ITEMS.map((item) => {
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
                'relative flex h-14 items-center gap-3 rounded-l-[28px] px-4 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]',
                active
                  ? 'bg-[var(--bg-background)] font-semibold text-[var(--navigation-selected-content)]'
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
      </nav>

      {/* Bottom Store Status Indicator */}
      <div className="mt-auto px-6 pt-4">
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
