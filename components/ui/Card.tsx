import React from "react";

type CardVariant = "default" | "elevated" | "outlined" | "gradient" | "flat";
type CardContentPadding = "none" | "sm" | "default" | "lg";
type CardTitleSize = "sm" | "default" | "lg" | "xl";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  compact?: boolean;
}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> { padding?: CardContentPadding; }
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { size?: CardTitleSize; }

const variantStyles: Record<CardVariant, string> = {
  default: "[background:var(--glass-surface,rgba(255,255,255,0.06))] border border-(--glass-outline,rgba(255,255,255,0.12)) shadow-sm",
  elevated: "[background:var(--glass-surface,rgba(255,255,255,0.06))] border border-(--glass-outline,rgba(255,255,255,0.12)) shadow-lg",
  outlined: "bg-transparent border border-(--glass-outline,rgba(255,255,255,0.18)) shadow-none",
  gradient: "[background:var(--glass-surface-gradient,var(--glass-surface,rgba(255,255,255,0.06)))] border border-(--glass-outline,rgba(255,255,255,0.12)) shadow-md",
  flat: "bg-transparent shadow-none border-none",
};

const paddingStyles: Record<CardContentPadding, string> = { none: "", sm: "p-4", default: "px-6 py-4", lg: "px-8 py-6" };

const titleSizeStyles: Record<CardTitleSize, string> = {
  sm: "text-base font-medium",
  default: "text-lg font-medium",
  lg: "text-xl font-semibold",
  xl: "text-2xl font-semibold",
};

export const Card: React.FC<CardProps> = ({ children, className = "", variant = "default", interactive = false, compact = false, ...props }) => (
  <div
    className={`${compact ? "rounded-lg" : "rounded-xl"} ${variantStyles[variant]} ${interactive ? "hover:shadow-lg dark:hover:shadow-gray-900/30 transition-all duration-200 cursor-pointer hover:scale-[1.02]" : ""} ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`px-6 py-4 border-b border-(--glass-outline,rgba(255,255,255,0.12)) ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent: React.FC<CardContentProps> = ({ children, className = "", padding = "default", ...props }) => (
  <div className={`${paddingStyles[padding]} ${className}`} {...props}>{children}</div>
);

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = "", size = "default", ...props }) => (
  <h3 className={`${titleSizeStyles[size]} text-(--text-primary,inherit) ${className}`} {...props}>{children}</h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = "", ...props }) => (
  <p className={`text-sm text-(--text-muted,rgba(255,255,255,0.55)) mt-1 ${className}`} {...props}>{children}</p>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`px-6 py-3 border-t border-(--glass-outline,rgba(255,255,255,0.12)) flex items-center justify-between gap-2 ${className}`} {...props}>
    {children}
  </div>
);

export { CardContent as CardBody };

export default Card;
