import React from 'react';
import PropTypes from 'prop-types';

const Card = ({
  children,
  className = '',
  variant = 'default',
  interactive = false,
  ...props
}) => {
  const variantStyles = {
    default: `
      bg-white dark:bg-gray-800 
      border border-gray-200 dark:border-gray-700 
      shadow-sm dark:shadow-gray-900/10
    `,
    elevated: `
      bg-white dark:bg-gray-800 
      border border-gray-100 dark:border-gray-700 
      shadow-lg dark:shadow-gray-900/25 
      shadow-gray-100 dark:shadow-gray-900/25
    `,
    outlined: `
      bg-transparent 
      border border-gray-300 dark:border-gray-600 
      shadow-none
    `,
    gradient: `
      bg-gradient-to-br from-white to-gray-50 
      dark:from-gray-800 dark:to-gray-900 
      border border-gray-200 dark:border-gray-700 
      shadow-md dark:shadow-gray-900/20
    `,
  };

  const interactiveStyles = interactive
    ? 'hover:shadow-lg dark:hover:shadow-gray-900/30 transition-all duration-200 cursor-pointer hover:scale-[1.02]'
    : '';

  return (
    <div
      className={`
        rounded-xl 
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

const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`
        px-6 py-4 
        border-b border-gray-200 dark:border-gray-700 
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
  className = '',
  padding = 'default',
  ...props
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    default: 'px-6 py-4',
    lg: 'px-8 py-6',
  };

  return (
    <div className={`${paddingStyles[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardTitle = ({
  children,
  className = '',
  size = 'default',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-base font-medium',
    default: 'text-lg font-medium',
    lg: 'text-xl font-semibold',
    xl: 'text-2xl font-semibold',
  };

  return (
    <h3
      className={`
        ${sizeStyles[size]} 
        text-gray-900 dark:text-gray-100 
        ${className}
      `}
      {...props}
    >
      {children}
    </h3>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'gradient']),
  interactive: PropTypes.bool,
};

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  padding: PropTypes.oneOf(['none', 'sm', 'default', 'lg']),
};

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'default', 'lg', 'xl']),
};

export { Card, CardHeader, CardContent, CardTitle };
