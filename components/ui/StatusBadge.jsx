import React from "react";
import PropTypes from "prop-types";
import { Chip, CHIP_VARIANTS } from "./Chip";

/**
 * StatusBadge — Liquid Glass Design System
 *
 * Backward-compatible wrapper around Chip for user/system status display.
 * Renders a pill with a status dot + capitalised label.
 *
 * Standard variants (user/system):
 *   active | inactive | suspended | locked | pending | warning
 *
 * For feedback-specific statuses (investigating, in-progress, resolved, etc.)
 * use <Chip variant="resolved" dot /> directly.
 *
 * @example — named variant
 *   <StatusBadge variant="active" label="Active" />
 *
 * @example — custom colours (legacy API)
 *   <StatusBadge label="Reviewing" customStyle={{ bg, color, border, dot }} />
 */
export function StatusBadge({ label, variant, customStyle }) {
  if (customStyle) {
    // Legacy custom style object → map straight to Chip colour props
    return (
      <Chip
        bg={customStyle.bg}
        color={customStyle.color}
        border={customStyle.border}
        label={label}
        dot={!!customStyle.dot}
        dotColor={customStyle.dot || undefined}
        size="sm"
      />
    );
  }

  // Named variant — Chip handles both the colour lookup and the dot
  return (
    <Chip
      variant={variant ?? "muted"}
      label={label}
      dot
      size="sm"
    />
  );
}

StatusBadge.propTypes = {
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf([
    "active",
    "inactive",
    "suspended",
    "locked",
    "pending",
    "warning",
    // Extended from Chip — any CHIP_VARIANTS key is valid
    "investigating",
    "in-progress",
    "resolved",
    "ignored",
    "duplicate",
    "critical",
    "high",
    "medium",
    "low",
    "info",
    "success",
    "danger",
    "muted",
  ]),
  /** Fully custom colour tokens — only used when variant is omitted */
  customStyle: PropTypes.shape({
    bg: PropTypes.string,
    color: PropTypes.string,
    border: PropTypes.string,
    dot: PropTypes.string,
  }),
};

/**
 * CHIP_VARIANTS re-exported as STATUS_VARIANTS for backward compatibility.
 * Callers that used STATUS_VARIANTS to build customStyle objects don't need
 * to change — the reference is now to the canonical CHIP_VARIANTS map.
 */
export { CHIP_VARIANTS as STATUS_VARIANTS };
