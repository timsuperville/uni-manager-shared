/**
 * ErrorBoundary — Unified React error boundary for the Uni-Manager ecosystem.
 *
 * Consolidates four previously-divergent implementations:
 *   - shared/components/ErrorBoundary.jsx          (Sentiment Feed only)
 *   - shared/components/GlobalErrorBoundary.jsx    (dual report, full-screen)
 *   - shared/features/monitoring/ErrorMonitoring   (richest telemetry, dual report)
 *   - apps/church/src/components/ErrorBoundary.jsx (best Liquid Glass UI)
 *
 * ── Reporting architecture ────────────────────────────────────────────────────
 * On any caught error the boundary always fires two parallel, fire-and-forget
 * requests:
 *   1. POST /api/v1/errors/log      → ErrorLog collection (Error Resonance dashboard)
 *   2. POST /api/v1/feedback/submit → FeedbackReport collection (Sentiment Feed)
 *
 * Both use raw fetch (NOT @shared/api) because:
 *   a) The boundary may be mounted BEFORE ApiProvider is in the tree.
 *   b) installFetchInterceptor() wraps window.fetch — using ApiClient here
 *      would create a self-reporting loop if the ApiClient itself throws.
 *   c) The monitor must survive even when the ApiClient is the error source.
 *
 * Both paths are RELATIVE — Vite proxy handles dev, nginx handles prod.
 * Do NOT introduce VITE_API_URL here. See frontend/vite-proxy.js.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * App root (full-screen crash recovery):
 *   <ErrorBoundary appType="church">
 *     <App />
 *   </ErrorBoundary>
 *
 * Inner feature boundary (inline, no full-screen takeover):
 *   <ErrorBoundary variant="inline" title="Could not load feed">
 *     <ActivityFeed />
 *   </ErrorBoundary>
 *
 * Custom fallback render prop:
 *   <ErrorBoundary fallback={({ error, errorId, reset }) => <MyFallback ... />}>
 *     <Widget />
 *   </ErrorBoundary>
 */

import React from "react";
import PropTypes from "prop-types";
import { AlertTriangle, RefreshCw, Home, ChevronDown } from "lucide-react";

// ── Ingest endpoints ──────────────────────────────────────────────────────────
// Intentionally RELATIVE paths — never construct an absolute URL here.
// In dev:  Vite proxy routes /api/v1 → http://localhost:5000/api/v1
// In prod: nginx routes /api/v1     → backend
// See frontend/vite-proxy.js and shared/api/config/apiConfig.ts.
const INGEST_ERRORS = "/api/v1/errors/log";
const INGEST_FEEDBACK = "/api/v1/feedback/submit";

// ── Error ID ─────────────────────────────────────────────────────────────────
// btoa() throws on non-Latin-1 characters (emoji, Cyrillic, etc. in error
// messages). Use a portable XOR hash instead — never throws, always 8 hex chars.
function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0; // FNV-1a, unsigned 32-bit
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function buildErrorId(message, pathname) {
  const seed = `${message || "unknown"}-${pathname}-${Date.now()}`;
  return `ERR-${hashString(seed).toUpperCase()}`;
}

// ── Auth token probe ──────────────────────────────────────────────────────────
// Check all namespace keys in priority order — whichever app initialized first
// wins. The boundary may fire before or after login.
const TOKEN_NAMESPACES = ["admin", "home", "church", "personal", "business", "uni"];

function getAuthToken(appType) {
  const namespaces = [appType, ...TOKEN_NAMESPACES].filter(Boolean);
  for (const ns of namespaces) {
    const token =
      window.sessionStorage?.getItem(`${ns}_auth_access_token`) ||
      window.localStorage?.getItem(`${ns}_auth_access_token`);
    if (token) return token;
  }
  return null;
}

// ── User context ──────────────────────────────────────────────────────────────
// Best-effort read from localStorage — never throws.
function getUserContext() {
  try {
    let userInfo = {};
    // Try all known storage keys in order of specificity
    for (const key of ["user", "uni_manager_auth", "auth_user"]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        userInfo = parsed?.user || parsed || {};
        if (userInfo.id || userInfo._id) break; // found a real user object
      } catch (_) { /* malformed JSON — skip */ }
    }
    return {
      isAuthenticated: !!(userInfo.id || userInfo._id),
      userId: userInfo.id || userInfo._id || null,
      userEmail: userInfo.email || userInfo.userEmail || null,
      userRole: userInfo.role || null,
    };
  } catch (_) {
    return { isAuthenticated: false, userId: null, userEmail: null, userRole: null };
  }
}

