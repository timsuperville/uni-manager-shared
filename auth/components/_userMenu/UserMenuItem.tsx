import React, { useState, memo } from "react";
import { motion } from "framer-motion";

type MenuItemVariant = "default" | "danger";

/** Any renderable icon component (Lucide, custom, etc.) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = React.ComponentType<any>;

interface UserMenuItemProps {
  icon: IconComponent;
  label: string;
  onClick?: () => void;
  variant?: MenuItemVariant;
  active?: boolean;
  disabled?: boolean;
}

/**
 * UserMenuItem — accessible ARIA menuitem button.
 * All colours driven by CSS custom properties so it adapts to any app's theme.
 * Hover state managed via React (Tailwind hover: utilities can't read CSS vars).
 *
 * Props:
 *   disabled — when true, dims the button, uses not-allowed cursor, and
 *              prevents click events. Used e.g. during logout in-progress.
 *   loading  — synonym for disabled with slightly different semantics.
 *              Pass the spinner icon as `icon` when using this.
 */
const UserMenuItem = memo(
  React.forwardRef<HTMLButtonElement, UserMenuItemProps>(
    ({ icon: Icon, label, onClick, variant = "default", active = false, disabled = false }, ref) => {
      const [hovered, setHovered] = useState(false);
      const isDanger = variant === "danger";

      const bg = active
        ? "var(--primary-subtle, hsla(187,84%,44%,0.12))"
        : hovered && isDanger && !disabled
          ? "var(--color-error-surface, hsla(0,75%,60%,0.1))"
          : hovered && !disabled
            ? "var(--nav-hover, hsla(0,0%,100%,0.06))"
            : "transparent";

      const textColor = isDanger
        ? "var(--color-error, hsl(0,75%,60%))"
        : active
          ? "var(--text-accent, var(--primary-resonance))"
          : "var(--text-secondary)";

      const iconColor = isDanger
        ? "var(--color-error, hsl(0,75%,60%))"
        : active || (hovered && !disabled)
          ? "var(--primary-resonance)"
          : "var(--text-muted)";

      return (
        <button
          ref={ref}
          onClick={disabled ? undefined : onClick}
          role="menuitem"
          aria-current={active ? "page" : undefined}
          aria-disabled={disabled || undefined}
          disabled={disabled}
          onMouseEnter={() => !disabled && setHovered(true)}
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
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
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
                boxShadow: "0 0 6px var(--primary-glow, var(--primary-resonance))",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
          <Icon size={15} style={{ color: iconColor, flexShrink: 0, transition: "color 150ms ease" }} />
          {label}
        </button>
      );
    },
  ),
);

UserMenuItem.displayName = "UserMenuItem";

export default UserMenuItem;
