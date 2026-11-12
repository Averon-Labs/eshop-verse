import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  value: string;
  label: string;
  dotColor?: string;
  description?: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  icon?: ReactNode;
  size?: 'sm' | 'md';
}

/** Default semantic dot colors for standard statuses */
function inferDotColor(val: string): string | undefined {
  const lower = val.toLowerCase();
  if (['delivered', 'active', 'in_stock', 'success', 'paid'].includes(lower)) {
    return 'var(--status-success)';
  }
  if (['processing', 'shipped', 'pending', 'pending_payment', 'low_stock', 'warning'].includes(lower)) {
    return 'var(--status-warning)';
  }
  if (['cancelled', 'archived', 'out_of_stock', 'failed', 'refunded', 'inactive'].includes(lower)) {
    return 'var(--status-error)';
  }
  if (['confirmed', 'info'].includes(lower)) {
    return 'var(--brand-primary)';
  }
  return undefined;
}

export function CustomSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select option',
  label,
  disabled = false,
  className = '',
  ariaLabel,
  ariaDescribedBy,
  icon,
  size = 'md',
}: CustomSelectProps) {
  const generatedId = useId();
  const selectId = id || `custom-select-${generatedId}`;
  const listboxId = `listbox-${selectId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Check mobile viewport (< 640px)
  useEffect(() => {
    function checkViewport() {
      setIsMobile(window.innerWidth < 640);
    }
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Update fixed portal coordinates when open on desktop
  useEffect(() => {
    if (!isOpen || isMobile || !triggerRef.current) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverHeight = Math.min(320, options.length * 44 + 20);
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldFlip = spaceBelow < popoverHeight && rect.top > popoverHeight;

      setCoords({
        top: shouldFlip ? rect.top - popoverHeight - 8 : rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - rect.width - 16)),
        width: Math.max(rect.width, 180),
      });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, isMobile, options.length]);

  // Click outside and escape handling
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        listboxRef.current &&
        !listboxRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        const currentIndex = options.findIndex((opt) => opt.value === value);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      } else {
        const nextIndex =
          event.key === 'ArrowDown'
            ? Math.min(options.length - 1, highlightedIndex + 1)
            : Math.max(0, highlightedIndex - 1);
        setHighlightedIndex(nextIndex);
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isOpen && highlightedIndex >= 0 && options[highlightedIndex]) {
        if (!options[highlightedIndex].disabled) {
          handleSelect(options[highlightedIndex].value);
        }
      } else {
        setIsOpen(!isOpen);
      }
    }
  };

  const effectiveDot = selectedOption?.dotColor || (selectedOption ? inferDotColor(selectedOption.value) : undefined);

  return (
    <div className={`relative inline-block w-full text-left ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
          {label}
        </label>
      )}

      {/* Main Combobox Trigger */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={ariaLabel || label}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={[
          'group relative flex w-full items-center justify-between gap-2.5 rounded-2xl border transition-all text-left',
          size === 'sm' ? 'h-10 px-3.5 text-xs' : 'h-11 px-4 text-sm',
          isOpen
            ? 'border-[var(--brand-primary)] bg-[var(--bg-surface)] ring-2 ring-[var(--brand-primary)]/20 shadow-xs'
            : 'border-[var(--border-outline-variant)] bg-[var(--bg-surface)] hover:border-[var(--border-outline)] hover:bg-[var(--bg-surface-variant)]/40',
          disabled ? 'cursor-not-allowed opacity-50 bg-[var(--bg-surface-variant)]' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className="flex min-w-0 items-center gap-2.5 truncate font-medium text-[var(--text-on-surface)]">
          {icon && <span className="shrink-0 text-[var(--text-secondary)]">{icon}</span>}
          {effectiveDot && (
            <span
              className="h-2 w-2 shrink-0 rounded-full shadow-xs"
              style={{ backgroundColor: effectiveDot }}
              aria-hidden="true"
            />
          )}
          <span className={`truncate ${!selectedOption ? 'text-[var(--text-disabled)]' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        {/* Animated Chevron */}
        <span className="shrink-0 text-[var(--text-secondary)] transition-transform duration-200">
          <svg
            className={`h-4 w-4 transform transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[var(--brand-primary)]' : 'group-hover:text-[var(--text-on-surface)]'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Hidden native select for form submit and standard accessibility fallbacks */}
      {name && (
        <select
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* Dropdown Menu Portal */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          isMobile ? (
            /* Mobile Bottom Sheet Modal */
            <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />
              <div
                ref={listboxRef}
                id={listboxId}
                role="listbox"
                aria-label={label || placeholder}
                className="relative z-10 max-h-[75vh] w-full overflow-y-auto rounded-t-3xl border-t border-[var(--border-outline-variant)] bg-[var(--bg-surface)] p-5 shadow-2xl animate-slide-up"
              >
                {/* Grab handle */}
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--border-outline)]/60" />

                <div className="mb-3 flex items-center justify-between border-b border-[var(--border-outline-variant)] pb-3">
                  <h3 className="text-sm font-bold text-[var(--text-on-surface)]">{label || placeholder}</h3>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-variant)]"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 py-1">
                  {options.map((opt) => {
                    const isSelected = opt.value === value;
                    const optDot = opt.dotColor || inferDotColor(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={opt.disabled}
                        onClick={() => handleSelect(opt.value)}
                        className={[
                          'flex min-h-[48px] w-full items-center justify-between rounded-2xl px-4 py-2.5 text-left text-sm transition-all',
                          isSelected
                            ? 'bg-[var(--brand-primary-container)]/40 font-bold text-[var(--brand-primary)]'
                            : 'font-medium text-[var(--text-on-surface)] hover:bg-[var(--bg-surface-variant)] active:scale-[0.99]',
                          opt.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-3">
                          {optDot && (
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: optDot }}
                              aria-hidden="true"
                            />
                          )}
                          <div>
                            <p>{opt.label}</p>
                            {opt.description && (
                              <p className="text-xs text-[var(--text-secondary)]">{opt.description}</p>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <svg
                            className="h-5 w-5 shrink-0 text-[var(--brand-primary)]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Desktop Floating Portal Popover */
            coords && (
              <div
                ref={listboxRef}
                id={listboxId}
                role="listbox"
                aria-label={label || placeholder}
                style={{
                  position: 'fixed',
                  top: `${coords.top}px`,
                  left: `${coords.left}px`,
                  minWidth: `${coords.width}px`,
                  maxWidth: '360px',
                }}
                className="z-[9999] max-h-72 overflow-y-auto rounded-2xl border border-[var(--border-outline-variant)] bg-[var(--bg-surface)]/95 p-1.5 shadow-2xl backdrop-blur-md animate-scale-in"
              >
                <div className="flex flex-col gap-1">
                  {options.map((opt, idx) => {
                    const isSelected = opt.value === value;
                    const isHighlighted = idx === highlightedIndex;
                    const optDot = opt.dotColor || inferDotColor(opt.value);
                    return (
                      <div
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => !opt.disabled && handleSelect(opt.value)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={[
                          'group flex min-h-[40px] items-center justify-between rounded-xl px-3.5 py-2 text-sm transition-all',
                          isSelected
                            ? 'bg-[var(--brand-primary-container)]/40 font-bold text-[var(--brand-primary)]'
                            : isHighlighted
                              ? 'bg-[var(--interaction-hover-overlay)] text-[var(--text-on-surface)]'
                              : 'font-medium text-[var(--text-on-surface)]',
                          opt.disabled
                            ? 'cursor-not-allowed opacity-40'
                            : 'cursor-pointer hover:bg-[var(--interaction-hover-overlay)]',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {optDot && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: optDot }}
                              aria-hidden="true"
                            />
                          )}
                          <span className="truncate">{opt.label}</span>
                        </div>
                        {isSelected && (
                          <svg
                            className="ml-2 h-4 w-4 shrink-0 text-[var(--brand-primary)]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ),
          document.body,
        )}
    </div>
  );
}
