/**
 * ErrorBoundary — Unified React error boundary for the Uni-Manager ecosystem.
 *
 * ── Reporting architecture ────────────────────────────────────────────────────
 * On any caught error the boundary fires two parallel, fire-and-forget requests:
 *   1. POST /api/v1/errors/log      → ErrorLog collection (Error Resonance)
 *   2. POST /api/v1/feedback/submit → FeedbackReport collection (Sentiment Feed)
 *
 * Both use raw fetch (NOT @shared/api) because:
 *   a) The boundary may mount BEFORE ApiProvider is in the tree.
 *   b) installFetchInterceptor() wraps window.fetch — using ApiClient here
 *      would create a self-reporting loop if ApiClient itself throws.
 *   c) The monitor must survive even when ApiClient is the error source.
 *
 * Both paths are RELATIVE — Vite proxy handles dev, nginx handles prod.
 * See frontend/vite-proxy.js. Do NOT introduce VITE_API_URL here.
 *
 * ── Payload contract ─────────────────────────────────────────────────────────
 * The backend ErrorLog schema has a fixed set of indexed top-level fields plus
 * a `meta: Mixed` escape hatch for arbitrary context. We MUST keep the top-level
 * payload to schema fields only — extra fields at the root are silently dropped
 * by Mongoose because the service destructures only known keys.
 *
 *   Top-level (stored/indexed): message, stack, componentStack, severity,
 *     category, url, path, userAgent, userId, userEmail, appType, environment,
 *     errorId, name
 *   meta (Mixed, full advanced context): performanceInfo, browserContext,
 *     capabilities, recentActivity, viewport, userContext
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
 *   <ErrorBoundary fallback={({ error, errorId, reset }) => <MyFallback />}>
 *     <Widget />
 *   </ErrorBoundary>
 */

import React from "react";
import PropTypes from "prop-types";
import { AlertTriangle, RefreshCw, Home, ChevronDown } from "lucide-react";
import { getAuthToken } from "../utils/authToken.js";

// collectAdvancedErrorContext is imported lazily (dynamic import) to avoid a
// circular dependency: ErrorMonitoring re-exports ErrorBoundary from this file.
// Dynamic import resolves after module graph is built — safe in componentDidCatch.
let _collectAdvanced = null;
import("../features/monitoring/ErrorMonitoring.jsx")
  .then((m) => { _collectAdvanced = m.collectAdvancedErrorContext; })
  .catch(() => { /* monitoring module unavailable — degrade gracefully */ });

// ── Ingest endpoints ──────────────────────────────────────────────────────────
// Intentionally RELATIVE paths — Vite proxy routes /api/v1 → backend in dev,
// nginx routes in prod. See frontend/vite-proxy.js and shared/api/config/apiConfig.ts.
const INGEST_ERRORS = "/api/v1/errors/log";
const INGEST_FEEDBACK = "/api/v1/feedback/submit";

// ── Environment normalisation ─────────────────────────────────────────────────
// The ErrorLog schema only accepts 'development' | 'production'.
// "staging" and any future env names map to "production" (production-like behaviour:
// longer retention, alert emails triggered). Never let "staging" through as a raw
// string — it fails the Mongoose enum validator and the document is silently dropped.
function normaliseEnvironment(mode) {
  if (mode === "development") return "development";
  return "production"; // production, staging, preview, test, etc.
}

// ── Error ID ─────────────────────────────────────────────────────────────────
// btoa() throws on non-Latin-1 characters (emoji, Cyrillic, etc. in error messages).
// FNV-1a XOR hash: never throws, always 8 hex chars, sub-microsecond.
function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// errorId is intentionally unique per crash instance (includes timestamp) so
// support staff can look up the exact occurrence. groupId deduplication is
// handled server-side using MD5 of appType + message + stack.
function buildErrorId(message, pathname, appType) {
  const seed = `${message || "unknown"}-${pathname}-${appType}-${Date.now()}`;
  return `ERR-${hashString(seed).toUpperCase()}`;
}

