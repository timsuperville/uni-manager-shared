/**
 * datePickerUtils.ts — Liquid Glass Design System
 *
 * Pure helpers, constants, and style tokens for DatePicker.tsx.
 * Extracted to keep the component file focused on logic and JSX.
 */
import type React from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedDate {
  year: number;
  month: number;
  day: number;
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

/** Returns a Date set to midnight local time for a given y/m/d. */
export function localDate(y: number, m: number, d: number): Date {
  return new Date(y, m, d);
}

/** Total days in a given month. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Day-of-week the month starts on (0=Sun). */
export function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** Parse a yyyy-mm-dd string or Date into ParsedDate | null. */
export function parseValue(value?: string | Date | null): ParsedDate | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value + "T00:00:00") : new Date(value);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

/** Format ParsedDate → "yyyy-mm-dd". */
export function formatISO({ year, month, day }: ParsedDate): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** Format ParsedDate → "Mon D, YYYY". */
export function formatDisplay({ year, month, day }: ParsedDate): string {
  return `${MONTHS[month].slice(0, 3)} ${day}, ${year}`;
}

// ── Inline style tokens ───────────────────────────────────────────────────────
// Typed as Record so callers can spread directly onto React style props.

type CSSProperties = React.CSSProperties;

export const DATE_PICKER_STYLES = {
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
  triggerPlaceholder: {
    color: "var(--text-muted, rgba(255,255,255,0.35))",
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
    minWidth: "280px",
    width: "100%",
    boxSizing: "border-box",
    animation: "lgFadeIn 0.15s ease",
  } as CSSProperties,
  navRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
    gap: "4px",
  } as CSSProperties,
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
  } as CSSProperties,
  monthYearLabel: {
    flex: 1,
    textAlign: "center",
    fontWeight: 600,
    fontSize: "13px",
    color: "var(--text-primary)",
    letterSpacing: "0.02em",
  } as CSSProperties,
  weekHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "2px",
    marginBottom: "4px",
  } as CSSProperties,
  weekDay: {
    textAlign: "center",
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--text-muted)",
    padding: "4px 0",
    letterSpacing: "0.04em",
  } as CSSProperties,
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "2px",
  } as CSSProperties,
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
  } as CSSProperties,
  clearRow: {
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid var(--glass-outline, rgba(255,255,255,0.08))",
    display: "flex",
    justifyContent: "flex-end",
  } as CSSProperties,
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
  } as CSSProperties,
} as const;
