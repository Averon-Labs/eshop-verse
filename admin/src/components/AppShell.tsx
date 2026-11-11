import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from './ConfirmDialog';
import { CommandPalette } from './CommandPalette';
import { NavigationGuardProvider, useNavigationGuard } from './NavigationGuard';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/**
 * Evergreen Commerce Admin AppShell:
 * - Floating signature sidebar (228px width, 32px radius, inverted fillet active curve)
 * - Search bar and utility top header (TopBar)
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
  const { isBlocked, setBlocked } = useNavigationGuard();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const drawerButtonRef = useRef<HTMLButtonElement | null>(null);

  // Global Ctrl+K / Cmd+K keyboard shortcut for Spotlight Command Palette
  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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

  return (
    <div className="relative min-h-screen bg-[var(--bg-background)] text-[var(--text-on-background)] transition-colors">
      {/* Desktop Floating Sidebar */}
      <div className="hidden md:block">
        <Sidebar onItemClick={handleNavClick} />
      </div>

      {/* Main Workspace */}
      <div className="flex flex-col md:pl-[280px]">
        {/* Top Header Bar */}
        <TopBar
          onOpenDrawer={() => setDrawerOpen(true)}
          drawerOpen={drawerOpen}
          onOpenCommandPalette={() => setPaletteOpen(true)}
        />

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
                ref={drawerButtonRef}
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--interaction-hover-overlay)] hover:text-[var(--text-on-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                onClick={() => setDrawerOpen(false)}
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
      {/* Global Spotlight / Command Palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
