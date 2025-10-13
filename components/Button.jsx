// Shared Button component for all Uni-Manager applications
import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from './ThemeProvider';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  ...props
}) => {
  const theme = useTheme();
  const baseStyles = 'btn-base';

  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger',
    success: 'btn-success',
    warning: 'btn-warning',
    // alias commonly used in app to a reasonable style
    ghost: 'btn-outline',
  };

  const sizes = {
    small: 'btn-sm',
    medium: '', // Default size
    large: 'btn-lg',
    // alias shorthand often used in code/tests
    sm: 'btn-sm',
  };

  // Generate dynamic styles based on theme
  const dynamicStyles = {
    fontFamily: theme.typography.fontFamily,
    borderRadius: theme.borderRadius.md,
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.medium} ${className}`.trim()}
      disabled={disabled}
      style={dynamicStyles}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'outline',
    'danger',
    'success',
    'warning',
    'ghost',
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large', 'sm']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;
