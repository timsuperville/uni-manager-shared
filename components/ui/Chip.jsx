import React from "react";
import PropTypes from "prop-types";

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

// ─── Preset variant map ───────────────────────────────────────────────────────
// Single source of truth for all semantic colour sets across the ecosystem.
// Covers: user status, feedback status, severity levels, and report categories.
export const CHIP_VARIANTS = {
    // ── User / system status ────────────────────────────────────────────────────
    active: {
        bg: "hsla(160,84%,39%,0.12)",
        color: "hsl(160,84%,50%)",
        border: "hsla(160,84%,39%,0.3)",
        dot: "hsl(160,84%,50%)",
    },
    inactive: {
        bg: "hsla(351,89%,60%,0.1)",
        color: "hsl(351,89%,65%)",
        border: "hsla(351,89%,60%,0.25)",
        dot: "hsl(351,89%,60%)",
    },
    suspended: {
        bg: "hsla(38,92%,50%,0.12)",
        color: "hsl(38,92%,65%)",
        border: "hsla(38,92%,50%,0.3)",
        dot: "hsl(38,92%,60%)",
    },
    locked: {
        bg: "hsla(351,89%,60%,0.12)",
        color: "hsl(351,89%,65%)",
        border: "hsla(351,89%,60%,0.3)",
        dot: "hsl(351,89%,60%)",
    },
    warning: {
        bg: "hsla(38,92%,50%,0.12)",
        color: "hsl(38,92%,65%)",
        border: "hsla(38,92%,50%,0.3)",
        dot: "hsl(38,92%,60%)",
    },

    // ── Feedback / report statuses ──────────────────────────────────────────────
    pending: {
        bg: "hsla(45,100%,60%,0.12)",
        color: "hsl(45,100%,65%)",
        border: "hsla(45,100%,60%,0.3)",
        dot: "hsl(45,100%,60%)",
    },
    investigating: {
        bg: "hsla(210,90%,65%,0.12)",
        color: "hsl(210,90%,72%)",
        border: "hsla(210,90%,65%,0.3)",
        dot: "hsl(210,90%,65%)",
    },
    "in-progress": {
        bg: "hsla(187,84%,55%,0.12)",
        color: "hsl(187,84%,60%)",
        border: "hsla(187,84%,55%,0.3)",
        dot: "hsl(187,84%,55%)",
    },
    resolved: {
        bg: "hsla(160,84%,50%,0.1)",
        color: "hsl(160,84%,55%)",
        border: "hsla(160,84%,50%,0.3)",
        dot: "hsl(160,84%,50%)",
    },
    ignored: {
        bg: "transparent",
        color: "var(--text-muted)",
        border: "var(--glass-outline)",
        dot: "var(--text-muted)",
    },
    duplicate: {
        bg: "hsla(280,60%,65%,0.1)",
        color: "hsl(280,60%,70%)",
        border: "hsla(280,60%,65%,0.3)",
        dot: "hsl(280,60%,65%)",
    },
    open: {
        bg: "hsla(38,92%,50%,0.12)",
        color: "hsl(38,92%,65%)",
        border: "hsla(38,92%,50%,0.3)",
        dot: "hsl(38,92%,65%)",
    },

    // ── Severity ────────────────────────────────────────────────────────────────
    critical: {
        bg: "hsla(351,89%,60%,0.12)",
        color: "hsl(351,89%,65%)",
        border: "hsla(351,89%,60%,0.3)",
        dot: "hsl(351,89%,62%)",
    },
    high: {
        bg: "hsla(28,100%,60%,0.12)",
        color: "hsl(28,100%,66%)",
        border: "hsla(28,100%,60%,0.3)",
        dot: "hsl(28,100%,60%)",
    },
    medium: {
        bg: "hsla(45,100%,60%,0.1)",
        color: "hsl(45,100%,60%)",
        border: "hsla(45,100%,60%,0.28)",
        dot: "hsl(45,100%,60%)",
    },
    low: {
        bg: "hsla(210,90%,60%,0.08)",
        color: "hsl(210,90%,70%)",
        border: "hsla(210,90%,60%,0.2)",
        dot: "hsl(210,90%,70%)",
    },

    // ── Report categories ───────────────────────────────────────────────────────
    bug: {
        bg: "hsla(351,89%,60%,0.12)",
        color: "hsl(351,89%,65%)",
        border: "hsla(351,89%,60%,0.3)",
        dot: null,
    },
    feature: {
        bg: "hsla(160,70%,50%,0.12)",
        color: "hsl(160,70%,60%)",
        border: "hsla(160,70%,50%,0.3)",
        dot: null,
    },
    improvement: {
        bg: "hsla(210,100%,56%,0.12)",
        color: "hsl(210,100%,70%)",
        border: "hsla(210,100%,56%,0.3)",
        dot: null,
    },
    other: {
        bg: "hsla(215,20%,65%,0.08)",
        color: "var(--text-muted)",
        border: "var(--glass-outline)",
        dot: null,
    },

    // ── Generic semantic ────────────────────────────────────────────────────────
    info: {
        bg: "hsla(210,100%,56%,0.1)",
        color: "hsl(210,100%,70%)",
        border: "hsla(210,100%,56%,0.25)",
        dot: "hsl(210,100%,65%)",
    },
    success: {
        bg: "hsla(160,70%,50%,0.12)",
        color: "hsl(160,70%,55%)",
        border: "hsla(160,70%,50%,0.3)",
        dot: "hsl(160,70%,50%)",
    },
    danger: {
        bg: "hsla(351,89%,60%,0.12)",
        color: "hsl(351,89%,65%)",
        border: "hsla(351,89%,60%,0.3)",
        dot: "hsl(351,89%,62%)",
    },
    muted: {
        bg: "transparent",
        color: "var(--text-muted)",
        border: "var(--glass-outline)",
        dot: null,
    },
};

