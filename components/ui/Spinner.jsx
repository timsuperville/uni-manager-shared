import PropTypes from "prop-types";

/**
 * Spinner — Liquid Glass Design System
 *
 * Inline CSS animation loading indicator.
 * Spin colour uses `--primary-resonance` by default.
 *
 * @param {string} size    - 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} color   - CSS colour override (defaults to --primary-resonance)
 * @param {string} label   - aria-label for screen readers
 * @param {string} className
 */
export function Spinner({
  size = "md",
  color,
  label = "Loading…",
  className = "",
  ...props
}) {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 36,
    xl: 48,
  };
  const px = sizes[size] ?? sizes.md;
  const stroke = px <= 16 ? 2 : px <= 24 ? 2.5 : 3;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={label}
      role="status"
      className={className}
      style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}
      {...props}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      {/* Track */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="var(--glass-outline, rgba(255,255,255,0.12))"
        strokeWidth={stroke}
      />
      {/* Tail */}
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke={
          color ?? "var(--primary-resonance, var(--color-primary, #6366f1))"
        }
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

Spinner.propTypes = {
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  color: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
};

export default Spinner;
