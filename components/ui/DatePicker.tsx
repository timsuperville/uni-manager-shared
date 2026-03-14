import React, { useState, useEffect, useRef, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns a Date set to midnight local time for a given y/m/d */
function localDate(y: number, m: number, d: number): Date {
    return new Date(y, m, d);
}

/** Total days in a given month */
function daysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/** Day-of-week the month starts on (0=Sun) */
function firstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
}

/** Parse a yyyy-mm-dd string or Date into { year, month, day } | null */
interface ParsedDate { year: number; month: number; day: number; }
function parseValue(value?: string | Date | null): ParsedDate | null {
    if (!value) return null;
    const d = typeof value === "string" ? new Date(value + "T00:00:00") : new Date(value);
    if (isNaN(d.getTime())) return null;
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

/** Format { year, month, day } → "yyyy-mm-dd" */
function formatISO({ year, month, day }: ParsedDate): string {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
}

/** Format { year, month, day } → "Mon D, YYYY" */
function formatDisplay({ year, month, day }: ParsedDate): string {
    return `${MONTHS[month].slice(0, 3)} ${day}, ${year}`;
}

// ── Inline style tokens ───────────────────────────────────────────────────────

const S = {
    // Trigger button (looks like an input)
    trigger: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        padding: "9px 12px",
        background: "var(--bg-surface-1, rgba(255,255,255,0.04))",
        border: "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
        borderRadius: "var(--radius-md, 6px)",
        color: "var(--text-primary, #f1f5f9)",
        fontSize: "13px",
        fontFamily: "var(--font-body, Inter, sans-serif)",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        textAlign: "left",
        userSelect: "none",
    },
    triggerPlaceholder: {
        color: "var(--text-muted, rgba(255,255,255,0.35))",
    },
    // Popover panel (Surface 2 glass)
    panel: {
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        right: 0,
        zIndex: 900,
        background: "var(--glass-surface, hsla(222,47%,10%,0.94))",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid var(--glass-outline, rgba(255,255,255,0.1))",
        borderRadius: "var(--radius-lg, 12px)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        padding: "12px",
        minWidth: "280px",
        width: "100%",
        boxSizing: "border-box",
        animation: "lgFadeIn 0.15s ease",
    },
    // Navigation row
    navRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "8px",
        gap: "4px",
    },
    navBtn: {
        background: "transparent",
        border: "none",
        color: "var(--text-muted)",
        cursor: "pointer",
        padding: "6px",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.1s, color 0.1s",
        minWidth: "32px",
        minHeight: "32px",
    },
    monthYearLabel: {
        flex: 1,
        textAlign: "center",
        fontWeight: 600,
        fontSize: "13px",
        color: "var(--text-primary)",
        letterSpacing: "0.02em",
    },
    // Week header labels
    weekHeader: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "2px",
        marginBottom: "4px",
    },
    weekDay: {
        textAlign: "center",
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--text-muted)",
        padding: "4px 0",
        letterSpacing: "0.04em",
    },
    // Day grid
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "2px",
    },
    // Base day cell
    day: {
        textAlign: "center",
        fontSize: "12px",
        padding: "8px 0",
        borderRadius: "6px",
        cursor: "pointer",
        border: "none",
        background: "transparent",
        color: "var(--text-secondary)",
        transition: "background 0.1s, color 0.1s",
        lineHeight: 1,
        minHeight: "32px",
        minWidth: 0,
    },
    // Clear button
    clearRow: {
        marginTop: "10px",
        paddingTop: "10px",
        borderTop: "1px solid var(--glass-outline, rgba(255,255,255,0.08))",
        display: "flex",
        justifyContent: "flex-end",
    },
    clearBtn: {
        background: "transparent",
        border: "none",
        fontSize: "11px",
        color: "var(--text-muted)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 4px",
    },
};

// ── DatePicker ────────────────────────────────────────────────────────────────

