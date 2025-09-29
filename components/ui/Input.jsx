import React from "react";
import PropTypes from "prop-types";

const Input = ({
  type = "text",
  placeholder = "",
  value,
  onChange,
  className = "",
  size = "default",
  variant = "default",
  disabled = false,
  error = false,
  ...props
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-2 text-sm";
      case "lg":
        return "px-4 py-3 text-base";
      default:
        return "px-3 py-2 text-sm";
    }
  };

  const getVariantClasses = () => {
    if (error) {
      return "border-red-300 focus:border-red-500 focus:ring-red-500";
    }

    switch (variant) {
      case "outline":
        return "border-gray-300 focus:border-blue-500 focus:ring-blue-500";
      default:
        return "border-gray-300 focus:border-blue-500 focus:ring-blue-500";
    }
  };

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`
        block w-full rounded-md shadow-sm
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}
        focus:outline-none focus:ring-1
        transition-colors duration-200
        ${className}
      `}
      {...props}
    />
  );
};

const Select = ({
  children,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  size = "default",
  disabled = false,
  error = false,
  ...props
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-2 text-sm";
      case "lg":
        return "px-4 py-3 text-base";
      default:
        return "px-3 py-2 text-sm";
    }
  };

  const getVariantClasses = () => {
    if (error) {
      return "border-red-300 focus:border-red-500 focus:ring-red-500";
    }
    return "border-gray-300 focus:border-blue-500 focus:ring-blue-500";
  };

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`
        block w-full rounded-md shadow-sm
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}
        focus:outline-none focus:ring-1
        transition-colors duration-200
        ${className}
      `}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
};

const Textarea = ({
  placeholder = "",
  value,
  onChange,
  className = "",
  rows = 3,
  disabled = false,
  error = false,
  ...props
}) => {
  const getVariantClasses = () => {
    if (error) {
      return "border-red-300 focus:border-red-500 focus:ring-red-500";
    }
    return "border-gray-300 focus:border-blue-500 focus:ring-blue-500";
  };

  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      disabled={disabled}
      className={`
        block w-full rounded-md shadow-sm px-3 py-2 text-sm
        ${getVariantClasses()}
        ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}
        focus:outline-none focus:ring-1
        transition-colors duration-200
        resize-vertical
        ${className}
      `}
      {...props}
    />
  );
};

Input.propTypes = {
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "default", "lg"]),
  variant: PropTypes.oneOf(["default", "outline"]),
  disabled: PropTypes.bool,
  error: PropTypes.bool,
};

Select.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "default", "lg"]),
  disabled: PropTypes.bool,
  error: PropTypes.bool,
};

Textarea.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  className: PropTypes.string,
  rows: PropTypes.number,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
};

export { Input, Select, Textarea };
