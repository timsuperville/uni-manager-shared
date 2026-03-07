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
export function SectionCard({ title, icon: Icon, iconColor = "var(--primary-resonance, #60a5fa)", children, className = "", ...props }) {
  return (
    <div
      className={className}
      style={{
        background: "var(--glass-surface, rgba(255,255,255,0.03))",
        border:
          "1px solid var(--glass-outline, var(--glass-border, rgba(255,255,255,0.08)))",
        borderRadius: "var(--radius-lg, 1rem)",
        marginBottom: "1rem",
        overflow: "hidden"
      }}
      {...props}
    >
      {(title || Icon) && (
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--glass-border, rgba(255,255,255,0.08))", background: "rgba(255,255,255,0.02)" }}>
          {Icon && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${iconColor}20` }}>
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
            </div>
          )}
          {title && (
            <h3 className="font-bold text-sm m-0" style={{ color: "var(--text-primary, #f1f5f9)" }}>{title}</h3>
          )}
        </div>
      )}
      <div style={{ padding: "1.25rem 1.25rem 0.5rem" }}>
        {children}
      </div>
    </div>
  );
}

SectionCard.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.elementType,
  iconColor: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default SectionCard;
