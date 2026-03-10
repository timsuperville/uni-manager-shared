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
 *   1. POST /api/v1/errors/log     → ErrorLog collection (Error Resonance dashboard)
 *   2. POST /api/v1/feedback/submit → FeedbackReport collection (Sentiment Feed)
 *
 * Both use raw fetch (NOT @shared/api) because:
 *   a) The boundary may be mounted BEFORE ApiProvider is in the tree.
 *   b) installFetchInterceptor() wraps window.fetch — using ApiClient here
 *      would create a self-reporting loop if the ApiClient itself throws.
 *   c) The monitor must survive even when the ApiClient is the error source.
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
 *   <ErrorBoundary fallback={({ error, reset }) => <MyFallback ... />}>
 *     <Widget />
 *   </ErrorBoundary>
 */

import React from "react";
import PropTypes from "prop-types";
import { AlertTriangle, RefreshCw } from "lucide-react";

// ── Ingest endpoints ──────────────────────────────────────────────────────────
// Intentionally RELATIVE paths — never construct an absolute URL here.
// In dev:  Vite proxy routes /api/v1 → http://localhost:5000/api/v1
// In prod: nginx routes /api/v1     → backend
// VITE_API_URL is for cross-origin staging only and belongs in ApiClient config,
// not in fire-and-forget monitoring fetches. See frontend/vite-proxy.js.
const INGEST_ERRORS = "/api/v1/errors/log";
const INGEST_FEEDBACK = "/api/v1/feedback/submit";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAuthToken(appType) {
  const namespaces = [appType, "admin", "home", "church", "personal", "business", "uni"].filter(Boolean);
  for (const ns of namespaces) {
    const token =
      window.sessionStorage?.getItem(`${ns}_auth_access_token`) ||
      window.localStorage?.getItem(`${ns}_auth_access_token`);
    if (token) return token;
  }
  return null;
}

function getUserContext() {
  try {
    let userInfo = {};
    const rawUser = localStorage.getItem("user");
    if (rawUser) { try { userInfo = JSON.parse(rawUser); } catch (_) { } }
    if (!userInfo.id) {
      const crossApp = localStorage.getItem("uni_manager_auth");
      if (crossApp) { try { const p = JSON.parse(crossApp); userInfo = p.user || p; } catch (_) { } }
    }
    return {
      isAuthenticated: !!(userInfo.id || userInfo._id),
      userId: userInfo.id || userInfo._id || null,
      userEmail: userInfo.email || userInfo.userEmail || null,
      userRole: userInfo.role || null,
    };
  } catch (_) { return {}; }
}

function collectTelemetry(error, errorInfo, appType) {
  const user = getUserContext();
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
    url: window.location.href,
    path: window.location.pathname,

    // User (promote to top-level for ErrorLog schema)
    userId: user.userId,
    userEmail: user.userEmail,
    userContext: user,

    // Browser snapshot
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    screen: { width: screen.width, height: screen.height },

    // Performance (non-blocking, best-effort)
    memoryMB: performance?.memory
      ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
      : null,
  };
}

async function reportError(telemetry, appType) {
  const token = getAuthToken(appType);
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const feedbackPayload = {
    type: "error-report",
    priority: "urgent",
    category: "bug",
    title: `[Auto] Crash: ${telemetry.message}`,
    description: [
      `Error: ${telemetry.message}`,
      "",
      "Component Stack:",
      telemetry.componentStack || "(unavailable)",
    ].join("\n"),
    metadata: {
      autoGenerated: true,
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
    // Intentionally silent — never surface monitoring failures to the user
    try {
      const pending = JSON.parse(localStorage.getItem("pendingErrorReports") || "[]");
      pending.push({ ...telemetry, storedAt: Date.now() });
      localStorage.setItem("pendingErrorReports", JSON.stringify(pending.slice(-10)));
    } catch (_) { }
  });
}

// ── Fallback UI ───────────────────────────────────────────────────────────────
function InlineFallback({ title, message, error, onReset, showHomeButton }) {
  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: "var(--radius-lg, 0.75rem)",
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.25)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <AlertTriangle style={{ width: 20, height: 20, color: "var(--color-error, #ef4444)", flexShrink: 0 }} />
        <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary, #f1f5f9)" }}>
          {title || "Something went wrong"}
        </h3>
      </div>
      <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "var(--text-muted, #94a3b8)" }}>
        {message || "An unexpected error occurred. Please try refreshing."}
      </p>
      {import.meta.env?.DEV && error && (
        <details style={{ marginBottom: "1rem" }}>
          <summary style={{ fontSize: "0.8125rem", cursor: "pointer", color: "var(--text-muted, #94a3b8)" }}>
            Error details (dev only)
          </summary>
          <pre style={{ fontSize: "0.75rem", color: "var(--color-error, #ef4444)", overflowX: "auto", margin: "0.5rem 0 0" }}>
            {error.toString()}
          </pre>
        </details>
      )}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={onReset}
          style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            padding: "0.4rem 0.9rem", borderRadius: "var(--radius-sm, 0.375rem)",
            background: "var(--primary-resonance, #6366f1)", color: "#fff",
            border: "none", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer",
          }}
        >
          <RefreshCw style={{ width: 14, height: 14 }} /> Try Again
        </button>
        {showHomeButton && (
          <button
            onClick={() => (window.location.href = "/")}
            style={{
              padding: "0.4rem 0.9rem", borderRadius: "var(--radius-sm, 0.375rem)",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
              color: "var(--text-muted, #94a3b8)", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer",
            }}
          >
            Go Home
          </button>
        )}
      </div>
    </div>
  );
}

