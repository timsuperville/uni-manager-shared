import React from "react";

type InputSize = "sm" | "default" | "lg";
type InputVariant = "default" | "outline";

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  size?: InputSize;
  variant?: InputVariant;
  /** true for error ring, or a string message to display below */
  error?: boolean | string;
  fullWidth?: boolean;
  helperText?: string;
  label?: string;
  /** Left-side icon node */
  icon?: React.ReactNode;
}

interface SelectOption {
  value: string | number;
  label: React.ReactNode;
}

interface InputSelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  size?: InputSize;
  error?: boolean | string;
  options?: SelectOption[];
  helperText?: string;
  label?: string;
  fullWidth?: boolean;
  placeholder?: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
  helperText?: string;
  label?: string;
  fullWidth?: boolean;
}

const getSizeClasses = (size: InputSize): string => {
  if (size === "sm") return "px-3 py-1.5 text-xs";
  if (size === "lg") return "px-4 py-3 text-base";
  return "px-3 py-2 text-sm";
};

const hasError = (error?: boolean | string) => !!error;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      type = "text",
      placeholder = "",
      value,
      onChange,
      className = "",
      size = "default",
      variant = "default",
      disabled = false,
      error = false,
      fullWidth: _fullWidth,
      helperText,
      label,
      icon,
      ...props
    },
    ref,
  ) {
    const errorMsg = typeof error === "string" ? error : undefined;
    const isError = hasError(error);
    const showHelper = errorMsg || helperText;

    const inputEl = (
      <div className={`relative flex items-center${icon ? "" : ""}`}>
        {icon && (
          <span className="absolute left-3 flex items-center pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`block w-full lg-input ${isError ? "lg-input-error" : ""} shadow-sm ${getSizeClasses(size)} ${icon ? "pl-10" : ""} ${className}`}
          {...props}
        />
      </div>
    );

    if (!label && !showHelper) return inputEl;

    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {label}
          </label>
        )}
        {inputEl}
        {showHelper && (
          <p
            className={`text-xs mt-1 ${isError ? "text-red-500" : ""}`}
            style={!isError ? { color: "var(--text-muted)" } : undefined}
          >
            {errorMsg ?? helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export const InputSelect: React.FC<InputSelectProps> = ({
  children,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  size = "default",
  disabled = false,
  error = false,
  options,
  fullWidth: _fw,
  helperText: _ht,
  label: _lbl,
  ...props
}) => (
  <select
    value={value}
    onChange={onChange}
    disabled={disabled}
    className={`block w-full lg-input ${error ? "lg-input-error" : ""} shadow-sm ${getSizeClasses(size)} ${className}`}
    {...props}
  >
    {placeholder && (
      <option value="" disabled>
        {placeholder}
      </option>
    )}
    {options
      ? options.map((opt) => (
          <option
            key={opt.value !== undefined ? opt.value : String(opt.label)}
            value={opt.value}
          >
            {opt.label}
          </option>
        ))
      : children}
  </select>
);

export const Textarea: React.FC<TextareaProps> = ({
  placeholder = "",
  value,
  onChange,
  className = "",
  rows = 3,
  disabled = false,
  error = false,
  fullWidth: _fw,
  helperText: _ht,
  label: _lbl,
  ...props
}) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    disabled={disabled}
    className={`block w-full lg-input ${error ? "lg-input-error" : ""} shadow-sm px-3 py-2 text-sm resize-vertical ${className}`}
    {...props}
  />
);

/** @deprecated Use InputSelect — Select alias kept for backward compatibility */
export { InputSelect as Select };
export { Input as default };
