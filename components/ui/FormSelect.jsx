import React from "react";
import PropTypes from "prop-types";

/**
 * FormSelect — Liquid Glass Design System
 *
 * A styled native <select> for form fields. Full-width block layout;
 * use this inside FormField wrappers, settings pages, and filter panels
 * where block layout is appropriate.
 *
 * For inline compact filter chips, use: <Select size="chip" />
 * For full custom dropdowns with search/multi, use: <Select />
 */
export function FormSelect({
    id,
    value,
    onChange,
    children,
    disabled = false,
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
                color: "var(--text-primary)",
                fontSize: "13px",
                fontFamily: "var(--font-body)",
                outline: "none",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.55 : 1,
                transition: "border-color var(--transition-fast)",
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
            {children}
        </select>
    );
}

FormSelect.propTypes = {
    id: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    disabled: PropTypes.bool,
    style: PropTypes.object,
};

/**
 * @deprecated Use FormSelect instead.
 * GlassSelect kept as an alias for backward compatibility.
 */
export const GlassSelect = FormSelect;

export default FormSelect;
