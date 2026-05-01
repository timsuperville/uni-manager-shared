import React from "react";
import { AlertTriangle, RefreshCw, Home, ChevronDown } from "lucide-react";

// ── Animations ────────────────────────────────────────────────────────────────
let _animationsInjected = false;
function injectAnimations(): void {
  if (_animationsInjected || typeof document === "undefined") return;
  _animationsInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes eb-fade-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes eb-scale-in { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
    @keyframes eb-pulse-ring { 0%,100% { box-shadow:0 0 0 0 rgba(239,68,68,0.4); } 50% { box-shadow:0 0 0 8px rgba(239,68,68,0); } }
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

// ── Fallback prop shapes ───────────────────────────────────────────────────────
export interface FallbackProps {
  title?: string;
  message?: string;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
  onReset: () => void;
  showHomeButton?: boolean;
}

// ── Inline variant ────────────────────────────────────────────────────────────
export function InlineFallback({
  title,
  message,
  error,
  errorInfo,
  errorId,
  onReset,
  showHomeButton,
}: FallbackProps) {
  injectAnimations();
  const [showDetail, setShowDetail] = React.useState(false);
  const hasDev = (import.meta as any).env?.DEV && (error || errorInfo);

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
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.625rem",
          marginBottom: "0.625rem",
        }}
      >
        <AlertTriangle
          aria-hidden="true"
          style={{
            width: 18,
            height: 18,
            color: T.error,
            flexShrink: 0,
            marginTop: 2,
          }}
        />
        <p
          style={{
            margin: 0,
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: T.textPrimary,
            lineHeight: 1.4,
          }}
        >
          {title || "Something went wrong"}
        </p>
      </div>
      <p
        style={{
          margin: "0 0 1rem 1.625rem",
          fontSize: "0.875rem",
          color: T.textMuted,
          lineHeight: 1.6,
        }}
      >
        {message || "An unexpected error occurred in this section."}
      </p>
      {hasDev && (
        <div style={{ marginBottom: "1rem", marginLeft: "1.625rem" }}>
          <button
            onClick={() => setShowDetail((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: "0.75rem",
              color: T.textMuted,
              fontWeight: 500,
            }}
            aria-expanded={showDetail}
          >
            <ChevronDown
              aria-hidden="true"
              style={{
                width: 14,
                height: 14,
                transform: showDetail ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
              }}
            />
            Error details (dev only)
          </button>
          {showDetail && (
            <pre
              style={{
                marginTop: "0.5rem",
                padding: "0.75rem",
                background: "rgba(0,0,0,0.3)",
                borderRadius: T.radiusSm,
                fontSize: "0.6875rem",
                color: T.error,
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: 240,
              }}
            >
              {[error?.toString?.(), errorInfo?.componentStack]
                .filter(Boolean)
                .join("\\n\\n")}
            </pre>
          )}
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginLeft: "1.625rem",
        }}
      >
        <button
          onClick={onReset}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.375rem 0.875rem",
            borderRadius: T.radiusSm,
            background: T.primary,
            color: "#fff",
            border: "none",
            fontWeight: 600,
            fontSize: "0.8125rem",
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <RefreshCw aria-hidden="true" style={{ width: 13, height: 13 }} />
          Try Again
        </button>
        {showHomeButton && (
          <button
            onClick={() => (window.location.href = "/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.375rem 0.875rem",
              borderRadius: T.radiusSm,
              background: "transparent",
              color: T.textMuted,
              border: `1px solid ${T.outline}`,
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Home aria-hidden="true" style={{ width: 13, height: 13 }} />
            Home
          </button>
        )}
        {errorId && (
          <span
            title="Reference this ID when reporting the issue"
            style={{
              fontSize: "0.6875rem",
              color: T.textMuted,
              fontFamily: "monospace",
              marginLeft: "auto",
            }}
          >
            {errorId}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Full-screen variant ───────────────────────────────────────────────────────
export function FullScreenFallback({
  title,
  message,
  error,
  errorInfo,
  errorId,
  onReset,
  showHomeButton,
}: FallbackProps) {
  injectAnimations();
  const [showDetail, setShowDetail] = React.useState(false);
  const hasDev = (import.meta as any).env?.DEV && (error || errorInfo);

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: T.pageBg,
        padding: "1rem",
      }}
    >
      <div
        className="eb-card"
        style={{
          maxWidth: 460,
          width: "100%",
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
            marginBottom: "1.125rem",
          }}
        >
          <div
            className="eb-icon"
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(239,68,68,0.12)",
              borderRadius: "50%",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <AlertTriangle style={{ width: 22, height: 22, color: T.error }} />
          </div>
          <h1
            style={{
              margin: 0,
              flex: 1,
              fontSize: "clamp(1rem, 3vw, 1.25rem)",
              fontWeight: 700,
              color: T.textPrimary,
              lineHeight: 1.3,
              fontFamily: "Outfit, Inter, system-ui, sans-serif",
            }}
          >
            {title || "Something went wrong"}
          </h1>
        </div>
        <p
          style={{
            margin: "0 0 1.25rem",
            color: T.textMuted,
            fontSize: "0.9375rem",
            lineHeight: 1.65,
          }}
        >
          {message ||
            "The application encountered an unexpected error. An error report has been sent to our team automatically."}
        </p>
        {errorId && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              marginBottom: "1.25rem",
              padding: "0.375rem 0.75rem",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: T.radiusSm,
            }}
          >
            <span
              style={{
                fontSize: "0.6875rem",
                color: T.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Ref
            </span>
            <span
              title="Quote this ID when contacting support"
              style={{
                fontSize: "0.75rem",
                fontFamily: "JetBrains Mono, monospace",
                color: "hsl(239,84%,72%)",
                letterSpacing: "0.02em",
              }}
            >
              {errorId}
            </span>
          </div>
        )}
        {hasDev && (
          <div style={{ marginBottom: "1.25rem" }}>
            <button
              onClick={() => setShowDetail((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontSize: "0.8125rem",
                color: T.textMuted,
                fontWeight: 500,
                marginBottom: showDetail ? "0.5rem" : 0,
              }}
              aria-expanded={showDetail}
            >
              <ChevronDown
                aria-hidden="true"
                style={{
                  width: 15,
                  height: 15,
                  transform: showDetail ? "rotate(180deg)" : "none",
                  transition: "transform 0.18s",
                }}
              />
              Error details{" "}
              <span style={{ fontSize: "0.6875rem", opacity: 0.6 }}>
                (dev only)
              </span>
            </button>
            {showDetail && (
              <pre
                style={{
                  padding: "0.875rem",
                  background: "rgba(0,0,0,0.45)",
                  borderRadius: T.radiusSm,
                  border: `1px solid ${T.errorBorder}`,
                  fontSize: "0.6875rem",
                  color: T.error,
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  maxHeight: 280,
                  overflowY: "auto",
                }}
              >
                {[error?.toString?.(), errorInfo?.componentStack]
                  .filter(Boolean)
                  .join("\\n\\n")}
              </pre>
            )}
          </div>
        )}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {onReset && (
            <button
              onClick={onReset}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.65rem 1rem",
                borderRadius: T.radiusSm,
                background: T.primary,
                color: "#fff",
                border: "none",
                fontWeight: 600,
                fontSize: "0.9375rem",
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <RefreshCw aria-hidden="true" style={{ width: 16, height: 16 }} />
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.65rem 1rem",
              borderRadius: T.radiusSm,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${T.outline}`,
              color: T.textMuted,
              fontWeight: 600,
              fontSize: "0.9375rem",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.09)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
            }
          >
            <RefreshCw aria-hidden="true" style={{ width: 16, height: 16 }} />
            Reload Page
          </button>
          {showHomeButton && (
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.375rem",
                padding: "0.5rem 1rem",
                background: "transparent",
                color: T.textMuted,
                border: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                opacity: 0.75,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
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
