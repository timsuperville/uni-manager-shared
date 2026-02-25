import React from "react";
import PropTypes from "prop-types";

/**
 * Auth Input — Labelled text input with optional icon, right element, and
 * inline error message for use within auth forms.
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
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors">
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
        className={`block w-full ${icon ? "pl-10" : "pl-4"} ${rightElement ? "pr-10" : "pr-4"} py-3 sm:py-3.5 text-sm sm:text-base border rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 ${
          error
            ? "border-red-300 dark:border-red-800 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50 dark:bg-red-900/10"
            : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800"
        } text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed backdrop-blur-sm`}
      />
      {rightElement && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
    {error && (
      <div className="mt-1.5 flex items-center text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium animate-fadeIn">
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