// ── User context ──────────────────────────────────────────────────────────────
function getUserContext() {
  try {
    let userInfo = {};
    for (const key of ["user", "uni_manager_auth", "auth_user"]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        userInfo = parsed?.user || parsed || {};
        if (userInfo.id || userInfo._id) break;
      } catch (_) { /* malformed JSON */ }
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

// ── Telemetry ─────────────────────────────────────────────────────────────────
// Produces a payload that maps cleanly to the ErrorLog schema.
// Advanced context (performanceInfo, browserContext, capabilities, recentActivity)
// is added to `meta` by reportError() after _collectAdvanced resolves — this
// is the ONLY field the backend passes as-is (Mixed type, no schema validation).
function collectTelemetry(error, errorInfo, appType) {
  const user = getUserContext();

  // typeof guards — safe in SSR / jsdom / Worker environments
  const w = typeof window !== "undefined" ? window : null;
  const n = typeof navigator !== "undefined" ? navigator : null;
  const s = typeof screen !== "undefined" ? screen : null;
  const p = typeof performance !== "undefined" ? performance : null;

  return {
    // ── Schema top-level fields ───────────────────────────────────────────────
    message: error?.message || "Unknown error",
    stack: error?.stack || "",
    componentStack: errorInfo?.componentStack || "",
    severity: "critical",
    category: "rendering",

    // environment MUST be 'development' | 'production' — see normaliseEnvironment()
    appType: appType || import.meta?.env?.VITE_APP_TYPE || "unknown",
    environment: normaliseEnvironment(import.meta?.env?.MODE),
    timestamp: new Date().toISOString(),

    url: w?.location.href || "",
    path: w?.location.pathname || "",

    userAgent: n?.userAgent || "",

    // User (top-level for ErrorLog schema — backend uses req.user if available)
    userId: user.userId,
    userEmail: user.userEmail,

    // ── meta: everything the schema doesn't index but we want to store ────────
    meta: {
      userContext: user,
      viewport: w ? { width: w.innerWidth, height: w.innerHeight } : null,
      screen: s ? { width: s.width, height: s.height } : null,
      memoryMB: p?.memory
        ? Math.round(p.memory.usedJSHeapSize / 1024 / 1024)
        : null,
    },
  };
}

// ── Offline report flush ──────────────────────────────────────────────────────
// When a report fails (network down), we store a PII-stripped snapshot.
// This function retries them once the network comes back or the tab is re-focused.
// Called from setupOfflineFlush() in ErrorMonitoring — registered once at startup.
export function flushPendingErrorReports(appType) {
  if (typeof localStorage === "undefined") return;
  try {
    const pending = JSON.parse(localStorage.getItem("pendingErrorReports") || "[]");
    if (!pending.length) return;

    // Clear immediately — we attempt once, no retry loops on second failure.
    localStorage.removeItem("pendingErrorReports");

    const token = getAuthToken(appType || import.meta?.env?.VITE_APP_TYPE);
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    pending.forEach((report) => {
      fetch(INGEST_ERRORS, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...report, _retried: true }),
      }).catch(() => { /* still failing — drop silently, don't re-queue */ });
    });
  } catch (_) { /* localStorage unavailable */ }
}