/**
 * DatePicker — Liquid Glass Design System
 *
 * A fully custom, accessible calendar date picker built on CSS custom
 * properties. No native date input. No external date library.
 *
 * @param {string}   id            - id for the trigger button (accessibility)
 * @param {string}   value         - Controlled ISO date string "yyyy-mm-dd" or ""
 * @param {function} onChange      - Called with "yyyy-mm-dd" string or ""
 * @param {string}   placeholder   - Placeholder text when no date is selected
 * @param {boolean}  disabled      - Disables interaction
 * @param {Date}     minDate       - Earliest selectable date (optional)
 * @param {Date}     maxDate       - Latest selectable date (optional)
 * @param {string}   label         - Accessible label (optional, aria-label)
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

export function DatePicker({ id, value, onChange, placeholder = "Select a date", disabled = false, minDate, maxDate, label }: DatePickerProps) {
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
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    const prevMonth = useCallback(() => {
        setViewMonth((m) => {
            if (m === 0) { setViewYear((y) => y - 1); return 11; }
            return m - 1;
        });
    }, []);

    const nextMonth = useCallback(() => {
        setViewMonth((m) => {
            if (m === 11) { setViewYear((y) => y + 1); return 0; }
            return m + 1;
        });
    }, []);

    const selectDay = useCallback((year, month, day) => {
        const iso = formatISO({ year, month, day });
        onChange?.(iso);
        setOpen(false);
        triggerRef.current?.focus();
    }, [onChange]);

    const clear = useCallback(() => {
        onChange?.("");
        setOpen(false);
    }, [onChange]);

    // Compute calendar cells
    const firstDay = firstDayOfMonth(viewYear, viewMonth);
    const totalDays = daysInMonth(viewYear, viewMonth);
    const cells = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) cells.push(null);
    // Day cells
    for (let d = 1; d <= totalDays; d++) cells.push(d);

    const isSelected = (d) =>
        parsed && parsed.year === viewYear && parsed.month === viewMonth && parsed.day === d;

    const isToday = (d) =>
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

    const triggerFocusStyle = (focused) => ({
        border: focused
            ? "1px solid var(--border-glow, var(--primary-resonance))"
            : "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
        boxShadow: focused ? "0 0 0 3px var(--primary-glow, rgba(99,102,241,0.2))" : "none",
    });

    return (
        <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
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
                onClick={() => !disabled && setOpen((o) => !o)}
                style={{
                    ...S.trigger,
                    opacity: disabled ? 0.55 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                    ...(open ? triggerFocusStyle(true) : triggerFocusStyle(false)),
                }}
                onFocus={(e) => Object.assign(e.currentTarget.style, triggerFocusStyle(true))}
                onBlur={(e) => { if (!wrapRef.current?.contains(e.relatedTarget)) Object.assign(e.currentTarget.style, triggerFocusStyle(false)); }}
            >
                <Calendar style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }} />
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
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--glass-surface-hover, rgba(255,255,255,0.06))"; e.currentTarget.style.color = "var(--text-primary)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
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
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--glass-surface-hover, rgba(255,255,255,0.06))"; e.currentTarget.style.color = "var(--text-primary)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                        >
                            <ChevronRight style={{ width: 16, height: 16 }} />
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div style={S.weekHeader} aria-hidden="true">
                        {DAYS_SHORT.map((d) => (
                            <div key={d} style={S.weekDay}>{d}</div>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div style={S.grid} role="grid" aria-label={`${MONTHS[viewMonth]} ${viewYear}`}>
                        {cells.map((day, i) => {
                            if (!day) return <div key={`empty-${i}`} role="gridcell" aria-hidden="true" />;

                            const sel = isSelected(day);
                            const tod = isToday(day);
                            const dis = isDisabled(day);

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    role="gridcell"
                                    aria-label={`${MONTHS[viewMonth]} ${day}, ${viewYear}${sel ? " (selected)" : ""}${tod ? " (today)" : ""}`}
                                    aria-selected={sel}
                                    aria-disabled={dis}
                                    disabled={dis}
                                    onClick={() => !dis && selectDay(viewYear, viewMonth, day)}
                                    style={{
                                        ...S.day,
                                        ...(dis ? { opacity: 0.3, cursor: "not-allowed" } : {}),
                                        ...(tod && !sel ? {
                                            color: "var(--text-accent, var(--primary-resonance))",
                                            fontWeight: 700,
                                        } : {}),
                                        ...(sel ? {
                                            background: "var(--primary-resonance)",
                                            color: "#fff",
                                            fontWeight: 700,
                                            boxShadow: "0 2px 8px var(--primary-glow, rgba(99,102,241,0.3))",
                                        } : {}),
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!sel && !dis) {
                                            e.currentTarget.style.background = "var(--glass-surface-hover, rgba(255,255,255,0.07))";
                                            e.currentTarget.style.color = "var(--text-primary)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!sel && !dis) {
                                            e.currentTarget.style.background = "transparent";
                                            e.currentTarget.style.color = tod ? "var(--text-accent, var(--primary-resonance))" : "var(--text-secondary)";
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
                            style={{ ...S.clearBtn, marginRight: "auto" }}
                            onClick={() => selectDay(today.getFullYear(), today.getMonth(), today.getDate())}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                        >
                            Today
                        </button>

                        {parsed && (
                            <button
                                type="button"
                                style={S.clearBtn}
                                onClick={clear}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-error, #ef4444)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
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
