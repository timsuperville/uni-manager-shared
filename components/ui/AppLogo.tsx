import React from 'react';

export type AppDomain =
  | 'platform'
  | 'church'
  | 'home'
  | 'personal'
  | 'work'
  | 'admin'
  | 'playback'
  | 'presentation';

interface AppLogoProps extends React.SVGProps<SVGSVGElement> {
  app?: AppDomain;
  className?: string;
  withText?: boolean;
}

/**
 * Modern UI SVG Logos for the Uni-Manager Ecosystem.
 * Each app has its own autonomous shape, but shares the same rendering DNA.
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  app = 'platform',
  className = 'h-8 w-8',
  withText = false,
  ...props
}) => {
  const getAppTitle = () => {
    switch (app) {
      case 'church':
        return 'Church Suite';
      case 'home':
        return 'Domestic Nucleus';
      case 'personal':
        return 'Private Space';
      case 'work':
        return 'Executive Slate';
      case 'admin':
        return 'Command Hub';
      case 'playback':
        return 'Playback Pro';
      case 'presentation':
        return 'Presentation Pro';
      case 'platform':
      default:
        return 'Uni-Manager';
    }
  };

  const renderLogoContent = () => {
    switch (app) {
      case 'church':
        return (
          <>
            <path
              d="M 50 10 L 20 40 L 20 90 L 80 90 L 80 40 Z"
              fill="url(#logo-grad-top)"
            />
            <path
              d="M 50 25 L 35 45 L 35 90 L 65 90 L 65 45 Z"
              fill="url(#logo-grad-bottom)"
            />
            {/* Abstract Cross/Arch */}
            <rect
              x="46"
              y="45"
              width="8"
              height="35"
              fill="#ffffff"
              fillOpacity="0.8"
              rx="2"
            />
            <rect
              x="38"
              y="55"
              width="24"
              height="8"
              fill="#ffffff"
              fillOpacity="0.8"
              rx="2"
            />
          </>
        );
      case 'home':
        return (
          <>
            <path d="M 50 15 L 15 45 L 85 45 Z" fill="url(#logo-grad-top)" />
            <path
              d="M 25 45 L 25 85 L 75 85 L 75 45 Z"
              fill="url(#logo-grad-bottom)"
            />
            {/* Abstract Hearth */}
            <path
              d="M 40 85 L 40 65 Q 50 55 60 65 L 60 85 Z"
              fill="#ffffff"
              fillOpacity="0.8"
            />
            <circle
              cx="50"
              cy="70"
              r="4"
              fill="currentColor"
              fillOpacity="0.6"
            />
          </>
        );
      case 'personal':
        return (
          <>
            <path
              d="M 50 15 C 30 15, 20 25, 20 40 C 20 65, 50 85, 50 85 C 50 85, 80 65, 80 40 C 80 25, 70 15, 50 15 Z"
              fill="url(#logo-grad-top)"
            />
            {/* Inner SecureVault / Shield */}
            <path
              d="M 50 30 C 38 30, 32 36, 32 45 C 32 60, 50 72, 50 72 C 50 72, 68 60, 68 45 C 68 36, 62 30, 50 30 Z"
              fill="url(#logo-grad-bottom)"
            />
            <circle cx="50" cy="45" r="7" fill="#ffffff" fillOpacity="0.8" />
          </>
        );
      case 'work':
        return (
          <>
            <rect
              x="25"
              y="35"
              width="50"
              height="45"
              rx="4"
              fill="url(#logo-grad-top)"
            />
            <path
              d="M 35 35 L 35 25 C 35 20, 65 20, 65 25 L 65 35"
              fill="none"
              stroke="url(#logo-grad-bottom)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Abstract Slate lines */}
            <rect
              x="35"
              y="45"
              width="30"
              height="4"
              fill="#ffffff"
              fillOpacity="0.6"
              rx="2"
            />
            <rect
              x="35"
              y="55"
              width="20"
              height="4"
              fill="#ffffff"
              fillOpacity="0.6"
              rx="2"
            />
            <rect
              x="35"
              y="65"
              width="25"
              height="4"
              fill="#ffffff"
              fillOpacity="0.6"
              rx="2"
            />
          </>
        );
      case 'admin':
        return (
          <>
            <polygon
              points="50,15 85,30 85,70 50,85 15,70 15,30"
              fill="url(#logo-grad-top)"
            />
            <polygon
              points="50,28 72,38 72,62 50,72 28,62 28,38"
              fill="url(#logo-grad-bottom)"
            />
            {/* All-seeing Eye / Core Node */}
            <circle cx="50" cy="50" r="8" fill="#ffffff" fillOpacity="0.95" />
            <circle
              cx="50"
              cy="50"
              r="14"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.5"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          </>
        );
      case 'playback':
        return (
          <>
            <rect
              x="15"
              y="20"
              width="70"
              height="60"
              rx="8"
              fill="url(#logo-grad-top)"
            />
            <circle cx="50" cy="50" r="22" fill="url(#logo-grad-bottom)" />
            {/* Play/Wave */}
            <polygon
              points="45,40 60,50 45,60"
              fill="#ffffff"
              fillOpacity="0.9"
            />
            <rect
              x="25"
              y="40"
              width="4"
              height="20"
              fill="#ffffff"
              fillOpacity="0.4"
              rx="2"
            />
            <rect
              x="33"
              y="30"
              width="4"
              height="40"
              fill="#ffffff"
              fillOpacity="0.6"
              rx="2"
            />
            <rect
              x="71"
              y="40"
              width="4"
              height="20"
              fill="#ffffff"
              fillOpacity="0.4"
              rx="2"
            />
          </>
        );
      case 'presentation':
        return (
          <>
            <rect
              x="15"
              y="25"
              width="70"
              height="45"
              rx="4"
              fill="url(#logo-grad-top)"
            />
            <polygon
              points="25,85 75,85 60,70 40,70"
              fill="url(#logo-grad-bottom)"
            />
            {/* Screen Content */}
            <rect
              x="25"
              y="35"
              width="50"
              height="25"
              rx="2"
              fill="#ffffff"
              fillOpacity="0.2"
            />
            <circle cx="50" cy="47" r="6" fill="#ffffff" fillOpacity="0.9" />
          </>
        );
      case 'platform':
      default:
        return (
          <>
            <defs>
              <linearGradient
                id="platform-grad-top"
                x1="0"
                y1="0"
                x2="100"
                y2="100"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#8b5cf6" stopOpacity="0.9" />{' '}
                {/* violet-500 */}
                <stop offset="1" stopColor="#f43f5e" stopOpacity="0.9" />{' '}
                {/* rose-500 */}
              </linearGradient>
              <linearGradient
                id="platform-grad-bottom"
                x1="100"
                y1="100"
                x2="0"
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#f59e0b" stopOpacity="0.8" /> {/* amber-500 */}
                <stop offset="1" stopColor="#f43f5e" stopOpacity="0.8" />{' '}
                {/* rose-500 */}
              </linearGradient>
            </defs>
            {/* Top Sweeping Arc */}
            <path
              d="M 50 15 C 70 15, 85 25, 85 50 C 85 62, 80 72, 70 80 L 50 50 Z"
              fill="url(#platform-grad-top)"
            />
            {/* Bottom Sweeping Arc */}
            <path
              d="M 50 85 C 30 85, 15 75, 15 50 C 15 38, 20 28, 30 20 L 50 50 Z"
              fill="url(#platform-grad-bottom)"
            />
            {/* Inner Core Shield / Diamond */}
            <polygon
              points="50,32 68,50 50,68 32,50"
              fill="#ffffff"
              fillOpacity="0.8"
            />
            {/* Orbiting Nodes */}
            <circle
              cx="72"
              cy="28"
              r="5"
              fill="#f59e0b"
              fillOpacity="0.9"
            />{' '}
            {/* amber */}
            <circle
              cx="28"
              cy="72"
              r="5"
              fill="#8b5cf6"
              fillOpacity="0.9"
            />{' '}
            {/* violet */}
            {/* Center Singular Node */}
            <circle cx="50" cy="50" r="4" fill="#ffffff" />
            <circle
              cx="50"
              cy="50"
              r="9"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2"
              strokeOpacity="0.8"
            />
          </>
        );
    }
  };

  return (
    <div className={`flex items-center gap-3 ${withText ? 'w-fit' : ''}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
        style={{ color: 'var(--primary, currentColor)' }}
        {...props}
      >
        <defs>
          <linearGradient
            id="logo-grad-top"
            x1="50"
            y1="0"
            x2="50"
            y2="50"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient
            id="logo-grad-bottom"
            x1="50"
            y1="100"
            x2="50"
            y2="50"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient
            id="logo-glow"
            cx="50"
            cy="50"
            r="50"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Global ambient glow */}
        <circle cx="50" cy="50" r="48" fill="url(#logo-glow)" />

        {renderLogoContent()}
      </svg>

      {withText && (
        <span
          className="font-semibold text-lg tracking-tight whitespace-nowrap"
          style={{ color: 'var(--foreground, currentColor)' }}
        >
          {getAppTitle()}
        </span>
      )}
    </div>
  );
};

export default AppLogo;
