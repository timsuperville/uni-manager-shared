import React from "react";
import PropTypes from "prop-types";

export function Button({
  children,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  onClick,
  type = "button",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  // Map legacy/home variants to shared variants or define new ones
  const variantMap = {
    // Standard Shared Variants
    default:
      "[background:var(--primary-resonance,#4f46e5)] text-white hover:[background:var(--primary-resonance-dark,#4338ca)] focus:ring-(--primary-resonance,#4f46e5)/50",
    destructive:
      "[background:var(--danger,#ef4444)] text-white hover:[background:var(--danger-dark,#dc2626)] focus:ring-(--danger,#ef4444)/50",
    outline:
      "border border-(--glass-outline,rgba(255,255,255,0.18)) [background:var(--glass-surface,rgba(255,255,255,0.05))] text-(--text-primary,inherit) hover:[background:var(--glass-surface-hover,rgba(255,255,255,0.1))] focus:ring-(--primary-resonance,#4f46e5)/50",
    ghost:
      "text-(--text-primary,inherit) hover:[background:var(--glass-surface-hover,rgba(255,255,255,0.08))] focus:ring-(--glass-outline,rgba(255,255,255,0.12))/50",
    link: "text-(--primary-resonance,#4f46e5) underline-offset-4 hover:underline focus:ring-(--primary-resonance,#4f46e5)/50",

    // Home App Aliases / Extensions
    primary:
      "[background:var(--primary-resonance,#4f46e5)] text-white hover:[background:var(--primary-resonance-dark,#4338ca)] focus:ring-(--primary-resonance,#4f46e5)/50",
    secondary:
      "[background:var(--glass-surface,rgba(255,255,255,0.08))] text-(--text-primary,inherit) hover:[background:var(--glass-surface-hover,rgba(255,255,255,0.13))] focus:ring-(--glass-outline,rgba(255,255,255,0.12))/50",
    danger:
      "[background:var(--danger,#ef4444)] text-white hover:[background:var(--danger-dark,#dc2626)] focus:ring-(--danger,#ef4444)/50",
    success:
      "[background:var(--accent-emerald,#22c55e)] text-white hover:[background:var(--accent-emerald-dark,#16a34a)] focus:ring-(--accent-emerald,#22c55e)/50",
    warning:
      "[background:hsla(38,92%,50%,0.15)] text-(--warning,#f59e0b) border border-(--warning,#f59e0b)/30 hover:[background:hsla(38,92%,50%,0.25)] focus:ring-(--warning,#f59e0b)/40",
  };

  const sizeStyles = {
    // Shared Sizes
    default: "h-9 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    xs: "h-6 px-2 text-[10px]",
    lg: "h-10 px-8 text-base",
    icon: "h-9 w-9",

    // Home App Aliases
    md: "h-9 px-4 py-2 text-sm", // Alias for default
  };

  const widthStyles = fullWidth ? "w-full" : "";

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
      {icon && !loading && (
        <span className="mr-1.5 inline-flex shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf([
    "default",
    "destructive",
    "outline",
    "ghost",
    "link",
    "primary",
    "secondary",
    "danger",
    "success",
    "warning",
  ]),
  size: PropTypes.oneOf(["default", "sm", "xs", "lg", "icon", "md"]),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  icon: PropTypes.node,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
};

export default Button;
