import React, { useState, memo } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";

/**
 * UserMenuItem — accessible ARIA menuitem button.
 * All colours driven by CSS custom properties so it adapts to any app's theme.
 * Hover state managed via React (Tailwind hover: utiliites can't read CSS vars).
 */
const UserMenuItem = memo(
  React.forwardRef(
    (
      { icon: Icon, label, onClick, variant = "default", active = false },
      ref,
    ) => {
      const [hovered, setHovered] = useState(false);
      const isDanger = variant === "danger";

      const bg = active
        ? "var(--primary-subtle, hsla(187,84%,44%,0.12))"
        : hovered && isDanger
          ? "var(--color-error-surface, hsla(0,75%,60%,0.1))"
          : hovered
            ? "var(--nav-hover, hsla(0,0%,100%,0.06))"
            : "transparent";

      const textColor = isDanger
        ? "var(--color-error, hsl(0,75%,60%))"
        : active
          ? "var(--text-accent, var(--primary-resonance))"
          : "var(--text-secondary)";

      const iconColor = isDanger
        ? "var(--color-error, hsl(0,75%,60%))"
        : active || hovered
          ? "var(--primary-resonance)"
          : "var(--text-muted)";

      return (
        <button
          ref={ref}
          onClick={onClick}
          role="menuitem"
          aria-current={active ? "page" : undefined}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 10px",
            borderRadius: "8px",
            background: bg,
            border: "none",
            color: textColor,
            fontSize: "13px",
            fontWeight: active ? "600" : "500",
            cursor: "pointer",
            transition: "all 150ms ease",
            textAlign: "left",
            position: "relative",
            outline: "none",
            fontFamily: "var(--font-body)",
          }}
        >
          {/* Active left accent bar */}
          {active && (
            <motion.span
              layoutId="active-user-menu-item"
              style={{
                position: "absolute",
                left: 0,
                top: "20%",
                height: "60%",
                width: "2px",
                borderRadius: "0 2px 2px 0",
                background: "var(--primary-resonance)",
                boxShadow:
                  "0 0 6px var(--primary-glow, var(--primary-resonance))",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
          <Icon
            size={15}
            style={{
              color: iconColor,
              flexShrink: 0,
              transition: "color 150ms ease",
            }}
          />
          {label}
        </button>
      );
    },
  ),
);

UserMenuItem.displayName = "UserMenuItem";

UserMenuItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(["default", "danger"]),
  active: PropTypes.bool,
};

export default UserMenuItem;
