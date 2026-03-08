import React from "react";
import PropTypes from "prop-types";

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
}) => (
  <div className="group">
    {label && (
      <label
        htmlFor={id}
        className="block text-sm font-medium mb-1.5 transition-colors"
        style={{ color: "var(--text-secondary, rgba(120,120,140,0.9))" }}
      >
        {/* Use inline style for the focus-within colour shift via a wrapper data attribute */}
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div
          className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          {icon}
        </div>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        className={`block w-full ${icon ? "pl-10" : "pl-4"} ${rightElement ? "pr-10" : "pr-4"} py-3 sm:py-3.5 text-sm sm:text-base rounded-xl shadow-sm focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:border-primary-ecclesia focus:ring-0`}
        style={{
          background: error ? "hsla(0,72%,50%,0.08)" : "hsla(0,0%,100%,0.04)",
          border: error
            ? "1px solid hsla(0,72%,55%,0.5)"
            : "1px solid var(--glass-outline, hsla(0,0%,100%,0.1))",
          color: "var(--text-primary, #f8f8fc)",
          boxShadow: "none",
        }}
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
            e.target.style.borderColor =
              "var(--glass-outline, hsla(0,0%,100%,0.1))";
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
      <div className="mt-1.5 flex items-center text-xs sm:text-sm text-red-400 font-medium">
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
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

AuthInput.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  autoComplete: PropTypes.string,
  autoFocus: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
  rightElement: PropTypes.node,
};

export default AuthInput;
