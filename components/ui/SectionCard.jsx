import PropTypes from "prop-types";

/**
 * SectionCard — Liquid Glass Design System
 *
 * Lightweight grouping card with an optional title. Used inside modals and
 * wizard steps to visually separate form sections.
 *
 * @param {string}    title     - Optional section heading
 * @param {ReactNode} children  - Section content
 * @param {string}    className - Extra class for wrapper
 */
export function SectionCard({ title, children, className = "", ...props }) {
  return (
    <div
      className={className}
      style={{
        padding: "1rem",
        background: "rgba(255,255,255,0.03)",
        border:
          "1px solid var(--glass-outline, var(--glass-border, rgba(255,255,255,0.08)))",
        borderRadius: "var(--radius-md, 0.5rem)",
        marginBottom: "1rem",
      }}
      {...props}
    >
      {title && (
        <p
          style={{
            fontWeight: 600,
            fontSize: "var(--text-sm, 0.875rem)",
            color: "var(--text-primary, #f1f5f9)",
            margin: "0 0 0.75rem",
          }}
        >
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

SectionCard.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default SectionCard;
