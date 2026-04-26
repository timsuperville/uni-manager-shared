import React from "react";
import { CHIP_VARIANTS, CHIP_FALLBACK, CHIP_SIZE_MAP } from "./chipVariants";
import type { ChipVariant, ChipSize } from "./chipVariants";

export { CHIP_VARIANTS } from "./chipVariants";

/**
 * Chip — Liquid Glass Design System
 *
 * The canonical pill badge for the entire ecosystem. Replaces all inline Chip
 * definitions and is the underlying primitive for StatusBadge.
 *
 * Three usage patterns:
 *
 *  1. Preset variant — pick a named semantic from CHIP_VARIANTS:
 *       <Chip variant="pending" dot />
 *       <Chip variant="critical" dot dotGlow size="sm" />
 *
 *  2. Custom colours — pass raw color props (from feedbackTokens, etc.):
 *       <Chip bg={cat.bg} color={cat.color} border={cat.border}>🐛 Bug</Chip>
 *
 *  3. Clickable chip (filter / dismiss):
 *       <Chip variant="resolved" dot onClick={() => setFilter("resolved")} />
 *
 * Sizes:
 *   "xs"  → 10px font  • 2px 7px padding   (compact rows)
 *   "sm"  → 11px font  • 2px 9px padding   (default)
 *   "md"  → 12px font  • 3px 11px padding  (prominent / header use)
 *
 * Content:
 *   - `label` string for plain-text chips
 *   - `children` for rich content (emoji + text, icons, etc.)
 *   - Both can coexist: label renders before children
 *
 * Dot indicator:
 *   - `dot`      – boolean; if omitted the dot shows only when the resolved
 *                  variant or custom dotColor provides a colour.
 *   - `dotColor` – explicit colour (overrides variant's dot)
 *   - `dotGlow`  – adds a box-shadow glow on the dot (use for active/live states)
 */

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  bg?: string;
  color?: string;
  border?: string;
  label?: string;
  dot?: boolean;
  dotColor?: string;
  dotGlow?: boolean;
  onClick?: (e: React.MouseEvent | React.KeyboardEvent) => void;
  title?: string;
  size?: ChipSize;
  className?: string;
  style?: React.CSSProperties;
}

export function Chip({
  variant,
  bg: bgProp,
  color: colorProp,
  border: borderProp,
  label,
  children,
  dot,
  dotColor,
  dotGlow = false,
  onClick,
  title,
  size = "sm",
  className = "",
  style: styleProp,
  ...props
}: ChipProps) {
  const preset = variant
    ? (CHIP_VARIANTS[variant] ?? CHIP_FALLBACK)
    : CHIP_FALLBACK;

  const resolvedBg = bgProp ?? preset.bg;
  const resolvedColor = colorProp ?? preset.color;
  const resolvedBorder = borderProp ?? preset.border;

  // Dot visibility: explicit boolean overrides auto-detection
  const resolvedDotColor = dotColor ?? preset.dot;
  const showDot =
    dot === undefined ? !!resolvedDotColor : dot && !!resolvedDotColor;

  const sz = CHIP_SIZE_MAP[size] ?? CHIP_SIZE_MAP.sm;

  const isInteractive = typeof onClick === "function";

  return (
    <span
      title={title}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick(e);
            }
          : undefined
      }
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: showDot
          ? "5px"
          : React.Children.count(children) > 0 || label
            ? "4px"
            : "0",
        padding: sz.padding,
        borderRadius: "100px",
        fontSize: sz.fontSize,
        fontWeight: sz.fontWeight,
        background: resolvedBg,
        color: resolvedColor,
        border: `1px solid ${resolvedBorder}`,
        flexShrink: 0,
        whiteSpace: "nowrap",
        cursor: isInteractive ? "pointer" : "default",
        userSelect: "none",
        transition: isInteractive
          ? "opacity 120ms ease, filter 120ms ease"
          : "none",
        ...styleProp,
      }}
      {...props}
    >
      {showDot && (
        <span
          aria-hidden="true"
          style={{
            width: sz.dotSize,
            height: sz.dotSize,
            borderRadius: "50%",
            background: resolvedDotColor ?? undefined,
            flexShrink: 0,
            boxShadow: dotGlow ? `0 0 6px ${resolvedDotColor}` : "none",
            transition: "box-shadow 150ms ease",
          }}
        />
      )}
      {label}
      {children}
    </span>
  );
}

export default Chip;
