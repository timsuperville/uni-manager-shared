import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef
} from 'react';
import { Clock, Check } from 'lucide-react';
import {
  parse24,
  to24String,
  toDisplay,
  clamp,
  TIME_PICKER_STYLES as S
} from './timePickerUtils';
import { glassBorder, glassBackgroundHover } from '@shared/styles/styleUtils';

export type { ParsedTime } from './timePickerUtils';

/**
 * TimePicker — Liquid Glass Design System
 *
 * Redesigned for speed and clarity:
 *  - Compact inline editor (HH : MM  AM|PM) at the top of the panel
 *  - Large quick-preset grid of common times (tap → commit + auto-close)
 *  - AM/PM click → auto-close (final confirmation)
 *  - ✓ Done button for explicit close after custom entry
 *  - Editable digit inputs: type digits, arrow-spin, a/p for AM/PM
 *
 * @param id          - id for the trigger button
 * @param value       - Controlled "HH:MM" 24h string or ""
 * @param onChange    - Called with "HH:MM" 24h string
 * @param placeholder - Placeholder text
 * @param disabled    - Disables interaction
 * @param minuteStep  - Minutes increment for arrows (default 5)
 * @param label       - Accessible aria-label (optional)
 */

// ── DigitInput ────────────────────────────────────────────────────────────────

/**
 * Editable digit segment with type-ahead, auto-advance, and arrow-spin.
 * Wrapped in forwardRef so the hour segment can advance focus to the minute one.
 */
interface DigitInputProps {
  value: number;
  min: number;
  max: number;
  onCommit: (v: number) => void;
  onStep: (dir: number) => void;
  nextRef?: React.RefObject<HTMLInputElement> | null;
  isHour?: boolean;
  onAMPM?: (ampm: 'AM' | 'PM') => void;
  highlight?: boolean;
}

const DigitInput = forwardRef<HTMLInputElement, DigitInputProps>(
  function DigitInput(
    { value, min, max, onCommit, onStep, nextRef, isHour, onAMPM, highlight },
    ref
  ) {
    const [buffer, setBuffer] = useState('');
    const [focused, setFocused] = useState(false);

    useEffect(() => {
      setBuffer('');
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setBuffer('');
        onStep(1);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setBuffer('');
        onStep(-1);
        return;
      }
      if (e.key === 'Tab') {
        setBuffer('');
        return;
      }

      if (isHour) {
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          onAMPM?.('AM');
          return;
        }
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          onAMPM?.('PM');
          return;
        }
      }

      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
        return;
      }
      e.preventDefault();

      const next = buffer + e.key;
      const digit = parseInt(e.key, 10);

      if (next.length === 1) {
        const maxTens = isHour ? 1 : 5;
        if (digit > maxTens) {
          setBuffer('');
          onCommit(clamp(digit, min, max));
          nextRef?.current?.focus();
        } else {
          setBuffer(next);
        }
      } else {
        setBuffer('');
        onCommit(clamp(parseInt(next, 10), min, max));
        nextRef?.current?.focus();
      }
    };

    const shownValue = buffer !== '' ? buffer : String(value).padStart(2, '0');

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={shownValue}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setFocused(true);
          setBuffer('');
        }}
        onBlur={() => {
          setFocused(false);
          setBuffer('');
        }}
        style={{
          ...S.digitInput,
          ...(focused || highlight
            ? {
                borderColor: 'var(--primary-resonance)',
                boxShadow: '0 0 0 3px var(--primary-glow, rgba(99,102,241,0.2))'
              }
            : {})
        }}
        aria-label={isHour ? 'Hours' : 'Minutes'}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
      />
    );
  }
);

// ── TimePicker ────────────────────────────────────────────────────────────────

interface TimePickerProps {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minuteStep?: number;
  label?: string;
}

