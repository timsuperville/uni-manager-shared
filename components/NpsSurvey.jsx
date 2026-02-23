/**
 * NpsSurvey — Compact Net Promoter Score survey widget
 *
 * Rendered as a fixed bottom-center card (slide-up animation).
 * Designed to be dropped anywhere; all styling is inline so it
 * works across apps without Tailwind JIT scanning.
 *
 * Props:
 *   onDismiss()               — called when the user closes without scoring
 *   onSubmit(score, comment)  — called when the user submits a score
 */

import React, { useState } from "react";

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function scoreColor(n) {
  if (n >= 9) return "#22c55e"; // promoter — green
  if (n >= 7) return "#f59e0b"; // passive  — amber
  return "#ef4444"; // detractor — red
}

export function NpsSurvey({ onDismiss, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    setTimeout(() => onSubmit(selected, comment), 800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How likely are you to recommend us?"
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "min(520px, calc(100vw - 32px))",
        background: "var(--bg-surface-1, #1e1e2e)",
        border: "1px solid var(--glass-outline, rgba(255,255,255,0.1))",
        borderRadius: "16px",
        padding: "20px 24px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
        animation: "nps-slide-up 280ms cubic-bezier(0.34,1.56,0.64,1) both",
        fontFamily: "var(--font-body, inherit)",
      }}
    >
      <style>{`
        @keyframes nps-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(24px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {submitted ? (
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>🙏</div>
          <p
            style={{
              color: "var(--text-primary, #fff)",
              fontWeight: "700",
              fontSize: "15px",
            }}
          >
            Thanks for your feedback!
          </p>
          <p
            style={{
              color: "var(--text-muted, #94a3b8)",
              fontSize: "13px",
              marginTop: "4px",
            }}
          >
            Your response has been recorded.
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "16px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "var(--text-primary, #fff)",
                  lineHeight: 1.3,
                }}
              >
                How likely are you to recommend this app?
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted, #94a3b8)",
                  marginTop: "3px",
                }}
              >
                0 = Not likely &nbsp;·&nbsp; 10 = Extremely likely
              </p>
            </div>
            <button
              id="nps-dismiss-btn"
              onClick={onDismiss}
              title="Dismiss"
              aria-label="Dismiss survey"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted, #94a3b8)",
                fontSize: "18px",
                lineHeight: 1,
                padding: "0 0 0 8px",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* Score buttons */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "14px",
              flexWrap: "wrap",
            }}
          >
            {SCORES.map((n) => (
              <button
                key={n}
                id={`nps-score-${n}`}
                onClick={() => setSelected(n)}
                style={{
                  flex: "1 0 auto",
                  minWidth: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  border:
                    selected === n
                      ? `2px solid ${scoreColor(n)}`
                      : "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
                  background:
                    selected === n
                      ? `${scoreColor(n)}22`
                      : "var(--bg-surface-2, rgba(255,255,255,0.04))",
                  color:
                    selected === n
                      ? scoreColor(n)
                      : "var(--text-secondary, #94a3b8)",
                  fontSize: "13px",
                  fontWeight: selected === n ? "700" : "500",
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Optional comment (shown after score selected) */}
          {selected !== null && (
            <textarea
              id="nps-comment"
              placeholder="Any additional thoughts? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "8px 10px",
                borderRadius: "8px",
                border:
                  "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
                background: "var(--bg-surface-2, rgba(255,255,255,0.04))",
                color: "var(--text-primary, #fff)",
                fontSize: "13px",
                fontFamily: "inherit",
                resize: "none",
                outline: "none",
                marginBottom: "12px",
              }}
            />
          )}

          {/* Actions */}
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
          >
            <button
              id="nps-later-btn"
              onClick={onDismiss}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                background: "transparent",
                border:
                  "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
                color: "var(--text-secondary, #94a3b8)",
              }}
            >
              Ask me later
            </button>
            <button
              id="nps-submit-btn"
              onClick={handleSubmit}
              disabled={selected === null}
              style={{
                padding: "7px 20px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: selected !== null ? "pointer" : "not-allowed",
                background:
                  selected !== null
                    ? "var(--cobalt, #3b82f6)"
                    : "rgba(59,130,246,0.3)",
                border: "none",
                color: "#fff",
                transition: "opacity 150ms ease",
                opacity: selected !== null ? 1 : 0.5,
              }}
            >
              Submit
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default NpsSurvey;
