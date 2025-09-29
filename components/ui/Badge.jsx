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
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "danger":
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "secondary":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "outline":
        return "bg-transparent text-gray-600 border-gray-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
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
