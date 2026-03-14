import React from "react";
import { useTheme } from "./ThemeProvider";
import { Moon, Sun, Monitor } from "lucide-react";

type ThemeMode = "system" | "dark" | "light";

interface ThemeToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
}

/**
 * ThemeToggle — Three-state theme switcher.
 * Cycles: system (auto) → dark → light → system
 */
export function ThemeToggle({
  className = "",
  style = {},
  showLabel = false,
  ...props
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const nextTheme: ThemeMode =
    theme === "system" ? "dark" : theme === "dark" ? "light" : "system";

  const STATES: Record<ThemeMode, { icon: React.ReactNode; label: string; ariaLabel: string; tooltip: string }> = {
    system: {
      icon: <Monitor size={15} />,
      label: "Auto",
      ariaLabel: "Theme: Auto (following device). Click for dark mode.",
      tooltip: "Auto (device theme)",
    },
    dark: {
      icon: <Moon size={15} />,
      label: "Dark",
      ariaLabel: "Theme: Dark. Click for light mode.",
      tooltip: "Dark mode",
    },
    light: {
      icon: <Sun size={15} />,
      label: "Light",
      ariaLabel: "Theme: Light. Click for auto mode.",
      tooltip: "Light mode",
    },
  };

  const current = STATES[theme] ?? STATES.system;
  const isManual = theme !== "system";
  const accentColor = isManual
    ? resolvedTheme === "dark"
      ? "hsl(213,94%,62%)"
      : "hsl(213,94%,42%)"
    : undefined;

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={current.ariaLabel}
      title={current.tooltip}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: showLabel ? "5px" : undefined,
        width: showLabel ? "auto" : "32px",
        height: "32px",
        padding: showLabel ? "0 10px" : undefined,
        borderRadius: "8px",
        border: `1px solid ${isManual ? "var(--cobalt, hsl(213,94%,52%))" : "var(--glass-outline, rgba(255,255,255,0.1))"}`,
        background: isManual
          ? "var(--cobalt-glow, rgba(30,100,250,0.10))"
          : "var(--bg-surface-1, rgba(255,255,255,0.06))",
        color: accentColor ?? "var(--text-secondary, #94a3b8)",
        cursor: "pointer",
        transition: "background 200ms ease, border-color 200ms ease, color 200ms ease",
        flexShrink: 0,
        fontSize: "11px",
        fontWeight: "600",
        fontFamily: "var(--font-body, Inter, sans-serif)",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--cobalt-glow, rgba(30,100,250,0.10))";
        e.currentTarget.style.borderColor = "var(--cobalt, hsl(213,94%,52%))";
        e.currentTarget.style.color = "var(--cobalt, hsl(213,94%,52%))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isManual
          ? "var(--cobalt-glow, rgba(30,100,250,0.10))"
          : "var(--bg-surface-1, rgba(255,255,255,0.06))";
        e.currentTarget.style.borderColor = isManual
          ? "var(--cobalt, hsl(213,94%,52%))"
          : "var(--glass-outline, rgba(255,255,255,0.1))";
        e.currentTarget.style.color = accentColor ?? "var(--text-secondary, #94a3b8)";
      }}
      {...props}
    >
      <span className="sr-only">{current.ariaLabel}</span>
      {current.icon}
      {showLabel && <span aria-hidden="true">{current.label}</span>}
    </button>
  );
}

export default ThemeToggle;
