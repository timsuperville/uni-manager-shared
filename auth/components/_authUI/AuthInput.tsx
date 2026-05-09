import React from "react";
import {
  textSecondary,
  textMuted,
  inputBase,
  errorSurface,
} from "../../../styles/styleUtils";

interface AuthInputProps {
  id: string;
  name: string;
  type?: React.HTMLInputTypeAttribute;
  label?: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

/**
 * Auth Input — Labelled text input with optional icon, right element, and
 * inline error message for use within auth forms.
 *
 * Focus colours use CSS custom properties (`--primary-resonance`) so each
 * app's design token drives focus highlight automatically.
 */
export const AuthInput = ({
  id,
  name,
  type = "text",
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required = false,
  autoComplete,
  autoFocus = false,
  disabled = false,
  icon,
  rightElement,
}: AuthInputProps) => {
  const errorId = `${id}-error`;

  return (
    <div className="group">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium mb-1.5 transition-colors text-gray-700 dark:text-[var(--text-secondary,hsl(220,14%,70%))]"
        >
          {label}
          {required && (
            <span
              className="text-red-500 dark:text-red-400 ml-1"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors text-gray-400 dark:text-[var(--text-muted,hsl(220,12%,48%))]">
            {icon}
          </div>
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          className={`block w-full ${icon ? "pl-10" : "pl-4"} ${rightElement ? "pr-10" : "pr-4"} py-3 sm:py-3.5 text-sm sm:text-base rounded-xl shadow-sm focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-white/5 border ${error ? "border-red-500 bg-red-50 dark:bg-red-500/10" : "border-gray-200 dark:border-white/10"} text-gray-900 dark:text-[var(--text-primary,#f1f5f9)] placeholder-gray-400 dark:placeholder-gray-500`}
          onFocus={(e) => {
            if (!error) {
              e.target.style.borderColor =
                "var(--glass-outline-active, hsla(272,65%,62%,0.5))";
              e.target.style.boxShadow =
                "0 0 0 3px var(--primary-glow, hsla(272,65%,62%,0.14))";
            }
          }}
          onBlurCapture={(e) => {
            if (!error) {
              e.target.style.borderColor = "";
              e.target.style.boxShadow = "none";
            }
            onBlur?.(e);
          }}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <div
          id={errorId}
          className="mt-1.5 flex items-center text-xs sm:text-sm text-red-400 font-medium"
          role="alert"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default AuthInput;
