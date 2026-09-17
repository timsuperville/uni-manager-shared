/**
 * @shared/components/icons
 *
 * Canonical icon library for the Uni-Manager ecosystem.
 * All icons accept a `size` prop (default 16) and inherit
 * color via `currentColor` — no hardcoded colours.
 *
 * Usage:
 *   import { SearchIcon, ShieldIcon } from "@shared/components/icons";
 *   <SearchIcon size={20} />
 */

import React, { type SVGProps, type CSSProperties } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  sw?: number;
  style?: CSSProperties;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const svg = (children: React.ReactNode, defaultSw = 2): React.FC<IconProps> =>
  function Icon({ size = 16, sw = defaultSw, style, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
        aria-hidden="true"
        {...rest}
      >
        {children}
      </svg>
    );
  };

// ── Navigation / Layout ────────────────────────────────────────────────────────

export const ChevronDownIcon = svg(<path d="M6 9l6 6 6-6" />);
export const ChevronUpIcon = svg(<path d="M6 15l6-6 6 6" />);
export const ChevronRightIcon = svg(<path d="M9 5l7 7-7 7" />);
export const XIcon = svg(<path d="M6 18L18 6M6 6l12 12" />);
export const PlusIcon = svg(<path d="M12 4v16m8-8H4" />);

// ── Data / Files ───────────────────────────────────────────────────────────────

export const SearchIcon = svg(
  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
);

export const DownloadIcon = svg(
  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
);

export const ExportIcon = svg(
  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
);

export const RefreshIcon = svg(
  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
);

export const UploadIcon = svg(
  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
);

// ── Status / Feedback ──────────────────────────────────────────────────────────

export const AlertIcon = svg(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </>,
  1.5
);

export const AlertCircleIcon = svg(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4m0 4h.01" />
  </>,
  1.5
);

export const CheckIcon = svg(<path d="M20 6L9 17l-5-5" />);

export const BanIcon = svg(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </>,
  1.5
);

export const TrendUpIcon = svg(<path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />);
export const TrendDownIcon = svg(<path d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />);

// ── Users / Auth ───────────────────────────────────────────────────────────────

export const UsersIcon = svg(
  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  1.5
);

export const UserIcon = svg(
  <>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>,
  1.5
);

export const ShieldIcon = svg(
  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  1.5
);

/** Shield without check — used for "restricted access" branding */
export const ShieldSolidIcon = svg(
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  1.5
);

/** Shield with tick — MFA enabled / protected state */
export const ShieldCheckIcon = svg(
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </>,
  2
);

/** Shield with diagonal slash — MFA disabled / unprotected state */
export const ShieldOffIcon = svg(
  <>
    <path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18" />
    <path d="M4.73 4.73 4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </>,
  2
);

/** QR / scan frame icon */
export const ScanIcon = svg(
  <>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </>,
  2
);

/** Copy to clipboard */
export const CopyIcon = svg(
  <>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>,
  2
);

export const LockIcon = svg(
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>,
  1.5
);

export const EyeIcon = svg(
  <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </>,
  1.5
);

export const EyeOffIcon = svg(
  <>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </>,
  1.5
);

export const KeyIcon = svg(
  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />,
  1.5
);

export const SmartphoneIcon = svg(
  <>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </>,
  1.5
);

// ── System / Engineering ───────────────────────────────────────────────────────

export const ServerIcon = svg(
  <path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />,
  1.5
);

export const BarChartIcon = svg(
  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  1.5
);

// ── Domains & Ecosystem ────────────────────────────────────────────────────────

// Church
export const ChurchIcon = svg(
  <path d="M18 7v4h-6v4M6 7v4h6M12 2v20M3 21h18" />,
  1.5
);

export const ChurchAppLogo = svg(
  <>
    <path d="M10 9h4" />
    <path d="M12 7v5" />
    <path d="M8 22V10.51a2 2 0 0 1 .53-1.36L12 6l3.47 3.15a2 2 0 0 1 .53 1.36V22" />
    <path d="M4 22V13.51a2 2 0 0 1 .53-1.36L8 9" />
    <path d="M20 22V13.51a2 2 0 0 0-.53-1.36L16 9" />
    <path d="M3 22h18" />
    <path d="M10 16a2 2 0 0 1 4 0v6h-4v-6Z" />
  </>,
  1.5
);

export const BellIcon = svg(
  <>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </>,
  1.5
);

export const MusicIcon = svg(
  <>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </>,
  1.5
);

export const CoinsIcon = svg(
  <>
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="m16.71 13.88.7.71-2.82 2.82" />
  </>,
  1.5
);

export const MegaphoneIcon = svg(
  <>
    <path d="m3 11 18-5v12L3 14v-3z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </>,
  1.5
);

export const BookIcon = svg(
  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />,
  1.5
);

export const FlameIcon = svg(
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
  1.5
);

export const WineIcon = svg(
  <>
    <path d="M8 22h8" />
    <path d="M7 10h10" />
    <path d="M12 15v7" />
    <path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z" />
  </>,
  1.5
);

