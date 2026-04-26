import React from "react";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "error"
  | "info"
  | "secondary"
  | "outline";
type BadgeSize = "sm" | "default" | "lg";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

function getVariantClasses(variant: BadgeVariant): string {
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
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  default: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
};

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => (
  <span
    className={`inline-flex items-center rounded-full border font-medium ${sizeClasses[size]} ${getVariantClasses(variant)} ${className}`}
    {...props}
  >
    {children}
  </span>
);

export { Badge };
export default Badge;
