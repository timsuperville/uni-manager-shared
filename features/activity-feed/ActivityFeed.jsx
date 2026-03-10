/**
 * ActivityFeed — Liquid Glass real-time activity list.
 *
 * Props:
 *   activities  {Array}   — pre-fetched activity items (passed by parent)
 *   loading     {boolean}
 *   maxItems    {number}  — trim live-appended WebSocket events to this count
 *   showHeader  {boolean}
 *   compact     {boolean} — compact list mode (no expand/filter)
 */

import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import webSocketClient from "../../services/webSocketClient.js";

// ── Action colour palette ─────────────────────────────────────────────────────
const ACTION_COLOR = {
  created: { bg: "rgba(34,197,94,0.15)", color: "#4ade80" },
  accepted: { bg: "rgba(34,197,94,0.15)", color: "#4ade80" },
  sent: { bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
  updated: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
  deleted: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
  declined: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
  default: { bg: "rgba(100,116,139,0.12)", color: "var(--text-muted)" },
};

function actionColor(action) {
  return ACTION_COLOR[action] || ACTION_COLOR.default;
}

// ── Action icon (SVG only — no MUI dependency) ────────────────────────────────
function ActivityIcon({ type, action }) {
  const { bg, color } = actionColor(action);
  const paths = {
    created: "M12 4v16m8-8H4",                                   // PlusIcon
    updated: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", // EditIcon
    deleted: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16", // TrashIcon
    sent: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",   // MailIcon
    accepted: "M5 13l4 4L19 7",                                   // CheckIcon
    declined: "M6 18L18 6M6 6l12 12",                            // CloseIcon
    default: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", // PersonIcon
  };
  const d = paths[action] || paths.default;
  return (
    <span
      style={{
        width: 30, height: 30,
        borderRadius: "50%",
        background: bg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </span>
  );
}

// ── Single activity row ───────────────────────────────────────────────────────
function ActivityItem({ activity, expanded, onToggle }) {
  const { type, action, timestamp, user, target, metadata = {} } = activity;
  const hasDetails = Object.keys(metadata).length > 0;

  const description = (() => {
    const who = user?.name || "Someone";
    const what = target?.name || target?.email || "unknown";
    if (type === "member") {
      if (action === "created") return `${who} added member ${what}`;
      if (action === "updated") return `${who} updated member ${what}`;
      if (action === "deleted") return `${who} removed member ${what}`;
    }
    if (type === "invitation") {
      if (action === "sent") return `${who} sent invitation to ${what}`;
      if (action === "accepted") return `${what} accepted invitation`;
      if (action === "declined") return `${what} declined invitation`;
    }
    return `${who} performed ${action}`;
  })();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "12px",
        borderRadius: "10px",
        background: "var(--glass-surface, rgba(255,255,255,0.03))",
        border: "1px solid var(--glass-outline)",
        marginBottom: "8px",
        transition: "background 150ms ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--glass-surface-hover, rgba(255,255,255,0.05))")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--glass-surface, rgba(255,255,255,0.03))")}
    >
      <ActivityIcon type={type} action={action} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.4" }}>
            {description}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </span>
            {hasDetails && (
              <button
                onClick={onToggle}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "2px", color: "var(--text-muted)", borderRadius: "4px",
                }}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Metadata tags */}
        {metadata.role && (
          <span style={{
            display: "inline-block", marginTop: "6px",
            fontSize: "10px", padding: "2px 6px", borderRadius: "4px",
            background: "var(--primary-subtle, rgba(99,102,241,0.1))",
            color: "var(--primary-resonance)",
          }}>
            {metadata.role}
          </span>
        )}
        {metadata.changes && Object.keys(metadata.changes).map((field) => (
          <span key={field} style={{
            display: "inline-block", marginTop: "6px", marginLeft: "4px",
            fontSize: "10px", padding: "2px 6px", borderRadius: "4px",
            background: "rgba(59,130,246,0.1)", color: "#60a5fa",
          }}>
            {field} changed
          </span>
        ))}

        {/* Expand panel */}
        {expanded && hasDetails && (
          <div style={{
            marginTop: "10px", padding: "10px", borderRadius: "8px",
            background: "rgba(0,0,0,0.25)", fontSize: "12px",
            color: "var(--text-muted)", lineHeight: "1.6",
          }}>
            {user && <div>By: {user.name} ({user.role})</div>}
            {target && <div>Target: {target.name || target.email}</div>}
            {metadata.changes && Object.entries(metadata.changes).map(([f, c]) => (
              <div key={f} style={{ paddingLeft: "8px" }}>• {f}: {c.from} → {c.to}</div>
            ))}
            <div>Time: {new Date(timestamp).toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Filter chip ───────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "500",
        border: `1px solid ${active ? "var(--primary-resonance)" : "var(--glass-outline)"}`,
        background: active ? "var(--primary-subtle)" : "transparent",
        color: active ? "var(--primary-resonance)" : "var(--text-muted)",
        cursor: "pointer", fontFamily: "inherit", transition: "all 120ms ease",
      }}
    >
      {label}
    </button>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export function ActivityFeed({
  activities: propActivities = [],
  loading = false,
  maxItems = 50,
  showHeader = true,
  compact = false,
}) {
  // Live-append WebSocket events on top of prop-supplied activities
  const [liveItems, setLiveItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const handleMember = (data, action) => {
      setLiveItems((prev) => [{
        id: `member_${action}_${Date.now()}`,
        type: "member", action,
        timestamp: data.timestamp || new Date().toISOString(),
        user: { id: data.updatedBy, name: "User", role: "member" },
        target: data.member,
        metadata: data.metadata || {},
      }, ...prev].slice(0, maxItems));
    };

    const handleInvite = (data, action) => {
      setLiveItems((prev) => [{
        id: `invitation_${action}_${Date.now()}`,
        type: "invitation", action,
        timestamp: data.timestamp || new Date().toISOString(),
        user: { id: data.updatedBy, name: "User", role: "member" },
        target: data.invitation,
        metadata: data.metadata || {},
      }, ...prev].slice(0, maxItems));
    };

    try {
      webSocketClient.on("member:created", (d) => handleMember(d, "created"));
      webSocketClient.on("member:updated", (d) => handleMember(d, "updated"));
      webSocketClient.on("member:deleted", (d) => handleMember(d, "deleted"));
      webSocketClient.on("invitation:sent", (d) => handleInvite(d, "sent"));
      webSocketClient.on("invitation:accepted", (d) => handleInvite(d, "accepted"));
      webSocketClient.on("invitation:declined", (d) => handleInvite(d, "declined"));
    } catch { }

    return () => {
      try {
        ["member:created", "member:updated", "member:deleted",
          "invitation:sent", "invitation:accepted", "invitation:declined"
        ].forEach((ev) => webSocketClient.off(ev));
      } catch { }
    };
  }, [maxItems]);

  const allActivities = [...liveItems, ...propActivities];
  const filtered = filter === "all" ? allActivities : allActivities.filter((a) => a.type === filter);

  const toggleExpanded = (id) => {
    setExpandedItems((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  // ── Compact list ─────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {filtered.slice(0, 5).map((a) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px" }}>
            <ActivityIcon type={a.type} action={a.action} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {a.type === "member" ? `Member ${a.action}` : `Invitation ${a.action}`}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>
                {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Full feed ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {showHeader && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
              Recent Activity
            </h2>
            {allActivities.length > 0 && (
              <span style={{
                fontSize: "10px", padding: "2px 6px", borderRadius: "10px",
                background: "var(--primary-subtle)", color: "var(--primary-resonance)",
              }}>
                {allActivities.length}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            {["all", "member", "invitation"].map((f) => (
              <FilterChip
                key={f}
                label={f.charAt(0).toUpperCase() + f.slice(1)}
                active={filter === f}
                onClick={() => setFilter(f)}
              />
            ))}
            {liveItems.length > 0 && (
              <button
                onClick={() => { setLiveItems([]); setExpandedItems(new Set()); }}
                style={{
                  padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "500",
                  border: "1px solid var(--glass-outline)", background: "transparent",
                  color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Clear live
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: "60px", borderRadius: "10px",
              background: "var(--glass-surface)",
              border: "1px solid var(--glass-outline)",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
          <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "600", color: "var(--text-secondary)" }}>No activity yet</p>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
            Member and invitation activities will appear here in real-time.
          </p>
        </div>
      ) : (
        <div>
          {filtered.map((a) => (
            <ActivityItem
              key={a.id}
              activity={a}
              expanded={expandedItems.has(a.id)}
              onToggle={() => toggleExpanded(a.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const ActivitySummary = ({ timeRange = "24h" }) => {
  const [summary, setSummary] = useState({ total: 0, byType: {}, byAction: {} });

  useEffect(() => {
    // API integration point — currently simulated
    setSummary({
      total: 15,
      byType: { member: 8, invitation: 7 },
      byAction: { created: 5, updated: 6, sent: 3, accepted: 1 },
    });
  }, [timeRange]);

  return (
    <div style={{
      padding: "16px", borderRadius: "10px",
      background: "var(--glass-surface)", border: "1px solid var(--glass-outline)",
    }}>
      <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
        Activity Summary ({timeRange})
      </h3>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        {[
          { label: `${summary.total} Total`, color: "var(--primary-resonance)", bg: "var(--primary-subtle)" },
          { label: `${summary.byType.member || 0} Members`, color: "#60a5fa", bg: "rgba(59,130,246,0.1)" },
          { label: `${summary.byType.invitation || 0} Invitations`, color: "#4ade80", bg: "rgba(34,197,94,0.1)" },
        ].map((chip) => (
          <span key={chip.label} style={{
            fontSize: "11px", padding: "3px 8px", borderRadius: "20px",
            background: chip.bg, color: chip.color, fontWeight: "600",
          }}>
            {chip.label}
          </span>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--glass-outline)", paddingTop: "10px" }}>
        <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Breakdown
        </p>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {Object.entries(summary.byAction).map(([action, count]) => (
            <span key={action} style={{
              fontSize: "11px", padding: "2px 7px", borderRadius: "4px",
              background: actionColor(action).bg, color: actionColor(action).color,
            }}>
              {count} {action}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;
