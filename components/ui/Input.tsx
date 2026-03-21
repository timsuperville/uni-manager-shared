import React from "react";

type InputSize = "sm" | "default" | "lg";
type InputVariant = "default" | "outline";

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  size?: InputSize;
  variant?: InputVariant;
  error?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  label?: string;
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
  error?: boolean;
  options?: SelectOption[];
  helperText?: string;
  label?: string;
  fullWidth?: boolean;
  placeholder?: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  helperText?: string;
  label?: string;
  fullWidth?: boolean;
}

const getSizeClasses = (size: InputSize): string => {
  if (size === "sm") return "px-3 py-1.5 text-xs";
  if (size === "lg") return "px-4 py-3 text-base";
  return "px-3 py-2 text-sm";
};

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
      helperText: _ht,
      label: _lbl,
      ...props
    },
    ref,
  ) {
    return (
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`block w-full lg-input ${error ? "lg-input-error" : ""} shadow-sm ${getSizeClasses(size)} ${className}`}
        {...props}
      />
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
