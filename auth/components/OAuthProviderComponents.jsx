import React from "react";
import {
  FaGoogle,
  FaMicrosoft,
  FaLinkedin,
  FaGithub,
  FaSpotify,
  FaApple,
} from "react-icons/fa";

/**
 * Enhanced OAuth Provider Icons Component
 * Provides properly styled icons for all supported OAuth providers
 */
export const OAuthProviderIcon = ({ providerId, size = "1.25rem" }) => {
  const iconMap = {
    google: {
      Icon: FaGoogle,
      color: "#4285f4",
      bgColor: "#fff",
      borderColor: "#dadce0",
    },
    microsoft: {
      Icon: FaMicrosoft,
      color: "#00a4ef",
      bgColor: "#fff",
      borderColor: "#0078d4",
    },
    linkedin: {
      Icon: FaLinkedin,
      color: "#0077b5",
      bgColor: "#fff",
      borderColor: "#0077b5",
    },
    github: {
      Icon: FaGithub,
      color: "#333",
      bgColor: "#fff",
      borderColor: "#d0d7de",
    },
    spotify: {
      Icon: FaSpotify,
      color: "#1db954",
      bgColor: "#000",
      borderColor: "#1db954",
    },
    apple: {
      Icon: FaApple,
      color: "#000",
      bgColor: "#fff",
      borderColor: "#000",
    },
  };

  const config = iconMap[providerId];
  if (!config) return null;

  const { Icon, color } = config;

  return (
    <Icon
      style={{
        fontSize: size,
        color: color,
      }}
    />
  );
};

/**
 * OAuth Provider Button Component
 * Provides consistent styling for OAuth provider buttons
 */
export const OAuthProviderButton = ({
  providerId,
  providerName,
  onClick,
  disabled = false,
  loading = false,
  size = "default", // 'small', 'default', 'large'
}) => {
  const sizeClasses = {
    small: "px-3 py-2 text-sm",
    default: "px-4 py-3 text-base",
    large: "px-6 py-4 text-lg",
  };

  const iconSizes = {
    small: "1rem",
    default: "1.25rem",
    large: "1.5rem",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-3 w-full
        ${sizeClasses[size]}
        border border-gray-300 rounded-lg
        bg-white hover:bg-gray-50
        text-gray-700 font-medium
        transition-all duration-200
        focus:ring-2 focus:ring-blue-500 focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        active:transform active:scale-[0.98]
      `}
      type="button"
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
      ) : (
        <OAuthProviderIcon providerId={providerId} size={iconSizes[size]} />
      )}
      <span>{loading ? "Connecting..." : `Continue with ${providerName}`}</span>
    </button>
  );
};

export default { OAuthProviderIcon, OAuthProviderButton };
