import React, { memo } from "react";
import PropTypes from "prop-types";
import { WifiOff } from "lucide-react";

/**
 * PresenceToggle — inline status pill shown inside the UserMenu identity header.
 * Only rendered when a PresenceProvider is present in the React tree.
 *
 * Props:
 *   status      — "available" | "unavailable"
 *   isConnected — false when WebSocket/presence connection is lost
 *   onToggle    — callback to flip the status
 *   dotColor    — CSS color string for the status indicator dot
 */
const PresenceToggle = memo(function PresenceToggle({
  status,
  isConnected,
  onToggle,
  dotColor,
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        marginTop: "7px",
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "2px 8px",
        borderRadius: "100px",
        background: "var(--bg-surface-1, hsla(0,0%,100%,0.04))",
        border: "1px solid var(--glass-outline)",
        cursor: isConnected ? "pointer" : "default",
        fontSize: "11px",
        fontWeight: "500",
        color: "var(--text-secondary)",
        transition: "all 150ms ease",
      }}
    >
      {isConnected ? (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: dotColor,
            flexShrink: 0,
          }}
        />
      ) : (
        <WifiOff
          size={10}
          style={{ color: "var(--color-warning, hsl(38,95%,54%))" }}
        />
      )}
      {!isConnected
        ? "Offline"
        : status === "available"
          ? "Available"
          : "Unavailable"}
    </button>
  );
});

PresenceToggle.propTypes = {
  status: PropTypes.string.isRequired,
  isConnected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  dotColor: PropTypes.string.isRequired,
};

export default PresenceToggle;
