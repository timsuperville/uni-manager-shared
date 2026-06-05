/**
 * AuthLayout — Institutional Auth Shell
 *
 * The sovereign wrapper for all non-admin auth pages (login, signup, forgot password).
 * Renders the split-screen Liquid Glass layout:
 *   - LEFT  (lg+):  Branded gradient panel with app identity, tagline, and feature pillars
 *   - RIGHT (all):  Form slot — children rendered here
 *   - MOBILE:       Full-width glass card with compact branded header
 *
 * Identity fencing: each app has its own gradient, tagline, and pillars defined
 * in APP_IDENTITY below, aligned with the Visual Identity Fencing spec.
 *
 * @see docs/developer/LIQUID_GLASS_SPEC.md
 * @see docs/product/06-ux-design.md
 * @see frontend/shared/auth/config/appConfigs
 */
import React from 'react';
import { getCurrentAppConfig } from '../config/appConfigs';
import { AuthShellContext } from './_authUI/AuthContainer';
import { ThemeToggle } from '../../components/ThemeToggle';
import {
  ChurchIcon,
  MusicIcon,
  CoinsIcon,
  HomeIcon,
  ShoppingCartIcon,
  UsersIcon,
  BrainIcon,
  TargetIcon,
  DiamondIcon,
  BarChartIcon,
  PackageIcon,
  BriefcaseIcon,
  MicIcon,
  KeyboardIcon,
  SpeakerIcon,
  LockIcon,
  GlobeIcon,
  LightningIcon
} from '../../components/icons';

// ─── Per-app Visual Identity Fencing ──────────────────────────────────────────

type AppType = 'church' | 'home' | 'personal' | 'work' | 'playback' | 'default';

interface PillarItem {
  icon: React.ReactNode;
  label: string;
}

interface AppIdentity {
  tagline: string;
  description: string;
  gradient: string;
  glowColor: string;
  accentLight: string;
  pillars: PillarItem[];
}

const APP_IDENTITY: Record<AppType, AppIdentity> = {
  church: {
    tagline: 'Stewardship, Empowered.',
    description:
      'Ministry leadership, relational intelligence, and liturgical orchestration — unified for your congregation.',
    gradient: 'from-violet-600 via-purple-600 to-indigo-700',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    accentLight: 'rgba(167, 139, 250, 0.15)',
    pillars: [
      { icon: <ChurchIcon size={22} />, label: 'Member & Ministry Management' },
      {
        icon: <MusicIcon size={22} />,
        label: 'Liturgical Scheduling & Playback'
      },
      {
        icon: <CoinsIcon size={22} />,
        label: 'Tithing & Fiduciary Stewardship'
      }
    ]
  },
  home: {
    tagline: 'Domestic Harmony, Orchestrated.',
    description:
      'Household orchestration, stewardship rituals, and physical asset maintenance — all in one Domestic Nucleus.',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    accentLight: 'rgba(252, 211, 77, 0.15)',
    pillars: [
      { icon: <HomeIcon size={22} />, label: 'Household & Asset Management' },
      {
        icon: <ShoppingCartIcon size={22} />,
        label: 'Budget, Pantry & Meal Planning'
      },
      { icon: <UsersIcon size={22} />, label: 'Family Scheduling & Messaging' }
    ]
  },
  personal: {
    tagline: 'Your Sovereign Sanctuary.',
    description:
      'Sovereign development, physiological intelligence, and relational accountability — a Personal OS built for you alone.',
    gradient: 'from-purple-600 via-indigo-600 to-blue-700',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    accentLight: 'rgba(165, 180, 252, 0.15)',
    pillars: [
      { icon: <BrainIcon size={22} />, label: 'Second Brain & Deep Work' },
      { icon: <TargetIcon size={22} />, label: 'Habits, Goals & Journal' },
      { icon: <DiamondIcon size={22} />, label: 'Personal Finance & Identity' }
    ]
  },
  work: {
    tagline: 'Professional Velocity, Mastered.',
    description:
      'Strategic toolset for high-performance SMB operations — CRM, inventory, and margin-focused fiduciary velocity.',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    accentLight: 'rgba(110, 231, 183, 0.15)',
    pillars: [
      {
        icon: <BarChartIcon size={22} />,
        label: 'CRM & Pipeline Intelligence'
      },
      { icon: <PackageIcon size={22} />, label: 'Inventory & Operations' },
      { icon: <BriefcaseIcon size={22} />, label: 'Finance & Team Management' }
    ]
  },
  playback: {
    tagline: 'Frame-Accurate. Stage-Ready.',
    description:
      'A precision audio engine for live multitrack, MIDI performance, and stage automation — built for ministry teams.',
    gradient: 'from-rose-600 via-pink-600 to-fuchsia-700',
    glowColor: 'rgba(244, 63, 94, 0.25)',
    accentLight: 'rgba(251, 146, 60, 0.12)',
    pillars: [
      { icon: <MicIcon size={22} />, label: 'Live Multitrack Performance' },
      { icon: <KeyboardIcon size={22} />, label: 'MIDI & Stage Automation' },
      {
        icon: <SpeakerIcon size={22} />,
        label: 'In-Ear Monitor & Stem Control'
      }
    ]
  },
  default: {
    tagline: 'Total Life Orchestration.',
    description:
      'Uni-Manager bridges your professional, spiritual, and domestic life through a single unified identity.',
    gradient: 'from-blue-600 via-indigo-600 to-violet-700',
    glowColor: 'rgba(99, 102, 241, 0.25)',
    accentLight: 'rgba(165, 180, 252, 0.15)',
    pillars: [
      { icon: <LockIcon size={22} />, label: 'Secure, unified identity' },
      { icon: <GlobeIcon size={22} />, label: 'Six specialized life contexts' },
      { icon: <LightningIcon size={22} />, label: 'Sub-second resonance' }
    ]
  }
};

