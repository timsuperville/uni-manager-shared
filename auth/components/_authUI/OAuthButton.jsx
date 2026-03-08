import React from "react";
import PropTypes from "prop-types";

/**
 * OAuth Button — Social login button (Google, GitHub, Microsoft, etc.)
 *
 * Uses CSS custom properties for focus ring colour so each app's token
 * drives the interaction highlight automatically.
 */
export const OAuthButton = ({
  provider,
  onClick,
  disabled = false,
  children,
  icon,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full flex items-center justify-center gap-3 px-4 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium focus:outline-none disabled:opacity-50 transition-all duration-200 active:scale-[0.98] active:shadow-inner"
    style={{
      background: "hsla(0,0%,100%,0.06)",
      border: "1px solid var(--glass-outline, hsla(0,0%,100%,0.1))",
      color: "var(--text-primary, #f4f4f8)",
      boxShadow: "none",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "hsla(0,0%,100%,0.1)";
      e.currentTarget.style.borderColor =
        "var(--glass-outline-active, hsla(272,65%,62%,0.35))";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "hsla(0,0%,100%,0.06)";
      e.currentTarget.style.borderColor =
        "var(--glass-outline, hsla(0,0%,100%,0.1))";
    }}
    onFocus={(e) => {
      e.currentTarget.style.boxShadow =
        "0 0 0 3px var(--primary-glow, hsla(272,65%,62%,0.2))";
    }}
    onBlur={(e) => {
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    <span>{children || `Continue with ${provider}`}</span>
  </button>
);

OAuthButton.propTypes = {
  provider: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.node,
  icon: PropTypes.node,
};

export default OAuthButton;
