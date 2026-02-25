import React from "react";
import PropTypes from "prop-types";
import { ChevronDown, WifiOff } from "lucide-react";

import { UserAvatar } from "../../../components/ui";
import { getUserDisplayName } from "../../../utils";

/**
 * UserMenuTrigger — the pill button that opens/closes the UserMenu dropdown.
 * Purely presentational — all state and handlers come from UserMenu.
 */
function UserMenuTrigger({
  buttonRef,
  triggerId,
  panelId,
  isOpen,
  user,
  appConfig,
  roleLabel,
  hasPresence,
  isConnected,
  status,
  statusDotColor,
  onToggle,
  onMouseEnter,
  onMouseLeave,
  triggerBorder,
  triggerBg,
}) {
  return (
    <button
      ref={buttonRef}
      id={triggerId}
      onClick={onToggle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-label="User menu"
      aria-controls={isOpen ? panelId : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "4px 10px 4px 4px",
        borderRadius: "100px",
        border: `1px solid ${triggerBorder}`,
        background: triggerBg,
        cursor: "pointer",
        transition: "all 200ms ease",
        outline: "none",
      }}
    >
      {/* Avatar + presence dot */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <UserAvatar user={user} appConfig={appConfig} size="xs" />
        {hasPresence && (
          <span
            style={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: isConnected
                ? statusDotColor
                : "var(--color-warning, hsl(38,95%,54%))",
              border:
                "2px solid var(--bg-sidebar, var(--bg-obsidian, #0a0e1a))",
              transition: "background 300ms ease",
            }}
            title={
              !isConnected
                ? "Offline"
                : status === "available"
                  ? "Available"
                  : "Unavailable"
            }
            aria-hidden="true"
          />
        )}
      </div>

      {/* Name + role subtitle — hidden on mobile */}
      <div className="hidden md:block" style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--text-secondary)",
            maxWidth: "110px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.2,
          }}
        >
          {getUserDisplayName(user)}
        </p>
        {roleLabel && (
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              color: "var(--text-muted)",
              maxWidth: "110px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.2,
              textTransform: "capitalize",
            }}
          >
            {roleLabel}
          </p>
        )}
      </div>

      {/* Offline badge */}
      {hasPresence && !isConnected && (
        <WifiOff
          size={12}
          style={{
            color: "var(--color-warning, hsl(38,95%,54%))",
            flexShrink: 0,
          }}
          aria-label="Offline"
        />
      )}

      {/* Chevron */}
      <ChevronDown
        size={12}
        style={{
          color: "var(--text-ghost, var(--text-muted))",
          transform: isOpen ? "rotate(180deg)" : "none",
          transition: "transform 200ms ease",
          flexShrink: 0,
        }}
      />
    </button>
  );
}

UserMenuTrigger.propTypes = {
  buttonRef: PropTypes.object.isRequired,
  triggerId: PropTypes.string.isRequired,
  panelId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  user: PropTypes.object.isRequired,
  appConfig: PropTypes.object.isRequired,
  roleLabel: PropTypes.string,
  hasPresence: PropTypes.bool.isRequired,
  isConnected: PropTypes.bool.isRequired,
  status: PropTypes.string.isRequired,
  statusDotColor: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
  triggerBorder: PropTypes.string.isRequired,
  triggerBg: PropTypes.string.isRequired,
};

export default UserMenuTrigger;
