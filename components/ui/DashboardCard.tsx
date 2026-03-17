import React from "react";
import { Card, CardContent } from "./Card";

type TrendDirection = "up" | "down" | "neutral";

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value?: React.ReactNode;
  subtitle?: string;
  caption?: string;
  icon?: React.ElementType;
  iconColor?: string;
  trend?: TrendDirection;
  trendLabel?: string;
  className?: string;
  variant?: "default" | "elevated" | "outlined" | "gradient";
  interactive?: boolean;
  onClick?: () => void;
  loading?: boolean;
}

const TREND_COLORS: Record<TrendDirection, string> = {
  up: "text-(--accent-emerald,#4ade80)",
  down: "text-(--danger,#f87171)",
  neutral: "text-(--text-muted,rgba(255,255,255,0.5))",
};

const DashboardCard: React.FC<DashboardCardProps> = ({
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
  const handleClick = interactive && onClick ? onClick : undefined;
  return (
    <Card
      variant={variant}
      interactive={interactive}
      onClick={handleClick}
      className={`${className} ${loading ? "animate-pulse" : ""}`}
      {...props}
    >
      <CardContent padding="lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-(--text-muted,rgba(255,255,255,0.55)) mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-(--text-primary,inherit) mb-1">
              {loading ? (
                <span className="inline-block w-16 h-6 [background:var(--glass-outline,rgba(255,255,255,0.12))] rounded animate-pulse" />
              ) : (
                value
              )}
            </p>
            {subtitle && (
              <p className="text-xs text-(--text-muted,rgba(255,255,255,0.5))">
                {subtitle}
              </p>
            )}
            {trend && trendLabel && (
              <div
                className={`flex items-center mt-2 text-xs ${TREND_COLORS[trend] ?? TREND_COLORS.neutral}`}
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

type StatVariant = "default" | "success" | "warning" | "danger";
type ChangeType = "up" | "down" | "neutral";

const STAT_VARIANT_BORDER: Record<StatVariant, string> = {
  default: "var(--glass-outline)",
  success: "var(--color-success-border, rgba(74,222,128,0.35))",
  warning: "var(--color-warning-border, rgba(251,191,36,0.35))",
  danger: "var(--color-error-border, rgba(248,113,113,0.35))",
};
const STAT_VARIANT_ICON_COLOR: Record<StatVariant, string> = {
  default: "var(--text-secondary)",
  success: "var(--color-success, #4ade80)",
  warning: "var(--color-warning, #fbbf24)",
  danger: "var(--color-error, #f87171)",
};

interface StatCardProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value"
> {
  title?: string;
  value: React.ReactNode;
  change?: string;
  changeType?: ChangeType;
  icon?: React.ElementType | string;
  iconColor?: string;
  subtitle?: string;
  caption?: string;
  className?: string;
  label?: string;
  sub?: string;
  variant?: StatVariant;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor,
  subtitle,
  caption,
  className = "",
  label,
  sub,
  variant = "default",
  onClick,
  ...props
}) => {
  const resolvedTitle = title ?? label;
  const resolvedSubtitle = subtitle ?? sub;
  const variantBorder =
    STAT_VARIANT_BORDER[variant] ?? STAT_VARIANT_BORDER.default;
  const variantIconColor =
    iconColor ??
    STAT_VARIANT_ICON_COLOR[variant] ??
    STAT_VARIANT_ICON_COLOR.default;
  const isEmojiIcon = typeof Icon === "string";
  const changeBg =
    changeType === "up"
      ? "var(--color-success-surface, rgba(74,222,128,0.1))"
      : changeType === "down"
        ? "var(--color-error-surface, rgba(248,113,113,0.1))"
        : "var(--glass-surface)";
  const changeColor =
    changeType === "up"
      ? "var(--color-success, #4ade80)"
      : changeType === "down"
        ? "var(--color-error, #f87171)"
        : "var(--text-muted)";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 px-4 py-3.5 rounded-xl transition-all w-full text-left ${className}`}
      style={{
        background: "var(--glass-surface)",
        border: `1px solid ${variantBorder}`,
        backdropFilter: "var(--glass-blur)",
        cursor: onClick ? "pointer" : "default",
      }}
      {...props}
    >
      <div className="flex items-center justify-between w-full">
        {isEmojiIcon ? (
          <span className="text-xl" style={{ color: variantIconColor }}>
            {Icon as string}
          </span>
        ) : (
          Icon && (
            <div
              className="flex items-center justify-center rounded-lg shrink-0"
              style={{
                width: 36,
                height: 36,
                background: `${variantIconColor}18`,
                border: `1px solid ${variantIconColor}30`,
              }}
            >
              <Icon className="w-4 h-4" style={{ color: variantIconColor }} />
            </div>
          )
        )}
        {change && (
          <span
            className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: changeBg, color: changeColor }}
          >
            {change}
          </span>
        )}
      </div>
      <div>
        <p
          className="text-2xl font-bold"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
          }}
        >
          {value}
        </p>
        <p
          className="text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {resolvedTitle}
        </p>
        {resolvedSubtitle && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {resolvedSubtitle}
          </p>
        )}
        {caption && (
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {caption}
          </p>
        )}
      </div>
    </button>
  );
};

interface ActionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: string;
  /** Either a Lucide component (rendered internally) or an already-rendered ReactNode. */
  icon?: React.ElementType | React.ReactNode;
  className?: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  action,
  icon,
  className = "",
  ...props
}) => {
  // If icon is a function/class component, render it; otherwise treat as ReactNode
  const iconNode =
    typeof icon === "function"
      ? React.createElement(icon as React.ElementType, {
          className: "w-5 h-5 text-(--primary-resonance,#6366f1)",
        })
      : (icon as React.ReactNode);

  return (
    <Card
      variant="outlined"
      interactive
      className={`group hover:border-(--primary-resonance,#4f46e5) transition-all duration-200 ${className}`}
      {...props}
    >
      <CardContent padding="lg">
        <div className="flex items-start space-x-4">
          {iconNode != null && (
            <div className="w-10 h-10 [background:var(--glass-surface,rgba(255,255,255,0.06))] rounded-lg flex items-center justify-center group-hover:[background:var(--glass-surface-hover,rgba(255,255,255,0.1))] transition-colors duration-200">
              {iconNode}
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

export { DashboardCard, StatCard, ActionCard };
export default DashboardCard;
