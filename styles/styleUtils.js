/**
 * @shared/styles/styleUtils
 *
 * Liquid Glass inline-style helpers — one canonical source for the entire platform.
 *
 * ──  WHY THIS FILE EXISTS  ──────────────────────────────────────────────────────
 * Every feature file was independently redeclaring:
 *   const textP  = { color: "var(--text-primary, #f1f5f9)" };
 *   const textM  = { color: "var(--text-muted, #94a3b8)" };
 *   const sp     = (n) => `calc(var(--space-1, 0.25rem) * ${n})`;
 *   const flex   = (extra = {}) => ({ display: "flex", alignItems: "center", ...extra });
 *   const inputStyle = { ... };
 * …creating ~52 divergent copies across admin, home, personal, shared, church, and business.
 *
 * Import from here instead:
 *   import { textPrimary, textMuted, sp, flex, inputBase, glassPanel } from "@shared/styles/styleUtils";
 *
 * ──  GOVERNANCE  ────────────────────────────────────────────────────────────────
 * Do NOT duplicate any of these helpers inline in feature files.
 * Do NOT introduce hardcoded colour literals — use var(--*) fallbacks only.
 * See: .agent/rules/component-sovereignty-protocol.md § Style Utilities Policy
 */

// ── Text colour tokens ─────────────────────────────────────────────────────────

/** var(--text-primary) — high-contrast body text */
export const textPrimary = { color: "var(--text-primary, #f1f5f9)" };

/** var(--text-muted) — de-emphasised / secondary labels */
export const textMuted = { color: "var(--text-muted, #94a3b8)" };

/** var(--text-secondary) — mid-emphasis text */
export const textSecondary = {
  color: "var(--text-secondary, rgba(255,255,255,0.7))",
};

// ── Spacing helper ────────────────────────────────────────────────────────────

/**
 * CSS calc helper based on the 4 px base unit.
 * sp(4)  →  "calc(var(--space-1, 0.25rem) * 4)"  →  1rem in most themes
 * @param {number} n  Multiplier (same scale as Tailwind's space-{n})
 */
export const sp = (n) => `calc(var(--space-1, 0.25rem) * ${n})`;

// ── Flex factory ──────────────────────────────────────────────────────────────

/**
 * Returns an inline flex-row style object.
 * @param {object} [extra={}]  Additional style properties to merge in.
 * @example
 *   style={flex({ gap: sp(2), justifyContent: "space-between" })}
 */
export const flex = (extra = {}) => ({
  display: "flex",
  alignItems: "center",
  ...extra,
});

// ── Glass surface objects ─────────────────────────────────────────────────────

/**
 * Standard Liquid Glass card / panel surface — blur(24px) saturate(180%).
 * Use for any raised container that needs the frosted-glass treatment.
 */
export const glassPanel = {
  background: "var(--glass-surface, rgba(15,15,35,0.85))",
  border: "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  borderRadius: "var(--radius-lg, 0.75rem)",
};

/**
 * Lighter glass card surface — blur(16px) saturate(160%).
 * Use for secondary cards, list items, and nested surfaces.
 */
export const glassCard = {
  background: "var(--glass-surface, rgba(15,15,35,0.85))",
  border: "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
  backdropFilter: "blur(16px) saturate(160%)",
  WebkitBackdropFilter: "blur(16px) saturate(160%)",
  borderRadius: "var(--radius-lg, 0.75rem)",
};

/**
 * Deep modal glass surface — blur(32px) saturate(200%).
 * Use for modal dialogs and high-prominence overlays.
 */
export const glassModal = {
  background: "var(--glass-surface, rgba(15,15,35,0.95))",
  border: "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
  backdropFilter: "blur(32px) saturate(200%)",
  WebkitBackdropFilter: "blur(32px) saturate(200%)",
  borderRadius: "var(--radius-xl, 1rem)",
};

/**
 * Lightweight glass overlay — backdrop only, no border-radius.
 * Use for modal backdrops, dropdowns, and popovers.
 */
export const glassOverlay = {
  background: "rgba(0,0,0,0.65)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

// ── Form control base ─────────────────────────────────────────────────────────

/**
 * Base inline style for <input>, <select>, and <textarea> elements.
 * Provides glass surface styling consistent with the Liquid Glass design system.
 * For full form field wrappers (label + hint + error), use <FormField> from @shared/components/ui.
 */
export const inputBase = {
  width: "100%",
  background: "var(--glass-bg, rgba(15,15,35,0.7))",
  border: "1px solid var(--glass-border, rgba(255,255,255,0.12))",
  borderRadius: "var(--radius-sm, 0.375rem)",
  color: "var(--text-primary, #f1f5f9)",
  fontSize: "var(--text-sm, 0.875rem)",
  outline: "none",
  boxSizing: "border-box",
};

/**
 * Select / dropdown variant of inputBase — identical appearance.
 * Alias maintained for semantic clarity at call sites.
 */
export const selectBase = inputBase;

// ── Overlay / scrim ───────────────────────────────────────────────────────────

/**
 * Dark, non-blurring modal scrim (backdrop div).
 * Use behind modals and drawers as a click-capture overlay.
 * For glass-blurred backdrops, use `glassOverlay` instead.
 */
export const overlayScrim = {
  position: "fixed",
  inset: 0,
  background: "var(--overlay-scrim, rgba(0,0,0,0.6))",
};

// ── Semantic error surface ────────────────────────────────────────────────────

/**
 * Container style for inline error messages, banners, and destructive states.
 * Provides a subtle red-tinted surface with a coloured border.
 */
export const errorSurface = {
  background: "var(--color-error-surface, rgba(220,38,38,0.08))",
  border: "1px solid var(--color-error-border, rgba(220,38,38,0.3))",
  borderRadius: "var(--radius-sm, 0.375rem)",
};

/** Error text colour — for headings and copy on error surfaces. */
export const errorText = { color: "var(--color-error, hsl(0,70%,60%))" };

// ── Semantic success surface ──────────────────────────────────────────────────

/**
 * Container style for inline success messages, confirmations, and positive states.
 * Provides a subtle green-tinted surface with a coloured border.
 */
export const successSurface = {
  background: "var(--color-success-surface, rgba(16,185,129,0.08))",
  border: "1px solid var(--color-success-border, rgba(16,185,129,0.3))",
  borderRadius: "var(--radius-sm, 0.375rem)",
};

/** Success text colour — for copy on success surfaces. */
export const successText = { color: "var(--color-success, hsl(160,70%,50%))" };

// ── Skeleton / loading shimmer ────────────────────────────────────────────────

/**
 * Base style for skeleton loading placeholder elements.
 * Apply `animate-pulse` className alongside this style.
 */
export const skeletonBase = {
  background: "var(--glass-outline, rgba(255,255,255,0.12))",
  borderRadius: "var(--radius-sm, 0.375rem)",
};
