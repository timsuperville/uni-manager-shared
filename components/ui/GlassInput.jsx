import React from "react";
import PropTypes from "prop-types";

/**
 * GlassInput — Liquid Glass Design System
 *
 * A styled text input using the global CSS token set (var(--*)).
 * An optional leading icon slot accepts any React node.
 */
export function GlassInput({
  id,
  placeholder,
  value,
  onChange,
  icon,
  type = "text",
  disabled = false,
  style: styleProp = {},
}) {
  return (
    <div style={{ position: "relative" }}>
      {icon && (
        <span
          style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          {icon}
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%",
          padding: icon ? "8px 12px 8px 32px" : "8px 12px",
          background: "var(--bg-surface-1)",
          border: "1px solid var(--glass-outline)",
          borderRadius: "var(--radius-md)",
          color: "var(--text-primary)",
          fontSize: "13px",
          fontFamily: "var(--font-body)",
          outline: "none",
          transition:
            "border-color var(--transition-fast), box-shadow var(--transition-fast)",
          opacity: disabled ? 0.55 : 1,
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
      />
    </div>
  );
}

GlassInput.propTypes = {
  id: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  icon: PropTypes.node,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  style: PropTypes.object,
};

export default GlassInput;
