// FeedbackQuickAction — Shared Feedback Submission Component
// Variants:
//   "sidebar-item" — pinned nav row for sidebar footer (preferred for sidebar apps)
//   "button"       — inline button for header placement
//   "floating"     — FAB, only for apps without a persistent sidebar (e.g. playback)
//
// Uses inline styles throughout to avoid Tailwind JIT scanning gaps in shared/.

import React, { useState } from "react";

// ─── Feedback Modal ────────────────────────────────────────────────────────────
function FeedbackModal({ onClose, appType }) {
  const [feedback, setFeedback] = useState({
    type: "general",
    priority: "medium",
    category: "feedback",
    title: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Map frontend type values → FeedbackReport.type enum
      // Allowed: 'user-feedback' | 'error-report' | 'broken-link' | 'performance-issue'
      const typeMap = {
        general: "user-feedback",
        bug_report: "error-report",
        feature_request: "user-feedback",
        improvement: "user-feedback",
        question: "user-feedback",
      };

      // Map frontend type → FeedbackReport.category enum
      // Allowed: 'bug' | 'feature' | 'improvement' | 'other'
      const categoryFromType = {
        general: "other",
        bug_report: "bug",
        feature_request: "feature",
        improvement: "improvement",
        question: "other",
      };

      // Map frontend priority string → FeedbackReport.severity enum
      // Allowed: 'low' | 'medium' | 'high' | 'critical'
      const severityMap = {
        low: "low",
        medium: "medium",
        high: "high",
        urgent: "critical",
      };

      const appName =
        appType ||
        (typeof window !== "undefined" && import.meta?.env?.VITE_APP_TYPE) ||
        "unknown";
      const env =
        typeof window !== "undefined" && import.meta?.env?.MODE === "production"
          ? "production"
          : "development";

      // ── Token — probe sessionStorage then localStorage with app namespace ──
      // TokenStorage stores tokens as {namespace}_auth_access_token.
      // Try the current app first, then all known apps as fallback.
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

      // ── Path — strip Vite BASE_URL so we record the in-app route ──────────
      // e.g. full pathname '/admin/dashboard' with base '/admin/' → '/dashboard'
      const fullPathname =
        typeof window !== "undefined" ? window.location.pathname : "/";
      const base = import.meta?.env?.BASE_URL || "/";
      const inAppPath = fullPathname.startsWith(base)
        ? "/" + fullPathname.slice(base.length)
        : fullPathname;

      // Build the structured FeedbackReport payload the backend expects
      const payload = {
        type: typeMap[feedback.type] || "user-feedback",
        category: categoryFromType[feedback.type] || "other",
        severity: severityMap[feedback.priority] || "medium",
        userInput: {
          title: feedback.title,
          description: feedback.description,
          allowContact: false,
        },
        systemContext: {
          page: {
            url:
              typeof window !== "undefined" ? window.location.href : "unknown",
            path: inAppPath,
            referrer: typeof document !== "undefined" ? document.referrer : "",
            timestamp: new Date().toISOString(),
          },
          browser: {
            userAgent:
              typeof navigator !== "undefined"
                ? navigator.userAgent
                : "unknown",
            viewport: {
              width: typeof window !== "undefined" ? window.innerWidth : 0,
              height: typeof window !== "undefined" ? window.innerHeight : 0,
            },
            language:
              typeof navigator !== "undefined" ? navigator.language : "",
            timezone:
              Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone || "",
          },
          application: {
            name: appName,
            environment: env,
          },
        },
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
          onClose();
          setSubmitted(false);
        }, 2000);
      } else {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `Server error ${response.status}`);
      }
    } catch (_err) {
      alert(`Failed to submit feedback: ${_err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Shared input style ──
  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid rgba(128,128,128,0.25)",
    background: "rgba(128,128,128,0.08)",
    color: "inherit",
    fontSize: "13px",
    outline: "none",
    fontFamily: "inherit",
  };

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
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Panel */}
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "14px",
          background: "var(--bg-surface-3, #1e293b)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          padding: "20px",
          color: "var(--text-primary, #f1f5f9)",
          fontFamily: "var(--font-body, system-ui, sans-serif)",
          animation: "feedback-slide-in 0.2s ease both",
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
            {/* Type + Priority row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
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
                  Type
                </label>
                <select
                  value={feedback.type}
                  onChange={(e) =>
                    setFeedback({ ...feedback, type: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="general">General</option>
                  <option value="bug_report">Bug Report</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="improvement">Improvement</option>
                  <option value="question">Question</option>
                </select>
              </div>
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
                  Priority
                </label>
                <select
                  value={feedback.priority}
                  onChange={(e) =>
                    setFeedback({ ...feedback, priority: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
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

            {/* Description */}
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
                Description
              </label>
              <textarea
                value={feedback.description}
                onChange={(e) =>
                  setFeedback({ ...feedback, description: e.target.value })
                }
                placeholder="Describe your feedback in detail..."
                rows={4}
                required
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                paddingTop: "4px",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(128,128,128,0.25)",
                  background: "transparent",
                  color: "var(--text-secondary, #94a3b8)",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: "inherit",
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
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--primary-resonance, #22d3ee)",
                  color: "#000",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity:
                    isSubmitting || !feedback.title || !feedback.description
                      ? 0.5
                      : 1,
                  fontFamily: "inherit",
                }}
              >
                {isSubmitting ? "Sending…" : "Send Feedback"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Keyframe injected once */}
      <style>{`
        @keyframes feedback-slide-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}

// ─── Public Component ──────────────────────────────────────────────────────────
export const FeedbackQuickAction = ({
  variant = "sidebar-item",
  position = "bottom-right",
  appType,
  accentColor,
}) => {
  const [isOpen, setIsOpen] = useState(false);

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
          onClick={() => setIsOpen(true)}
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
          <FeedbackModal onClose={() => setIsOpen(false)} appType={appType} />
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
          <FeedbackModal onClose={() => setIsOpen(false)} appType={appType} />
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
            background: "var(--primary-resonance, #22d3ee)",
            border: "none",
            color: "#000",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
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
        <FeedbackModal onClose={() => setIsOpen(false)} appType={appType} />
      )}
    </>
  );
};

export default FeedbackQuickAction;
