import React from "react";

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "style"> {
  style?: React.CSSProperties;
}

/**
 * FormSelect — Liquid Glass native select for form fields (block layout).
 * Use inside FormField. For inline chips: Select size="chip". For custom dropdowns: Select.
 */
export function FormSelect({ id, value, onChange, children, disabled = false, style: styleProp = {}, ...props }: FormSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{ width: "100%", padding: "8px 12px", background: "var(--bg-surface-1)", border: "1px solid var(--glass-outline)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "13px", fontFamily: "var(--font-body)", outline: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1, transition: "border-color var(--transition-fast)", ...styleProp }}
      onFocus={(e) => { e.target.style.borderColor = "var(--border-glow)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-glow)"; }}
      onBlur={(e) => { e.target.style.borderColor = "var(--glass-outline)"; e.target.style.boxShadow = "none"; }}
      {...props}
    >
      {children}
    </select>
  );
}

export default FormSelect;
