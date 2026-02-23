import PropTypes from "prop-types";

/**
 * FormField — Liquid Glass Design System
 *
 * Label + input slot wrapper with optional hint and error text.
 * Wraps any form control (input, select, textarea) and provides
 * consistent label/error/hint treatment.
 *
 * @param {string}    label     - Visible label text
 * @param {string}    error     - Validation error message (renders in red)
 * @param {string}    hint      - Help text below the control
 * @param {boolean}   required  - Appends asterisk to label
 * @param {ReactNode} children  - The form control to wrap
 * @param {string}    className - Extra class for the wrapper div
 */
export function FormField({
  label,
  error,
  hint,
  required = false,
  children,
  className = "",
  ...props
}) {
  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
      {...props}
    >
      {label && (
        <label
          style={{
            fontSize: "var(--text-xs, 0.75rem)",
            fontWeight: 500,
            color: "var(--text-muted, rgba(255,255,255,0.6))",
            display: "block",
          }}
        >
          {label}
          {required && (
            <span
              aria-hidden="true"
              style={{
                color: "var(--accent-rose, var(--color-error, #ef4444))",
                marginLeft: "0.2rem",
              }}
            >
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error && (
        <p
          role="alert"
          style={{
            fontSize: "var(--text-xs, 0.75rem)",
            color: "var(--accent-rose, var(--color-error, #ef4444))",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          style={{
            fontSize: "var(--text-xs, 0.75rem)",
            color: "var(--text-muted, rgba(255,255,255,0.5))",
            margin: 0,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

FormField.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  hint: PropTypes.string,
  required: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default FormField;
