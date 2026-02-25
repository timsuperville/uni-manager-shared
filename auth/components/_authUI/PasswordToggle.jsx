import React from "react";
import PropTypes from "prop-types";

/**
 * Eye / EyeOff icons and PasswordToggleButton — shared across all auth forms.
 * Extract here once; import everywhere. Never redefine inline.
 */

export const EyeIcon = () => (
  <svg
    className="h-4.5 w-4.5"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

export const EyeOffIcon = () => (
  <svg
    className="h-4.5 w-4.5"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
    />
  </svg>
);

/**
 * PasswordToggleButton — the show/hide button for password inputs.
 * Renders inside AuthInput's `rightElement` slot.
 */
export const PasswordToggleButton = ({ visible, onToggle, ariaLabel }) => (
  <button
    type="button"
    aria-label={ariaLabel ?? (visible ? "Hide password" : "Show password")}
    onClick={onToggle}
    className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors focus:outline-none"
  >
    {visible ? <EyeIcon /> : <EyeOffIcon />}
  </button>
);

PasswordToggleButton.propTypes = {
  visible: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string,
};

export default PasswordToggleButton;
