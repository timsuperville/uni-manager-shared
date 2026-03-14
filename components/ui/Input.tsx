import React from "react";

type InputSize = "sm" | "default" | "lg";
type InputVariant = "default" | "outline";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
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

interface InputSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: InputSize;
  error?: boolean;
  options?: SelectOption[];
  helperText?: string;
  label?: string;
  fullWidth?: boolean;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  helperText?: string;
  label?: string;
  fullWidth?: boolean;
}

const getSizeClasses = (size: InputSize): string => {
  if (size === "sm") return "px-3 py-2 text-sm";
  if (size === "lg") return "px-4 py-3 text-base";
  return "px-3 py-2 text-sm";
};

const getVariantClasses = (error: boolean, variant?: InputVariant): string => {
  if (error) return "border-(--danger,#ef4444) focus:border-(--danger,#ef4444) focus:ring-(--danger,#ef4444)/40";
  return "border-(--glass-outline,rgba(255,255,255,0.18)) focus:border-(--primary-resonance,#4f46e5) focus:ring-(--primary-resonance,#4f46e5)/30";
};

const disabledCls = "[background:var(--bg-surface-0,rgba(255,255,255,0.02))] text-(--text-muted,rgba(255,255,255,0.4)) cursor-not-allowed";
const enabledCls = "[background:var(--bg-surface-1,rgba(255,255,255,0.05))] text-(--text-primary,inherit)";

export const Input: React.FC<InputProps> = ({
  type = "text", placeholder = "", value, onChange, className = "",
  size = "default", variant = "default", disabled = false, error = false,
  fullWidth: _fullWidth, helperText: _ht, label: _lbl,
  ...props
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={disabled}
    className={`block w-full rounded-md shadow-sm ${getSizeClasses(size)} ${getVariantClasses(error, variant)} ${disabled ? disabledCls : enabledCls} focus:outline-none focus:ring-1 transition-colors duration-200 ${className}`}
    {...props}
  />
);

export const InputSelect: React.FC<InputSelectProps> = ({
  children, value, onChange, placeholder = "Select an option", className = "",
  size = "default", disabled = false, error = false, options,
  fullWidth: _fw, helperText: _ht, label: _lbl,
  ...props
}) => (
  <select
    value={value}
    onChange={onChange}
    disabled={disabled}
    className={`block w-full rounded-md shadow-sm ${getSizeClasses(size)} ${getVariantClasses(error)} ${disabled ? disabledCls : enabledCls} focus:outline-none focus:ring-1 transition-colors duration-200 ${className}`}
    {...props}
  >
    {placeholder && <option value="" disabled>{placeholder}</option>}
    {options
      ? options.map((opt) => <option key={opt.value !== undefined ? opt.value : String(opt.label)} value={opt.value}>{opt.label}</option>)
      : children}
  </select>
);

export const Textarea: React.FC<TextareaProps> = ({
  placeholder = "", value, onChange, className = "", rows = 3,
  disabled = false, error = false,
  fullWidth: _fw, helperText: _ht, label: _lbl,
  ...props
}) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    disabled={disabled}
    className={`block w-full rounded-md shadow-sm px-3 py-2 text-sm ${getVariantClasses(error)} ${disabled ? disabledCls : enabledCls} focus:outline-none focus:ring-1 transition-colors duration-200 resize-vertical ${className}`}
    {...props}
  />
);

/** @deprecated Use InputSelect — Select alias kept for backward compatibility */
export { InputSelect as Select };
export { Input as default };
