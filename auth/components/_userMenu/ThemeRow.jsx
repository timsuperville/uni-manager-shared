import React, { memo } from "react";
import { Palette } from "lucide-react";
import { ThemeToggle } from "../../../components/ThemeToggle";

/**
 * ThemeRow — Appearance toggle row inside the user menu.
 *
 * Mobile  (< md): just the ThemeToggle button, centred in the row.
 * Desktop (≥ md): full row — "Palette + Appearance" label on the left,
 *                 labelled ThemeToggle on the right.
 */
const ThemeRow = memo(function ThemeRow() {
  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: "8px",
      }}
    >
      {/* ── Mobile: icon-only toggle, centred ── */}
      <div className="flex md:hidden justify-center">
        <ThemeToggle />
      </div>

      {/* ── Desktop: labelled row ── */}
      <div
        className="hidden md:flex"
        style={{
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: "500",
            color: "var(--text-secondary)",
          }}
        >
          <Palette
            size={15}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
          Appearance
        </div>
        <ThemeToggle showLabel />
      </div>
    </div>
  );
});

export default ThemeRow;
