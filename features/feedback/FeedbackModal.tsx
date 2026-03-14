/**
 * FeedbackModal — Centered dialog (bottom sheet on mobile).
 * Rendered exclusively via FeedbackModalPortal to document.body so that
 * position:fixed inset:0 always resolves to the full viewport, even when the
 * trigger lives inside a CSS-transform parent (e.g. sidebar slide animations).
 *
 * Uses inline styles throughout to avoid Tailwind JIT scanning gaps in shared/.
 */

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { collectSystemContext } from "./utils/collectSystemContext.ts";
import type { FeedbackUser, SystemContext } from "./utils/collectSystemContext.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedbackType = "bug_report" | "feature_request" | "general";

interface FeedbackFormState {
  type:        FeedbackType;
  title:       string;
  description: string;
}

interface FeedbackModalProps {
  onClose:            () => void;
  onSubmitSuccess?:   () => void;
  appType?:           string;
  user?:              FeedbackUser | null;
  initialTitle?:      string;
  initialDescription?: string;
}

export interface FeedbackModalPortalProps extends FeedbackModalProps {}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_MAP: Record<FeedbackType, string> = {
  general:         "user-feedback",
  bug_report:      "error-report",
  feature_request: "user-feedback",
};

const CATEGORY_FROM_TYPE: Record<FeedbackType, string> = {
  general:         "other",
  bug_report:      "bug",
  feature_request: "feature",
};

