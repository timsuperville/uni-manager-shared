import PropTypes from "prop-types";

/**
 * Reusable ProgressBar component with customizable colors and sizes
 */
export function ProgressBar({
  value,
  max = 100,
  color = "blue",
  size = "md",
  showLabel = false,
  label,
  className = "",
  ...props
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const bgColorClass = colorClasses[color] || colorClasses.blue;
  const heightClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={className} {...props}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showLabel && (
            <span className="text-sm font-medium text-gray-700">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClass}`}
      >
        <div
          className={`${bgColorClass} ${heightClass} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  color: PropTypes.oneOf(["blue", "green", "purple", "orange", "red"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  showLabel: PropTypes.bool,
  label: PropTypes.string,
  className: PropTypes.string,
};
