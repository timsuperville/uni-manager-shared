import React from "react";
import PropTypes from "prop-types";
import { useTheme } from "../ThemeProvider";

const Card = ({ children, className = "", variant = "default", ...props }) => {
  const theme = useTheme();

  const variantStyles = {
    default: "bg-white border-gray-200",
    elevated: "bg-white border-gray-100 shadow-lg",
    outlined: "bg-transparent border-gray-300",
  };

  return (
    <div
      className={`rounded-lg shadow border ${variantStyles[variant]} ${className}`}
      style={{
        borderRadius: theme.borderRadius.lg,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "", ...props }) => {
  const theme = useTheme();

  return (
    <div
      className={`px-6 py-4 border-b border-gray-200 ${className}`}
      style={{
        padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const CardContent = ({ children, className = "", ...props }) => {
  const theme = useTheme();

  return (
    <div
      className={`px-6 py-4 ${className}`}
      style={{
        padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = "", ...props }) => {
  const theme = useTheme();

  return (
    <h3
      className={`text-lg font-medium text-gray-900 ${className}`}
      style={{
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSize.xl,
      }}
      {...props}
    >
      {children}
    </h3>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "elevated", "outlined"]),
};

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export { Card, CardHeader, CardContent, CardTitle };
