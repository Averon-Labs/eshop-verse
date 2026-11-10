import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
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

interface TopBarProps {
  onOpenDrawer?: () => void;
  drawerOpen?: boolean;
}

export function TopBar({ onOpenDrawer, drawerOpen = false }: TopBarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close user dropdown menu on outside click or Escape
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

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Admin';
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : 'AD';

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between px-6 lg:px-10 backdrop-blur-md bg-[var(--bg-background)]/85 transition-colors">
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger Drawer Trigger */}
        {onOpenDrawer && (
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-outline)] bg-[var(--bg-surface)] text-[var(--text-on-background)] hover:bg-[var(--bg-surface-variant)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] md:hidden"
            aria-expanded={drawerOpen}
            aria-controls="admin-mobile-nav"
            onClick={onOpenDrawer}
          >
            <span className="sr-only">Open navigation</span>
            <MenuIcon />
          </button>
        )}
      </div>

      {/* Right Header Utilities */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Admin User Menu */}
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
              {initials}
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
  );
}
