import PropTypes from "prop-types";

/**
 * EmptyState — Liquid Glass Design System
 *
 * Centred empty state panel with optional icon, title, description, and CTA.
 *
 * @param {ReactNode} icon        - Icon element or emoji
 * @param {string}    title       - Main heading
 * @param {string}    description - Supporting text
 * @param {ReactNode} action      - CTA button / link (optional)
 * @param {string}    className   - Extra classes for the wrapper
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
  ...props
}) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "3rem 1.5rem",
        gap: "0.75rem",
      }}
      {...props}
    >
      {icon && (
        <div
          style={{
            fontSize: "2.5rem",
            lineHeight: 1,
            color: "var(--text-muted, rgba(255,255,255,0.4))",
            marginBottom: "0.25rem",
          }}
        >
          {icon}
        </div>
      )}
      {title && (
        <h3
          style={{
            margin: 0,
            fontSize: "var(--text-base, 1rem)",
            fontWeight: 600,
            color: "var(--text-primary, inherit)",
          }}
        >
          {title}
        </h3>
      )}
      {description && (
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm, 0.875rem)",
            color: "var(--text-secondary, rgba(255,255,255,0.6))",
            maxWidth: "28ch",
          }}
        >
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: "0.5rem" }}>{action}</div>}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.node,
  className: PropTypes.string,
};

export default EmptyState;