function FullScreenFallback({ title, message, error, errorId, onReset, showHomeButton }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--page-bg, #0a0a1a)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          maxWidth: 448, width: "100%",
          background: "var(--glass-surface, rgba(15,15,35,0.85))",
          border: "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderRadius: "var(--radius-lg, 0.75rem)",
          padding: "2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ padding: "0.5rem", background: "rgba(239,68,68,0.15)", borderRadius: "50%" }}>
            <AlertTriangle style={{ width: 24, height: 24, color: "var(--color-error, #ef4444)" }} />
          </div>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary, #f1f5f9)" }}>
            {title || "Something went wrong"}
          </h2>
        </div>

        <p style={{ margin: "0 0 1rem", color: "var(--text-muted, #94a3b8)", fontSize: "0.9375rem" }}>
          {message || "The application encountered an error. An error report has been sent automatically."}
        </p>

        {/* Error ID — useful for cross-referencing with Error Resonance dashboard */}
        {errorId && (
          <div
            style={{
              marginBottom: "1.25rem", padding: "0.75rem",
              background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-sm, 0.375rem)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)" }}>
              Error ID: <span style={{ fontFamily: "monospace", color: "var(--primary-resonance, #6366f1)" }}>{errorId}</span>
            </p>
          </div>
        )}

        {import.meta.env?.DEV && error && (
          <details style={{ marginBottom: "1.25rem", padding: "0.75rem", background: "rgba(239,68,68,0.06)", borderRadius: "var(--radius-sm, 0.375rem)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <summary style={{ cursor: "pointer", fontSize: "0.8125rem", color: "var(--text-muted, #94a3b8)", fontWeight: 500 }}>
              Error Details (dev only)
            </summary>
            <pre style={{ fontSize: "0.75rem", color: "var(--color-error, #ef4444)", overflowX: "auto", marginTop: "0.5rem" }}>
              {error.toString()}
            </pre>
          </details>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.6rem 1rem", borderRadius: "var(--radius-sm, 0.375rem)",
              background: "var(--primary-resonance, #6366f1)", color: "#fff",
              border: "none", fontWeight: 600, fontSize: "0.9375rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} /> Reload Application
          </button>
          {onReset && (
            <button
              onClick={onReset}
              style={{
                padding: "0.6rem 1rem", borderRadius: "var(--radius-sm, 0.375rem)",
                background: "rgba(255,255,255,0.07)", color: "var(--text-muted, #94a3b8)",
                border: "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
                fontWeight: 600, fontSize: "0.9375rem", cursor: "pointer",
              }}
            >
              Try Again
            </button>
          )}
          {showHomeButton && (
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                padding: "0.6rem 1rem", borderRadius: "var(--radius-sm, 0.375rem)",
                background: "transparent", color: "var(--text-muted, #94a3b8)",
                border: "none", fontWeight: 500, fontSize: "0.875rem", cursor: "pointer",
              }}
            >
              Go Home
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
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });

    if (import.meta.env?.DEV) {
      console.error("[ErrorBoundary]", error, errorInfo);
    }

    // Generate a stable, short ID for this specific crash
    const errorId = `ERR-${btoa(
      `${error?.message || ""}-${window.location.pathname}-${Date.now()}`
    ).replace(/[^a-zA-Z0-9]/g, "").substring(0, 12)}`;
    this.setState({ errorId });

    // ── Dual reporting: always, fire-and-forget ───────────────────────────────
    const telemetry = collectTelemetry(error, errorInfo, this.props.appType);
    reportError({ ...telemetry, errorId }, this.props.appType);

    // Optional callback for the parent to handle additional logic
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
    if (this.props.onReset) this.props.onReset();
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    // ── Render prop (highest priority) ───────────────────────────────────────
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
      errorId: this.state.errorId,
      onReset: this.handleReset,
      showHomeButton: this.props.showHomeButton !== false,
    };

    // ── Full-screen (app root) vs inline (feature section) ───────────────────
    return this.props.variant === "inline"
      ? <InlineFallback {...shared} />
      : <FullScreenFallback {...shared} />;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  /** "full-screen" (default) for app roots, "inline" for feature sections */
  variant: PropTypes.oneOf(["full-screen", "inline"]),
  /** Custom render prop — receives { error, errorInfo, errorId, reset } */
  fallback: PropTypes.func,
  /** Identifies the app for telemetry tagging. Prefer VITE_APP_TYPE if omitted. */
  appType: PropTypes.string,
  /** Optional name for dev logs (e.g. appName="church") */
  appName: PropTypes.string,
  onError: PropTypes.func,
  onReset: PropTypes.func,
  title: PropTypes.string,
  message: PropTypes.string,
  showHomeButton: PropTypes.bool,
};

export default ErrorBoundary;
