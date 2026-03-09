import React from "react";
import PropTypes from "prop-types";

/**
 * Avatar — Liquid Glass Design System
 *
 * Image-first circular avatar with automatic initials fallback.
 * Accepts a plain `src`/`alt` API so it can be used in any context
 * (notifications, comments, cards, etc.) without requiring a full user object.
 *
 * @param {string} src       - Image URL (optional)
 * @param {string} alt       - Alt text (also used to derive initials)
 * @param {"xs"|"sm"|"md"|"lg"|"xl"} size
 * @param {string} className
 */
const SIZES = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 44,
  xl: 56,
};

const FONT_SIZES = {
  xs: 9,
  sm: 11,
  md: 13,
  lg: 15,
  xl: 18,
};

function getInitials(alt = "") {
  return alt
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export function Avatar({ src, alt = "", size = "md", className = "" }) {
  const dim = SIZES[size] ?? SIZES.md;
  const fs = FONT_SIZES[size] ?? FONT_SIZES.md;

  const baseStyle = {
    width: dim,
    height: dim,
    minWidth: dim,
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--glass-outline, rgba(128,128,128,0.25))",
    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
    fontSize: fs,
    fontWeight: 600,
    background: "var(--primary-resonance, #6366f1)",
    color: "#fff",
    userSelect: "none",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ ...baseStyle, objectFit: "cover" }}
        onError={(e) => {
          // Fallback to initials on image load error
          e.target.style.display = "none";
          e.target.parentNode?.setAttribute("data-fallback", "true");
        }}
      />
    );
  }

  return (
    <div className={className} style={baseStyle} aria-label={alt}>
      {getInitials(alt)}
    </div>
  );
}

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
  className: PropTypes.string,
};

export default Avatar;
