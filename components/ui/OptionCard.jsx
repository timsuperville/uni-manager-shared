import PropTypes from "prop-types";

/**
 * OptionCard — Liquid Glass Design System
 *
 * Selectable card for option pickers (backup strategy, cloud provider, etc.).
 * Selected state uses --primary-resonance for per-app brand colour.
 *
 * @param {boolean}   selected    - Whether this option is selected
 * @param {function}  onClick     - Click handler
 * @param {ReactNode} icon        - Icon/emoji element
 * @param {string}    label       - Option label
 * @param {string}    description - Supporting description
 * @param {string}    className   - Extra class for wrapper
 */
export function OptionCard({
  selected = false,
  onClick,
  icon,
  label,
  description,
  className = "",
  ...props
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
      aria-pressed={selected}
      className={className}
      style={{
        cursor: "pointer",
        padding: "1rem",
        borderRadius: "var(--radius-md, 0.5rem)",
        border: `2px solid ${
          selected
            ? "var(--primary-resonance, var(--color-primary, #6366f1))"
            : "var(--glass-outline, var(--glass-border, rgba(255,255,255,0.1)))"
        }`,
        background: selected
          ? "color-mix(in srgb, var(--primary-resonance, #6366f1) 8%, transparent)"
          : "transparent",
        transition: "all 0.15s ease",
        outline: "none",
      }}
      {...props}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {icon && <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>}
        <div>
          {label && (
            <p
              style={{
                fontWeight: 600,
                fontSize: "var(--text-sm, 0.875rem)",
                color: "var(--text-primary, #f1f5f9)",
                margin: "0 0 0.25rem",
              }}
            >
              {label}
            </p>
          )}
          {description && (
            <p
              style={{
                fontSize: "var(--text-xs, 0.75rem)",
                color: "var(--text-muted, #94a3b8)",
                margin: 0,
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

OptionCard.propTypes = {
  selected: PropTypes.bool,
  onClick: PropTypes.func,
  icon: PropTypes.node,
  label: PropTypes.string,
  description: PropTypes.string,
  className: PropTypes.string,
};

export default OptionCard;
