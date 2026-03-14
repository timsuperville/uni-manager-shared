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

// ── Helpers ────────────────────────────────────────────────────────────────────

/** @param {{ size?: number, sw?: number, [key: string]: any }} props */
const svg = (children, defaultSw = 2) =>
  function Icon({ size = 16, sw = defaultSw, style, ...rest }) {
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
  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
);

export const DownloadIcon = svg(
  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
);

export const ExportIcon = svg(
  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
);

export const RefreshIcon = svg(
  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
);

export const UploadIcon = svg(
  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />,
);

// ── Status / Feedback ──────────────────────────────────────────────────────────

export const AlertIcon = svg(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </>,
  1.5,
);

export const AlertCircleIcon = svg(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4m0 4h.01" />
  </>,
  1.5,
);

export const CheckIcon = svg(<path d="M20 6L9 17l-5-5" />);

export const BanIcon = svg(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </>,
  1.5,
);

export const TrendUpIcon = svg(<path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />);

export const TrendDownIcon = svg(<path d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />);

// ── Users / Auth ───────────────────────────────────────────────────────────────

export const UsersIcon = svg(
  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  1.5,
);

export const UserIcon = svg(
  <>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>,
  1.5,
);

export const ShieldIcon = svg(
  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  1.5,
);

/** Shield without check — used for "restricted access" branding */
export const ShieldSolidIcon = svg(
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  1.5,
);

/** Shield with tick — MFA enabled / protected state */
export const ShieldCheckIcon = svg(
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </>,
  2,
);

/** Shield with diagonal slash — MFA disabled / unprotected state */
export const ShieldOffIcon = svg(
  <>
    <path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18" />
    <path d="M4.73 4.73 4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </>,
  2,
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
  2,
);

/** Copy to clipboard */
export const CopyIcon = svg(
  <>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>,
  2,
);

export const LockIcon = svg(
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>,
  1.5,
);

export const EyeIcon = svg(
  <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </>,
  1.5,
);

export const EyeOffIcon = svg(
  <>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </>,
  1.5,
);

export const KeyIcon = svg(
  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />,
  1.5,
);

export const SmartphoneIcon = svg(
  <>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </>,
  1.5,
);

// ── System / Engineering ───────────────────────────────────────────────────────

export const ServerIcon = svg(
  <path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />,
  1.5,
);

export const BarChartIcon = svg(
  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  1.5,
);
