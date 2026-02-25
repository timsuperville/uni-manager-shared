import React from "react";
import PropTypes from "prop-types";

/**
 * Auth Button — Primary action button for auth forms.
 * Supports primary / secondary / success / danger variants with an
 * optional loading spinner.
 */
export const AuthButton = ({
  children,
  type = "button",
  onClick,
  disabled = false,
  variant = "primary",
  fullWidth = true,
  loading = false,
  className = "",
}) => {
  const base =
    "inline-flex items-center justify-center px-4 py-3 sm:py-3.5 border border-transparent text-sm sm:text-base font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 transform active:scale-[0.98]";

  const variants = {
    primary:
      "text-white bg-linear-to-r from-blue-600 via-blue-700 to-indigo-800 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-900 focus:ring-blue-500 shadow-blue-500/30 hover:shadow-blue-500/40",
    secondary:
      "text-blue-700 dark:text-blue-300 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 backdrop-blur-sm border border-blue-100 dark:border-blue-900 focus:ring-blue-500",
    success:
      "text-white bg-linear-to-r from-emerald-500 to-teal-700 hover:from-emerald-600 hover:to-teal-800 focus:ring-emerald-500 shadow-emerald-500/30 hover:shadow-emerald-500/40",
    danger:
      "text-white bg-linear-to-r from-red-500 to-rose-700 hover:from-red-600 hover:to-rose-800 focus:ring-red-500 shadow-red-500/30 hover:shadow-red-500/40",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

AuthButton.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(["primary", "secondary", "success", "danger"]),
  fullWidth: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default AuthButton;
