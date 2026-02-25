import React from "react";
import PropTypes from "prop-types";

/**
 * OAuth Button — Social login button (Google, GitHub, Microsoft, etc.)
 */
export const OAuthButton = ({
  provider,
  onClick,
  disabled = false,
  children,
  icon,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full flex items-center justify-center gap-3 px-4 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 active:scale-[0.98] active:shadow-inner"
  >
    {icon && (
      <span className="shrink-0 transition-transform group-hover:scale-110">
        {icon}
      </span>
    )}
    <span>{children || `Continue with ${provider}`}</span>
  </button>
);

OAuthButton.propTypes = {
  provider: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.node,
  icon: PropTypes.node,
};

export default OAuthButton;
