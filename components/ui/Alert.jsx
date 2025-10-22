import React from 'react';

export function Alert({ children, variant = 'default', className = '', ...props }) {
  const baseStyles = 'p-4 rounded-md border';
  const variantStyles = {
    default: 'bg-gray-50 border-gray-200 text-gray-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AlertDescription({ children, className = '', ...props }) {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AlertTitle({ children, className = '', ...props }) {
  return (
    <h4 className={`font-medium mb-1 ${className}`} {...props}>
      {children}
    </h4>
  );
}

export default Alert;