import React from "react";
import PropTypes from "prop-types";

const Card = ({
  children,
  className = "",
  variant = "default",
  interactive = false,
  compact = false,
  ...props
}) => {
  const variantStyles = {
    default: `
      [background:var(--glass-surface,rgba(255,255,255,0.06))]
      border border-(--glass-outline,rgba(255,255,255,0.12))
      shadow-sm
    `,
    elevated: `
      [background:var(--glass-surface,rgba(255,255,255,0.06))]
      border border-(--glass-outline,rgba(255,255,255,0.12))
      shadow-lg
    `,
    outlined: `
      bg-transparent
      border border-(--glass-outline,rgba(255,255,255,0.18))
      shadow-none
    `,
    gradient: `
      [background:var(--glass-surface-gradient,var(--glass-surface,rgba(255,255,255,0.06)))]
      border border-(--glass-outline,rgba(255,255,255,0.12))
      shadow-md
    `,
    flat: `
      bg-transparent
      shadow-none
      border-none
    `,
  };

  const compactClasses = compact ? "rounded-lg" : "rounded-xl";

  const interactiveStyles = interactive
    ? "hover:shadow-lg dark:hover:shadow-gray-900/30 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
    : "";

  return (
    <div
      className={`
        ${compactClasses}
        ${variantStyles[variant]}
        ${interactiveStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`
        px-6 py-4
        border-b border-(--glass-outline,rgba(255,255,255,0.12))
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const CardContent = ({
  children,
  className = "",
  padding = "default",
  ...props
}) => {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    default: "px-6 py-4",
    lg: "px-8 py-6",
  };

  return (
    <div className={`${paddingStyles[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardTitle = ({
  children,
  className = "",
  size = "default",
  ...props
}) => {
  const sizeStyles = {
    sm: "text-base font-medium",
    default: "text-lg font-medium",
    lg: "text-xl font-semibold",
    xl: "text-2xl font-semibold",
  };

  return (
    <h3
      className={`
        ${sizeStyles[size]}
        text-(--text-primary,inherit)
        ${className}
      `}
      {...props}
    >
      {children}
    </h3>
  );
};

const CardDescription = ({ children, className = "", ...props }) => {
  return (
    <p
      className={`
        text-sm text-(--text-muted,rgba(255,255,255,0.55))
        mt-1
        ${className}
      `}
      {...props}
    >
      {children}
    </p>
  );
};

const CardFooter = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`
        px-6 py-3
        border-t border-(--glass-outline,rgba(255,255,255,0.12))
        flex items-center justify-between gap-2
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf([
    "default",
    "elevated",
    "outlined",
    "gradient",
    "flat",
  ]),
  interactive: PropTypes.bool,
  compact: PropTypes.bool,
};

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  padding: PropTypes.oneOf(["none", "sm", "default", "lg"]),
};

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "default", "lg", "xl"]),
};

CardDescription.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
  CardContent as CardBody,
};
