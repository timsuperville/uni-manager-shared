import React from "react";

/**
 * ChurchCardSkeleton — Liquid Glass shimmer placeholder.
 * Mirrors the layout of the redesigned ChurchCard.
 */
const ChurchCardSkeleton: React.FC = () => (
  <div
    className="rounded-2xl overflow-hidden flex flex-col animate-pulse"
    style={{
      background: "var(--glass-surface, rgba(15,15,35,0.7))",
      border: "1px solid var(--glass-outline, rgba(255,255,255,0.08))",
    }}
  >
    {/* Header */}
    <div
      className="px-5 pt-5 pb-4 flex items-start gap-4"
      style={{ borderBottom: "1px solid var(--glass-outline)" }}
    >
      {/* Avatar */}
      <div
        className="shrink-0 w-12 h-12 rounded-xl"
        style={{ background: "var(--glass-outline, rgba(255,255,255,0.08))" }}
      />
      {/* Title + denomination */}
      <div className="flex-1 space-y-2 pt-0.5">
        <div
          className="h-4 rounded w-3/4"
          style={{ background: "var(--glass-outline, rgba(255,255,255,0.08))" }}
        />
        <div
          className="h-3 rounded w-1/3"
          style={{ background: "var(--glass-outline, rgba(255,255,255,0.06))" }}
        />
      </div>
    </div>

    {/* Body */}
    <div className="px-5 py-4 flex-1 space-y-3">
      <div className="space-y-2">
        <div
          className="h-3 rounded w-full"
          style={{ background: "var(--glass-outline, rgba(255,255,255,0.07))" }}
        />
        <div
          className="h-3 rounded w-5/6"
          style={{ background: "var(--glass-outline, rgba(255,255,255,0.06))" }}
        />
      </div>
      <div className="flex gap-4 pt-1">
        <div
          className="h-3 rounded w-1/3"
          style={{ background: "var(--glass-outline, rgba(255,255,255,0.07))" }}
        />
        <div
          className="h-3 rounded w-1/4"
          style={{ background: "var(--glass-outline, rgba(255,255,255,0.06))" }}
        />
      </div>
    </div>

    {/* Actions */}
    <div
      className="px-5 pb-5 pt-3 flex gap-2"
      style={{ borderTop: "1px solid var(--glass-outline)" }}
    >
      <div
        className="h-9 rounded-lg flex-1"
        style={{ background: "var(--glass-outline, rgba(255,255,255,0.07))" }}
      />
      <div
        className="h-9 rounded-lg"
        style={{
          background: "var(--primary-glow, hsla(272,65%,62%,0.2))",
          flex: 1.4,
        }}
      />
    </div>
  </div>
);

export default ChurchCardSkeleton;