// ── Telemetry collection ──────────────────────────────────────────────────────
function collectTelemetry(error, errorInfo, appType) {
  const user = getUserContext();

  // typeof guards so this is safe in SSR / jsdom / Worker environments
  const w = typeof window !== "undefined" ? window : null;
  const n = typeof navigator !== "undefined" ? navigator : null;
  const s = typeof screen !== "undefined" ? screen : null;
  const p = typeof performance !== "undefined" ? performance : null;

  return {
    // Error identity
    message: error?.message || "Unknown error",
    stack: error?.stack || "",
    componentStack: errorInfo?.componentStack || "",
    name: error?.name || "Error",
    category: "rendering",
    severity: "critical",

    // App context
    appType: appType || import.meta?.env?.VITE_APP_TYPE || "unknown",
    environment: import.meta?.env?.MODE === "production" ? "production" : "development",
    timestamp: new Date().toISOString(),

    // Location
    url: w?.location.href || "",
    path: w?.location.pathname || "",

    // User (top-level for ErrorLog schema)
    userId: user.userId,
    userEmail: user.userEmail,
    userContext: user,

    // Browser snapshot (typeof-guarded)
    userAgent: n?.userAgent || "",
    viewport: w ? { width: w.innerWidth, height: w.innerHeight } : null,
    screen: s ? { width: s.width, height: s.height } : null,

    // Performance (non-blocking, best-effort, Chrome only)
    memoryMB: p?.memory
      ? Math.round(p.memory.usedJSHeapSize / 1024 / 1024)
      : null,
  };
}

// ── Reporting ─────────────────────────────────────────────────────────────────
function reportError(telemetry, appType) {
  const token = getAuthToken(appType);
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const feedbackPayload = {
    type: "error-report",
    priority: "urgent",
    category: "bug",
    title: `[Auto] Crash: ${telemetry.message}`,
    description: [
      `**Error:** ${telemetry.message}`,
      `**Error ID:** ${telemetry.errorId || "(none)"}`,
      `**Path:** ${telemetry.path}`,
      "",
      "**Component Stack:**",
      "```",
      telemetry.componentStack || "(unavailable)",
      "```",
    ].join("\n"),
    metadata: {
      autoGenerated: true,
      errorId: telemetry.errorId,
      appType: telemetry.appType,
      timestamp: telemetry.timestamp,
      url: telemetry.url,
      severity: telemetry.severity,
    },
  };

  // Fire both — intentionally no await (fire-and-forget)
  Promise.all([
    fetch(INGEST_ERRORS, { method: "POST", headers, body: JSON.stringify(telemetry) }),
    fetch(INGEST_FEEDBACK, { method: "POST", headers, body: JSON.stringify(feedbackPayload) }),
  ]).catch(() => {
    // Intentionally silent — never surface monitoring failures to the user.
    // Store a PII-stripped snapshot offline for retry later (max 10 entries).
    try {
      const safe = {
        errorId: telemetry.errorId,
        message: telemetry.message,
        name: telemetry.name,
        appType: telemetry.appType,
        path: telemetry.path,
        timestamp: telemetry.timestamp,
        storedAt: Date.now(),
      };
      const pending = JSON.parse(localStorage.getItem("pendingErrorReports") || "[]");
      pending.push(safe);
      localStorage.setItem("pendingErrorReports", JSON.stringify(pending.slice(-10)));
    } catch (_) { /* localStorage unavailable — silently swallow */ }
  });
}

