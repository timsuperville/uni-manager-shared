import React, { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import PropTypes from "prop-types";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function parse24(value) {
    if (!value) return null;
    const [h, m] = value.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return { hours: h, minutes: m };
}

function to24String(h, m) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function toDisplay(h, m) {
    const ampm = h < 12 ? "AM" : "PM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function clamp(val, min, max, wrap) {
    if (val < min) return wrap ? max : min;
    if (val > max) return wrap ? min : max;
    return val;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

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
    triggerPlaceholder: {
        color: "var(--text-muted, rgba(255,255,255,0.35))",
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
        padding: "16px",
        minWidth: "220px",
        width: "100%",
        boxSizing: "border-box",
        animation: "lgFadeIn 0.15s ease",
    },
    panelInner: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
    },
    column: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
    },
    spinBtn: {
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
    digitInput: {
        width: "56px",
        height: "46px",
        textAlign: "center",
        background: "var(--bg-surface-2, rgba(255,255,255,0.06))",
        border: "1px solid var(--glass-outline)",
        borderRadius: "8px",
        fontSize: "22px",
        fontFamily: "var(--font-mono, JetBrains Mono, monospace)",
        fontWeight: 700,
        color: "var(--text-primary)",
        letterSpacing: "0.02em",
        outline: "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
        caretColor: "transparent",
        cursor: "text",
        padding: 0,
        boxSizing: "border-box",
        MozAppearance: "textfield",
    },
    separator: {
        fontSize: "20px",
        fontWeight: 700,
        color: "var(--text-muted)",
        lineHeight: 1,
        marginTop: "-8px",
        userSelect: "none",
    },
    ampmBlock: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        marginLeft: "4px",
        alignSelf: "center",
    },
    ampmBtn: {
        padding: "5px 10px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.06em",
        borderRadius: "6px",
        border: "1px solid transparent",
        cursor: "pointer",
        transition: "all 0.1s",
        minHeight: "28px",
    },
    quickRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        marginTop: "12px",
        paddingTop: "12px",
        borderTop: "1px solid var(--glass-outline, rgba(255,255,255,0.08))",
    },
    quickBtn: {
        padding: "3px 10px",
        fontSize: "11px",
        fontWeight: 600,
        borderRadius: "20px",
        border: "1px solid var(--glass-outline)",
        background: "transparent",
        color: "var(--text-muted)",
        cursor: "pointer",
        transition: "all 0.1s",
    },
};

// ── Quick presets ─────────────────────────────────────────────────────────────

const QUICK_TIMES = [
    { label: "8 AM", h: 8, m: 0 },
    { label: "9 AM", h: 9, m: 0 },
    { label: "10 AM", h: 10, m: 0 },
    { label: "11 AM", h: 11, m: 0 },
    { label: "Noon", h: 12, m: 0 },
    { label: "5 PM", h: 17, m: 0 },
    { label: "6 PM", h: 18, m: 0 },
    { label: "7 PM", h: 19, m: 0 },
];

// ── DigitInput ────────────────────────────────────────────────────────────────

/**
 * A single numeric segment (hours or minutes) rendered as a typed input.
 *
 * Behaviour:
 *  - Digit keys: accumulate a 1–2 digit buffer; commit + auto-advance on the
 *    second digit, or on first digit if it can't be a valid tens digit.
 *  - ArrowUp / ArrowDown: spin the value (clears buffer).
 *  - 'a' / 'A'  →  toggle AM  (hour segment only)
 *  - 'p' / 'P'  →  toggle PM  (hour segment only)
 *  - Tab:        propagate normally (browser moves focus to next element).
 *  - All other keys: suppressed.
 */
