import React from "react";

interface GlassInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "style"
> {
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * GlassInput — Liquid Glass styled text input using CSS token set (var(--*)).
 * Optional leading icon slot accepts any React node.
 * Forwarded ref enables consumers to manage focus programmatically.
 */
export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  function GlassInputInner(
    {
      id,
      placeholder,
      value,
      onChange,
      icon,
      type = "text",
      disabled = false,
      style: styleProp = {},
      onFocus: consumerOnFocus,
      onBlur: consumerOnBlur,
      ...props
    },
    ref,
  ) {
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
          ref={ref}
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
            // Internal focus ring
            e.target.style.borderColor = "var(--border-glow)";
            e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)";
            // Merge with consumer handler if provided
            consumerOnFocus?.(e);
          }}
          onBlur={(e) => {
            // Internal focus ring reset
            e.target.style.borderColor = "var(--glass-outline)";
            e.target.style.boxShadow = "none";
            // Merge with consumer handler if provided
            consumerOnBlur?.(e);
          }}
          {...props}
        />
      </div>
    );
  },
);

GlassInput.displayName = "GlassInput";

export default GlassInput;
