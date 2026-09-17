import React, { useId } from 'react';

export type AppDomain =
  | 'platform'
  | 'church'
  | 'home'
  | 'personal'
  | 'work'
  | 'admin'
  | 'playback'
  | 'presentation'
  | 'audiolab';

export interface AppLogoProps extends React.SVGProps<SVGSVGElement> {
  app?: AppDomain;
  className?: string;
  withText?: boolean;
  variant?: 'rich' | 'flat' | 'squircle';
  size?: number | string;
}

/**
 * Uni-Manager Ecosystem Logo System: "Liquid Glass Resonance"
 *
 * Provides resolution-independent, vector-rendered brand marks for every app
 * in the Uni-Manager ecosystem.
 *
 * Variants:
 *  - 'rich': Multi-stop gradient fills, glass refraction bevels, and ambient glow.
 *  - 'squircle': Rich logo housed in an obsidian dark-glass squircle container.
 *  - 'flat': Clean single/dual-tone vector glyph that inherits currentColor.
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  app = 'platform',
  className = 'h-8 w-8',
  withText = false,
  variant = 'rich',
  size,
  style,
  ...props
}) => {
  const reactId = useId();
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, '') || app;

  const getAppTitle = () => {
    switch (app) {
      case 'church':
        return 'Ecclesia (Church)';
      case 'home':
        return 'Domestic Nucleus';
      case 'personal':
        return 'Personal Sanctuary';
      case 'work':
        return 'Executive Slate';
      case 'admin':
        return 'Platform Command';
      case 'playback':
        return 'Playback Pro';
      case 'presentation':
        return 'Presentation Pro';
      case 'audiolab':
        return 'Audio Lab';
      case 'platform':
      default:
        return 'Uni-Manager';
    }
  };

  // Gradient ID generators ensuring collision-free DOM rendering
  const gradA = `um-${app}-${safeId}-gA`;
  const gradB = `um-${app}-${safeId}-gB`;
  const gradGlow = `um-${app}-${safeId}-glow`;

  const renderGradients = () => {
    switch (app) {
      case 'admin':
        return (
          <>
            <linearGradient id={gradA} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284c7" /> {/* Sky 600 */}
              <stop offset="1" stopColor="#06b6d4" /> {/* Cyan 500 */}
            </linearGradient>
            <linearGradient id={gradB} x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" /> {/* Sky 400 */}
              <stop offset="1" stopColor="#0284c7" />
            </linearGradient>
            <radialGradient id={gradGlow} cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
          </>
        );
      case 'church':
        return (
          <>
            <linearGradient id={gradA} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7c3aed" /> {/* Violet 600 */}
              <stop offset="1" stopColor="#a855f7" /> {/* Purple 500 */}
            </linearGradient>
            <linearGradient id={gradB} x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f59e0b" /> {/* Amber 500 */}
              <stop offset="1" stopColor="#ec4899" /> {/* Pink 500 */}
            </linearGradient>
            <radialGradient id={gradGlow} cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8b5cf6" stopOpacity="0.35" />
              <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
          </>
        );
      case 'home':
        return (
          <>
            <linearGradient id={gradA} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f59e0b" /> {/* Amber 500 */}
              <stop offset="1" stopColor="#ea580c" /> {/* Orange 600 */}
            </linearGradient>
            <linearGradient id={gradB} x1="100" y1="100" x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fbbf24" />
              <stop offset="1" stopColor="#f97316" />
            </linearGradient>
            <radialGradient id={gradGlow} cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </>
        );
      case 'personal':
        return (
          <>
            <linearGradient id={gradA} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9333ea" /> {/* Purple 600 */}
              <stop offset="1" stopColor="#4f46e5" /> {/* Indigo 600 */}
            </linearGradient>
            <linearGradient id={gradB} x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#c084fc" />
              <stop offset="1" stopColor="#818cf8" />
            </linearGradient>
            <radialGradient id={gradGlow} cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9333ea" stopOpacity="0.35" />
              <stop offset="1" stopColor="#9333ea" stopOpacity="0" />
            </radialGradient>
          </>
        );
      case 'work':
        return (
          <>
            <linearGradient id={gradA} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10b981" /> {/* Emerald 500 */}
              <stop offset="1" stopColor="#059669" /> {/* Emerald 600 */}
            </linearGradient>
            <linearGradient id={gradB} x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34d399" />
              <stop offset="1" stopColor="#047857" />
            </linearGradient>
            <radialGradient id={gradGlow} cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="1" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </>
        );
      case 'playback':
        return (
          <>
            <linearGradient id={gradA} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284c7" /> {/* Sky 600 */}
              <stop offset="1" stopColor="#06b6d4" /> {/* Cyan 500 */}
            </linearGradient>
            <linearGradient id={gradB} x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0ea5e9" />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
            <radialGradient id={gradGlow} cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
          </>
        );
      case 'presentation':
        return (
          <>
            <linearGradient id={gradA} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" /> {/* Blue 500 */}
              <stop offset="1" stopColor="#8b5cf6" /> {/* Violet 500 */}
            </linearGradient>
            <linearGradient id={gradB} x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60a5fa" />
              <stop offset="1" stopColor="#a78bfa" />
            </linearGradient>
            <radialGradient id={gradGlow} cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </>
        );
      case 'audiolab':
        return (
          <>
            <linearGradient id={gradA} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#14b8a6" /> {/* Teal 500 */}
              <stop offset="1" stopColor="#6366f1" /> {/* Indigo 500 */}
            </linearGradient>
            <linearGradient id={gradB} x1="100" y1="100" x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2dd4bf" />
              <stop offset="1" stopColor="#4f46e5" />
            </linearGradient>
            <radialGradient id={gradGlow} cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#14b8a6" stopOpacity="0.35" />
              <stop offset="1" stopColor="#14b8a6" stopOpacity="0" />
            </radialGradient>
          </>
        );
      case 'platform':
      default:
        return (
          <>
            <linearGradient id={gradA} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8b5cf6" /> {/* Electric Violet */}
              <stop offset="0.5" stopColor="#a855f7" />
              <stop offset="1" stopColor="#d946ef" /> {/* Magenta Nova */}
            </linearGradient>
            <linearGradient id={gradB} x1="90" y1="10" x2="10" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#c084fc" />
              <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
            <radialGradient id={gradGlow} cx="50" cy="50" r="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
          </>
        );
    }
  };

  const renderMarkContent = () => {
    switch (app) {
      case 'admin':
        return (
          <>
            {/* Hexagonal Command Shield Body */}
            <polygon
              points="50,14 84,33 84,67 50,86 16,67 16,33"
              fill={`url(#${gradA})`}
              stroke={`url(#${gradB})`}
              strokeWidth="2.5"
            />
            {/* Inner Hex Bevel */}
            <polygon
              points="50,22 76,37 76,63 50,78 24,63 24,37"
              fill="#0d1117"
              fillOpacity="0.65"
              stroke="#ffffff"
              strokeOpacity="0.2"
              strokeWidth="1.2"
            />
            {/* LiveSync Orbital Ring */}
            <circle
              cx="50"
              cy="50"
              r="18"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="7 5"
            />
            {/* Central Quantum Node */}
            <circle cx="50" cy="50" r="7" fill="#ffffff" />
            <circle cx="50" cy="50" r="4" fill="#0284c7" />
          </>
        );

      case 'church':
        return (
          <>
            {/* Cathedral Spire Base */}
            <path
              d="M 50 12 L 80 34 L 80 84 A 4 4 0 0 1 76 88 L 24 88 A 4 4 0 0 1 20 84 L 20 34 Z"
              fill={`url(#${gradA})`}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />
            {/* Romanesque Arch Portal */}
            <path
              d="M 38 88 L 38 58 Q 50 46 62 58 L 62 88 Z"
              fill="#0d1117"
              fillOpacity="0.6"
              stroke={`url(#${gradB})`}
              strokeWidth="2"
            />
            {/* Sacred Cross of Light */}
            <path
              d="M 50 24 L 50 48 M 40 34 L 60 34"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="50" cy="34" r="3.5" fill="#f59e0b" />
          </>
        );

      case 'home':
        return (
          <>
            {/* Sheltering Haven Roof */}
            <path
              d="M 12 44 L 50 14 L 88 44 L 80 44 L 80 84 A 4 4 0 0 1 76 88 L 24 88 A 4 4 0 0 1 20 84 L 20 44 Z"
              fill={`url(#${gradA})`}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeOpacity="0.25"
            />
            {/* Inner Living Chamber */}
            <path
              d="M 30 50 L 50 34 L 70 50 L 70 82 L 30 82 Z"
              fill="#0d1117"
              fillOpacity="0.55"
            />
            {/* Radiant Hearth & Flame Nucleus */}
            <path
              d="M 42 88 L 42 66 Q 50 56 58 66 L 58 88 Z"
              fill={`url(#${gradB})`}
            />
            <circle cx="50" cy="58" r="4.5" fill="#ffffff" />
          </>
        );

      case 'personal':
        return (
          <>
            {/* Sovereign Vault Shield */}
            <path
              d="M 50 14 L 84 28 L 84 56 C 84 74 68 86 50 90 C 32 86 16 74 16 56 L 16 28 Z"
              fill={`url(#${gradA})`}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />
            {/* Inner Privacy Sanctuary */}
            <path
              d="M 50 24 L 74 35 L 74 54 C 74 68 62 77 50 80 C 38 77 26 68 26 54 L 26 35 Z"
              fill="#0d1117"
              fillOpacity="0.65"
              stroke={`url(#${gradB})`}
              strokeWidth="1.8"
            />
            {/* WebCrypto Sovereign Core Node */}
            <circle cx="50" cy="48" r="8" fill="#ffffff" />
            <circle cx="50" cy="48" r="4.5" fill="#7c3aed" />
          </>
        );

      case 'work':
        return (
          <>
            {/* Executive Slate Plate */}
            <rect
              x="20"
              y="22"
              width="60"
              height="66"
              rx="8"
              fill={`url(#${gradA})`}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeOpacity="0.25"
            />
            {/* Executive Slate Header Clip */}
            <rect x="36" y="14" width="28" height="12" rx="4" fill={`url(#${gradB})`} />
            {/* Momentum Bars */}
            <rect x="30" y="38" width="40" height="6" rx="3" fill="#ffffff" fillOpacity="0.9" />
            <rect x="30" y="50" width="28" height="6" rx="3" fill="#ffffff" fillOpacity="0.65" />
            <rect x="30" y="62" width="20" height="6" rx="3" fill="#ffffff" fillOpacity="0.45" />
            {/* Velocity Growth Indicator */}
            <path
              d="M 58 68 L 68 56 L 78 56"
              stroke="#34d399"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );

      case 'playback':
        return (
          <>
            {/* Curved Resonance Ribbon 'P' */}
            <path
              d="M 22 16 L 56 16 C 70 16 80 25 80 38 C 80 50 70 59 56 59 L 38 59 L 38 84 L 22 84 Z"
              fill={`url(#${gradA})`}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />
            {/* Internal Acoustic Cutout */}
            <path
              d="M 38 30 L 54 30 C 60 30 64 33 64 38 C 64 42 60 46 54 46 L 38 46 Z"
              fill="#0d1117"
              fillOpacity="0.8"
            />
            {/* Embedded Audio Play Engine */}
            <polygon
              points="48,64 68,76 48,88"
              fill={`url(#${gradB})`}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </>
        );

      case 'presentation':
        return (
          <>
            {/* Stage Obsidian Display Canvas */}
            <rect
              x="14"
              y="18"
              width="72"
              height="50"
              rx="6"
              fill={`url(#${gradA})`}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />
            {/* Screen Bezel Window */}
            <rect
              x="20"
              y="24"
              width="60"
              height="38"
              rx="3"
              fill="#0d1117"
              fillOpacity="0.75"
            />
            {/* Stage Luminary Projection Beam */}
            <polygon
              points="30,68 18,84 82,84 70,68"
              fill={`url(#${gradB})`}
              fillOpacity="0.8"
            />
            {/* Center Focus Beacon */}
            <circle cx="50" cy="43" r="7" fill="#ffffff" />
            <circle cx="50" cy="43" r="4" fill="#3b82f6" />
          </>
        );

      case 'audiolab':
        return (
          <>
            {/* Frequency Potentiometer Ring */}
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke={`url(#${gradA})`}
              strokeWidth="6"
              strokeDasharray="14 4"
            />
            {/* DSP Matrix Core Dial */}
            <circle cx="50" cy="50" r="22" fill={`url(#${gradB})`} />
            <circle cx="50" cy="50" r="14" fill="#0d1117" fillOpacity="0.7" />
            {/* Modulation Needle */}
            <line x1="50" y1="50" x2="68" y2="34" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="50" r="4" fill="#ffffff" />
          </>
        );

      case 'platform':
      default:
        return (
          <>
            {/* Left Glass Stem */}
            <path
              d="M 22 16 L 36 16 A 4 4 0 0 1 40 20 L 40 48 C 40 54 36 58 30 58 L 22 58 A 4 4 0 0 1 18 54 L 18 20 A 4 4 0 0 1 22 16 Z"
              fill={`url(#${gradA})`}
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            {/* Right Glass Stem */}
            <path
              d="M 64 16 L 78 16 A 4 4 0 0 1 82 20 L 82 54 A 4 4 0 0 1 78 58 L 70 58 C 64 58 60 54 60 48 L 60 20 A 4 4 0 0 1 64 16 Z"
              fill={`url(#${gradA})`}
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            {/* Segmented Liquid Glass U-Bend */}
            <path
              d="M 18 52 C 18 74 32 86 50 86 C 68 86 82 74 82 52 L 70 52 C 70 66 60 74 50 74 C 40 74 30 66 30 52 Z"
              fill={`url(#${gradB})`}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeOpacity="0.35"
            />
            {/* Inner Glass Refraction Highlights */}
            <path
              d="M 25 24 L 25 48"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.7"
            />
            <path
              d="M 75 24 L 75 48"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.7"
            />
            <path
              d="M 36 60 C 39 68 44 70 50 70 C 56 70 61 68 64 60"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.5"
            />
          </>
        );
    }
  };

  const isSquircle = variant === 'squircle';
  const customDimension = size ? { width: size, height: size } : {};

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${withText ? 'w-fit' : ''}`}
      style={{ verticalAlign: 'middle' }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
        style={{ ...customDimension, ...style }}
        aria-label={getAppTitle()}
        role="img"
        {...props}
      >
        <defs>
          {renderGradients()}

          {/* Squircle Glass Background */}
          {isSquircle && (
            <linearGradient id={`sq-bg-${safeId}`} x1="0" y1="0" x2="100" y2="100">
              <stop stopColor="#131722" />
              <stop offset="1" stopColor="#080b11" />
            </linearGradient>
          )}
        </defs>

        {/* Ambient Halo Glow */}
        <circle cx="50" cy="50" r="46" fill={`url(#${gradGlow})`} />

        {/* Squircle Frame if requested */}
        {isSquircle && (
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="24"
            fill={`url(#sq-bg-${safeId})`}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeOpacity="0.12"
          />
        )}

        {/* The Mark */}
        {renderMarkContent()}
      </svg>

      {withText && (
        <span
          className="font-bold text-lg tracking-tight whitespace-nowrap"
          style={{ color: 'var(--text-primary, currentColor)' }}
        >
          {getAppTitle()}
        </span>
      )}
    </div>
  );
};

export default AppLogo;