export const SmileIcon = svg(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </>,
  1.5
);

export const SendIcon = svg(
  <>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </>,
  1.5
);

export const LogOutIcon = svg(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </>,
  1.5
);

export const AnointingIcon = svg(
  <>
    {/* The main outline of the downward-facing giving hand */}
    <path d="M2 10h5c1 0 3-2 5-2h4c2 0 4 1 5 3a2 2 0 0 1-2 4c-2 0-3-2-4-3l-3-2" />
    {/* Thumb curving under */}
    <path d="M12 13c-1 2-3 3-5 2" />

    {/* Additional overlapping fingers for 3D perspective */}
    <path d="M19.5 10a2 2 0 0 1-2 4" />
    <path d="M18 9a2 2 0 0 1-2 4" />

    {/* Anointing droplets/sparks falling from the palm */}
    <path d="M15 16v2" />
    <path d="M15 21v1" />
    <path d="M13 20l.5.5" />
    <path d="M17 20l-.5.5" />
  </>,
  1.5
);

export const StarIcon = svg(
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  1.5
);

export const LayersIcon = svg(
  <>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 12 12 17 22 12" />
    <polyline points="2 17 12 22 22 17" />
  </>,
  1.5
);

// Home
export const HomeIcon = svg(
  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  1.5
);
export const ShoppingCartIcon = svg(
  <>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </>,
  1.5
);

// Personal
export const BrainIcon = svg(
  <>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <path d="M17.599 6.5A3 3 0 0 0 13.6 4.6" />
    <path d="M6.401 6.5A3 3 0 0 1 10.4 4.6" />
    <path d="M6.082 16H4a2 2 0 0 1-2-2v-1" />
    <path d="M17.918 16H20a2 2 0 0 0 2-2v-1" />
    <path d="M12 20v2" />
    <path d="M12 18v-2" />
  </>,
  1.5
);
export const TargetIcon = svg(
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </>,
  1.5
);
export const DiamondIcon = svg(<path d="M6 3h12l4 6-10 13L2 9z" />, 1.5);

// Business
export const PackageIcon = svg(
  <>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </>,
  1.5
);
export const BriefcaseIcon = svg(
  <>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </>,
  1.5
);

// Playback
export const MicIcon = svg(
  <>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </>,
  1.5
);
export const KeyboardIcon = svg(
  <>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M10 14h.01M14 14h.01M18 14h.01M10 18h4" />
  </>,
  1.5
);
export const SpeakerIcon = svg(
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </>,
  1.5
);

// Default
export const GlobeIcon = svg(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </>,
  1.5
);
export const LightningIcon = svg(
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  1.5
);

// ── App Logos (Source of Truth for the Uni-Manager Ecosystem) ───────────────────

/** Uni-Manager Master Brand: Segmented Liquid Glass 'U' Mark */
export const UniManagerLogo = svg(
  <>
    <path
      d="M5.5 3.5h3c.55 0 1 .45 1 1v6.5a2.5 2.5 0 0 1-2.5 2.5H5.5c-.55 0-1-.45-1-1v-8c0-.55.45-1 1-1z"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M15.5 3.5h3c.55 0 1 .45 1 1v8a2.5 2.5 0 0 1-2.5 2.5h-1.5c-.55 0-1-.45-1-1v-6.5c0-.55.45-1 1-1z"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M4.5 13.5c0 4.14 3.36 7.5 7.5 7.5s7.5-3.36 7.5-7.5"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M8.5 13.5c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </>,
  1.8
);

/** Admin Portal: Quantum Command Nexus Hexagon Shield with LiveSync Node */
export const AdminAppLogo = svg(
  <>
    <path
      d="M12 2.2L20.5 7.1V16.9L12 21.8L3.5 16.9V7.1L12 2.2Z"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="5" strokeWidth="1.6" strokeDasharray="3 3" />
    <circle cx="12" cy="12" r="2.2" fill="currentColor" />
  </>,
  2
);

/** Domestic Nucleus: Hearth Haven & Interlocking Shelter Roof */
export const HomeAppLogo = svg(
  <>
    <path
      d="M2.5 10.5L12 3l9.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5v-9Z"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M9 21v-5a3 3 0 0 1 6 0v5" strokeWidth="1.8" />
    <circle cx="12" cy="11.5" r="2" fill="currentColor" />
  </>,
  1.8
);

/** Personal Sanctuary: Sovereign WebCrypto Vault Shield & Inner Light Spark */
export const PersonalAppLogo = svg(
  <>
    <path
      d="M12 2.5L3.5 7.2v6.5c0 5.2 3.6 9.8 8.5 11 4.9-1.2 8.5-5.8 8.5-11V7.2L12 2.5Z"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3.5" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </>,
  1.8
);

