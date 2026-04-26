/**
 * chipVariants.ts — Liquid Glass Design System
 *
 * Single source of truth for all Chip semantic colour sets across the ecosystem.
 * Covers: user status, feedback status, severity levels, and report categories.
 *
 * Imported by Chip.tsx and any consumer that needs to reference palette keys
 * programmatically (e.g. mapping an API value to a chip style).
 */

export interface ChipColorSet {
  bg: string;
  color: string;
  border: string;
  dot: string | null;
}

export const CHIP_VARIANTS = {
  // ── User / system status ──────────────────────────────────────────────────
  active: {
    bg: "hsla(160,84%,39%,0.12)",
    color: "hsl(160,84%,50%)",
    border: "hsla(160,84%,39%,0.3)",
    dot: "hsl(160,84%,50%)",
  },
  inactive: {
    bg: "hsla(351,89%,60%,0.1)",
    color: "hsl(351,89%,65%)",
    border: "hsla(351,89%,60%,0.25)",
    dot: "hsl(351,89%,60%)",
  },
  suspended: {
    bg: "hsla(38,92%,50%,0.12)",
    color: "hsl(38,92%,65%)",
    border: "hsla(38,92%,50%,0.3)",
    dot: "hsl(38,92%,60%)",
  },
  locked: {
    bg: "hsla(351,89%,60%,0.12)",
    color: "hsl(351,89%,65%)",
    border: "hsla(351,89%,60%,0.3)",
    dot: "hsl(351,89%,60%)",
  },
  warning: {
    bg: "hsla(38,92%,50%,0.12)",
    color: "hsl(38,92%,65%)",
    border: "hsla(38,92%,50%,0.3)",
    dot: "hsl(38,92%,60%)",
  },

  // ── Feedback / report statuses ────────────────────────────────────────────
  pending: {
    bg: "hsla(45,100%,60%,0.12)",
    color: "hsl(45,100%,65%)",
    border: "hsla(45,100%,60%,0.3)",
    dot: "hsl(45,100%,60%)",
  },
  investigating: {
    bg: "hsla(210,90%,65%,0.12)",
    color: "hsl(210,90%,72%)",
    border: "hsla(210,90%,65%,0.3)",
    dot: "hsl(210,90%,65%)",
  },
  "in-progress": {
    bg: "hsla(187,84%,55%,0.12)",
    color: "hsl(187,84%,60%)",
    border: "hsla(187,84%,55%,0.3)",
    dot: "hsl(187,84%,55%)",
  },
  resolved: {
    bg: "hsla(160,84%,50%,0.1)",
    color: "hsl(160,84%,55%)",
    border: "hsla(160,84%,50%,0.3)",
    dot: "hsl(160,84%,50%)",
  },
  ignored: {
    bg: "transparent",
    color: "var(--text-muted)",
    border: "var(--glass-outline)",
    dot: "var(--text-muted)",
  },
  duplicate: {
    bg: "hsla(280,60%,65%,0.1)",
    color: "hsl(280,60%,70%)",
    border: "hsla(280,60%,65%,0.3)",
    dot: "hsl(280,60%,65%)",
  },
  open: {
    bg: "hsla(38,92%,50%,0.12)",
    color: "hsl(38,92%,65%)",
    border: "hsla(38,92%,50%,0.3)",
    dot: "hsl(38,92%,65%)",
  },

  // ── Severity ──────────────────────────────────────────────────────────────
  critical: {
    bg: "hsla(351,89%,60%,0.12)",
    color: "hsl(351,89%,65%)",
    border: "hsla(351,89%,60%,0.3)",
    dot: "hsl(351,89%,62%)",
  },
  high: {
    bg: "hsla(28,100%,60%,0.12)",
    color: "hsl(28,100%,66%)",
    border: "hsla(28,100%,60%,0.3)",
    dot: "hsl(28,100%,60%)",
  },
  medium: {
    bg: "hsla(45,100%,60%,0.1)",
    color: "hsl(45,100%,60%)",
    border: "hsla(45,100%,60%,0.28)",
    dot: "hsl(45,100%,60%)",
  },
  low: {
    bg: "hsla(210,90%,60%,0.08)",
    color: "hsl(210,90%,70%)",
    border: "hsla(210,90%,60%,0.2)",
    dot: "hsl(210,90%,70%)",
  },

  // ── Report categories ─────────────────────────────────────────────────────
  bug: {
    bg: "hsla(351,89%,60%,0.12)",
    color: "hsl(351,89%,65%)",
    border: "hsla(351,89%,60%,0.3)",
    dot: null,
  },
  feature: {
    bg: "hsla(160,70%,50%,0.12)",
    color: "hsl(160,70%,60%)",
    border: "hsla(160,70%,50%,0.3)",
    dot: null,
  },
  improvement: {
    bg: "hsla(210,100%,56%,0.12)",
    color: "hsl(210,100%,70%)",
    border: "hsla(210,100%,56%,0.3)",
    dot: null,
  },
  other: {
    bg: "hsla(215,20%,65%,0.08)",
    color: "var(--text-muted)",
    border: "var(--glass-outline)",
    dot: null,
  },

  // ── Generic semantic ──────────────────────────────────────────────────────
  info: {
    bg: "hsla(210,100%,56%,0.1)",
    color: "hsl(210,100%,70%)",
    border: "hsla(210,100%,56%,0.25)",
    dot: "hsl(210,100%,65%)",
  },
  success: {
    bg: "hsla(160,70%,50%,0.12)",
    color: "hsl(160,70%,55%)",
    border: "hsla(160,70%,50%,0.3)",
    dot: "hsl(160,70%,50%)",
  },
  danger: {
    bg: "hsla(351,89%,60%,0.12)",
    color: "hsl(351,89%,65%)",
    border: "hsla(351,89%,60%,0.3)",
    dot: "hsl(351,89%,62%)",
  },
  muted: {
    bg: "transparent",
    color: "var(--text-muted)",
    border: "var(--glass-outline)",
    dot: null,
  },
} as const satisfies Record<string, ChipColorSet>;

/** Fallback colour set used when no variant is matched and no custom colours are given. */
export const CHIP_FALLBACK: ChipColorSet = {
  bg: "hsla(215,20%,65%,0.08)",
  color: "var(--text-secondary, rgba(255,255,255,0.6))",
  border: "var(--glass-outline, rgba(255,255,255,0.12))",
  dot: null,
};

/** Size token map — maps size prop to CSS primitives. */
export const CHIP_SIZE_MAP = {
  xs: {
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 7px",
    dotSize: "5px",
  },
  sm: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 9px",
    dotSize: "6px",
  },
  md: {
    fontSize: "12px",
    fontWeight: "700",
    padding: "3px 11px",
    dotSize: "7px",
  },
} as const;

export type ChipVariant = keyof typeof CHIP_VARIANTS;
export type ChipSize = keyof typeof CHIP_SIZE_MAP;
