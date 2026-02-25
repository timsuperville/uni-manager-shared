import React, { memo } from "react";
import { Palette } from "lucide-react";
import { ThemeToggle } from "../../../components/ThemeToggle";

/**
 * ThemeRow — Appearance toggle row inside the user menu.
 *
 * Mobile  (viewport < 768px): just the ThemeToggle icon button, centred.
 * Desktop (viewport ≥ 768px): "🎨 Appearance" label left + labelled toggle right.
 *
 * NOTE: uses a synchronous window.innerWidth read instead of Tailwind
 * responsive classes — the file lives in _userMenu/ which may not be
 * covered by every app's Tailwind content glob, making `md:hidden` etc.
 * unreliable across the ecosystem.
 */
const ThemeRow = memo(function ThemeRow() {
  // Synchronous read is accurate here: the ThemeRow only mounts when the
  // dropdown opens, so the viewport width at that moment is correct.
  // Resize handling is not needed — closing and reopening the menu gives
  // a fresh read.
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  if (isMobile) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "6px 10px",
          borderRadius: "8px",
        }}
      >
        <ThemeToggle />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 10px",
        borderRadius: "8px",
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
  );
});

export default ThemeRow;
