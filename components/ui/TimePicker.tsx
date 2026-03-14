import React, { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { Clock, Check } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

interface ParsedTime { hours: number; minutes: number; }
function parse24(value?: string): ParsedTime | null {
    if (!value) return null;
    const [h, m] = value.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return { hours: h, minutes: m };
}

function to24String(h: number, m: number): string {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function toDisplay(h: number, m: number): string {
    const ampm = h < 12 ? "AM" : "PM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

// ── Style tokens ──────────────────────────────────────────────────────────────

const S = {
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
        minWidth: "240px",
        width: "100%",
        boxSizing: "border-box",
        animation: "lgFadeIn 0.15s ease",
    },
    digitInput: {
        width: "48px",
        height: "40px",
        textAlign: "center",
        background: "var(--bg-surface-2, rgba(255,255,255,0.06))",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--glass-outline)",
        borderRadius: "8px",
        fontSize: "20px",
        fontFamily: "var(--font-mono, JetBrains Mono, monospace)",
        fontWeight: 700,
        color: "var(--text-primary)",
        outline: "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
        caretColor: "transparent",
        cursor: "text",
        padding: 0,
        boxSizing: "border-box",
    },
};

// ── Quick preset grid ─────────────────────────────────────────────────────────

const PRESET_ROWS = [
    [
        { label: "6 AM", h: 6, m: 0 },
        { label: "7 AM", h: 7, m: 0 },
        { label: "8 AM", h: 8, m: 0 },
        { label: "9 AM", h: 9, m: 0 },
    ],
    [
        { label: "10 AM", h: 10, m: 0 },
        { label: "11 AM", h: 11, m: 0 },
        { label: "Noon", h: 12, m: 0 },
        { label: "1 PM", h: 13, m: 0 },
    ],
    [
        { label: "5 PM", h: 17, m: 0 },
        { label: "6 PM", h: 18, m: 0 },
        { label: "7 PM", h: 19, m: 0 },
        { label: "8 PM", h: 20, m: 0 },
    ],
];

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
    onAMPM?: (ampm: "AM" | "PM") => void;
}

const DigitInput = forwardRef<HTMLInputElement, DigitInputProps>(function DigitInput(
    { value, min, max, onCommit, onStep, nextRef, isHour, onAMPM },
    ref
) {
    const [buffer, setBuffer] = useState("");
    const [focused, setFocused] = useState(false);

    useEffect(() => { setBuffer(""); }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowUp") { e.preventDefault(); setBuffer(""); onStep(1); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); setBuffer(""); onStep(-1); return; }
        if (e.key === "Tab") { setBuffer(""); return; }

        if (isHour) {
            if (e.key === "a" || e.key === "A") { e.preventDefault(); onAMPM?.("AM"); return; }
            if (e.key === "p" || e.key === "P") { e.preventDefault(); onAMPM?.("PM"); return; }
        }

        if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
        e.preventDefault();

        const next = buffer + e.key;
        const digit = parseInt(e.key, 10);

        if (next.length === 1) {
            const maxTens = isHour ? 1 : 5;
            if (digit > maxTens) {
                setBuffer("");
                onCommit(clamp(digit, min, max));
                nextRef?.current?.focus();
            } else {
                setBuffer(next);
            }
        } else {
            const num = parseInt(next, 10);
            setBuffer("");
            onCommit(clamp(num, min, max));
            nextRef?.current?.focus();
        }
    };

    const shownValue = buffer !== "" ? buffer : String(value).padStart(2, "0");

    return (
        <input
            ref={ref}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={shownValue}
            onChange={() => { }}
            onKeyDown={handleKeyDown}
            onFocus={() => { setFocused(true); setBuffer(""); }}
            onBlur={() => { setFocused(false); setBuffer(""); }}
            style={{
                ...S.digitInput,
                ...(focused ? {
                    borderColor: "var(--primary-resonance)",
                    boxShadow: "0 0 0 3px var(--primary-glow, rgba(99,102,241,0.2))",
                } : {}),
            }}
            aria-label={isHour ? "Hours" : "Minutes"}
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
        />
    );
});

