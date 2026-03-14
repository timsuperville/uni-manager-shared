import React from "react";
import { getUserInitials, getUserAvatar } from "../../utils";

/**
 * UserAvatar Component
 * Displays user avatar or initials with dynamic background color.
 *
 * Uses explicit inline styles for dimensions so the component is immune
 * to Tailwind CSS JIT scanning gaps (shared components scanned by multiple apps).
 */
const SIZES = {
  xs: { dimension: 24, fontSize: 10 },
  sm: { dimension: 28, fontSize: 11 },
  md: { dimension: 36, fontSize: 13 },
  lg: { dimension: 40, fontSize: 14 },
};

const UserAvatar = ({
  user,
  appConfig,
  size = "md",
  className = "",
  style: styleProp = {},
}) => {
  const initials = getUserInitials(user);
  const { dimension, fontSize } = SIZES[size] || SIZES.md;

  const baseStyle = {
    width: dimension,
    height: dimension,
    minWidth: dimension,
    borderRadius: "50%",
    fontSize,
    fontWeight: 600,
    objectFit: "cover",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(128,128,128,0.25)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
    ...styleProp,
  };

  const avatarSrc = getUserAvatar(user);

  if (avatarSrc) {
    return (
      <img
        src={avatarSrc}
        alt={`${user?.firstName ?? user?.name ?? "User"}'s avatar`}
        className={className}
        style={baseStyle}
      />
    );
  }

  // Fallback color if appConfig is missing
  const bgColor = appConfig?.branding?.primaryColor || "#4F46E5";

  return (
    <div
      style={{ ...baseStyle, backgroundColor: bgColor, color: "#fff" }}
      className={className}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
