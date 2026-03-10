import React from "react";
import PropTypes from "prop-types";

/**
 * GlassSelect — Liquid Glass Design System
 *
 * A styled native <select> using the global CSS token set (var(--*)).
 * Mirrors GlassInput for consistent inline/compact usage in filter panels,
 * toolbars, and settings rows where a block FormSelect is too heavy.
 *
 * Props:
 *   id         — optional HTML id
 *   value      — controlled value
 *   onChange   — change handler (receives native event)
 *   children   — <option> elements
 *   disabled   — greys out and locks interaction
 *   placeholder — optional first <option> displayed when value is empty
 *   style      — additional inline style overrides
 */
export function GlassSelect({
  id,
  value,
  onChange,
  children,
  disabled = false,
  placeholder,
  style: styleProp = {},
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "8px 12px",
        background: "var(--bg-surface-1)",
        border: "1px solid var(--glass-outline)",
        borderRadius: "var(--radius-md)",
        color: !value ? "var(--text-muted)" : "var(--text-primary)",
        fontSize: "13px",
        fontFamily: "var(--font-body)",
        outline: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition:
          "border-color var(--transition-fast), box-shadow var(--transition-fast)",
        appearance: "auto",
        ...styleProp,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "var(--border-glow)";
        e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "var(--glass-outline)";
        e.target.style.boxShadow = "none";
      }}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}

GlassSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  style: PropTypes.object,
};

export default GlassSelect;
