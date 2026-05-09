import React from "react";

/**
 * Enhanced OAuth Provider Icons Component
 * Provides properly styled icons for all supported OAuth providers.
 *
 * AUTH-09: Replaced react-icons/fa imports with inline SVGs.
 * react-icons is not a dependency of the shared package and throws at runtime.
 */

interface ProviderIconProps {
  size: number;
}

// Inline SVG brand icons — matches react-icons visual output
const PROVIDER_ICONS: Record<
  string,
  (props: ProviderIconProps) => React.ReactElement
> = {
  google: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  ),
  microsoft: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#00a4ef" d="M13 1h10v10H13z" />
      <path fill="#7fba00" d="M1 13h10v10H1z" />
      <path fill="#ffb900" d="M13 13h10v10H13z" />
    </svg>
  ),
  linkedin: ({ size }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#0077b5"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  github: ({ size }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#333"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
  spotify: ({ size }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#1DB954"
      aria-hidden="true"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  ),
  apple: ({ size }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#000"
      aria-hidden="true"
    >
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  ),
};

interface OAuthProviderIconProps {
  providerId: string;
  size?: string | number;
}

export const OAuthProviderIcon = ({
  providerId,
  size = "1.25rem",
}: OAuthProviderIconProps) => {
  const IconComponent = PROVIDER_ICONS[providerId];
  if (!IconComponent) return null;

  // Convert rem string to px number for SVG width/height
  const px =
    typeof size === "string" && size.endsWith("rem")
      ? parseFloat(size) * 16
      : Number(size);

  return <IconComponent size={px} />;
};

type ButtonSize = "small" | "default" | "large";

interface OAuthProviderButtonProps {
  providerId: string;
  providerName: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  size?: ButtonSize;
}

/**
 * OAuth Provider Button Component
 * Provides consistent styling for OAuth provider buttons.
 */
export const OAuthProviderButton = ({
  providerId,
  providerName,
  onClick,
  disabled = false,
  loading = false,
  size = "default",
}: OAuthProviderButtonProps) => {
  const sizeClasses: Record<ButtonSize, string> = {
    small: "px-3 py-2 text-sm",
    default: "px-4 py-3 text-base",
    large: "px-6 py-4 text-lg",
  };

  const iconSizes: Record<ButtonSize, string> = {
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
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary-resonance,hsl(272,65%,62%))] focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        active:transform active:scale-[0.98]
      `}
      type="button"
      aria-busy={loading}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600" />
      ) : (
        <OAuthProviderIcon providerId={providerId} size={iconSizes[size]} />
      )}
      <span>{loading ? "Connecting..." : `Continue with ${providerName}`}</span>
    </button>
  );
};

export default { OAuthProviderIcon, OAuthProviderButton };
