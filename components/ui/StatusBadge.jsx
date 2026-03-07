import React from "react";
import PropTypes from "prop-types";

/**
 * StatusBadge — Liquid Glass Design System
 *
 * A pill badge with a status dot and capitalised label.
 * Accepts either a `variant` string from the standard status set,
 * or a fully custom `style` object for one-off colours.
 *
 * Standard variants: active | inactive | suspended | locked | pending | warning
 */
const VARIANT_MAP = {
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
  pending: {
    bg: "hsla(38,92%,50%,0.1)",
    color: "hsl(38,92%,65%)",
    border: "hsla(38,92%,50%,0.25)",
    dot: "hsl(38,92%,60%)",
  },
  warning: {
    bg: "hsla(38,92%,50%,0.12)",
    color: "hsl(38,92%,65%)",
    border: "hsla(38,92%,50%,0.3)",
    dot: "hsl(38,92%,60%)",
  },
};

const FALLBACK = {
  bg: "hsla(215,20%,65%,0.1)",
  color: "var(--text-secondary)",
  border: "var(--glass-outline)",
  dot: null,
};

export function StatusBadge({ label, variant, customStyle }) {
  const s =
    customStyle || VARIANT_MAP[variant] || VARIANT_MAP[label] || FALLBACK;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "2px 10px",
        borderRadius: "100px",
        fontSize: "11px",
        fontWeight: "600",
        letterSpacing: "0.04em",
        textTransform: "capitalize",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.dot && (
        <span
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: s.dot,
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </span>
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
  ]),
  /** Fully custom colour tokens — only used when variant is unknown */
  customStyle: PropTypes.shape({
    bg: PropTypes.string,
    color: PropTypes.string,
    border: PropTypes.string,
    dot: PropTypes.string,
  }),
};

/**
 * VARIANT_MAP exported so callers can define their own domain-specific maps
 * (e.g. ROLE_STYLES) and pass a resolved entry as `customStyle`.
 */
export { VARIANT_MAP as STATUS_VARIANTS };