export function TimePicker({
  id,
  value,
  onChange,
  placeholder = 'Select a time',
  disabled = false,
  minuteStep = 5,
  label
}: TimePickerProps) {
  const parsed = parse24(value);

  const [open, setOpen] = useState(false);
  const [presetMode, setPresetMode] = useState<'hours' | 'minutes' | 'ampm'>(
    'hours'
  );
  const [hours, setHours] = useState(parsed?.hours ?? 9);
  const [minutes, setMinutes] = useState(parsed?.minutes ?? 0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);

  // Sync when value changes externally
  useEffect(() => {
    const p = parse24(value);
    if (p) {
      setHours(p.hours);
      setMinutes(p.minutes);
    }
  }, [value]);

  const emit = useCallback(
    (h: number, m: number) => {
      onChange?.(to24String(h, m));
    },
    [onChange]
  );

  const commitAndClose = useCallback(
    (h: number, m: number) => {
      emit(h, m);
      setOpen(false);
      setPresetMode('hours');
      triggerRef.current?.focus();
    },
    [emit]
  );

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
      if (e.key === 'Escape') {
        setOpen(false);
        setPresetMode('hours');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const isAM = hours < 12;
  const h12 = hours % 12 === 0 ? 12 : hours % 12;

  const commitH12 = useCallback(
    (h12val: number) => {
      const h = clamp(h12val, 1, 12);
      const h24 = isAM ? (h === 12 ? 0 : h) : h === 12 ? 12 : h + 12;
      setHours(h24);
      emit(h24, minutes);
    },
    [isAM, minutes, emit]
  );

  const commitMins = useCallback(
    (mval: number) => {
      const m = clamp(mval, 0, 59);
      setMinutes(m);
      emit(hours, m);
    },
    [hours, emit]
  );

  const stepHours = useCallback(
    (dir: number) => {
      setHours(h => {
        const next = (((h + dir) % 24) + 24) % 24;
        emit(next, minutes);
        return next;
      });
    },
    [minutes, emit]
  );

  const stepMins = useCallback(
    (dir: number) => {
      setMinutes(m => {
        let next = m + dir * minuteStep;
        let h = hours;
        if (next < 0) {
          next = 60 - minuteStep;
          h = (((hours - 1) % 24) + 24) % 24;
          setHours(h);
        }
        if (next >= 60) {
          next = 0;
          h = (hours + 1) % 24;
          setHours(h);
        }
        emit(h, next);
        return next;
      });
    },
    [hours, minuteStep, emit]
  );

  const setAMPM = useCallback(
    (ampm: 'AM' | 'PM') => {
      let h = hours;
      if (ampm === 'AM' && !isAM) h = hours - 12;
      if (ampm === 'PM' && isAM) h = hours + 12;
      setHours(h);
      commitAndClose(h, minutes);
    },
    [hours, isAM, minutes, commitAndClose]
  );

  const triggerFocus = (focused: boolean): React.CSSProperties => ({
    border: focused
      ? '1px solid var(--primary-resonance, #6366f1)'
      : '1px solid var(--glass-outline, rgba(255,255,255,0.12))',
    boxShadow: focused
      ? '0 0 0 3px var(--primary-glow, rgba(99,102,241,0.2))'
      : 'none'
  });

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <style>{`
        @keyframes lgFadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        .tp-preset:hover { background: var(--primary-subtle, hsla(272,65%,62%,0.14)) !important; color: var(--text-primary) !important; border-color: var(--primary-resonance) !important; }
        .tp-preset-active { background: var(--primary-resonance) !important; color: #fff !important; border-color: transparent !important; }
        .tp-spin:hover { background: var(--glass-surface-hover) !important; color: var(--text-primary) !important; }
        .tp-ampm:hover:not(.tp-ampm-active) { background: var(--glass-surface-hover) !important; color: var(--text-primary) !important; }
        .tp-done-btn:hover { background: var(--primary-resonance) !important; color: #fff !important; }
      `}</style>

      {/* ── Trigger ── */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={label || placeholder}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (disabled) return;
          if (!open) setPresetMode('hours');
          setOpen(o => !o);
        }}
        style={{
          ...S.trigger,
          opacity: disabled ? 0.55 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          ...(open ? triggerFocus(true) : triggerFocus(false))
        }}
        onFocus={e => Object.assign(e.currentTarget.style, triggerFocus(true))}
        onBlur={e => {
          if (!wrapRef.current?.contains(e.relatedTarget))
            Object.assign(e.currentTarget.style, triggerFocus(false));
        }}
      >
        <Clock
          style={{
            width: 14,
            height: 14,
            color: 'var(--text-muted)',
            flexShrink: 0
          }}
        />
        <span
          style={
            parsed
              ? { color: 'var(--text-primary)' }
              : { color: 'var(--text-muted, rgba(255,255,255,0.35))' }
          }
        >
          {parsed ? toDisplay(parsed.hours, parsed.minutes) : placeholder}
        </span>
      </button>

      {/* ── Panel ── */}
      {open && (
        <div role="dialog" aria-label="Time picker" style={S.panel}>
          {/* ── Inline editor row ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '12px'
            }}
          >
            <DigitInput
              value={h12}
              min={1}
              max={12}
              isHour
              onCommit={commitH12}
              onStep={stepHours}
              onAMPM={setAMPM}
              nextRef={minuteRef}
              highlight={presetMode === 'hours'}
            />

            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-muted)',
                lineHeight: 1,
                userSelect: 'none'
              }}
            >
              :
            </span>

            <DigitInput
              ref={minuteRef}
              value={minutes}
              min={0}
              max={59}
              onCommit={commitMins}
              onStep={stepMins}
              nextRef={null}
              highlight={presetMode === 'minutes'}
            />

            {/* AM / PM Toggle */}
            <button
              type="button"
              onClick={() => {
                setHours(h => (h < 12 ? h + 12 : h - 12));
              }}
              style={{
                width: '48px',
                height: '40px',
                marginLeft: 4,
                borderRadius: '8px',
                background: 'var(--bg-surface-2, rgba(255,255,255,0.06))',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                ...(presetMode === 'ampm'
                  ? {
                      borderColor: 'var(--primary-resonance)',
                      boxShadow:
                        '0 0 0 3px var(--primary-glow, rgba(99,102,241,0.2))'
                    }
                  : {}),
                ...glassBorder
              }}
            >
              {isAM ? 'AM' : 'PM'}
            </button>

            {/* ✓ Done */}
            <button
              type="button"
              className="tp-done-btn"
              onClick={() => commitAndClose(hours, minutes)}
              aria-label="Confirm time"
              title="Confirm time"
              style={{
                marginLeft: 2,
                width: 32,
                height: 32,
                borderRadius: '8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s',
                ...glassBorder,
                ...glassBackgroundHover
              }}
            >
              <Check style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* ── Divider ── */}
          <div
            style={{
              borderTop:
                '1px solid var(--glass-outline, rgba(255,255,255,0.08))',
              marginBottom: '10px'
            }}
          />

          {/* ── Quick presets grid ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {presetMode === 'hours' &&
              [
                [1, 2, 3, 4],
                [5, 6, 7, 8],
                [9, 10, 11, 12]
              ].map((row, ri) => (
                <div
                  key={ri}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 4
                  }}
                >
                  {row.map(hval => {
                    const active = h12 === hval;
                    return (
                      <button
                        key={hval}
                        type="button"
                        className={`tp-preset${active ? ' tp-preset-active' : ''}`}
                        onClick={() => {
                          commitH12(hval);
                          setPresetMode('minutes');
                        }}
                        style={{
                          padding: '9px 4px',
                          fontSize: '14px',
                          fontWeight: 600,
                          borderRadius: '8px',
                          border: active
                            ? '1px solid transparent'
                            : '1px solid var(--glass-outline)',
                          background: active
                            ? 'var(--primary-resonance)'
                            : 'var(--glass-surface-hover, rgba(255,255,255,0.04))',
                          color: active ? '#fff' : 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.12s',
                          textAlign: 'center'
                        }}
                      >
                        {hval}
                      </button>
                    );
                  })}
                </div>
              ))}

            {presetMode === 'minutes' &&
              [
                [0, 5, 10, 15],
                [20, 25, 30, 35],
                [40, 45, 50, 55]
              ].map((row, ri) => (
                <div
                  key={ri}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 4
                  }}
                >
                  {row.map(m => {
                    const active = minutes === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        className={`tp-preset${active ? ' tp-preset-active' : ''}`}
                        onClick={() => {
                          commitMins(m);
                          setPresetMode('ampm');
                        }}
                        style={{
                          padding: '7px 4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '8px',
                          border: active
                            ? '1px solid transparent'
                            : '1px solid var(--glass-outline)',
                          background: active
                            ? 'var(--primary-resonance)'
                            : 'var(--glass-surface-hover, rgba(255,255,255,0.04))',
                          color: active ? '#fff' : 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.12s',
                          textAlign: 'center'
                        }}
                      >
                        :{String(m).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              ))}

            {presetMode === 'ampm' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginTop: 4
                }}
              >
                {(['AM', 'PM'] as const).map(ap => {
                  const active = (ap === 'AM') === isAM;
                  return (
                    <button
                      key={ap}
                      type="button"
                      onClick={() => setAMPM(ap)}
                      className={`tp-preset${active ? ' tp-preset-active' : ''}`}
                      style={{
                        padding: '16px',
                        fontSize: '16px',
                        fontWeight: 700,
                        borderRadius: '10px',
                        border: active
                          ? '1px solid transparent'
                          : '1px solid var(--glass-outline)',
                        background: active
                          ? 'var(--primary-resonance)'
                          : 'var(--glass-surface-hover, rgba(255,255,255,0.04))',
                        color: active ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                        textAlign: 'center'
                      }}
                    >
                      {ap}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TimePicker;