// ─── Size tokens ──────────────────────────────────────────────────────────────
const SIZE_MAP = {
    xs: { fontSize: "10px", fontWeight: "700", padding: "2px 7px", dotSize: "5px" },
    sm: { fontSize: "11px", fontWeight: "700", padding: "2px 9px", dotSize: "6px" },
    md: { fontSize: "12px", fontWeight: "700", padding: "3px 11px", dotSize: "7px" },
};

// ─── Fallback (no variant match, no custom colours) ───────────────────────────
const FALLBACK = {
    bg: "hsla(215,20%,65%,0.08)",
    color: "var(--text-secondary, rgba(255,255,255,0.6))",
    border: "var(--glass-outline, rgba(255,255,255,0.12))",
    dot: null,
};

// ─── Component ────────────────────────────────────────────────────────────────
export function Chip({
    // Preset variant
    variant,
    // Custom colour override (takes precedence over variant)
    bg: bgProp,
    color: colorProp,
    border: borderProp,
    // Content
    label,
    children,
    // Dot indicator
    dot,        // boolean | undefined; undefined = auto (show if variant has a dot)
    dotColor,   // explicit dot colour (overrides variant's dot)
    dotGlow = false,
    // Interaction
    onClick,
    title,
    // Size
    size = "sm",
    // Passthrough
    className = "",
    style: styleProp,
    ...props
}) {
    const preset = variant ? (CHIP_VARIANTS[variant] ?? FALLBACK) : FALLBACK;

    const resolvedBg = bgProp ?? preset.bg;
    const resolvedColor = colorProp ?? preset.color;
    const resolvedBorder = borderProp ?? preset.border;

    // Dot visibility: explicit boolean overrides auto-detection
    const resolvedDotColor = dotColor ?? preset.dot;
    const showDot = dot === undefined
        ? !!resolvedDotColor
        : dot && !!resolvedDotColor;

    const sz = SIZE_MAP[size] ?? SIZE_MAP.sm;

    const isInteractive = typeof onClick === "function";

    return (
        <span
            title={title}
            onClick={onClick}
            role={isInteractive ? "button" : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onKeyDown={isInteractive ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(e); } : undefined}
            className={className}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: showDot ? "5px" : (React.Children.count(children) > 0 || label) ? "4px" : "0",
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
                transition: isInteractive ? "opacity 120ms ease, filter 120ms ease" : "none",
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
                        background: resolvedDotColor,
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

Chip.propTypes = {
    /** Named semantic variant — pulls colours from CHIP_VARIANTS */
    variant: PropTypes.string,
    /** Custom background colour (overrides variant) */
    bg: PropTypes.string,
    /** Custom text colour (overrides variant) */
    color: PropTypes.string,
    /** Custom border colour (overrides variant) */
    border: PropTypes.string,
    /** Plain-text label (renders before children) */
    label: PropTypes.string,
    /** Rich content: emoji + text, icons, etc. */
    children: PropTypes.node,
    /**
     * dot={true}  → always show dot (needs a dot colour from variant or dotColor)
     * dot={false} → always hide dot
     * omitted     → auto: show if variant/dotColor provides a colour
     */
    dot: PropTypes.bool,
    /** Explicit dot colour (overrides variant's dot colour) */
    dotColor: PropTypes.string,
    /** Apply a glow box-shadow on the dot (use for live / active states) */
    dotGlow: PropTypes.bool,
    /** Makes the chip interactive (pointer cursor + keyboard handler) */
    onClick: PropTypes.func,
    /** Tooltip text */
    title: PropTypes.string,
    /** "xs" | "sm" | "md" */
    size: PropTypes.oneOf(["xs", "sm", "md"]),
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Chip;
