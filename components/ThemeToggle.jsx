import React from "react";
import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";

/**
 * ThemeToggle — Ecosystem-aware dark/light mode switcher.
 *
 * Uses CSS variables for styling so it works across ALL apps
 * (admin, church, home, etc.) without requiring Tailwind.
 */
export function ThemeToggle({ className = "", style = {}, ...props }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      id="theme-toggle-btn"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      type="button"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        border: "1px solid var(--glass-outline, rgba(255,255,255,0.1))",
        background: "var(--bg-surface-1, rgba(255,255,255,0.06))",
        color: "var(--text-secondary, #94a3b8)",
        cursor: "pointer",
        transition:
          "background 200ms ease, border-color 200ms ease, color 200ms ease",
        flexShrink: 0,
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background =
          "var(--cobalt-glow, rgba(30,100,250,0.10))";
        e.currentTarget.style.borderColor = "var(--cobalt, hsl(213,94%,52%))";
        e.currentTarget.style.color = "var(--cobalt, hsl(213,94%,52%))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          "var(--bg-surface-1, rgba(255,255,255,0.06))";
        e.currentTarget.style.borderColor =
          "var(--glass-outline, rgba(255,255,255,0.1))";
        e.currentTarget.style.color = "var(--text-secondary, #94a3b8)";
      }}
      {...props}
    >
      <span className="sr-only">
        {isDark ? "Switch to light mode" : "Switch to dark mode"}
      </span>
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

export default ThemeToggle;
