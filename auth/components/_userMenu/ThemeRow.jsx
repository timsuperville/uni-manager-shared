import React, { memo } from "react";
import { Palette } from "lucide-react";
import { ThemeToggle } from "../../../components/ThemeToggle";

/**
 * ThemeRow — "Appearance" label + three-state ThemeToggle in the menu.
 * Memoised — never re-renders unless the parent re-mounts.
 */
const ThemeRow = memo(function ThemeRow() {
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
