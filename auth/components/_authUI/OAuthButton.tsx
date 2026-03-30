import React from "react";

interface OAuthButtonProps {
  provider: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

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
}: OAuthButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full flex items-center justify-center gap-3 px-4 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium focus:outline-none disabled:opacity-50 transition-all duration-200 active:scale-[0.98] active:shadow-inner bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white"
    style={{
      boxShadow: "none",
    }}
    onFocus={(e) => {
      e.currentTarget.style.boxShadow =
        "0 0 0 3px var(--primary-glow, hsla(272,65%,62%,0.2))";
      e.currentTarget.style.borderColor =
        "var(--glass-outline-active, hsla(272,65%,62%,0.35))";
    }}
    onBlur={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = "";
    }}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    <span>{children ?? `Continue with ${provider}`}</span>
  </button>
);

export default OAuthButton;