// ── TimePicker ────────────────────────────────────────────────────────────────

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
 * @param {string}   id           - id for the trigger button
 * @param {string}   value        - Controlled "HH:MM" 24h string or ""
 * @param {function} onChange     - Called with "HH:MM" 24h string
 * @param {string}   placeholder  - Placeholder text
 * @param {boolean}  disabled     - Disables interaction
 * @param {number}   minuteStep   - Minutes increment for arrows (default 5)
 * @param {string}   label        - Accessible aria-label (optional)
 */
interface TimePickerProps {
    id?: string;
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    minuteStep?: number;
    label?: string;
}

export function TimePicker({ id, value, onChange, placeholder = "Select a time", disabled = false, minuteStep = 5, label }: TimePickerProps) {
    const parsed = parse24(value);

    const [open, setOpen] = useState(false);
    const [hours, setHours] = useState(parsed?.hours ?? 9);
    const [minutes, setMinutes] = useState(parsed?.minutes ?? 0);

    const wrapRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const minuteRef = useRef<HTMLInputElement>(null);

    // Sync when value changes externally
    useEffect(() => {
        const p = parse24(value);
        if (p) { setHours(p.hours); setMinutes(p.minutes); }
    }, [value]);

    // Emit on every internal change (no auto-close here — just sync)
    const emit = useCallback((h, m) => {
        onChange?.(to24String(h, m));
    }, [onChange]);

    const commitAndClose = useCallback((h, m) => {
        emit(h, m);
        setOpen(false);
        triggerRef.current?.focus();
    }, [emit]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
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

    const isAM = hours < 12;
    const h12 = hours % 12 === 0 ? 12 : hours % 12;

    const commitH12 = useCallback((h12val) => {
        const h = clamp(h12val, 1, 12);
        const h24 = isAM ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
        setHours(h24);
        emit(h24, minutes);
    }, [isAM, minutes, emit]);

    const commitMins = useCallback((mval) => {
        const m = clamp(mval, 0, 59);
        setMinutes(m);
        emit(hours, m);
    }, [hours, emit]);

    const stepHours = useCallback((dir) => {
        setHours((h) => {
            const next = ((h + dir) % 24 + 24) % 24;
            emit(next, minutes);
            return next;
        });
    }, [minutes, emit]);

    const stepMins = useCallback((dir) => {
        setMinutes((m) => {
            let next = m + dir * minuteStep;
            let h = hours;
            if (next < 0) { next = 60 - minuteStep; h = ((hours - 1) % 24 + 24) % 24; setHours(h); }
            if (next >= 60) { next = 0; h = (hours + 1) % 24; setHours(h); }
            emit(h, next);
            return next;
        });
    }, [hours, minutes, minuteStep, emit]);

    // AM/PM toggle → auto-close (final user action)
    const setAMPM = useCallback((ampm) => {
        let h = hours;
        if (ampm === "AM" && !isAM) h = hours - 12;
        if (ampm === "PM" && isAM) h = hours + 12;
        setHours(h);
        commitAndClose(h, minutes);
    }, [hours, isAM, minutes, commitAndClose]);

    const triggerFocus = (focused) => ({
        border: focused ? "1px solid var(--border-glow, var(--primary-resonance))" : "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
        boxShadow: focused ? "0 0 0 3px var(--primary-glow, rgba(99,102,241,0.2))" : "none",
    });

    const navHover = (e: React.MouseEvent<HTMLElement>, enter: boolean) => {
        e.currentTarget.style.background = enter ? "var(--glass-surface-hover)" : "transparent";
        e.currentTarget.style.color = enter ? "var(--text-primary)" : "var(--text-muted)";
    };

    return (
        <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
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
                onClick={() => !disabled && setOpen((o) => !o)}
                style={{
                    ...S.trigger,
                    opacity: disabled ? 0.55 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                    ...(open ? triggerFocus(true) : triggerFocus(false)),
                }}
                onFocus={(e) => Object.assign(e.currentTarget.style, triggerFocus(true))}
                onBlur={(e) => { if (!wrapRef.current?.contains(e.relatedTarget)) Object.assign(e.currentTarget.style, triggerFocus(false)); }}
            >
                <Clock style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }} />
                <span style={parsed ? { color: "var(--text-primary)" } : { color: "var(--text-muted, rgba(255,255,255,0.35))" }}>
                    {parsed ? toDisplay(parsed.hours, parsed.minutes) : placeholder}
                </span>
            </button>

            {/* ── Panel ── */}
            {open && (
                <div role="dialog" aria-label="Time picker" style={S.panel}>

                    {/* ── Inline editor row ── */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "12px" }}>
                        {/* Hour input */}
                        <DigitInput
                            value={h12} min={1} max={12}
                            isHour
                            onCommit={commitH12}
                            onStep={stepHours}
                            onAMPM={setAMPM}
                            nextRef={minuteRef}
                        />

                        {/* Separator */}
                        <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-muted)", lineHeight: 1, userSelect: "none" }}>:</span>

                        {/* Minute input */}
                        <DigitInput
                            ref={minuteRef}
                            value={minutes} min={0} max={59}
                            onCommit={commitMins}
                            onStep={stepMins}
                            nextRef={null}
                        />

                        {/* AM / PM — clicking here auto-closes */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginLeft: 4 }}>
                            {["AM", "PM"].map((ap) => {
                                const active = (ap === "AM") === isAM;
                                return (
                                    <button
                                        key={ap}
                                        type="button"
                                        onClick={() => setAMPM(ap)}
                                        aria-pressed={active}
                                        className={`tp-ampm${active ? " tp-ampm-active" : ""}`}
                                        style={{
                                            padding: "4px 9px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            letterSpacing: "0.06em",
                                            borderRadius: "6px",
                                            border: active ? "1px solid transparent" : "1px solid var(--glass-outline)",
                                            cursor: "pointer",
                                            transition: "all 0.1s",
                                            background: active ? "var(--primary-resonance)" : "var(--bg-surface-2, rgba(255,255,255,0.05))",
                                            color: active ? "#fff" : "var(--text-muted)",
                                            minHeight: "28px",
                                        }}
                                    >
                                        {ap}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ✓ Done — explicit close for keyboard-entered custom time */}
                        <button
                            type="button"
                            className="tp-done-btn"
                            onClick={() => commitAndClose(hours, minutes)}
                            aria-label="Confirm time"
                            title="Confirm time"
                            style={{
                                marginLeft: 2,
                                width: 32, height: 32,
                                borderRadius: "8px",
                                border: "1px solid var(--glass-outline)",
                                background: "var(--glass-surface-hover)",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                transition: "all 0.15s",
                            }}
                        >
                            <Check style={{ width: 14, height: 14 }} />
                        </button>
                    </div>

                    {/* ── Divider ── */}
                    <div style={{ borderTop: "1px solid var(--glass-outline, rgba(255,255,255,0.08))", marginBottom: "10px" }} />

                    {/* ── Quick presets grid ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {PRESET_ROWS.map((row, ri) => (
                            <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                                {row.map(({ label: lbl, h, m }) => {
                                    const active = hours === h && minutes === m;
                                    return (
                                        <button
                                            key={lbl}
                                            type="button"
                                            className={`tp-preset${active ? " tp-preset-active" : ""}`}
                                            onClick={() => commitAndClose(h, m)}
                                            style={{
                                                padding: "7px 4px",
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                borderRadius: "8px",
                                                border: active ? "1px solid transparent" : "1px solid var(--glass-outline)",
                                                background: active ? "var(--primary-resonance)" : "var(--glass-surface-hover, rgba(255,255,255,0.04))",
                                                color: active ? "#fff" : "var(--text-muted)",
                                                cursor: "pointer",
                                                transition: "all 0.12s",
                                                textAlign: "center",
                                            }}
                                        >
                                            {lbl}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default TimePicker;