const DigitInput = forwardRef(function DigitInput(
    { value, min, max, onCommit, onStep, nextRef, isHour, onAMPM },
    ref
) {
    const [buffer, setBuffer] = useState("");

    // Clear buffer whenever the committed value changes externally
    useEffect(() => { setBuffer(""); }, [value]);

    const handleBlur = () => setBuffer("");
    const handleFocus = () => setBuffer("");

    const handleKeyDown = (e) => {
        // Spin
        if (e.key === "ArrowUp") { e.preventDefault(); setBuffer(""); onStep(1); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); setBuffer(""); onStep(-1); return; }

        // Let Tab pass through
        if (e.key === "Tab") { setBuffer(""); return; }

        // AM / PM shortcuts on the hour segment
        if (isHour) {
            if (e.key === "a" || e.key === "A") { e.preventDefault(); onAMPM?.("AM"); return; }
            if (e.key === "p" || e.key === "P") { e.preventDefault(); onAMPM?.("PM"); return; }
        }

        // Digits only
        if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
        e.preventDefault();

        const next = buffer + e.key;

        if (next.length === 1) {
            const digit = parseInt(next, 10);
            // If the first digit can never be the tens digit of a valid value,
            // commit immediately and advance focus.
            // Hours 1-12: max tens digit is 1  → digits 2-9 are instant
            // Minutes 0-59: max tens digit is 5 → digits 6-9 are instant
            const maxTens = isHour ? 1 : 5;
            if (digit > maxTens) {
                setBuffer("");
                onCommit(clamp(digit, min, max, false));
                nextRef?.current?.focus();
            } else {
                setBuffer(next);
            }
        } else {
            // Two-digit entry: commit and move on
            const num = parseInt(next, 10);
            setBuffer("");
            onCommit(clamp(num, min, max, false));
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
            onChange={() => { }}          // fully controlled via onKeyDown
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={S.digitInput}
            aria-label={isHour ? "Hours" : "Minutes"}
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
        />
    );
});

DigitInput.propTypes = {
    value: PropTypes.number.isRequired,
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    onCommit: PropTypes.func.isRequired,
    onStep: PropTypes.func.isRequired,
    nextRef: PropTypes.object,
    isHour: PropTypes.bool,
    onAMPM: PropTypes.func,
};

// ── TimePicker ────────────────────────────────────────────────────────────────

/**
 * TimePicker — Liquid Glass Design System
 *
 * A custom 12-hour AM/PM time picker with:
 *  - Directly editable digit inputs (type digits, auto-advance, ArrowUp/Down)
 *  - Spinner chevrons for mouse/touch control
 *  - Keyboard shortcuts: 'a' = AM, 'p' = PM in the hour field
 *  - Quick-time presets for common service times
 *
 * @param {string}   id           - id for the trigger button
 * @param {string}   value        - Controlled "HH:MM" 24h string or ""
 * @param {function} onChange     - Called with "HH:MM" 24h string or ""
 * @param {string}   placeholder  - Placeholder text
 * @param {boolean}  disabled     - Disables interaction
 * @param {number}   minuteStep   - Minutes increment (default 5)
 * @param {string}   label        - Accessible aria-label (optional)
 */