/** Executive Slate: Corporate Velocity Grid with Growth Momentum */
export const WorkAppLogo = svg(
  <>
    <rect x="3" y="4" width="18" height="16" rx="3" strokeWidth="1.8" />
    <path d="M7 9h10M7 13h6m-6 4h4" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M17 12l2 2 3-4"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </>,
  1.8
);

/** Playback Pro: Sonic Cyan Resonance Ribbon 'P' with Audio Play Engine */
export const PlaybackAppLogo = svg(
  <>
    <path
      d="M6 3.5h7a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H10v6H6v-17Z"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <polygon points="10,6.5 15,9 10,11.5" fill="currentColor" />
  </>,
  1.8
);

/** Presentation Pro: Stage Obsidian Display Canvas with Luminary Projection Beam */
export const PresentationAppLogo = svg(
  <>
    <rect x="3" y="4" width="18" height="12" rx="2" strokeWidth="1.8" />
    <path
      d="M7 16l-3 4.5h16L17 16"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="2.5" fill="currentColor" />
  </>,
  1.8
);

/** Audio Lab: Modular Sound Workbench, Frequency Wave & Potentiometer */
export const AudioLabAppLogo = svg(
  <>
    <circle cx="12" cy="12" r="9" strokeWidth="1.8" strokeDasharray="4 2" />
    <circle cx="12" cy="12" r="4.5" strokeWidth="1.8" />
    <line
      x1="12"
      y1="12"
      x2="16"
      y2="8"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </>,
  1.8
);

// ── Auto-Migrated App Imports ────────────────────────────────
export {
  // Hub icons
  Home,
  // Item icons
  LayoutDashboard,
  Activity,
  AlertCircle,
  AlertTriangle,
  AlignLeft,
  Archive,
  ArchiveIcon,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  ArrowUpCircle,
  ArrowUpDown,
  ArrowUpRight,
  Award,
  Baby,
  BadgeCheck,
  BarChart2,
  BarChart3,
  Bell,
  BellOff,
  BookMarked,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  BrainCircuit,
  Briefcase,
  Brush,
  Building2,
  Calendar,
  Calendar as CalendarIcon,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  Camera,
  Car,
  Check,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  ChevronsUpDown,
  Church,
  Circle,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Coffee,
  Columns,
  Compass,
  Copy,
  CreditCard,
  Crown,
  Database,
  DatabaseZap,
  Delete,
  Dna,
  DollarSign,
  DoorOpen,
  Download,
  DownloadCloud,
  Droplets,
  Drum,
  Edit,
  Edit2,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FileAudio,
  FileEdit,
  FileJson,
  FileText,
  FileUp,
  Film,
  Filter,
  Flag,
  Flame,
  FolderLock,
  Gavel,
  Gift,
  GitBranch,
  GitMerge,
  Globe,
  GraduationCap,
  Grid3X3,
  GripVertical,
  Guitar,
  HandHeart,
  Handshake,
  HardDrive,
  Hash,
  Headphones,
  Heart,
  HeartHandshake,
  HeartPulse,
  Highlighter,
  History,
  Hourglass,
  Image,
  Image as ImageIcon,
  Inbox,
  Info,
  Key,
  KeyRound,
  Laptop,
  Layers,
  Layout,
  LayoutGrid,
  LayoutList,
  LayoutTemplate,
  Leaf,
  Library,
  Lightbulb,
  Link,
  Link as LinkIcon,
  Link2,
  List,
  ListMusic,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Map,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Mic,
  Mic2,
  MicOff,
  Minimize2,
  Minus,
  Monitor,
  MonitorPlay,
  MonitorSmartphone,
  MonitorSpeaker,
  Moon,
  MoreVertical,
  Music,
  Music2,
  Navigation,
  Network,
  Package,
  Palette,
  Pause,
  PenLine,
  PenTool,
  Pencil,
  Phone,
  Piano,
  PieChart,
  Plane,
  Play,
  PlayCircle,
  Plug,
  Plus,
  PlusCircle,
  Printer,
  Projector,
  QrCode,
  Radio,
  Receipt,
  RefreshCw,
  Repeat,
  Repeat2,
  RotateCcw,
  Rss,
  Save,
  Search,
  SearchX,
  Send,
  Server,
  Settings,
  Settings as SettingsIcon,
  Settings2,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldHalf,
  SkipBack,
  SkipForward,
  Sliders,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Square,
  Star,
  StickyNote,
  Sun,
  Tag,
  Tags,
  Target,
  ThumbsUp,
  Timer,
  ToggleLeft,
  ToggleRight,
  Trash,
  Trash2,
  TreePine,
  TrendingDown,
  TrendingUp,
  Type,
  Unlock,
  Upload,
  UploadCloud,
  User,
  UserCheck,
  UserCircle2,
  UserCog,
  UserPlus,
  UserX,
  Users,
  Users2,
  UsersRound,
  Video,
  Volume2,
  VolumeX,
  Wallet,
  Wifi,
  WifiOff,
  Wind,
  Workflow,
  Wrench,
  X,
  XCircle,
  Zap
} from 'lucide-react';