// Pillar entry animation — defined once outside the component so it's not
// recreated on every render.
const PILLAR_KEYFRAMES = `
  @keyframes pillarSlideIn {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;

// ─── Component ─────────────────────────────────────────────────────────────────

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Explicit app type — determines visual identity fencing. Falls back to auto-detection if omitted. */
  appType?: AppType;
  showLogo?: boolean;
}

const AuthLayout = ({
  children,
  appType,
  showLogo = true
}: AuthLayoutProps) => {
  const appConfig = getCurrentAppConfig(appType);

  // Resolve identity: prefer explicit appType, fall back to auto-detected config
  const identityKey = (appType ??
    appConfig?.appName?.toLowerCase() ??
    'default') as AppType;
  const identity =
    APP_IDENTITY[identityKey] ??
    APP_IDENTITY[
      Object.keys(APP_IDENTITY).find(k =>
        identityKey.includes(k as AppType)
      ) as AppType
    ] ??
    APP_IDENTITY.default;

  return (
    <>
      {/*
        Font & animation styles — inserted once per route mount.
        Using a <link> would require document access; this is the safe React way
        for a shared component that may mount in any app context.
      */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .auth-layout-root { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .auth-layout-headline { font-family: 'Outfit', system-ui, sans-serif; }
        ${PILLAR_KEYFRAMES}
      `}</style>

      <div className="auth-layout-root h-screen w-full flex overflow-hidden bg-gray-50 dark:bg-[hsl(222,47%,4%)] relative">
        {/* ══ LEFT PANEL — Branded identity (lg+ only) ══ */}
        <div className="hidden lg:flex lg:w-2/5 lg:relative overflow-hidden h-full shrink-0">
          <div
            className={`absolute inset-0 bg-linear-to-br ${identity.gradient}`}
          />

          {/* Atmospheric depth blobs */}
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-40"
            style={{ background: identity.glowColor }}
          />
          <div
            className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-30"
            style={{ background: identity.glowColor }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full blur-2xl opacity-20"
            style={{ background: identity.accentLight }}
          />

          {/* Subtle grid overlay — per Liquid Glass spec */}
          <div className="absolute inset-0 opacity-10" aria-hidden="true">
            <svg
              className="absolute inset-0 h-full w-full"
              fill="none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id={`auth-grid-${identityKey}`}
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 8 0 L 0 0 0 8"
                    fill="none"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="0.4"
                  />
                </pattern>
              </defs>
              <rect
                width="100"
                height="100"
                fill={`url(#auth-grid-${identityKey})`}
              />
            </svg>
          </div>

          {/* Panel content */}
          <div className="relative z-10 flex flex-col justify-between px-12 py-12 w-full h-full">
            {showLogo && (
              <div className="animate-[fadeInDown_0.5s_ease_both]">
                <div className="inline-flex items-center gap-3 mb-2">
                  <div
                    className="w-9 h-9 rounded-xl shadow-lg flex items-center justify-center text-white"
                    style={{
                      background: 'hsla(0,0%,100%,0.15)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid hsla(0,0%,100%,0.25)'
                    }}
                    aria-hidden="true"
                  >
                    {React.isValidElement(appConfig.ui?.icon)
                      ? React.cloneElement(appConfig.ui.icon, {
                          size: 20,
                          style: { color: 'white' }
                        } as any)
                      : appConfig.ui?.icon}
                  </div>
                  <span
                    className="auth-layout-headline text-white/90 font-bold text-lg tracking-tight"
                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                  >
                    {appConfig.appName}
                  </span>
                </div>
                <div className="w-12 h-0.5 bg-white/30 rounded-full" />
              </div>
            )}

            <div className="space-y-8">
              <div>
                <h1
                  className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm mb-4"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {identity.tagline}
                </h1>
                <p className="text-base text-white/70 max-w-xs leading-relaxed">
                  {identity.description}
                </p>
              </div>

              <div className="space-y-3">
                {identity.pillars.map((pillar, i) => (
                  <div
                    key={pillar.label}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:bg-white/15"
                    style={{
                      background: 'hsla(0,0%,100%,0.08)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid hsla(0,0%,100%,0.12)',
                      animation: 'pillarSlideIn 0.4s ease both',
                      animationDelay: `${0.2 + i * 0.1}s`
                    }}
                  >
                    <span
                      className="text-xl shrink-0"
                      role="img"
                      aria-hidden="true"
                    >
                      {pillar.icon}
                    </span>
                    <span className="text-sm font-medium text-white/90 leading-snug">
                      {pillar.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-[fadeIn_0.8s_ease_0.4s_both]">
              <p className="text-xs text-white/40 font-medium tracking-widest uppercase">
                Uni-Manager · Total Life Orchestration
              </p>
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL — Form slot ══ */}
        <div className="flex-1 flex flex-col overflow-y-auto relative z-10 bg-white dark:bg-[hsl(222,47%,6%)]">
          <div className="flex flex-col items-center px-4 sm:px-8 lg:px-12 py-4 sm:py-6 w-full min-h-full">
            <div className="my-auto w-full max-w-md">
              <AuthShellContext.Provider value={true}>
                <div className="animate-[fadeInUp_0.5s_ease_0.05s_both]">
                  {children}
                </div>
              </AuthShellContext.Provider>

              <div className="mt-4 sm:mt-5 flex items-center justify-between animate-[fadeIn_0.6s_ease_0.2s_both]">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  © {new Date().getFullYear()} Uni-Manager.
                </p>
                {ThemeToggle && <ThemeToggle />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthLayout;