export function TimePicker({
    id,
    value,
    onChange,
    placeholder = "Select a time",
    disabled = false,
    minuteStep = 5,
    label,
}) {
    const parsed = parse24(value);

    const [open, setOpen] = useState(false);
    const [hours, setHours] = useState(parsed?.hours ?? 9);
    const [minutes, setMinutes] = useState(parsed?.minutes ?? 0);

    const wrapRef = useRef(null);
    const triggerRef = useRef(null);
    const minuteRef = useRef(null);   // auto-advance target

    // Sync when value changes externally
    useEffect(() => {
        const p = parse24(value);
        if (p) { setHours(p.hours); setMinutes(p.minutes); }
    }, [value]);

    // Emit on every internal change while open
    useEffect(() => {
        if (open) onChange?.(to24String(hours, minutes));
    }, [hours, minutes, open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    const isAM = hours < 12;
    const h12 = hours % 12 === 0 ? 12 : hours % 12;

    const commitH12 = useCallback((h12val) => {
        const h = clamp(h12val, 1, 12, false);
        setHours(isAM ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12));
    }, [isAM]);

    const commitMins = useCallback((mval) => {
        setMinutes(clamp(mval, 0, 59, false));
    }, []);

    const setAMPM = useCallback((ampm) => {
        if (ampm === "AM" && !isAM) setHours((h) => h - 12);
        if (ampm === "PM" && isAM) setHours((h) => h + 12);
    }, [isAM]);

    const stepMins = useCallback((dir) => {
        setMinutes((m) => {
            const next = m + dir * minuteStep;
            if (next < 0) { setHours((h) => clamp(h - 1, 0, 23, true)); return 60 - minuteStep; }
            if (next >= 60) { setHours((h) => clamp(h + 1, 0, 23, true)); return 0; }
            return next;
        });
    }, [minuteStep]);

    const stepHours = useCallback((dir) => {
        setHours((h) => clamp(h + dir, 0, 23, true));
    }, []);

    const navHover = (e, enter) => {
        e.currentTarget.style.background = enter ? "var(--glass-surface-hover, rgba(255,255,255,0.07))" : "transparent";
        e.currentTarget.style.color = enter ? "var(--text-primary)" : "var(--text-muted)";
    };

    const triggerFocus = (focused) => ({
        border: focused ? "1px solid var(--border-glow, var(--primary-resonance))" : "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
        boxShadow: focused ? "0 0 0 3px var(--primary-glow, rgba(99,102,241,0.2))" : "none",
    });

    return (
        <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
            <style>{`@keyframes lgFadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }`}</style>

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
                <span style={parsed ? {} : S.triggerPlaceholder}>
                    {parsed ? toDisplay(parsed.hours, parsed.minutes) : placeholder}
                </span>
            </button>

            {/* ── Panel ── */}
            {open && (
                <div role="dialog" aria-label="Time picker" style={S.panel}>
                    <div style={S.panelInner}>

                        {/* Hours */}
                        <div style={S.column}>
                            <button type="button" style={S.spinBtn} aria-label="Increase hours"
                                onClick={() => stepHours(1)}
                                onMouseEnter={(e) => navHover(e, true)}
                                onMouseLeave={(e) => navHover(e, false)}>
                                <ChevronUp style={{ width: 16, height: 16 }} />
                            </button>
                            <DigitInput
                                value={h12} min={1} max={12}
                                isHour
                                onCommit={commitH12}
                                onStep={stepHours}
                                onAMPM={setAMPM}
                                nextRef={minuteRef}
                            />
                            <button type="button" style={S.spinBtn} aria-label="Decrease hours"
                                onClick={() => stepHours(-1)}
                                onMouseEnter={(e) => navHover(e, true)}
                                onMouseLeave={(e) => navHover(e, false)}>
                                <ChevronDown style={{ width: 16, height: 16 }} />
                            </button>
                        </div>

                        {/* Separator */}
                        <div style={S.separator} aria-hidden="true">:</div>

                        {/* Minutes */}
                        <div style={S.column}>
                            <button type="button" style={S.spinBtn} aria-label="Increase minutes"
                                onClick={() => stepMins(1)}
                                onMouseEnter={(e) => navHover(e, true)}
                                onMouseLeave={(e) => navHover(e, false)}>
                                <ChevronUp style={{ width: 16, height: 16 }} />
                            </button>
                            <DigitInput
                                ref={minuteRef}
                                value={minutes} min={0} max={59}
                                onCommit={commitMins}
                                onStep={stepMins}
                                nextRef={null}
                            />
                            <button type="button" style={S.spinBtn} aria-label="Decrease minutes"
                                onClick={() => stepMins(-1)}
                                onMouseEnter={(e) => navHover(e, true)}
                                onMouseLeave={(e) => navHover(e, false)}>
                                <ChevronDown style={{ width: 16, height: 16 }} />
                            </button>
                        </div>

                        {/* AM / PM */}
                        <div style={S.ampmBlock}>
                            {["AM", "PM"].map((ap) => {
                                const active = (ap === "AM") === isAM;
                                return (
                                    <button key={ap} type="button" onClick={() => setAMPM(ap)} aria-pressed={active}
                                        style={{
                                            ...S.ampmBtn,
                                            background: active ? "var(--primary-resonance)" : "var(--bg-surface-2, rgba(255,255,255,0.05))",
                                            color: active ? "#fff" : "var(--text-muted)",
                                            border: active ? "1px solid transparent" : "1px solid var(--glass-outline)",
                                        }}>
                                        {ap}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick presets */}
                    <div style={S.quickRow}>
                        {QUICK_TIMES.map(({ label: lbl, h, m }) => {
                            const active = hours === h && minutes === m;
                            return (
                                <button key={lbl} type="button"
                                    onClick={() => { setHours(h); setMinutes(m); }}
                                    style={{
                                        ...S.quickBtn,
                                        background: active ? "var(--primary-subtle, hsla(272,65%,62%,0.12))" : "transparent",
                                        color: active ? "var(--text-accent, var(--primary-resonance))" : "var(--text-muted)",
                                        border: active ? "1px solid var(--primary-resonance, rgba(99,102,241,0.4))" : "1px solid var(--glass-outline)",
                                    }}
                                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--glass-surface-hover)"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
                                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; } }}
                                >
                                    {lbl}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

TimePicker.propTypes = {
    id: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
    minuteStep: PropTypes.number,
    label: PropTypes.string,
};
