/**
 * Text — Semantic text primitive using Liquid Glass CSS tokens.
 * Renders a <p> element with standard body sizing.
 *
 * Per CSP: Replaces all inline text components used across 2+ feature files.
 */
import React from "react";

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  size?: "xs" | "sm" | "base" | "lg" | "xl";
  weight?: "normal" | "medium" | "semibold" | "bold";
  muted?: boolean;
  secondary?: boolean;
  className?: string;
}

const SIZE_MAP: Record<string, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

const WEIGHT_MAP: Record<string, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  (
    {
      children,
      size = "base",
      weight,
      muted,
      secondary,
      className = "",
      style,
      ...rest
    },
    ref,
  ) => {
    const color = muted
      ? "var(--text-muted)"
      : secondary
        ? "var(--text-secondary)"
        : "var(--text-primary)";

    const sizeClass = SIZE_MAP[size] ?? "text-base";
    const weightClass = weight ? (WEIGHT_MAP[weight] ?? "") : "";

    return (
      <p
        ref={ref}
        className={`${sizeClass} ${weightClass} ${className}`}
        style={{ color, ...style }}
        {...rest}
      >
        {children}
      </p>
    );
  },
);

Text.displayName = "Text";
export default Text;
