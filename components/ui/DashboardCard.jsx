import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent } from "./Card";

const DashboardCard = ({
  title,
  value,
  subtitle,
  caption,
  icon: Icon,
  iconColor,
  trend,
  trendLabel,
  className = "",
  variant = "elevated",
  interactive = false,
  onClick,
  loading = false,
  ...props
}) => {
  const trendColors = {
    up: "text-(--accent-emerald,#4ade80)",
    down: "text-(--danger,#f87171)",
    neutral: "text-(--text-muted,rgba(255,255,255,0.5))",
  };

  const handleClick = interactive && onClick ? onClick : undefined;

  return (
    <Card
      variant={variant}
      interactive={interactive}
      onClick={handleClick}
      className={`
        ${className}
        ${loading ? "animate-pulse" : ""}
      `}
      {...props}
    >
      <CardContent padding="lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Title */}
            <p className="text-sm font-medium text-(--text-muted,rgba(255,255,255,0.55)) mb-1">
              {title}
            </p>

            {/* Value */}
            <p className="text-2xl font-bold text-(--text-primary,inherit) mb-1">
              {loading ? (
                <span className="inline-block w-16 h-6 [background:var(--glass-outline,rgba(255,255,255,0.12))] rounded animate-pulse"></span>
              ) : (
                value
              )}
            </p>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs text-(--text-muted,rgba(255,255,255,0.5))">
                {subtitle}
              </p>
            )}

            {/* Trend */}
            {trend && trendLabel && (
              <div
                className={`flex items-center mt-2 text-xs ${trendColors[trend] || trendColors.neutral}`}
              >
                {trend === "up" && (
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {trend === "down" && (
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {trend === "neutral" && (
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span>{trendLabel}</span>
              </div>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <div className="shrink-0">
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: iconColor
                    ? `${iconColor}22`
                    : "var(--glass-surface, rgba(255,255,255,0.06))",
                  borderRadius: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border:
                    "1px solid var(--glass-outline, rgba(255,255,255,0.15))",
                  flexShrink: 0,
                }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{
                    color: iconColor || "var(--primary-resonance, #6366f1)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
        {caption && (
          <p
            style={{
              fontSize: "var(--text-xs, 0.75rem)",
              color: "var(--text-muted, rgba(255,255,255,0.5))",
              margin: "0 1rem 0.75rem",
            }}
          >
            {caption}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Variant → border-color mapping (for Dashboard StatsRow use-case)
const STAT_VARIANT_BORDER = {
  default: "var(--glass-outline)",
  success: "var(--color-success-border, rgba(74,222,128,0.35))",
  warning: "var(--color-warning-border, rgba(251,191,36,0.35))",
  danger: "var(--color-error-border, rgba(248,113,113,0.35))",
};
const STAT_VARIANT_ICON_COLOR = {
  default: "var(--text-secondary)",
  success: "var(--color-success, #4ade80)",
  warning: "var(--color-warning, #fbbf24)",
  danger: "var(--color-error, #f87171)",
};

const StatCard = ({
  // Standard API
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor,
  subtitle,
  caption,
  className = "",
  // Extended API (Dashboard StatsRow aliases)
  label, // alias for title
  sub, // alias for subtitle
  variant = "default", // border + icon colour variant
  onClick,
  ...props
}) => {
  // Resolve aliases
  const resolvedTitle = title ?? label;
  const resolvedSubtitle = subtitle ?? sub;
  const resolvedInteractive = !!onClick;
  const variantBorder =
    STAT_VARIANT_BORDER[variant] ?? STAT_VARIANT_BORDER.default;
  const variantIconColor =
    iconColor ??
    STAT_VARIANT_ICON_COLOR[variant] ??
    STAT_VARIANT_ICON_COLOR.default;

  // If Icon is a string (emoji), render as a span; otherwise use DashboardCard's icon slot
  const isEmojiIcon = typeof Icon === "string";

  if (isEmojiIcon) {
    // Compact layout matching original Dashboard StatsRow design
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex flex-col items-start gap-1.5 px-4 py-3.5 rounded-xl transition-all w-full text-left ${className}`}
        style={{
          background: "var(--glass-surface)",
          border: `1px solid ${variantBorder}`,
          backdropFilter: "var(--glass-blur)",
          cursor: onClick ? "pointer" : "default",
        }}
        {...props}
      >
        <div className="flex items-center gap-2 w-full">
          <span className="text-xl" style={{ color: variantIconColor }}>
            {Icon}
          </span>
          <span
            className="text-2xl font-bold ml-auto"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
            }}
          >
            {value}
          </span>
        </div>
        <div>
          <p
            className="text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {resolvedTitle}
          </p>
          {resolvedSubtitle && (
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {resolvedSubtitle}
            </p>
          )}
        </div>
      </button>
    );
  }

  return (
    <DashboardCard
      title={resolvedTitle}
      value={value}
      icon={Icon}
      trend={changeType}
      trendLabel={change}
      subtitle={resolvedSubtitle}
      caption={caption}
      iconColor={variantIconColor}
      className={className}
      interactive={resolvedInteractive}
      onClick={onClick}
      {...props}
    />
  );
};

const ActionCard = ({
  title,
  description,
  action,
  icon: Icon,
  className = "",
  ...props
}) => {
  return (
    <Card
      variant="outlined"
      interactive={true}
      className={`
        group
        hover:border-(--primary-resonance,#4f46e5)
        transition-all duration-200
        ${className}
      `}
      {...props}
    >
      <CardContent padding="lg">
        <div className="flex items-start space-x-4">
          {Icon && (
            <div
              className="
              w-10 h-10
              [background:var(--glass-surface,rgba(255,255,255,0.06))]
              rounded-lg
              flex items-center justify-center
              group-hover:[background:var(--glass-surface-hover,rgba(255,255,255,0.1))]
              transition-colors duration-200
            "
            >
              <Icon className="w-5 h-5 text-(--primary-resonance,#6366f1)" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-(--text-primary,inherit) mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-(--text-muted,rgba(255,255,255,0.5)) mb-3">
                {description}
              </p>
            )}
            {action && (
              <div className="text-xs text-(--primary-resonance,#6366f1) font-medium">
                {action}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  trend: PropTypes.oneOf(["up", "down", "neutral"]),
  trendLabel: PropTypes.string,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "elevated", "outlined", "gradient"]),
  interactive: PropTypes.bool,
  onClick: PropTypes.func,
  loading: PropTypes.bool,
};

StatCard.propTypes = {
  // Standard API
  title: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.string,
  changeType: PropTypes.oneOf(["up", "down", "neutral"]),
  icon: PropTypes.oneOfType([PropTypes.elementType, PropTypes.string]),
  iconColor: PropTypes.string,
  subtitle: PropTypes.string,
  caption: PropTypes.string,
  className: PropTypes.string,
  // Extended API (Dashboard StatsRow aliases)
  label: PropTypes.string,
  sub: PropTypes.string,
  variant: PropTypes.oneOf(["default", "success", "warning", "danger"]),
  onClick: PropTypes.func,
};

ActionCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.string,
  icon: PropTypes.elementType,
  className: PropTypes.string,
};

export { DashboardCard, StatCard, ActionCard };
export default DashboardCard;
