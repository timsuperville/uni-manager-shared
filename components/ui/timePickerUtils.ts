/**
 * timePickerUtils.ts — Liquid Glass Design System
 *
 * Pure helpers, constants, and style tokens for TimePicker.tsx.
 * Extracted to keep the component file focused on logic and JSX.
 */
import type React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedTime {
  hours: number;
  minutes: number;
}

export interface TimePreset {
  label: string;
  h: number;
  m: number;
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

/** Parse a "HH:MM" 24h string into ParsedTime | null. */
export function parse24(value?: string): ParsedTime | null {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return { hours: h, minutes: m };
}

/** Format hours + minutes into "HH:MM" 24h string. */
export function to24String(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Format 24h hours + minutes into "H:MM AM/PM" display string. */
export function toDisplay(h: number, m: number): string {
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Clamp a value between min and max (inclusive). */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ── Preset rows ───────────────────────────────────────────────────────────────

export const PRESET_ROWS: TimePreset[][] = [
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

// ── Inline style tokens ───────────────────────────────────────────────────────

type CSSProperties = React.CSSProperties;

export const TIME_PICKER_STYLES = {
  trigger: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "9px 12px",
    background: "var(--bg-surface-1, rgba(255,255,255,0.04))",
    border: "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
    borderRadius: "var()",
    color: "var()",
    fontSize: "13px",
    fontFamily: "var()",
    cursor: "pointer",
    transition: "border-color 0.15s, box-shadow 0.15s",
    textAlign: "left",
    userSelect: "none",
  } as CSSProperties,
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
    borderRadius: "var()",
    boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
    padding: "12px",
    minWidth: "240px",
    width: "100%",
    boxSizing: "border-box",
    animation: "lgFadeIn 0.15s ease",
  } as CSSProperties,
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
    fontFamily: "var()",
    fontWeight: 700,
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    caretColor: "transparent",
    cursor: "text",
    padding: 0,
    boxSizing: "border-box",
  } as CSSProperties,
} as const;
