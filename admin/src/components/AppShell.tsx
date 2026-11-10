import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';
import { NavigationGuardProvider, useNavigationGuard } from './NavigationGuard';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 text-[var(--text-secondary)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/**
 * Evergreen Commerce Admin AppShell:
 * - Floating signature sidebar (228px width, 32px radius, inverted fillet active curve)
 * - Search bar and utility top header
 * - Responsive off-canvas drawer on mobile (< 768px)
 * - Navigation dirty-guard integration
 */
export function AppShell() {
  return (
    <NavigationGuardProvider>
      <AppShellLayout />
    </NavigationGuardProvider>
  );
}

function AppShellLayout() {
  const { user, signOut } = useAuth();
  const { isBlocked, setBlocked } = useNavigationGuard();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close user menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (!drawerOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [drawerOpen]);

  const handleNavClick = (event: ReactMouseEvent<HTMLAnchorElement>, to: string) => {
    if (isBlocked) {
      event.preventDefault();
      setPendingPath(to);
    }
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Admin';

  return (
    <div className="relative min-h-screen bg-[var(--bg-background)] text-[var(--text-on-background)] transition-colors">
      {/* Desktop Floating Sidebar */}
      <div className="hidden md:block">
        <Sidebar onItemClick={handleNavClick} />
      </div>

      {/* Main Workspace (offset by floating sidebar width 228px + margins 32px + gap = ~280px) */}
      <div className="flex flex-col md:pl-[280px]">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between px-6 lg:px-10 backdrop-blur-md bg-[var(--bg-background)]/85 transition-colors">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger Toggle */}
            <button
              ref={drawerButtonRef}
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-outline)] bg-[var(--bg-surface)] text-[var(--text-on-background)] hover:bg-[var(--bg-surface-variant)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] md:hidden"
              aria-expanded={drawerOpen}
              aria-controls="admin-mobile-nav"
              onClick={() => setDrawerOpen(true)}
            >
              <span className="sr-only">Open navigation</span>
              <MenuIcon />
            </button>

            {/* Evergreen Search Shell */}
            <div className="relative hidden sm:block w-72 lg:w-96">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search anything..."
                aria-label="Search dashboard"
                className="h-11 w-full rounded-2xl border border-[var(--border-outline)] bg-[var(--bg-surface)] pl-10 pr-4 text-sm text-[var(--text-on-background)] placeholder:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-colors"
              />
            </div>
          </div>

          {/* Right Header Utilities: Theme Toggle & Admin User Menu */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="relative">
              <button
                ref={menuButtonRef}
                type="button"
                className="flex h-11 items-center gap-3 rounded-2xl border border-[var(--border-outline)] bg-[var(--bg-surface)] px-3 text-sm font-semibold text-[var(--text-on-background)] hover:bg-[var(--bg-surface-variant)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-colors"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-primary-container)] text-xs font-bold text-[var(--brand-on-primary-container)]"
                >
                  {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : 'A'}
                </span>
                <span className="hidden max-w-[14rem] truncate sm:inline">{displayName}</span>
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 text-[var(--text-secondary)]"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="sr-only">Account menu</span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  aria-label="Account"
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 animate-fade-in rounded-2xl border border-[var(--border-outline)] bg-[var(--bg-surface)] p-2 shadow-glass"
                >
                  <div className="px-3 py-2 border-b border-[var(--border-outline-variant)]">
                    <p className="text-sm font-semibold text-[var(--text-on-background)]">{displayName}</p>
                    {user && <p className="truncate text-xs text-[var(--text-secondary)]">{user.email}</p>}
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleSignOut()}
                    className="mt-1 flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-[var(--status-error)] hover:bg-[var(--status-error-container)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main id="admin-main" className="w-full max-w-[1440px] px-6 py-4 lg:px-10 lg:py-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Slide-Over Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            id="admin-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-fade-in overflow-y-auto border-r border-[var(--border-outline)] bg-[var(--bg-sidebar)] shadow-2xl"
          >
            <div className="flex h-16 items-center justify-between px-6 border-b border-[var(--border-outline-variant)]">
              <span className="font-sans text-base font-bold tracking-tight text-[var(--text-on-background)]">
                EVERGREEN
              </span>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--interaction-hover-overlay)] hover:text-[var(--text-on-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                onClick={() => {
                  setDrawerOpen(false);
                  drawerButtonRef.current?.focus();
                }}
              >
                ✕
              </button>
            </div>
            <Sidebar
              isMobile
              onNavigate={() => setDrawerOpen(false)}
              onItemClick={handleNavClick}
            />
          </div>
        </div>
      )}

      {/* Dirty Form Confirmation Dialog */}
      <ConfirmDialog
        open={pendingPath !== null}
        title="Discard unsaved changes?"
        description="This page has unsaved changes. Leave the page and discard them?"
        confirmLabel="Discard changes"
        onCancel={() => setPendingPath(null)}
        onConfirm={() => {
          const target = pendingPath;
          setPendingPath(null);
          setBlocked(false);
          if (target) {
            navigate(target);
          }
        }}
      />
    </div>
  );
}
