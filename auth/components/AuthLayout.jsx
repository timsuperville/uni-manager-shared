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
 * @see frontend/shared/auth/config/appConfigs.js
 */
import React from "react";
import PropTypes from "prop-types";
import { getCurrentAppConfig } from "../config/appConfigs.js";
import { ThemeToggle } from "../../components/ThemeToggle";

// ─── Per-app Visual Identity Fencing ──────────────────────────────────────────
// Aligned with docs/product/01-introduction.md and the institutional context catalog.

const APP_IDENTITY = {
  church: {
    tagline: "Stewardship, Empowered.",
    description:
      "Ministry leadership, relational intelligence, and liturgical orchestration — unified for your congregation.",
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
    glowColor: "rgba(139, 92, 246, 0.25)",
    accentLight: "rgba(167, 139, 250, 0.15)",
    pillars: [
      { icon: "⛪", label: "Member & Ministry Management" },
      { icon: "🎵", label: "Liturgical Scheduling & Playback" },
      { icon: "💰", label: "Tithing & Fiduciary Stewardship" },
    ],
  },
  home: {
    tagline: "Domestic Harmony, Orchestrated.",
    description:
      "Household orchestration, stewardship rituals, and physical asset maintenance — all in one Domestic Nucleus.",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    glowColor: "rgba(245, 158, 11, 0.25)",
    accentLight: "rgba(252, 211, 77, 0.15)",
    pillars: [
      { icon: "🏠", label: "Household & Asset Management" },
      { icon: "🛒", label: "Budget, Pantry & Meal Planning" },
      { icon: "👨‍👩‍👧", label: "Family Scheduling & Messaging" },
    ],
  },
  personal: {
    tagline: "Your Sovereign Sanctuary.",
    description:
      "Sovereign development, physiological intelligence, and relational accountability — a Personal OS built for you alone.",
    gradient: "from-purple-600 via-indigo-600 to-blue-700",
    glowColor: "rgba(139, 92, 246, 0.25)",
    accentLight: "rgba(165, 180, 252, 0.15)",
    pillars: [
      { icon: "🧠", label: "Second Brain & Deep Work" },
      { icon: "🎯", label: "Habits, Goals & Journal" },
      { icon: "💎", label: "Personal Finance & Identity" },
    ],
  },
  business: {
    tagline: "Professional Velocity, Mastered.",
    description:
      "Strategic toolset for high-performance SMB operations — CRM, inventory, and margin-focused fiduciary velocity.",
    gradient: "from-emerald-500 via-teal-600 to-cyan-700",
    glowColor: "rgba(16, 185, 129, 0.25)",
    accentLight: "rgba(110, 231, 183, 0.15)",
    pillars: [
      { icon: "📈", label: "CRM & Pipeline Intelligence" },
      { icon: "📦", label: "Inventory & Operations" },
      { icon: "💼", label: "Finance & Team Management" },
    ],
  },
  playback: {
    tagline: "Frame-Accurate. Stage-Ready.",
    description:
      "A precision audio engine for live multitrack, MIDI performance, and stage automation — built for ministry teams.",
    gradient: "from-rose-600 via-pink-600 to-fuchsia-700",
    glowColor: "rgba(244, 63, 94, 0.25)",
    accentLight: "rgba(251, 146, 60, 0.12)",
    pillars: [
      { icon: "🎤", label: "Live Multitrack Performance" },
      { icon: "🎹", label: "MIDI & Stage Automation" },
      { icon: "🔊", label: "In-Ear Monitor & Stem Control" },
    ],
  },
  default: {
    tagline: "Total Life Orchestration.",
    description:
      "Uni-Manager bridges your professional, spiritual, and domestic life through a single unified identity.",
    gradient: "from-blue-600 via-indigo-600 to-violet-700",
    glowColor: "rgba(99, 102, 241, 0.25)",
    accentLight: "rgba(165, 180, 252, 0.15)",
    pillars: [
      { icon: "🔐", label: "Secure, unified identity" },
      { icon: "🌐", label: "Six specialized life contexts" },
      { icon: "⚡", label: "Sub-second resonance" },
    ],
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────

const AuthLayout = ({ children, appType, showLogo = true }) => {
  const appConfig = getCurrentAppConfig(appType);

  // Resolve identity: prefer explicit appType, fall back to auto-detected config
  const identityKey = appType || appConfig?.appName?.toLowerCase() || "default";
  const identity =
    APP_IDENTITY[identityKey] ||
    APP_IDENTITY[
      Object.keys(APP_IDENTITY).find((k) => identityKey.includes(k))
    ] ||
    APP_IDENTITY.default;

  return (
    <>
      {/* Outfit + Inter font resonance */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .auth-layout-root { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .auth-layout-headline { font-family: 'Outfit', system-ui, sans-serif; }
      `}</style>

      <div className="auth-layout-root min-h-screen w-full flex overflow-hidden bg-gray-50 dark:bg-[hsl(222,47%,4%)] relative">
        {/* ── Theme Toggle — sovereign top-right ── */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            LEFT PANEL — Branded identity (lg+ only)
        ══════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex lg:flex-1 lg:relative overflow-hidden">
          {/* Gradient base */}
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

          {/* Subtle grid overlay — per LG spec */}
          <div className="absolute inset-0 opacity-10">
            <svg
              className="absolute inset-0 h-full w-full"
              fill="none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id="auth-grid"
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
              <rect width="100" height="100" fill="url(#auth-grid)" />
            </svg>
          </div>

          {/* Panel content */}
          <div className="relative z-10 flex flex-col justify-between px-12 py-12 w-full max-w-xl mx-auto">
            {/* Top: Logo + app name */}
            {showLogo && (
              <div className="animate-[fadeInDown_0.5s_ease_both]">
                <div className="inline-flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg"
                    style={{
                      background: "hsla(0,0%,100%,0.15)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid hsla(0,0%,100%,0.25)",
                    }}
                  >
                    {/* Intentionally no emoji fallback — branding icon should come from appConfig.logo in production */}
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

            {/* Middle: Tagline + description */}
            <div className="space-y-6 animate-[fadeInUp_0.6s_ease_0.1s_both]">
              <div>
                <h1
                  className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm mb-4"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {identity.tagline}
                </h1>
                <p className="text-base text-white/75 max-w-xs leading-relaxed">
                  {identity.description}
                </p>
              </div>

              {/* Feature pillars — Liquid Glass cards */}
              <div className="space-y-3">
                {identity.pillars.map((pillar, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:bg-white/15"
                    style={{
                      background: "hsla(0,0%,100%,0.08)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid hsla(0,0%,100%,0.12)",
                      animationDelay: `${0.15 + i * 0.08}s`,
                    }}
                  >
                    <span
                      className="text-xl shrink-0"
                      role="img"
                      aria-hidden="true"
                    >
                      {pillar.icon}
                    </span>
                    <span className="text-sm font-medium text-white/90">
                      {pillar.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom: Platform attribution */}
            <div className="animate-[fadeIn_0.8s_ease_0.3s_both]">
              <p className="text-xs text-white/40 font-medium tracking-wide uppercase">
                Uni-Manager · Total Life Orchestration
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            RIGHT PANEL — Form slot
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-8 lg:px-12 relative z-10 min-h-screen">
          {/* Mobile-only branded header */}
          <div className="lg:hidden text-center mb-8 animate-[fadeInDown_0.4s_ease_both]">
            <div
              className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br ${identity.gradient} text-white text-2xl shadow-lg mb-3`}
            >
              {/* Logo slot */}
            </div>
            <h1
              className="text-2xl font-bold text-gray-900 dark:text-white"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {appConfig.appName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {identity.tagline}
            </p>
          </div>

          {/* Form content */}
          <div className="w-full max-w-md mx-auto animate-[fadeInUp_0.5s_ease_0.05s_both]">
            {children}
          </div>

          {/* Footer */}
          <div className="w-full max-w-md mx-auto mt-8 text-center animate-[fadeIn_0.6s_ease_0.2s_both]">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              © {new Date().getFullYear()} Uni-Manager. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
  /** Explicit app type — falls back to auto-detection via getCurrentAppConfig() if omitted */
  appType: PropTypes.oneOf([
    "church",
    "home",
    "personal",
    "business",
    "playback",
    "default",
  ]),
  showLogo: PropTypes.bool,
};

export default AuthLayout;