// ── Animations ────────────────────────────────────────────────────────────────
// Injected once into <head> — avoids Tailwind/CSS-module dependency.
let _animationsInjected = false;
function injectAnimations() {
  if (_animationsInjected || typeof document === "undefined") return;
  _animationsInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes eb-fade-up {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes eb-scale-in {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes eb-pulse-ring {
      0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
      50%      { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
    }
    .eb-card   { animation: eb-scale-in 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }
    .eb-inline { animation: eb-fade-up  0.22s ease-out both; }
    .eb-icon   { animation: eb-pulse-ring 2.4s ease-in-out infinite; }
  `;
  document.head.appendChild(style);
}

// ── Shared token shorthands ───────────────────────────────────────────────────
const T = {
  primary: "var(--primary-resonance, hsl(160,84%,39%))",
  error: "var(--color-error, hsl(0,70%,60%))",
  errorSurface: "var(--color-error-surface, rgba(220,38,38,0.08))",
  errorBorder: "var(--color-error-border, rgba(220,38,38,0.3))",
  surface: "var(--glass-surface, hsla(222,47%,11%,0.85))",
  outline: "var(--glass-outline, hsla(0,0%,100%,0.1))",
  pageBg: "var(--bg-obsidian, hsl(222,47%,4%))",
  textPrimary: "var(--text-primary, #f1f5f9)",
  textMuted: "var(--text-muted, #94a3b8)",
  radiusSm: "var(--radius-sm, 0.375rem)",
  radiusLg: "var(--radius-lg, 0.75rem)",
};

// ── Inline variant ────────────────────────────────────────────────────────────
function InlineFallback({ title, message, error, errorInfo, errorId, onReset }) {
  injectAnimations();
  const [showDetail, setShowDetail] = React.useState(false);
  const hasDev = import.meta.env?.DEV && (error || errorInfo);

  return (
    <div
      className="eb-inline"
      role="alert"
      aria-live="assertive"
      style={{
        padding: "1.25rem 1.5rem",
        borderRadius: T.radiusLg,
        background: T.errorSurface,
        border: `1px solid ${T.errorBorder}`,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.625rem" }}>
        <AlertTriangle
          aria-hidden="true"
          style={{ width: 18, height: 18, color: T.error, flexShrink: 0, marginTop: 2 }}
        />
        <p style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: T.textPrimary, lineHeight: 1.4 }}>
          {title || "Something went wrong"}
        </p>
      </div>

      {/* User-facing description */}
      <p style={{ margin: "0 0 1rem 1.625rem", fontSize: "0.875rem", color: T.textMuted, lineHeight: 1.6 }}>
        {message || "An unexpected error occurred in this section."}
      </p>

      {/* Dev detail — collapsible */}
      {hasDev && (
        <div style={{ marginBottom: "1rem", marginLeft: "1.625rem" }}>
          <button
            onClick={() => setShowDetail(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: "0.25rem",
              background: "none", border: "none", padding: 0, cursor: "pointer",
              fontSize: "0.75rem", color: T.textMuted, fontWeight: 500,
            }}
            aria-expanded={showDetail}
          >
            <ChevronDown
              aria-hidden="true"
              style={{
                width: 14, height: 14,
                transform: showDetail ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
              }}
            />
            Error details (dev only)
          </button>
          {showDetail && (
            <pre
              style={{
                marginTop: "0.5rem", padding: "0.75rem",
                background: "rgba(0,0,0,0.3)",
                borderRadius: T.radiusSm,
                fontSize: "0.6875rem", color: T.error,
                overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
                maxHeight: 240,
              }}
            >
              {[error?.toString?.(), errorInfo?.componentStack].filter(Boolean).join("\n\n")}
            </pre>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "1.625rem" }}>
        <button
          onClick={onReset}
          style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            padding: "0.375rem 0.875rem",
            borderRadius: T.radiusSm,
            background: T.primary, color: "#fff",
            border: "none", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          <RefreshCw aria-hidden="true" style={{ width: 13, height: 13 }} />
          Try Again
        </button>
        {errorId && (
          <span
            title="Reference this ID when reporting the issue"
            style={{ fontSize: "0.6875rem", color: T.textMuted, fontFamily: "monospace" }}
          >
            {errorId}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Full-screen variant ───────────────────────────────────────────────────────
function FullScreenFallback({ title, message, error, errorInfo, errorId, onReset, showHomeButton }) {
  injectAnimations();
  const [showDetail, setShowDetail] = React.useState(false);
  const hasDev = import.meta.env?.DEV && (error || errorInfo);

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: T.pageBg,
        padding: "1rem",
      }}
    >
      <div
        className="eb-card"
        style={{
          maxWidth: 460, width: "100%",
          background: T.surface,
          border: `1px solid ${T.outline}`,
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          borderRadius: T.radiusLg,
          padding: "2rem",
          // Prevent horizontal overflow on narrow viewports
          boxSizing: "border-box",
        }}
      >
        {/* Icon + heading in a flex row that wraps gracefully */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.125rem" }}>
          <div
            className="eb-icon"
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: 44, height: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(239,68,68,0.12)",
              borderRadius: "50%",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <AlertTriangle style={{ width: 22, height: 22, color: T.error }} />
          </div>
          <h1
            style={{
              margin: 0, flex: 1,
              fontSize: "clamp(1rem, 3vw, 1.25rem)",
              fontWeight: 700, color: T.textPrimary,
              lineHeight: 1.3,
              // Outfit if loaded, Inter fallback, system-ui otherwise
              fontFamily: "Outfit, Inter, system-ui, sans-serif",
            }}
          >
            {title || "Something went wrong"}
          </h1>
        </div>

        {/* Description */}
        <p style={{
          margin: "0 0 1.25rem",
          color: T.textMuted, fontSize: "0.9375rem", lineHeight: 1.65,
          fontFamily: "Inter, system-ui, sans-serif",
        }}>
          {message || "The application encountered an unexpected error. An error report has been sent to our team automatically."}
        </p>

        {/* Error ID chip */}
        {errorId && (
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.375rem",
              marginBottom: "1.25rem",
              padding: "0.375rem 0.75rem",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: T.radiusSm,
            }}
          >
            <span style={{ fontSize: "0.6875rem", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Ref
            </span>
            <span
              title="Quote this ID when contacting support"
              style={{ fontSize: "0.75rem", fontFamily: "JetBrains Mono, monospace", color: "hsl(239,84%,72%)", letterSpacing: "0.02em" }}
            >
              {errorId}
            </span>
          </div>
        )}

        {/* Dev error detail — collapsible */}
        {hasDev && (
          <div style={{ marginBottom: "1.25rem" }}>
            <button
              onClick={() => setShowDetail(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontSize: "0.8125rem", color: T.textMuted, fontWeight: 500,
                marginBottom: showDetail ? "0.5rem" : 0,
              }}
              aria-expanded={showDetail}
            >
              <ChevronDown
                aria-hidden="true"
                style={{
                  width: 15, height: 15,
                  transform: showDetail ? "rotate(180deg)" : "none",
                  transition: "transform 0.18s",
                }}
              />
              Error details <span style={{ fontSize: "0.6875rem", opacity: 0.6 }}>(dev only)</span>
            </button>
            {showDetail && (
              <pre
                style={{
                  padding: "0.875rem",
                  background: "rgba(0,0,0,0.45)",
                  borderRadius: T.radiusSm,
                  border: `1px solid ${T.errorBorder}`,
                  fontSize: "0.6875rem", color: T.error,
                  overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
                  maxHeight: 280, overflowY: "auto",
                }}
              >
                {[error?.toString?.(), errorInfo?.componentStack].filter(Boolean).join("\n\n")}
              </pre>
            )}
          </div>
        )}

        {/* Actions — "Try Again" is primary for full-screen too */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {onReset && (
            <button
              onClick={onReset}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                padding: "0.65rem 1rem",
                borderRadius: T.radiusSm,
                background: T.primary, color: "#fff",
                border: "none", fontWeight: 600, fontSize: "0.9375rem", cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <RefreshCw aria-hidden="true" style={{ width: 16, height: 16 }} />
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              padding: "0.65rem 1rem",
              borderRadius: T.radiusSm,
              // Secondary: glass outline style
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${T.outline}`,
              color: T.textMuted,
              fontWeight: 600, fontSize: "0.9375rem", cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          >
            <RefreshCw aria-hidden="true" style={{ width: 16, height: 16 }} />
            Reload Page
          </button>
          {showHomeButton && (
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                padding: "0.5rem 1rem",
                background: "transparent", color: T.textMuted,
                border: "none", fontWeight: 500, fontSize: "0.875rem", cursor: "pointer",
                opacity: 0.75, transition: "opacity 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.75")}
            >
              <Home aria-hidden="true" style={{ width: 14, height: 14 }} />
              Go to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Unified ErrorBoundary ─────────────────────────────────────────────────────
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError() {
    // Signal the error before componentDidCatch fires, so React can suspend.
    // Do NOT set error here — getDerivedStateFromError receives no errorInfo.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = buildErrorId(error?.message, window?.location?.pathname);
    this.setState({ error, errorInfo, errorId });

    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", { errorId, error, componentStack: errorInfo?.componentStack });
    }

    // ── Dual reporting: always, fire-and-forget ───────────────────────────────
    const telemetry = collectTelemetry(error, errorInfo, this.props.appType);
    reportError({ ...telemetry, errorId }, this.props.appType);

    // Optional parent callback
    this.props.onError?.(error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
    this.props.onReset?.();
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    // ── Custom render prop (highest priority) ─────────────────────────────────
    if (this.props.fallback) {
      return this.props.fallback({
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        errorId: this.state.errorId,
        reset: this.handleReset,
      });
    }

    const shared = {
      title: this.props.title,
      message: this.props.message,
      error: this.state.error,
      errorInfo: this.state.errorInfo,
      errorId: this.state.errorId,
      onReset: this.handleReset,
      // Full-screen shows Home button by default; inline does not (it's inside a page).
      showHomeButton: this.props.showHomeButton ?? (this.props.variant !== "inline"),
    };

    // ── Full-screen (app root) vs inline (feature section) ───────────────────
    return this.props.variant === "inline"
      ? <InlineFallback {...shared} />
      : <FullScreenFallback {...shared} />;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  /** "full-screen" (default) for app roots; "inline" for feature sections */
  variant: PropTypes.oneOf(["full-screen", "inline"]),
  /** Custom render prop — receives { error, errorInfo, errorId, reset } */
  fallback: PropTypes.func,
  /** Identifies the app for telemetry tagging. Falls back to VITE_APP_TYPE. */
  appType: PropTypes.string,
  onError: PropTypes.func,
  onReset: PropTypes.func,
  title: PropTypes.string,
  message: PropTypes.string,
  /** Override the "Go to Home" button visibility. Defaults to true for full-screen, false for inline. */
  showHomeButton: PropTypes.bool,
};

export default ErrorBoundary;
