import React from 'react';
import PropTypes from 'prop-types';

export function Button({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  // Map legacy/home variants to shared variants or define new ones
  const variantMap = {
    // Standard Shared Variants
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    link: 'text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500',

    // Home App Aliases / Extensions
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500', // Alias for default
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500', // Alias for destructive
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };

  const sizeStyles = {
    // Shared Sizes
    default: 'h-9 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-10 px-8 text-base',
    icon: 'h-9 w-9',

    // Home App Aliases
    md: 'h-9 px-4 py-2 text-sm', // Alias for default
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  const selectedVariant = variantMap[variant] || variantMap.default;
  const selectedSize = sizeStyles[size] || sizeStyles.default;

  return (
    <button
      type={type}
      className={`${baseStyles} ${selectedVariant} ${selectedSize} ${widthStyles} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
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
}

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf([
    'default', 'destructive', 'outline', 'ghost', 'link',
    'primary', 'secondary', 'danger', 'success'
  ]),
  size: PropTypes.oneOf(['default', 'sm', 'lg', 'icon', 'md']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default Button;