import React, { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { textMuted, textPrimary, textSecondary } from '../../styles/styleUtils';
import {
  glassBorder,
  glassBackgroundHover,
  textAccent
} from '@shared/styles/styleUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCalendarGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay(); // 0 = Sun

  const gridStart = new Date(year, month, 1 - startDow);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(
      new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + i
      )
    );
  }
  return days;
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

// ─── Component ────────────────────────────────────────────────────────────────

export interface CalendarProps {
  /**
   * A render prop for the actual day cell content.
   * The Calendar handles rendering the underlying grid boundaries.
   */
  renderDay: (
    date: Date,
    isCurrentMonth: boolean,
    isToday: boolean
  ) => React.ReactNode;

  /** Widget slot to the right of the month title. Handy for count summaries */
  headerWidget?: React.ReactNode;

  /** Content to display below the calendar grid, like a legend */
  bottomLegend?: React.ReactNode;

  /** Allows external control/initialization of the visible month */
  defaultYear?: number;
  defaultMonth?: number;

  /** Optional event to broadcast when month navigates */
  onMonthChange?: (year: number, month: number) => void;
}

export function Calendar({
  renderDay,
  headerWidget,
  bottomLegend,
  defaultYear,
  defaultMonth,
  onMonthChange
}: CalendarProps) {
  const today = useMemo(() => new Date(), []);

  const [viewYear, setViewYear] = useState(defaultYear ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(defaultMonth ?? today.getMonth());

  const gridDays = useMemo(
    () => buildCalendarGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const handleMonthTransition = useCallback(
    (newYear: number, newMonth: number) => {
      setViewYear(newYear);
      setViewMonth(newMonth);
      onMonthChange?.(newYear, newMonth);
    },
    [onMonthChange]
  );

  const goToPrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      handleMonthTransition(viewYear - 1, 11);
    } else {
      handleMonthTransition(viewYear, viewMonth - 1);
    }
  }, [viewMonth, viewYear, handleMonthTransition]);

  const goToNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      handleMonthTransition(viewYear + 1, 0);
    } else {
      handleMonthTransition(viewYear, viewMonth + 1);
    }
  }, [viewMonth, viewYear, handleMonthTransition]);

  const goToToday = useCallback(() => {
    handleMonthTransition(today.getFullYear(), today.getMonth());
  }, [today, handleMonthTransition]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Calendar header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          ...glassBorder
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CalendarDays size={18} style={{ ...textAccent }} />
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              ...textPrimary
            }}
          >
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          {headerWidget}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={goToToday}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              ...textSecondary,
              cursor: 'pointer',
              transition: 'background 0.15s',
              ...glassBackgroundHover,
              ...glassBorder
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'hsla(272,65%,62%,0.12)';
              e.currentTarget.style.color = 'var(--primary-resonance)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--glass-surface-hover)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Today
          </button>
          <button
            onClick={goToPrevMonth}
            aria-label="Previous month"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              ...textMuted,
              cursor: 'pointer',
              transition: 'background 0.15s',
              ...glassBackgroundHover,
              ...glassBorder
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'hsla(272,65%,62%,0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--glass-surface-hover)';
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToNextMonth}
            aria-label="Next month"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              ...textMuted,
              cursor: 'pointer',
              transition: 'background 0.15s',
              ...glassBackgroundHover,
              ...glassBorder
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'hsla(272,65%,62%,0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--glass-surface-hover)';
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          ...glassBorder
        }}
      >
        {DOW_LABELS.map(label => (
          <div
            key={label}
            style={{
              padding: '8px 6px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              ...textMuted
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          background: 'var(--glass-outline)',
          padding: '1px'
        }}
      >
        {gridDays.map(date => {
          const isCurrentMonth = date.getMonth() === viewMonth;
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

          return (
            <div
              key={date.toISOString()}
              style={{ background: 'var(--glass-surface, rgba(15,15,35,0.8))' }}
            >
              {renderDay(date, isCurrentMonth, isToday)}
            </div>
          );
        })}
      </div>

      {/* Legend Area */}
      {bottomLegend && (
        <div
          style={{
            padding: '10px 1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            ...glassBorder
          }}
        >
          {bottomLegend}
        </div>
      )}
    </div>
  );
}
