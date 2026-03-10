// FeedbackQuickAction — Shared Feedback Submission Component
// Variants:
//   "sidebar-item" — pinned nav row for sidebar footer (preferred for sidebar apps)
//   "button"       — inline button for header placement
//   "floating"     — FAB, only for apps without a persistent sidebar (e.g. playback)
//   "quick-react"  — 3-emoji inline strip
//
// Uses inline styles throughout to avoid Tailwind JIT scanning gaps in shared/.

import React, { useState, useContext, useEffect } from "react";
import ReactDOM from "react-dom";
import { useFrustrationDetector } from "../hooks/useFrustrationDetector";
import { AuthContext } from "../auth/context/AuthContext.jsx";

// M2 — Set session start timestamp at module load so collectSystemContext can
// calculate sessionDurationMs. Written only once per page load.
if (typeof window !== "undefined" && !window.__feedbackSessionStart) {
  window.__feedbackSessionStart = Date.now();
}

// M1 — Canonical source enum. Use these constants everywhere; never raw strings.
export const FEEDBACK_SOURCES = /** @type {const} */ ({
  FRUSTRATION_DETECTOR: "frustration-detector",
  ERROR_BOUNDARY: "error-boundary",
  MANUAL: "manual",
});

/** Valid systemContext.source values as accepted by FeedbackReport Mongoose schema. */
const VALID_SOURCES = new Set(Object.values(FEEDBACK_SOURCES));

/**
 * Validates and normalises a source string before submission.
 * Returns null (not undefined) so Mongoose keeps the field but stores null
 * rather than silently dropping a typo'd value that would break the enum.
 */