// ── Reporting ─────────────────────────────────────────────────────────────────
function reportError(telemetry, appType) {
  const token = getAuthToken(appType);
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Merge advanced context into `meta` if the monitoring module has loaded.
  // _collectAdvanced wraps the entire payload — extract only the advanced fields
  // and merge them into meta so we don't clobber top-level schema fields.
  let fullMeta = { ...telemetry.meta };
  if (_collectAdvanced) {
    const advanced = _collectAdvanced({});
    fullMeta = {
      ...fullMeta,
      performanceInfo: advanced.performanceInfo || null,
      browserContext: advanced.browserContext || null,
      capabilities: advanced.capabilities || null,
      recentActivity: advanced.recentActivity || [],
    };
  }

  const ingestPayload = { ...telemetry, meta: fullMeta };

  const feedbackPayload = {
    type: "error-report",
    priority: "urgent",
    category: "bug",
    title: `[Auto] Crash: ${telemetry.message}`,
    description: [
      `**Error:** ${telemetry.message}`,
      `**Error ID:** ${telemetry.errorId || "(none)"}`,
      `**App:** ${telemetry.appType}  **Path:** ${telemetry.path}`,
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

  Promise.all([
    fetch(INGEST_ERRORS, { method: "POST", headers, body: JSON.stringify(ingestPayload) }),
    fetch(INGEST_FEEDBACK, { method: "POST", headers, body: JSON.stringify(feedbackPayload) }),
  ]).catch(() => {
    // Network unavailable — store PII-stripped snapshot for retry.
    // Never store full telemetry (stack traces, userEmail) in localStorage.
    try {
      const safe = {
        errorId: telemetry.errorId,
        message: telemetry.message,
        severity: telemetry.severity,
        category: telemetry.category,
        appType: telemetry.appType,
        path: telemetry.path,
        timestamp: telemetry.timestamp,
        environment: telemetry.environment,
      };
      const pending = JSON.parse(localStorage.getItem("pendingErrorReports") || "[]");
      pending.push(safe);
      localStorage.setItem("pendingErrorReports", JSON.stringify(pending.slice(-10)));
    } catch (_) { /* localStorage unavailable */ }
  });
}

// ── Animations (injected once) ────────────────────────────────────────────────
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

// ── Design tokens ─────────────────────────────────────────────────────────────
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
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.625rem" }}>
        <AlertTriangle
          aria-hidden="true"
          style={{ width: 18, height: 18, color: T.error, flexShrink: 0, marginTop: 2 }}
        />
        <p style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: T.textPrimary, lineHeight: 1.4 }}>
          {title || "Something went wrong"}
        </p>
      </div>

      <p style={{ margin: "0 0 1rem 1.625rem", fontSize: "0.875rem", color: T.textMuted, lineHeight: 1.6 }}>
        {message || "An unexpected error occurred in this section."}
      </p>

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
              style={{ width: 14, height: 14, transform: showDetail ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
            />
            Error details (dev only)
          </button>
          {showDetail && (
            <pre
              style={{
                marginTop: "0.5rem", padding: "0.75rem",
                background: "rgba(0,0,0,0.3)", borderRadius: T.radiusSm,
                fontSize: "0.6875rem", color: T.error,
                overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 240,
              }}
            >
              {[error?.toString?.(), errorInfo?.componentStack].filter(Boolean).join("\n\n")}
            </pre>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "1.625rem" }}>
        <button
          onClick={onReset}
          style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            padding: "0.375rem 0.875rem", borderRadius: T.radiusSm,
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
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.125rem" }}>
          <div
            className="eb-icon"
            aria-hidden="true"
            style={{
              flexShrink: 0, width: 44, height: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(239,68,68,0.12)", borderRadius: "50%",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <AlertTriangle style={{ width: 22, height: 22, color: T.error }} />
          </div>
          <h1
            style={{
              margin: 0, flex: 1,
              fontSize: "clamp(1rem, 3vw, 1.25rem)", fontWeight: 700,
              color: T.textPrimary, lineHeight: 1.3,
              fontFamily: "Outfit, Inter, system-ui, sans-serif",
            }}
          >
            {title || "Something went wrong"}
          </h1>
        </div>

        <p style={{ margin: "0 0 1.25rem", color: T.textMuted, fontSize: "0.9375rem", lineHeight: 1.65, fontFamily: "Inter, system-ui, sans-serif" }}>
          {message || "The application encountered an unexpected error. An error report has been sent to our team automatically."}
        </p>

        {errorId && (
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.375rem",
              marginBottom: "1.25rem", padding: "0.375rem 0.75rem",
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: T.radiusSm,
            }}
          >
            <span style={{ fontSize: "0.6875rem", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ref</span>
            <span title="Quote this ID when contacting support" style={{ fontSize: "0.75rem", fontFamily: "JetBrains Mono, monospace", color: "hsl(239,84%,72%)", letterSpacing: "0.02em" }}>
              {errorId}
            </span>
          </div>
        )}

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
                style={{ width: 15, height: 15, transform: showDetail ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}
              />
              Error details <span style={{ fontSize: "0.6875rem", opacity: 0.6 }}>(dev only)</span>
            </button>
            {showDetail && (
              <pre
                style={{
                  padding: "0.875rem", background: "rgba(0,0,0,0.45)",
                  borderRadius: T.radiusSm, border: `1px solid ${T.errorBorder}`,
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

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {onReset && (
            <button
              onClick={onReset}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                padding: "0.65rem 1rem", borderRadius: T.radiusSm,
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
              padding: "0.65rem 1rem", borderRadius: T.radiusSm,
              background: "rgba(255,255,255,0.05)", border: `1px solid ${T.outline}`,
              color: T.textMuted, fontWeight: 600, fontSize: "0.9375rem", cursor: "pointer",
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
                padding: "0.5rem 1rem", background: "transparent", color: T.textMuted,
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
    this.state = { hasError: false, error: null, errorInfo: null, errorId: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const appType = this.props.appType || import.meta?.env?.VITE_APP_TYPE || "unknown";
    const errorId = buildErrorId(error?.message, window?.location?.pathname, appType);
    this.setState({ error, errorInfo, errorId });

    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", { errorId, error, componentStack: errorInfo?.componentStack });
    }

    const telemetry = collectTelemetry(error, errorInfo, appType);
    reportError({ ...telemetry, errorId }, appType);

    this.props.onError?.(error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
    this.props.onReset?.();
  }

  render() {
    if (!this.state.hasError) return this.props.children;

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
      showHomeButton: this.props.showHomeButton ?? (this.props.variant !== "inline"),
    };

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
  /** Defaults true for full-screen, false for inline. */
  showHomeButton: PropTypes.bool,
};

export default ErrorBoundary;
