import React from "react";
import PropTypes from "prop-types";

const Progress = ({
  value = 0,
  max = 100,
  className = "",
  size = "default",
  variant = "default",
  showLabel = false,
  label = "",
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-2";
      case "lg":
        return "h-4";
      default:
        return "h-3";
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "[background:var(--accent-emerald,#22c55e)]";
      case "warning":
        return "[background:var(--warning,#eab308)]";
      case "danger":
      case "error":
        return "[background:var(--danger,#ef4444)]";
      case "info":
        return "[background:var(--badge-info-text,#60a5fa)]";
      default:
        return "[background:var(--primary-resonance,#4f46e5)]";
    }
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-(--text-primary,inherit)">
            {label || `${Math.round(percentage)}%`}
          </span>
          {showLabel && !label && (
            <span className="text-sm text-(--text-muted,rgba(255,255,255,0.5))">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full [background:var(--glass-outline,rgba(255,255,255,0.12))] rounded-full ${getSizeClasses()}`}
      >
        <div
          className={`${getSizeClasses()} ${getVariantClasses()} rounded-full transition-all duration-300 ease-in-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const CircularProgress = ({
  value = 0,
  max = 100,
  size = "default",
  variant = "default",
  showLabel = false,
  strokeWidth = 8,
  className = "",
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getSizeValue = () => {
    switch (size) {
      case "sm":
        return 64;
      case "lg":
        return 128;
      default:
        return 96;
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case "success":
        return "var(--accent-emerald, #10b981)";
      case "warning":
        return "var(--warning, #f59e0b)";
      case "danger":
      case "error":
        return "var(--danger, #ef4444)";
      case "info":
        return "var(--badge-info-text, #3b82f6)";
      default:
        return "var(--primary-resonance, #4f46e5)";
    }
  };

  const sizeValue = getSizeValue();
  const radius = (sizeValue - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      {...props}
    >
      <svg
        width={sizeValue}
        height={sizeValue}
        className="transform -rotate-90"
      >
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          stroke="var(--glass-outline, #e5e7eb)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          stroke={getVariantColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-(--text-primary,inherit)">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

Progress.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "default", "lg"]),
  variant: PropTypes.oneOf([
    "default",
    "success",
    "warning",
    "danger",
    "error",
    "info",
  ]),
  showLabel: PropTypes.bool,
  label: PropTypes.string,
};

CircularProgress.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  size: PropTypes.oneOf(["sm", "default", "lg"]),
  variant: PropTypes.oneOf([
    "default",
    "success",
    "warning",
    "danger",
    "error",
    "info",
  ]),
  showLabel: PropTypes.bool,
  strokeWidth: PropTypes.number,
  className: PropTypes.string,
};

export { Progress, CircularProgress };
