import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';

export interface DatePreset {
  label: string;
  getRange: () => { from: string; to: string };
}

export interface DateRangePickerProps {
  id?: string;
  fromValue: string;
  toValue: string;
  onChange: (from: string, to: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
  onClear?: () => void;
}

/** Format YYYY-MM-DD to compact human-readable string like 'Mar 01, 2026' */
function formatHumanDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

/** Format Date object to YYYY-MM-DD */
function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Standard quick presets */
function getDefaultPresets(): DatePreset[] {
  const today = new Date();

  return [
    {
      label: 'Today',
      getRange: () => {
        const iso = toIsoDate(today);
        return { from: iso, to: iso };
      },
    },
    {
      label: 'Yesterday',
      getRange: () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const iso = toIsoDate(d);
        return { from: iso, to: iso };
      },
    },
    {
      label: 'Last 7 days',
      getRange: () => {
        const from = new Date();
        from.setDate(from.getDate() - 6);
        return { from: toIsoDate(from), to: toIsoDate(today) };
      },
    },
    {
      label: 'Last 30 days',
      getRange: () => {
        const from = new Date();
        from.setDate(from.getDate() - 29);
        return { from: toIsoDate(from), to: toIsoDate(today) };
      },
    },
    {
      label: 'This month',
      getRange: () => {
        const from = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from: toIsoDate(from), to: toIsoDate(today) };
      },
    },
  ];
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DateRangePicker({
  id,
  fromValue,
  toValue,
  onChange,
  placeholder = 'Select date range',
  label,
  disabled = false,
  className = '',
  minDate,
  maxDate,
  onClear,
}: DateRangePickerProps) {
  const generatedId = useId();
  const pickerId = id || `date-range-${generatedId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  // Internal draft state before Apply
  const [draftFrom, setDraftFrom] = useState(fromValue);
  const [draftTo, setDraftTo] = useState(toValue);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Calendar view navigation (Year and Month)
  const initialDate = fromValue ? new Date(fromValue) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear() || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth() || new Date().getMonth());

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const presets = useMemo(() => getDefaultPresets(), []);

  // Sync draft state with incoming props when opening
  useEffect(() => {
    if (isOpen) {
      setDraftFrom(fromValue);
      setDraftTo(toValue);
      if (fromValue) {
        const d = new Date(fromValue);
        if (!isNaN(d.getTime())) {
          setViewYear(d.getFullYear());
          setViewMonth(d.getMonth());
        }
      }
    }
  }, [isOpen, fromValue, toValue]);

  // Viewport detection
  useEffect(() => {
    function checkViewport() {
      setIsMobile(window.innerWidth < 640);
    }
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Calculate desktop fixed coords
  useEffect(() => {
    if (!isOpen || isMobile || !triggerRef.current) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 520;
      const popoverHeight = 360;

      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldFlip = spaceBelow < popoverHeight && rect.top > popoverHeight;

      // Ensure it stays within viewport
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - popoverWidth - 16);
      }

      setCoords({
        top: shouldFlip ? rect.top - popoverHeight - 8 : rect.bottom + 8,
        left,
      });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, isMobile]);

  // Outside click & escape handling
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
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

  // Calendar calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startWeekday = firstDay.getDay(); // 0 for Sunday
    const daysInMonth = lastDay.getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      disabled: boolean;
    }> = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      const iso = toIsoDate(prevDate);
      days.push({
        dateStr: iso,
        dayNumber: dayNum,
        isCurrentMonth: false,
        disabled: Boolean((minDate && iso < minDate) || (maxDate && iso > maxDate)),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = new Date(viewYear, viewMonth, d);
      const iso = toIsoDate(currentDate);
      days.push({
        dateStr: iso,
        dayNumber: d,
        isCurrentMonth: true,
        disabled: Boolean((minDate && iso < minDate) || (maxDate && iso > maxDate)),
      });
    }

    // Next month filler days (fill to 35 or 42 cells)
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(viewYear, viewMonth + 1, d);
      const iso = toIsoDate(nextDate);
      days.push({
        dateStr: iso,
        dayNumber: d,
        isCurrentMonth: false,
        disabled: Boolean((minDate && iso < minDate) || (maxDate && iso > maxDate)),
      });
    }

    return days;
  }, [viewYear, viewMonth, minDate, maxDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (dateStr: string) => {
    if (!draftFrom || (draftFrom && draftTo)) {
      // Starting new selection
      setDraftFrom(dateStr);
      setDraftTo('');
    } else {
      // Second click completes selection
      if (dateStr < draftFrom) {
        setDraftTo(draftFrom);
        setDraftFrom(dateStr);
      } else {
        setDraftTo(dateStr);
      }
    }
  };

  const handleApply = () => {
    const finalFrom = draftFrom;
    const finalTo = draftTo || draftFrom; // Default single day to full day
    onChange(finalFrom, finalTo);
    setIsOpen(false);
  };

  const handleClear = (event?: ReactMouseEvent) => {
    event?.stopPropagation();
    setDraftFrom('');
    setDraftTo('');
    onChange('', '');
    onClear?.();
    setIsOpen(false);
  };

  const handlePresetSelect = (preset: DatePreset) => {
    const range = preset.getRange();
    setDraftFrom(range.from);
    setDraftTo(range.to);
    onChange(range.from, range.to);
    setIsOpen(false);
  };

  // Determine display label
  const hasRange = Boolean(fromValue || toValue);
  let displayLabel = placeholder;
  if (fromValue && toValue) {
    if (fromValue === toValue) {
      displayLabel = formatHumanDate(fromValue);
    } else {
      displayLabel = `${formatHumanDate(fromValue)} – ${formatHumanDate(toValue)}`;
    }
  } else if (fromValue) {
    displayLabel = `From ${formatHumanDate(fromValue)}`;
  } else if (toValue) {
    displayLabel = `Until ${formatHumanDate(toValue)}`;
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={`relative inline-block w-full text-left ${className}`}>
      {label && (
        <label htmlFor={pickerId} className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
          {label}
        </label>
      )}

      {/* Main Capsule Trigger Button */}
      <button
        ref={triggerRef}
        id={pickerId}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={[
          'group relative flex h-11 w-full items-center justify-between gap-2 rounded-2xl border px-3.5 text-sm transition-all text-left',
          isOpen
            ? 'border-[var(--brand-primary)] bg-[var(--bg-surface)] ring-2 ring-[var(--brand-primary)]/20 shadow-xs'
            : 'border-[var(--border-outline-variant)] bg-[var(--bg-surface)] hover:border-[var(--border-outline)] hover:bg-[var(--bg-surface-variant)]/40',
          disabled ? 'cursor-not-allowed opacity-50 bg-[var(--bg-surface-variant)]' : 'cursor-pointer',
        ].join(' ')}
      >
        <div className="flex min-w-0 items-center gap-2.5 truncate">
          {/* Calendar Icon */}
          <span className="shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--brand-primary)] transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </span>

          <span
            className={`truncate font-medium ${
              hasRange ? 'text-[var(--text-on-surface)]' : 'text-[var(--text-disabled)]'
            }`}
          >
            {displayLabel}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {hasRange && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date range"
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear()}
              className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-disabled)] hover:bg-[var(--bg-surface-variant)] hover:text-[var(--text-on-surface)]"
            >
              ✕
            </span>
          )}
          <span className="text-[var(--text-secondary)]">
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[var(--brand-primary)]' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </button>

      {/* Floating Popover / Bottom Sheet */}
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
                ref={popoverRef}
                role="dialog"
                aria-label="Choose date range"
                className="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-t border-[var(--border-outline-variant)] bg-[var(--bg-surface)] p-5 shadow-2xl animate-slide-up"
              >
                {/* Grab handle */}
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--border-outline)]/60" />

                <div className="mb-4 flex items-center justify-between border-b border-[var(--border-outline-variant)] pb-3">
                  <h3 className="text-base font-bold text-[var(--text-on-surface)]">Choose date range</h3>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-variant)]"
                  >
                    ✕
                  </button>
                </div>

                {/* Presets as scrollable chips */}
                <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className="shrink-0 rounded-full border border-[var(--border-outline-variant)] bg-[var(--bg-surface-variant)]/60 px-3.5 py-1.5 text-xs font-semibold text-[var(--text-on-surface)] hover:bg-[var(--brand-primary-container)]/50 hover:text-[var(--brand-primary)] transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Calendar View */}
                <div className="rounded-2xl border border-[var(--border-outline-variant)] p-3.5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-bold text-sm text-[var(--text-on-surface)]">{monthName}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-outline-variant)] hover:bg-[var(--bg-surface-variant)]"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-outline-variant)] hover:bg-[var(--bg-surface-variant)]"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[var(--text-secondary)] mb-2">
                    {WEEKDAYS.map((w) => (
                      <span key={w} className="py-1">
                        {w}
                      </span>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day) => {
                      const isStart = draftFrom === day.dateStr;
                      const isEnd = draftTo === day.dateStr;
                      const isInRange =
                        draftFrom &&
                        draftTo &&
                        day.dateStr > draftFrom &&
                        day.dateStr < draftTo;

                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          disabled={day.disabled}
                          onClick={() => handleDayClick(day.dateStr)}
                          className={[
                            'flex h-11 w-full items-center justify-center rounded-xl text-xs font-semibold transition-all',
                            isStart || isEnd
                              ? 'bg-[var(--brand-primary)] text-white shadow-xs font-bold'
                              : isInRange
                                ? 'bg-[var(--brand-primary-container)]/40 text-[var(--brand-on-primary-container)]'
                                : day.isCurrentMonth
                                  ? 'text-[var(--text-on-surface)] hover:bg-[var(--bg-surface-variant)]'
                                  : 'text-[var(--text-disabled)]/60',
                            day.disabled ? 'cursor-not-allowed opacity-30' : '',
                          ].join(' ')}
                        >
                          {day.dayNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile actions footer */}
                <div className="mt-5 flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleClear()}
                    className="flex-1 rounded-xl border border-[var(--border-outline-variant)] py-3 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-variant)]"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex-1 rounded-xl bg-[var(--brand-primary)] py-3 text-xs font-bold text-white shadow-xs hover:bg-[var(--brand-primary-hover)] active:scale-[0.98]"
                  >
                    Apply range
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Desktop Floating Portal Popover */
            coords && (
              <div
                ref={popoverRef}
                role="dialog"
                aria-label="Choose date range"
                style={{
                  position: 'fixed',
                  top: `${coords.top}px`,
                  left: `${coords.left}px`,
                  width: '520px',
                }}
                className="z-[9999] rounded-2xl border border-[var(--border-outline-variant)] bg-[var(--bg-surface)] p-4 shadow-2xl backdrop-blur-md animate-scale-in"
              >
                <div className="grid grid-cols-[140px_1fr] gap-4">
                  {/* Presets Sidebar */}
                  <div className="border-r border-[var(--border-outline-variant)] pr-3 flex flex-col gap-1 justify-between">
                    <div>
                      <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)]">
                        Presets
                      </p>
                      <div className="flex flex-col gap-1 mt-1">
                        {presets.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handlePresetSelect(preset)}
                            className="flex h-8 w-full items-center rounded-xl px-2.5 text-left text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--interaction-hover-overlay)] hover:text-[var(--text-on-surface)] transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClear()}
                      className="mt-3 flex h-8 w-full items-center rounded-xl px-2.5 text-left text-xs font-semibold text-[var(--status-error)] hover:bg-[var(--status-error-container)]/30 transition-colors"
                    >
                      Clear dates
                    </button>
                  </div>

                  {/* Interactive Calendar Month */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-bold text-sm text-[var(--text-on-surface)]">{monthName}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          aria-label="Previous month"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-outline-variant)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface-variant)]"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          aria-label="Next month"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-outline-variant)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface-variant)]"
                        >
                          ›
                        </button>
                      </div>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                      {WEEKDAYS.map((w) => (
                        <span key={w} className="py-0.5">
                          {w}
                        </span>
                      ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day) => {
                        const isStart = draftFrom === day.dateStr;
                        const isEnd = draftTo === day.dateStr;
                        const effectiveEnd = draftTo || hoverDate;
                        const isInRange =
                          draftFrom &&
                          effectiveEnd &&
                          day.dateStr > draftFrom &&
                          day.dateStr < effectiveEnd;

                        return (
                          <button
                            key={day.dateStr}
                            type="button"
                            disabled={day.disabled}
                            onClick={() => handleDayClick(day.dateStr)}
                            onMouseEnter={() => {
                              if (draftFrom && !draftTo) {
                                setHoverDate(day.dateStr);
                              }
                            }}
                            className={[
                              'flex h-8 w-full items-center justify-center rounded-lg text-xs font-medium transition-all',
                              isStart || isEnd
                                ? 'bg-[var(--brand-primary)] text-white font-bold shadow-xs'
                                : isInRange
                                  ? 'bg-[var(--brand-primary-container)]/35 text-[var(--brand-on-primary-container)] rounded-none'
                                  : day.isCurrentMonth
                                    ? 'text-[var(--text-on-surface)] hover:bg-[var(--interaction-hover-overlay)]'
                                    : 'text-[var(--text-disabled)]/50',
                              day.disabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer',
                            ].join(' ')}
                          >
                            {day.dayNumber}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer bar */}
                <div className="mt-3.5 flex items-center justify-between border-t border-[var(--border-outline-variant)] pt-3 text-xs">
                  <div className="text-[var(--text-secondary)] truncate mr-2">
                    {draftFrom && draftTo ? (
                      <span>
                        <span className="font-semibold text-[var(--text-on-surface)]">
                          {formatHumanDate(draftFrom)}
                        </span>{' '}
                        →{' '}
                        <span className="font-semibold text-[var(--text-on-surface)]">
                          {formatHumanDate(draftTo)}
                        </span>
                      </span>
                    ) : draftFrom ? (
                      <span>Pick end date…</span>
                    ) : (
                      <span>Pick range</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="rounded-xl px-3 py-1.5 font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-variant)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!draftFrom}
                      onClick={handleApply}
                      className="rounded-xl bg-[var(--brand-primary)] px-4 py-1.5 font-bold text-white shadow-xs hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 active:scale-[0.98]"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )
          ),
          document.body,
        )}
    </div>
  );
}
