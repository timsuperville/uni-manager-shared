import React from "react";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/** FormField — label + input slot wrapper with optional error/hint. */
export function FormField({
  label,
  error,
  hint,
  required = false,
  children,
  className = "",
  ...props
}: FormFieldProps) {
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

export default FormField;