const SEVERITY_FROM_TYPE: Record<FeedbackType, string> = {
  bug_report:      "high",
  feature_request: "medium",
  general:         "low",
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getStoredToken(appName: string): string | null {
  if (typeof window === "undefined") return null;
  const namespaces = [
    appName, "admin", "church", "personal", "home", "business", "uni",
  ].filter(Boolean);
  for (const ns of namespaces) {
    const key = `${ns}_auth_access_token`;
    const tok =
      window.sessionStorage?.getItem(key) ||
      window.localStorage?.getItem(key);
    if (tok) return tok;
  }
  return null;
}

// ─── FeedbackModal ────────────────────────────────────────────────────────────

function FeedbackModal({
  onClose,
  onSubmitSuccess,
  appType,
  user          = null,
  initialTitle  = "",
  initialDescription = "",
}: FeedbackModalProps) {
  const [feedback,     setFeedback]     = useState<FeedbackFormState>({
    type:        "bug_report",
    title:       initialTitle,
    description: initialDescription,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [showContext,  setShowContext]  = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Detect mobile for bottom-sheet layout; re-checks on resize
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 600,
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const appName =
        appType ??
        (typeof window !== "undefined" && import.meta?.env?.VITE_APP_TYPE as string | undefined) ??
        "unknown";

      const authToken = getStoredToken(appName);

      const payload = {
        type:     TYPE_MAP[feedback.type] ?? "user-feedback",
        category: CATEGORY_FROM_TYPE[feedback.type] ?? "other",
        severity: SEVERITY_FROM_TYPE[feedback.type] ?? "medium",
        userInput: {
          title:        feedback.title,
          description:  feedback.description,
          allowContact: false,
        },
        systemContext: collectSystemContext(appName, user),
      };

      const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) reqHeaders["Authorization"] = `Bearer ${authToken}`;

      const response = await fetch("/api/v1/feedback/submit", {
        method:  "POST",
        headers: reqHeaders,
        body:    JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onSubmitSuccess?.();
          onClose();
          setSubmitted(false);
        }, 2200);
      } else {
        const errBody = await response.json().catch(() => ({})) as { message?: string };
        setError(errBody.message ?? `Server error ${response.status}`);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width:           "100%",
    boxSizing:       "border-box",
    padding:         "9px 12px",
    borderRadius:    "10px",
    border:          "1px solid var(--glass-outline)",
    background:      "rgba(255,255,255,0.04)",
    color:           "var(--text-primary, #f1f5f9)",
    fontSize:        "13px",
    outline:         "none",
    fontFamily:      "inherit",
    transition:      "border-color 160ms ease, background 160ms ease",
  };

  const ctx: SystemContext = collectSystemContext(appType ?? "unknown", user);
  const isDisabled = isSubmitting || !feedback.title || !feedback.description;

  return (
    // Scrim
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         9999,
        background:     "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display:        "flex",
        alignItems:     isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding:        isMobile ? "0" : "16px",
      }}
    >
      {/* Panel — bottom sheet on mobile, centered dialog on desktop */}
      <div
        style={{
          width:                "100%",
          maxWidth:             isMobile ? "100%" : "460px",
          maxHeight:            isMobile ? "92dvh" : "90vh",
          overflowY:            "auto",
          borderRadius:         isMobile ? "20px 20px 0 0" : "14px",
          background:           "var(--glass-surface, hsla(265,28%,14%,0.96))",
          backdropFilter:       "blur(32px) saturate(200%)",
          WebkitBackdropFilter: "blur(32px) saturate(200%)",
          border:               "1px solid var(--glass-outline)",
          boxShadow:            isMobile
            ? "0 -12px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 32px 72px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          padding:              isMobile ? "16px 20px 36px" : "20px",
          color:                "var(--text-primary, #f1f5f9)",
          fontFamily:           "var(--font-body, system-ui, sans-serif)",
          animation:            isMobile
            ? "feedback-sheet-up 0.28s cubic-bezier(0.32,0.72,0,1) both"
            : "feedback-slide-in 0.2s ease both",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span style={{ fontSize: "15px", fontWeight: "600" }}>Share Feedback</span>
            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "var(--primary-subtle, rgba(99,102,241,0.09))", color: "var(--primary-resonance)", fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {appType ?? "app"}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-muted, #94a3b8)", borderRadius: "6px" }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--success, #22c55e)" strokeWidth="2" style={{ margin: "0 auto 12px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>Thank you!</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)" }}>Your feedback has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={(e) => { void handleSubmit(e); }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Feedback type cards */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                What kind of feedback?
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {([
                  { value: "bug_report"      as FeedbackType, emoji: "🐛", label: "Bug"     },
                  { value: "feature_request" as FeedbackType, emoji: "💡", label: "Feature" },
                  { value: "general"         as FeedbackType, emoji: "💬", label: "Other"   },
                ] as const).map(({ value, emoji, label }) => {
                  const active = feedback.type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFeedback({ ...feedback, type: value })}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                        padding: "12px 8px", borderRadius: "10px",
                        border:      `1px solid ${active ? "var(--glass-outline-active)" : "var(--glass-outline)"}`,
                        background:  active ? "var(--primary-subtle)" : "rgba(255,255,255,0.03)",
                        color:       active ? "var(--text-accent)" : "var(--text-secondary)",
                        cursor:      "pointer",
                        fontSize:    "12px",
                        fontWeight:  active ? "600" : "400",
                        fontFamily:  "inherit",
                        transition:  "all 120ms ease",
                        lineHeight:  1,
                      }}
                    >
                      <span style={{ fontSize: "20px", lineHeight: 1 }}>{emoji}</span>
                      <span style={{ marginTop: "4px" }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "5px" }}>
                Title
              </label>
              <input
                type="text"
                value={feedback.title}
                onChange={(e) => setFeedback({ ...feedback, title: e.target.value })}
                placeholder="Brief summary..."
                required
                style={inputStyle}
              />
            </div>

            {/* Description + char counter */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
                <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Description
                </label>
                <span style={{ fontSize: "10px", color: feedback.description.length > 900 ? "hsl(38,92%,65%)" : "var(--text-ghost, #475569)", fontVariantNumeric: "tabular-nums" }}>
                  {feedback.description.length} / 1000
                </span>
              </div>
              <textarea
                value={feedback.description}
                onChange={(e) => setFeedback({ ...feedback, description: e.target.value.slice(0, 1000) })}
                placeholder="Describe your feedback — steps to reproduce, expected vs actual behavior, etc."
                rows={4}
                required
                maxLength={1000}
                style={{ ...inputStyle, resize: "vertical", minHeight: "90px" }}
              />
            </div>

            {/* Context disclosure */}
            <div>
              <button
                type="button"
                onClick={() => setShowContext((v) => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--text-muted, #64748b)", padding: "0", display: "flex", alignItems: "center", gap: "4px", fontFamily: "inherit" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showContext ? "rotate(90deg)" : "none", transition: "transform 150ms ease" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                {showContext ? "Hide" : "Show"} what&apos;s included automatically
              </button>
              {showContext && (
                <div style={{ marginTop: "8px", padding: "10px", borderRadius: "8px", background: "rgba(0,0,0,0.35)", border: "1px solid var(--glass-outline)", fontSize: "11px", fontFamily: "var(--font-mono, monospace)", color: "var(--text-muted, #94a3b8)", maxHeight: "160px", overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(ctx, null, 2)}
                </div>
              )}
            </div>

            {/* Inline error */}
            {error && (
              <div role="alert" style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "hsl(0,84%,70%)", fontSize: "12px", lineHeight: "1.5" }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", paddingTop: "4px" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{ background: "none", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", color: "var(--text-muted, #64748b)", fontSize: "13px", padding: "8px 10px", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: "2px", flexShrink: 0, opacity: isSubmitting ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDisabled}
                style={{
                  padding:     "10px 24px",
                  borderRadius: "8px",
                  border:      "none",
                  background:  isDisabled ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, var(--primary-resonance), var(--primary-hover, var(--primary-resonance)))",
                  color:       isDisabled ? "var(--text-muted)" : "#fff",
                  fontSize:    "13px",
                  fontWeight:  "600",
                  cursor:      isSubmitting ? "not-allowed" : "pointer",
                  opacity:     isSubmitting ? 0.7 : 1,
                  boxShadow:   isDisabled ? "none" : "0 4px 16px var(--primary-glow, rgba(99,102,241,0.35))",
                  transition:  "all 160ms ease",
                  fontFamily:  "inherit",
                  flexShrink:  0,
                }}
              >
                {isSubmitting ? "Sending…" : "Send Feedback"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Keyframes */}
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
export function FeedbackModalPortal(props: FeedbackModalPortalProps) {
  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(<FeedbackModal {...props} />, document.body);
}
