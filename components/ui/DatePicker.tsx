import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  MONTHS,
  DAYS_SHORT,
  localDate,
  daysInMonth,
  firstDayOfMonth,
  parseValue,
  formatISO,
  formatDisplay,
  DATE_PICKER_STYLES as S
} from './datePickerUtils';
export type { ParsedDate } from './datePickerUtils';

/**
 * DatePicker — Liquid Glass Design System
 *
 * A fully custom, accessible calendar date picker built on CSS custom
 * properties. No native date input. No external date library.
 *
 * @param id          - id for the trigger button (accessibility)
 * @param value       - Controlled ISO date string "yyyy-mm-dd" or ""
 * @param onChange    - Called with "yyyy-mm-dd" string or ""
 * @param placeholder - Placeholder text when no date is selected
 * @param disabled    - Disables interaction
 * @param minDate     - Earliest selectable date (optional)
 * @param maxDate     - Latest selectable date (optional)
 * @param label       - Accessible label (optional, aria-label)
 */
interface DatePickerProps {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  label?: string;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Select a date',
  disabled = false,
  minDate,
  maxDate,
  label
}: DatePickerProps) {
  const parsed = parseValue(value);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Keep the view in sync when value changes externally
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const prevMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 0) {
        setViewYear(y => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 11) {
        setViewYear(y => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const selectDay = useCallback(
    (year: number, month: number, day: number) => {
      onChange?.(formatISO({ year, month, day }));
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  const clear = useCallback(() => {
    onChange?.('');
    setOpen(false);
  }, [onChange]);

  // Calendar cells
  const firstDay = firstDayOfMonth(viewYear, viewMonth);
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const isSelected = (d: number) =>
    !!(
      parsed &&
      parsed.year === viewYear &&
      parsed.month === viewMonth &&
      parsed.day === d
    );
  const isToday = (d: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === d;
  const isDisabled = (d: number): boolean => {
    if (disabled) return true;
    const dt = localDate(viewYear, viewMonth, d);
    if (minDate && dt < minDate) return true;
    if (maxDate && dt > maxDate) return true;
    return false;
  };

  const triggerFocusStyle = (focused: boolean): React.CSSProperties => ({
    border: focused
      ? '1px solid var(--primary-resonance, #6366f1)'
      : '1px solid var(--glass-outline, rgba(255,255,255,0.12))',
    boxShadow: focused
      ? '0 0 0 3px var(--primary-glow, rgba(99,102,241,0.2))'
      : 'none'
  });

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      {/* Keyframe style injected once */}
      <style>{`@keyframes lgFadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={label || placeholder}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          ...S.trigger,
          opacity: disabled ? 0.55 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          ...(open ? triggerFocusStyle(true) : triggerFocusStyle(false))
        }}
        onFocus={e =>
          Object.assign(e.currentTarget.style, triggerFocusStyle(true))
        }
        onBlur={e => {
          if (!wrapRef.current?.contains(e.relatedTarget))
            Object.assign(e.currentTarget.style, triggerFocusStyle(false));
        }}
      >
        <Calendar
          style={{
            width: 14,
            height: 14,
            color: 'var(--text-muted)',
            flexShrink: 0
          }}
        />
        <span style={parsed ? {} : S.triggerPlaceholder}>
          {parsed ? formatDisplay(parsed) : placeholder}
        </span>
      </button>

      {open && (
        <div role="dialog" aria-label="Date picker" style={S.panel}>
          {/* Month / Year Navigation */}
          <div style={S.navRow}>
            <button
              type="button"
              onClick={prevMonth}
              style={S.navBtn}
              aria-label="Previous month"
              onMouseEnter={e => {
                e.currentTarget.style.background =
                  'var(--glass-surface-hover, rgba(255,255,255,0.06))';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </button>

            <span style={S.monthYearLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              style={S.navBtn}
              aria-label="Next month"
              onMouseEnter={e => {
                e.currentTarget.style.background =
                  'var(--glass-surface-hover, rgba(255,255,255,0.06))';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Weekday headers */}
          <div style={S.weekHeader} aria-hidden="true">
            {DAYS_SHORT.map(d => (
              <div key={d} style={S.weekDay}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div
            style={S.grid}
            role="grid"
            aria-label={`${MONTHS[viewMonth]} ${viewYear}`}
          >
            {cells.map((day, i) => {
              if (!day)
                return (
                  <div key={`empty-${i}`} role="gridcell" aria-hidden="true" />
                );
              const sel = isSelected(day);
              const tod = isToday(day);
              const dis = isDisabled(day);
              return (
                <button
                  key={day}
                  type="button"
                  role="gridcell"
                  aria-label={`${MONTHS[viewMonth]} ${day}, ${viewYear}${sel ? ' (selected)' : ''}${tod ? ' (today)' : ''}`}
                  aria-selected={sel}
                  aria-disabled={dis}
                  disabled={dis}
                  onClick={() => !dis && selectDay(viewYear, viewMonth, day)}
                  style={{
                    ...S.day,
                    ...(dis ? { opacity: 0.3, cursor: 'not-allowed' } : {}),
                    ...(tod && !sel
                      ? {
                          color: 'var(--primary-resonance, #6366f1)',
                          fontWeight: 700
                        }
                      : {}),
                    ...(sel
                      ? {
                          background: 'var(--primary-resonance)',
                          color: '#fff',
                          fontWeight: 700,
                          boxShadow:
                            '0 2px 8px var(--primary-glow, rgba(99,102,241,0.3))'
                        }
                      : {})
                  }}
                  onMouseEnter={e => {
                    if (!sel && !dis) {
                      e.currentTarget.style.background =
                        'var(--glass-surface-hover, rgba(255,255,255,0.07))';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!sel && !dis) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = tod
                        ? 'var(--primary-resonance, #6366f1)'
                        : 'var(--text-secondary)';
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut + Clear */}
          <div style={S.clearRow}>
            <button
              type="button"
              style={{ ...S.clearBtn, marginRight: 'auto' }}
              onClick={() =>
                selectDay(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate()
                )
              }
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              Today
            </button>

            {parsed && (
              <button
                type="button"
                style={S.clearBtn}
                onClick={clear}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--accent-rose, #ef4444)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <X style={{ width: 11, height: 11 }} />
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;
