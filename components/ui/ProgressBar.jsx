import PropTypes from "prop-types";

/**
 * ProgressBar — Liquid Glass Design System
 *
 * Uses CSS custom properties so it automatically adapts to each app's
 * colour palette (home = emerald, church = violet, admin = cobalt, etc.)
 *
 * @param {number}  value     - Current value (0–max)
 * @param {number}  max       - Maximum value (default 100)
 * @param {number}  height    - Bar height in px (default 6)
 * @param {string}  color     - Override fill colour (any CSS value). Takes
 *                              priority over `variant`.
 * @param {string}  variant   - Semantic colour: 'primary'|'success'|'error'|
 *                              'warning'. Resolved via CSS vars.
 * @param {boolean} animated  - Adds a shimmer/pulse animation on the fill
 * @param {string}  className - Extra classes for the wrapper element
 */
export function ProgressBar({
  value = 0,
  max = 100,
  height = 6,
  color,
  variant = "primary",
  animated = false,
  className = "",
  ...props
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const variantColor = {
    primary: "var(--primary-resonance, var(--color-primary, #6366f1))",
    success: "var(--accent-emerald, var(--color-success, #22c55e))",
    error: "var(--accent-rose, var(--color-error, #ef4444))",
    warning: "var(--accent-amber, var(--color-warning, #f59e0b))",
  };

  const fillColor = color ?? variantColor[variant] ?? variantColor.primary;

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height,
        borderRadius: height / 2,
        background:
          "var(--glass-outline, var(--glass-border, rgba(255,255,255,0.12)))",
        overflow: "hidden",
      }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: fillColor,
          borderRadius: height / 2,
          transition: "width 0.4s ease",
          animation: animated
            ? "progress-shimmer 1.5s ease-in-out infinite"
            : undefined,
        }}
      />
    </div>
  );
}

ProgressBar.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  height: PropTypes.number,
  color: PropTypes.string,
  variant: PropTypes.oneOf(["primary", "success", "error", "warning"]),
  animated: PropTypes.bool,
  className: PropTypes.string,
};

export default ProgressBar;