function resolveSource(source) {
  if (!source) return null;
  if (VALID_SOURCES.has(source)) return source;
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[FeedbackQuickAction] Unknown source "${source}". ` +
        `Valid values: ${[...VALID_SOURCES].join(", ")}. Defaulting to null.`,
    );
  }
  return null;
}

// ─── Safe Auth Access ─────────────────────────────────────────────────────────
// FeedbackQuickAction is used in both authenticated apps (church, home, admin…)
// and the public marketing site (main), which has no AuthProvider. useAuth()
// throws when called outside a provider, so we read the context directly with
// useContext — which returns null instead of throwing when there's no provider.
function useOptionalUser() {
  const ctx = useContext(AuthContext);
  if (!ctx?.user) return null;
  const u = ctx.user;
  return {
    id: u._id || u.id || null,
    email: u.email || null,
    name:
      u.name ||
      u.displayName ||
      [u.firstName, u.lastName].filter(Boolean).join(" ") ||
      null,
    role: u.role || u.roles?.[0] || u.rbac?.role || null,
    appRole: u.rbac?.role || null,
  };
}

// ─── Context Collector ────────────────────────────────────────────────────────
// Gathers extensive system/session context to enrich every feedback submission.
// ─── Device & OS Detection ───────────────────────────────────────────────────
function detectDevice() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobile =
    /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet =
    /Tablet|iPad/i.test(ua) ||
    (isMobile && Math.min(screen.width, screen.height) >= 600);
  const deviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  // OS detection — ordered most-specific first
  let os = "unknown";
  if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = /iPhone|iPad/i.test(ua) ? "iOS" : "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Linux/i.test(ua)) os = "Linux";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";

  // Extract OS version where possible
  const winMatch = ua.match(/Windows NT (\d+\.\d+)/);
  const macMatch = ua.match(/Mac OS X ([\d_]+)/);
  const androidMatch = ua.match(/Android ([\d.]+)/);
  const iosMatch = ua.match(/OS ([\d_]+) like Mac/);
  const osVersion =
    (winMatch && winMatch[1]) ||
    (macMatch && macMatch[1].replace(/_/g, ".")) ||
    (androidMatch && androidMatch[1]) ||
    (iosMatch && iosMatch[1].replace(/_/g, ".")) ||
    null;

  const orientation =
    typeof screen !== "undefined" && screen.orientation
      ? screen.orientation.type
      : typeof window !== "undefined"
        ? window.innerWidth > window.innerHeight
          ? "landscape-primary"
          : "portrait-primary"
        : null;

  return { deviceType, os, osVersion, orientation };
}

function collectSystemContext(appName, user = null) {
  const sessionStart = window.__feedbackSessionStart;
  const sessionDurationMs = sessionStart ? Date.now() - sessionStart : null;

  // Performance memory (Chrome-only)
  let memoryMb = null;
  try {
    const mem = performance?.memory;
    if (mem?.usedJSHeapSize) {
      memoryMb = Math.round(mem.usedJSHeapSize / 1024 / 1024);
    }
  } catch {}

  // Navigation timing — time to first interactive
  let loadTimingMs = null;
  try {
    const nav = performance?.getEntriesByType?.("navigation")?.[0];
    if (nav?.domInteractive) loadTimingMs = Math.round(nav.domInteractive);
  } catch {}

  // Connection info
  let connection = null;
  try {
    const conn =
      navigator?.connection ||
      navigator?.mozConnection ||
      navigator?.webkitConnection;
    if (conn) {
      connection = {
        effectiveType: conn.effectiveType || null,
        downlinkMbps: conn.downlink || null,
        rtt: conn.rtt || null,
        saveData: conn.saveData || false,
      };
    }
  } catch {}

  // Local/session storage key count (approximate data volume proxy)
  let storageKeys = null;
  try {
    storageKeys = {
      localStorage: localStorage.length,
      sessionStorage: sessionStorage.length,
    };
  } catch {}

  // Recent navigation history (last 5 pages in this tab)
  let navigationHistory = null;
  try {
    navigationHistory = window.__feedbackNavHistory || [];
  } catch {}

  // Page visibility / engagement
  let pageVisibilityState = null;
  try {
    pageVisibilityState = document.visibilityState || null;
  } catch {}

  const env =
    typeof import.meta !== "undefined" &&
    import.meta?.env?.MODE === "production"
      ? "production"
      : "development";

  const appVersion =
    typeof import.meta !== "undefined"
      ? import.meta?.env?.VITE_APP_VERSION || "unknown"
      : "unknown";

  const fullPathname =
    typeof window !== "undefined" ? window.location.pathname : "/";
  const base =
    (typeof import.meta !== "undefined" && import.meta?.env?.BASE_URL) || "/";
  const inAppPath = fullPathname.startsWith(base)
    ? "/" + fullPathname.slice(base.length)
    : fullPathname;

  const device = detectDevice();

  return {
    // ── Authenticated user identity (auto-populated, never manually entered) ──
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          appRole: user.appRole,
        }
      : null,

    page: {
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      path: inAppPath,
      hash: typeof window !== "undefined" ? window.location.hash : "",
      queryString: typeof window !== "undefined" ? window.location.search : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
      title: typeof document !== "undefined" ? document.title : "",
      timestamp: new Date().toISOString(),
    },
    device: {
      type: device.deviceType,
      os: device.os,
      osVersion: device.osVersion,
      orientation: device.orientation,
    },
    browser: {
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      viewport: {
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
      },
      screen: {
        width: typeof screen !== "undefined" ? screen.width : 0,
        height: typeof screen !== "undefined" ? screen.height : 0,
        pixelRatio:
          typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
        colorDepth: typeof screen !== "undefined" ? screen.colorDepth : null,
      },
      language: typeof navigator !== "undefined" ? navigator.language : "",
      languages:
        typeof navigator !== "undefined" && Array.isArray(navigator.languages)
          ? navigator.languages.slice(0, 3)
          : [],
      timezone: Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone || "",
      cookiesEnabled:
        typeof navigator !== "undefined" ? navigator.cookieEnabled : null,
      doNotTrack:
        typeof navigator !== "undefined" ? navigator.doNotTrack : null,
      onLine: typeof navigator !== "undefined" ? navigator.onLine : null,
      connection,
      loadTimingMs,
    },
    application: {
      name: appName,
      version: appVersion,
      environment: env,
      baseUrl: base,
    },
    session: {
      durationMs: sessionDurationMs,
      durationFormatted: sessionDurationMs
        ? `${Math.floor(sessionDurationMs / 60000)}m ${Math.floor((sessionDurationMs % 60000) / 1000)}s`
        : null,
      storageKeys,
      navigationHistoryCount: navigationHistory ? navigationHistory.length : 0,
      recentNavigation: navigationHistory ? navigationHistory.slice(-5) : [],
      pageVisibilityState,
    },
    performance: {
      memoryUsedMb: memoryMb,
      jsHeapLimitMb: (() => {
        try {
          const lim = performance?.memory?.jsHeapSizeLimit;
          return lim ? Math.round(lim / 1024 / 1024) : null;
        } catch {
          return null;
        }
      })(),
    },
  };
}

// Track session start time globally so duration accumulates correctly
if (typeof window !== "undefined" && !window.__feedbackSessionStart) {
  window.__feedbackSessionStart = Date.now();
}

// Track navigation history for context
if (typeof window !== "undefined" && !window.__feedbackNavHistory) {
  window.__feedbackNavHistory = [];
  // Intercept history pushes (SPA navigation)
  const origPush = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);
  const trackPage = (url) => {
    const path = typeof url === "string" ? url : window.location.pathname;
    const history = window.__feedbackNavHistory;
    if (history[history.length - 1] !== path) {
      history.push(path);
      if (history.length > 20) history.shift();
    }
  };
  history.pushState = (...args) => {
    origPush(...args);
    trackPage(args[2]);
  };
  history.replaceState = (...args) => {
    origReplace(...args);
    trackPage(args[2]);
  };
}

// ─── Silent auto-submit utility (used by ErrorBoundary, no UI) ─────────────────
// Fire-and-forget — never throws, never alerts the user.
export async function submitFeedbackSilently({
  title,
  description,
  appType = "unknown",
  severity = "high",
  user = null,
  source = null, // optional origin tag — validated against FEEDBACK_SOURCES enum
} = {}) {
  try {
    // Probe token from sessionStorage / localStorage across all known namespaces
    const namespaces = [
      appType,
      "admin",
      "church",
      "personal",
      "home",
      "business",
      "uni",
    ].filter(Boolean);
    let authToken = null;
    for (const ns of namespaces) {
      const key = `${ns}_auth_access_token`;
      authToken =
        window.sessionStorage?.getItem(key) ||
        window.localStorage?.getItem(key);
      if (authToken) break;
    }

    const headers = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    const systemCtx = collectSystemContext(appType, user);
    // M1 — validate source against canonical enum before sending;
    // a typo would otherwise be silently rejected by Mongoose strict mode.
    systemCtx.source = resolveSource(source);

    await fetch("/api/v1/feedback/submit", {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "error-report",
        category: "bug",
        severity,
        userInput: { title, description, allowContact: false },
        // Pass user identity so backend can enrich systemContext.user
        systemContext: systemCtx,
      }),
    });
  } catch {
    // Intentionally silent — never surface auto-report errors to users
  }
}

// ─── Feedback Modal ────────────────────────────────────────────────────────────
function FeedbackModal({
  onClose,
  onSubmitSuccess,
  appType,
  user = null,
  initialTitle = "",
  initialDescription = "",
}) {
  const [feedback, setFeedback] = useState({
    type: "bug_report", // pre-select Bug — most testing feedback is bugs
    title: initialTitle,
    description: initialDescription,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [error, setError] = useState(null);

  // Detect mobile for bottom-sheet layout; re-checks on resize
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 600,
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // Map frontend type values → FeedbackReport.type enum
      // Allowed: 'user-feedback' | 'error-report' | 'broken-link' | 'performance-issue'
      const typeMap = {
        general: "user-feedback",
        bug_report: "error-report",
        feature_request: "user-feedback",
      };

      // Map frontend type → FeedbackReport.category enum
      // Allowed: 'bug' | 'feature' | 'improvement' | 'other'
      const categoryFromType = {
        general: "other",
        bug_report: "bug",
        feature_request: "feature",
      };

      // Severity is auto-derived from type — not exposed to the user.
      // Bug reports are high-priority by default; feature requests medium; general low.
      const severityFromType = {
        bug_report: "high",
        feature_request: "medium",
        general: "low",
      };

      const appName =
        appType ||
        (typeof window !== "undefined" && import.meta?.env?.VITE_APP_TYPE) ||
        "unknown";

      // ── Token — probe sessionStorage then localStorage with app namespace ──
      const getStoredToken = () => {
        if (typeof window === "undefined") return null;
        const namespaces = [
          appName,
          "admin",
          "church",
          "personal",
          "home",
          "business",
          "uni",
        ].filter(Boolean);
        for (const ns of namespaces) {
          const key = `${ns}_auth_access_token`;
          const tok =
            window.sessionStorage?.getItem(key) ||
            window.localStorage?.getItem(key);
          if (tok) return tok;
        }
        return null;
      };
      const authToken = getStoredToken();

      // Build the structured FeedbackReport payload the backend expects
      const payload = {
        type: typeMap[feedback.type] || "user-feedback",
        category: categoryFromType[feedback.type] || "other",
        severity: severityFromType[feedback.type] || "medium",
        userInput: {
          title: feedback.title,
          description: feedback.description,
          allowContact: false,
        },
        // Full system context including auto-collected user identity & device info
        systemContext: collectSystemContext(appName, user),
      };

      const reqHeaders = { "Content-Type": "application/json" };
      if (authToken) reqHeaders["Authorization"] = `Bearer ${authToken}`;

      const response = await fetch("/api/v1/feedback/submit", {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onSubmitSuccess?.();
          onClose();
          setSubmitted(false);
        }, 2200);
      } else {
        const errBody = await response.json().catch(() => ({}));
        setError(errBody.message || `Server error ${response.status}`);
      }
    } catch (_err) {
      setError(_err.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Shared input style ──
  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "9px 12px",
    borderRadius: "10px",
    border: "1px solid var(--glass-outline)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--text-primary, #f1f5f9)",
    fontSize: "13px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 160ms ease, background 160ms ease",
  };

  const ctx = collectSystemContext(appType || "unknown", user);

  return (
    // Scrim
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        // Mobile: anchor to bottom edge as a sheet; desktop: center
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? "0" : "16px",
      }}
    >
      {/* Panel — bottom sheet on mobile, centered dialog on desktop */}
      <div
        style={{
          width: "100%",
          maxWidth: isMobile ? "100%" : "460px",
          maxHeight: isMobile ? "92dvh" : "90vh",
          overflowY: "auto",
          borderRadius: isMobile ? "20px 20px 0 0" : "14px",
          background: "var(--glass-surface, hsla(265,28%,14%,0.96))",
          backdropFilter: "blur(32px) saturate(200%)",
          WebkitBackdropFilter: "blur(32px) saturate(200%)",
          border: "1px solid var(--glass-outline)",
          boxShadow: isMobile
            ? "0 -12px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 32px 72px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          padding: isMobile ? "16px 20px 36px" : "20px",
          color: "var(--text-primary, #f1f5f9)",
          fontFamily: "var(--font-body, system-ui, sans-serif)",
          animation: isMobile
            ? "feedback-sheet-up 0.28s cubic-bezier(0.32,0.72,0,1) both"
            : "feedback-slide-in 0.2s ease both",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span style={{ fontSize: "15px", fontWeight: "600" }}>
              Share Feedback
            </span>
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "var(--primary-subtle, rgba(99,102,241,0.09))",
                color: "var(--primary-resonance)",
                fontWeight: "600",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {appType || "app"}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "var(--text-muted, #94a3b8)",
              borderRadius: "6px",
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <svg
              width="40"
              height="40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="var(--success, #22c55e)"
              strokeWidth="2"
              style={{ margin: "0 auto 12px" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p
              style={{
                fontSize: "15px",
                fontWeight: "600",
                marginBottom: "4px",
              }}
            >
              Thank you!
            </p>
            <p
              style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)" }}
            >
              Your feedback has been submitted.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Feedback type — 3 tap-target cards (replaces 7-option dropdown) */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "var(--text-muted, #94a3b8)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}
              >
                What kind of feedback?
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px",
                }}
              >
                {[
                  { value: "bug_report", emoji: "🐛", label: "Bug" },
                  { value: "feature_request", emoji: "💡", label: "Feature" },
                  { value: "general", emoji: "💬", label: "Other" },
                ].map(({ value, emoji, label }) => {
                  const active = feedback.type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFeedback({ ...feedback, type: value })}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                        padding: "12px 8px",
                        borderRadius: "10px",
                        border: `1px solid ${
                          active
                            ? "var(--glass-outline-active)"
                            : "var(--glass-outline)"
                        }`,
                        background: active
                          ? "var(--primary-subtle)"
                          : "rgba(255,255,255,0.03)",
                        color: active
                          ? "var(--text-accent)"
                          : "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: active ? "600" : "400",
                        fontFamily: "inherit",
                        transition: "all 120ms ease",
                        lineHeight: 1,
                      }}
                    >
                      <span style={{ fontSize: "20px", lineHeight: 1 }}>
                        {emoji}
                      </span>
                      <span style={{ marginTop: "4px" }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "var(--text-muted, #94a3b8)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "5px",
                }}
              >
                Title
              </label>
              <input
                type="text"
                value={feedback.title}
                onChange={(e) =>
                  setFeedback({ ...feedback, title: e.target.value })
                }
                placeholder="Brief summary..."
                required
                style={inputStyle}
              />
            </div>

            {/* Description + char counter */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "5px",
                }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "var(--text-muted, #94a3b8)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Description
                </label>
                <span
                  style={{
                    fontSize: "10px",
                    color:
                      feedback.description.length > 900
                        ? "hsl(38,92%,65%)"
                        : "var(--text-ghost, #475569)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {feedback.description.length} / 1000
                </span>
              </div>
              <textarea
                value={feedback.description}
                onChange={(e) =>
                  setFeedback({
                    ...feedback,
                    description: e.target.value.slice(0, 1000),
                  })
                }
                placeholder="Describe your feedback — steps to reproduce, expected vs actual behavior, etc."
                rows={4}
                required
                maxLength={1000}
                style={{ ...inputStyle, resize: "vertical", minHeight: "90px" }}
              />
            </div>

            {/* Context disclosure — user-friendly framing */}
            <div>
              <button
                type="button"
                onClick={() => setShowContext((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "11px",
                  color: "var(--text-muted, #64748b)",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontFamily: "inherit",
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: showContext ? "rotate(90deg)" : "none",
                    transition: "transform 150ms ease",
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {showContext ? "Hide" : "Show"} what’s included automatically
              </button>
              {showContext && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid var(--glass-outline)",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono, monospace)",
                    color: "var(--text-muted, #94a3b8)",
                    maxHeight: "160px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {JSON.stringify(ctx, null, 2)}
                </div>
              )}
            </div>

            {/* Inline error — replaces the old alert() call */}
            {error && (
              <div
                role="alert"
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "hsl(0,84%,70%)",
                  fontSize: "12px",
                  lineHeight: "1.5",
                }}
              >
                {error}
              </div>
            )}

            {/* Actions — Cancel anchored left, Submit anchored right at all viewport sizes */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                paddingTop: "4px",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  background: "none",
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  color: "var(--text-muted, #64748b)",
                  fontSize: "13px",
                  padding: "8px 10px",
                  fontFamily: "inherit",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                  flexShrink: 0,
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || !feedback.title || !feedback.description
                }
                style={{
                  padding: "10px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    isSubmitting || !feedback.title || !feedback.description
                      ? "rgba(255,255,255,0.1)"
                      : "linear-gradient(135deg, var(--primary-resonance), var(--primary-hover, var(--primary-resonance)))",
                  color:
                    isSubmitting || !feedback.title || !feedback.description
                      ? "var(--text-muted)"
                      : "#fff",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                  boxShadow:
                    isSubmitting || !feedback.title || !feedback.description
                      ? "none"
                      : "0 4px 16px var(--primary-glow, rgba(99,102,241,0.35))",
                  transition: "all 160ms ease",
                  fontFamily: "inherit",
                  flexShrink: 0,
                }}
              >
                {isSubmitting ? "Sending…" : "Send Feedback"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Keyframes — slide-in for desktop, sheet-up for mobile */}
      <style>{`
        @keyframes feedback-slide-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes feedback-sheet-up {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// Portal wrapper — breaks FeedbackModal out of any CSS-transform stacking
// context (e.g. sidebar translate-x-* animations) so that position:fixed
// resolves to the true viewport and inset:0 covers the full screen.
function FeedbackModalPortal(props) {
  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(
    <FeedbackModalPortal {...props} />,
    document.body,
  );
}

// ─── Public Component ──────────────────────────────────────────────────────────
export const FeedbackQuickAction = ({
  variant = "sidebar-item",
  position = "bottom-right",
  appType,
  accentColor,
  onSubmitSuccess, // optional — called after successful submission & modal auto-closes
}) => {
  // Automatically pick up the signed-in user's identity (null for anonymous/public pages)
  const user = useOptionalUser();
  const [isOpen, setIsOpen] = useState(false);
  // Pre-fill context provided by passive frustration detection
  const [prefill, setPrefill] = useState({ title: "", description: "" });
  // R4 — 'reacted' used by quick-react variant; declared here so hooks are never
  // called inside a conditional branch (Rules of Hooks).
  const [reacted, setReacted] = useState(false);

  // Passive frustration detection — auto-reports silently and caches prefill
  // for the next manual modal open so context is already populated.
  useFrustrationDetector({
    appType,
    disableInDev: true, // never auto-file reports during local development
    onFrustrated: async ({ signal, source, path }) => {
      const title =
        signal === "rage-click"
          ? `Repeated click detected on ${path}`
          : `Rapid navigation on ${path}`;
      const description =
        signal === "rage-click"
          ? `The user clicked rapidly in the same area, which may indicate a broken interaction or unresponsive element at ${path}.`
          : `The user navigated rapidly across multiple pages starting at ${path}, which may indicate difficulty finding what they need.`;

      // 1. Pre-fill so the next manual open already has context
      setPrefill({ title, description });

      // 2. Silently auto-report the frustration signal (include user identity + source tag)
      await submitFeedbackSilently({
        title,
        description,
        appType,
        severity: "medium",
        user,
        source, // 'frustration-detector' — allows agent scan to identify auto-reports
      });
    },
  });

  const iconSvg = (
    <svg
      width="15"
      height="15"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      style={{ flexShrink: 0 }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );

  // ── VARIANT: sidebar-item ──────────────────────────────────────────────────
  if (variant === "sidebar-item") {
    const accent = accentColor || "var(--primary-resonance, #22d3ee)";
    return (
      <>
        <button
          id="feedback-sidebar-trigger"
          onClick={() => {
            setIsOpen(true);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            color: "var(--text-secondary, #94a3b8)",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 150ms ease",
            fontFamily: "var(--font-body, inherit)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "var(--nav-hover, rgba(255,255,255,0.06))";
            e.currentTarget.style.color = accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary, #94a3b8)";
          }}
          title="Share feedback or report a bug"
        >
          <span style={{ color: "var(--text-muted, #64748b)", flexShrink: 0 }}>
            {iconSvg}
          </span>
          <span>Share Feedback</span>
        </button>
        {isOpen && (
          <FeedbackModalPortal
            onClose={() => setIsOpen(false)}
            onSubmitSuccess={onSubmitSuccess}
            appType={appType}
            user={user}
            initialTitle={prefill.title}
            initialDescription={prefill.description}
          />
        )}
      </>
    );
  }

  // ── VARIANT: sidebar-icon (collapsed icon-only mode) ──────────────────────
  if (variant === "sidebar-icon") {
    const accent = accentColor || "var(--primary-resonance, #22d3ee)";
    return (
      <>
        <button
          id="feedback-sidebar-icon-trigger"
          onClick={() => setIsOpen(true)}
          title="Share Feedback"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            color: "var(--text-muted, #64748b)",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "var(--nav-hover, rgba(255,255,255,0.06))";
            e.currentTarget.style.color = accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted, #64748b)";
          }}
        >
          {iconSvg}
        </button>
        {isOpen && (
          <FeedbackModalPortal
            onClose={() => setIsOpen(false)}
            appType={appType}
            user={user}
            initialTitle={prefill.title}
            initialDescription={prefill.description}
          />
        )}
      </>
    );
  }

  // ── VARIANT: button (inline header button) ─────────────────────────────────
  if (variant === "button") {
    return (
      <>
        <button
          id="feedback-header-trigger"
          onClick={() => setIsOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(128,128,128,0.25)",
            background: "transparent",
            color: "var(--text-secondary, #64748b)",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 150ms ease",
            fontFamily: "var(--font-body, inherit)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(128,128,128,0.1)";
            e.currentTarget.style.color = "var(--text-primary, inherit)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary, #64748b)";
          }}
        >
          {iconSvg}
          <span>Feedback</span>
        </button>
        {isOpen && (
          <FeedbackModalPortal
            onClose={() => setIsOpen(false)}
            appType={appType}
            user={user}
            initialTitle={prefill.title}
            initialDescription={prefill.description}
          />
        )}
      </>
    );
  }

  // ── VARIANT: bottom-nav-item (icon + label for mobile bottom nav "More" sheet) ──
  if (variant === "bottom-nav-item") {
    const accent = accentColor || "var(--primary-resonance, #22d3ee)";
    return (
      <>
        <button
          id="feedback-bottom-nav-trigger"
          onClick={() => setIsOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "none",
            background: "transparent",
            color: "var(--text-secondary, #94a3b8)",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "var(--font-body, inherit)",
            transition: "background 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: `rgba(34,211,238,0.12)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent,
              flexShrink: 0,
            }}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </span>
          <div>
            <div
              style={{
                color: "var(--text-primary, #f1f5f9)",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Share Feedback
            </div>
            <div
              style={{ color: "var(--text-muted, #64748b)", fontSize: "12px" }}
            >
              Report a bug or suggest a feature
            </div>
          </div>
        </button>
        {isOpen && (
          <FeedbackModalPortal
            onClose={() => setIsOpen(false)}
            appType={appType}
            user={user}
            initialTitle={prefill.title}
            initialDescription={prefill.description}
          />
        )}
      </>
    );
  }

  // R4 — quick-react variant: previously declared its own useState hooks inside
  // a conditional block which violates Rules of Hooks. Now uses the hoisted
  // `reacted` and the outer `isOpen` state from the component top.
  if (variant === "quick-react") {
    const handleReact = async (emoji, sentiment) => {
      if (reacted) return;
      if (sentiment === "positive") {
        setReacted(true);
        await submitFeedbackSilently({
          title: `Quick reaction: ${emoji}`,
          description: `User gave a positive quick reaction on ${window.location.pathname}`,
          appType,
          severity: "low",
          source: FEEDBACK_SOURCES.MANUAL,
        });
      } else {
        // Neutral / negative → open full modal for detail
        setIsOpen(true);
      }
    };

    return (
      <>
        {reacted ? (
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-secondary, #64748b)",
              padding: "4px 8px",
            }}
          >
            Thanks! 🙌
          </span>
        ) : (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(128,128,128,0.06)",
              borderRadius: "20px",
              padding: "4px 8px",
              border: "1px solid rgba(128,128,128,0.15)",
            }}
          >
            {[
              { emoji: "😊", label: "Great", sentiment: "positive" },
              { emoji: "😐", label: "Okay", sentiment: "neutral" },
              { emoji: "😤", label: "Frustrating", sentiment: "negative" },
            ].map(({ emoji, label, sentiment }) => (
              <button
                key={sentiment}
                id={`quick-react-${sentiment}`}
                title={label}
                onClick={() => handleReact(emoji, sentiment)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "2px 4px",
                  borderRadius: "6px",
                  lineHeight: 1,
                  transition: "transform 120ms ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.25)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        {isOpen && (
          <FeedbackModalPortal
            onClose={() => setIsOpen(false)}
            appType={appType}
            user={user}
          />
        )}
      </>
    );
  }

  // ── VARIANT: floating (FAB — for apps without sidebar, e.g. playback) ──────
  const positionMap = {
    "bottom-right": { bottom: "24px", right: "24px" },
    "bottom-left": { bottom: "24px", left: "24px" },
    "top-right": { top: "24px", right: "24px" },
    "top-left": { top: "24px", left: "24px" },
  };

  return (
    <>
      <div style={{ position: "fixed", zIndex: 40, ...positionMap[position] }}>
        <button
          id="feedback-fab-trigger"
          onClick={() => setIsOpen(true)}
          title="Send Feedback"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, var(--primary-resonance), var(--primary-hover, var(--primary-resonance)))",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px var(--primary-glow, rgba(0,0,0,0.3))",
            transition: "transform 150ms ease, box-shadow 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
          }}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      </div>
      {isOpen && (
        <FeedbackModalPortal
          onClose={() => setIsOpen(false)}
          appType={appType}
          user={user}
          initialTitle={prefill.title}
          initialDescription={prefill.description}
        />
      )}
    </>
  );
};

export default FeedbackQuickAction;
