import React from "react";

interface GlassSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "style"> {
  placeholder?: string;
  style?: React.CSSProperties;
}

/**
 * GlassSelect — Liquid Glass styled native select using CSS token set.
 * Mirrors GlassInput for inline/compact filter panels and toolbars.
 */
export function GlassSelect({ id, value, onChange, children, disabled = false, placeholder, style: styleProp = {}, ...props }: GlassSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{ width: "100%", padding: "8px 12px", background: "var(--bg-surface-1)", border: "1px solid var(--glass-outline)", borderRadius: "var(--radius-md)", color: !value ? "var(--text-muted)" : "var(--text-primary)", fontSize: "13px", fontFamily: "var(--font-body)", outline: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1, transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)", appearance: "auto", ...styleProp }}
      onFocus={(e) => { e.target.style.borderColor = "var(--border-glow)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)"; }}
      onBlur={(e) => { e.target.style.borderColor = "var(--glass-outline)"; e.target.style.boxShadow = "none"; }}
      {...props}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {children}
    </select>
  );
}

export default GlassSelect;
