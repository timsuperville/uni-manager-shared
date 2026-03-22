import React from "react";

type CardVariant = "default" | "elevated" | "outlined" | "gradient" | "flat";
type CardContentPadding = "none" | "sm" | "default" | "lg";
type CardTitleSize = "sm" | "default" | "lg" | "xl";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  compact?: boolean;
  /** Tailwind padding class — e.g. "p-6", "p-0". Applied to the root div when provided. */
  padding?: string;
  /** Displayed above children as a section heading when provided. */
  title?: string;
  /** When true, applies hover scale + shadow lift (alias for interactive). */
  hover?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardContentPadding;
}
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: CardTitleSize;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    "bg-(--glass-surface) backdrop-blur-xl border border-(--glass-outline) shadow-sm",
  elevated:
    "bg-(--glass-surface) backdrop-blur-xl border border-(--glass-outline) shadow-lg",
  outlined:
    "bg-transparent backdrop-blur-xl border border-(--glass-outline) shadow-none",
  gradient:
    "bg-(--bg-surface-gradient) backdrop-blur-xl border border-(--glass-outline) shadow-md",
  flat: "bg-transparent shadow-none border-none",
};

const paddingStyles: Record<CardContentPadding, string> = {
  none: "",
  sm: "p-4",
  default: "px-6 py-4",
  lg: "px-8 py-6",
};

const titleSizeStyles: Record<CardTitleSize, string> = {
  sm: "text-base font-medium",
  default: "text-lg font-medium",
  lg: "text-xl font-semibold",
  xl: "text-2xl font-semibold",
};

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
  interactive = false,
  compact = false,
  padding,
  title,
  hover,
  onClick,
  ...props
}) => {
  const isInteractive = interactive || hover || !!onClick;
  return (
    <div
      className={`${compact ? "rounded-lg" : "rounded-xl"} ${variantStyles[variant]} ${isInteractive ? "hover:shadow-lg dark:hover:shadow-gray-900/30 transition-all duration-200 cursor-pointer hover:scale-[1.02]" : ""} ${padding ?? ""} ${className}`}
      onClick={onClick}
      {...props}
    >
      {title && (
        <h3
          className="text-base font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div
    className={`px-6 py-4 border-b border-(--glass-outline) ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = "",
  padding = "default",
  ...props
}) => (
  <div className={`${paddingStyles[padding]} ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = "",
  size = "default",
  ...props
}) => (
  <h3
    className={`${titleSizeStyles[size]} text-(--text-primary) ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ children, className = "", ...props }) => (
  <p className={`text-sm text-(--text-muted) mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div
    className={`px-6 py-3 border-t border-(--glass-outline) flex items-center justify-between gap-2 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export { CardContent as CardBody };

export default Card;
