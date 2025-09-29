// Shared LoadingSpinner component for all Uni-Manager applications
import React from "react";
import PropTypes from "prop-types";

const LoadingSpinner = ({
  size = "medium",
  color = "blue",
  className = "",
  text = "",
}) => {
  const sizes = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const colors = {
    blue: "border-blue-600",
    gray: "border-gray-600",
    white: "border-white",
    green: "border-green-600",
    red: "border-red-600",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-t-transparent ${sizes[size]} ${colors[color]}`}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(["small", "medium", "large", "xl"]),
  color: PropTypes.oneOf(["blue", "gray", "white", "green", "red"]),
  className: PropTypes.string,
  text: PropTypes.string,
};

export default LoadingSpinner;
