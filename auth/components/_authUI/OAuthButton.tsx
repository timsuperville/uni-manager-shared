import React from 'react';

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
  icon
}: OAuthButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full flex items-center justify-center gap-3 px-4 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary-live-sync,hsl(272,65%,62%))] focus:border-transparent disabled:opacity-50 transition-all duration-200 active:scale-[0.98] active:shadow-inner bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white cursor-pointer disabled:cursor-not-allowed"
    style={{
      boxShadow: 'none'
    }}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    <span>{children ?? `Continue with ${provider}`}</span>
  </button>
);

export default OAuthButton;
