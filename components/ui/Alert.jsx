import React from "react";

export function Alert({
  children,
  variant = "default",
  className = "",
  ...props
}) {
  const baseStyles = "p-4 rounded-md border";
  const variantStyles = {
    default:
      "[background:var(--glass-surface,rgba(255,255,255,0.05))] [border-color:var(--glass-outline,rgba(255,255,255,0.12))] [color:var(--text-primary,inherit)]",
    destructive:
      "[background:rgba(239,68,68,0.1)] [border-color:rgba(239,68,68,0.3)] [color:var(--danger,#f87171)]",
    warning:
      "[background:rgba(234,179,8,0.1)] [border-color:rgba(234,179,8,0.3)] [color:var(--warning,#facc15)]",
    success:
      "[background:rgba(34,197,94,0.1)] [border-color:rgba(34,197,94,0.3)] [color:var(--accent-emerald,#4ade80)]",
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDescription({ children, className = "", ...props }) {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AlertTitle({ children, className = "", ...props }) {
  return (
    <h4 className={`font-medium mb-1 ${className}`} {...props}>
      {children}
    </h4>
  );
}

export default Alert;
