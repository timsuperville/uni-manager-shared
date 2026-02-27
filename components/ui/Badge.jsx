import React from "react";
import PropTypes from "prop-types";

const Badge = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "[background:var(--badge-success-bg,rgba(34,197,94,0.15))] [color:var(--badge-success-text,#4ade80)] [border-color:var(--badge-success-border,rgba(34,197,94,0.3))]";
      case "warning":
        return "[background:var(--badge-warning-bg,rgba(234,179,8,0.15))] [color:var(--badge-warning-text,#facc15)] [border-color:var(--badge-warning-border,rgba(234,179,8,0.3))]";
      case "danger":
      case "error":
        return "[background:var(--badge-danger-bg,rgba(239,68,68,0.15))] [color:var(--badge-danger-text,#f87171)] [border-color:var(--badge-danger-border,rgba(239,68,68,0.3))]";
      case "info":
        return "[background:var(--badge-info-bg,rgba(59,130,246,0.15))] [color:var(--badge-info-text,#60a5fa)] [border-color:var(--badge-info-border,rgba(59,130,246,0.3))]";
      case "secondary":
        return "[background:var(--glass-surface,rgba(255,255,255,0.06))] [color:var(--text-muted,rgba(255,255,255,0.55))] [border-color:var(--glass-outline,rgba(255,255,255,0.12))]";
      case "outline":
        return "bg-transparent [color:var(--text-muted,rgba(255,255,255,0.55))] [border-color:var(--glass-outline,rgba(255,255,255,0.18))]";
      default:
        return "[background:var(--badge-info-bg,rgba(59,130,246,0.15))] [color:var(--badge-info-text,#60a5fa)] [border-color:var(--badge-info-border,rgba(59,130,246,0.3))]";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-2 py-0.5 text-xs";
      case "lg":
        return "px-3 py-1 text-sm";
      default:
        return "px-2.5 py-0.5 text-xs";
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${getSizeClasses()} ${getVariantClasses()} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "default",
    "primary",
    "success",
    "warning",
    "danger",
    "error",
    "info",
    "secondary",
    "outline",
  ]),
  size: PropTypes.oneOf(["sm", "default", "lg"]),
  className: PropTypes.string,
};

export { Badge };
