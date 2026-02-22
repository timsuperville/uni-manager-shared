// Theme Provider for Uni-Manager Design System
import React, { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";

// Default theme tokens
const defaultTokens = {
  colors: {
    primary: "#2563eb",
    secondary: "#64748b",
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
    light: "#f8fafc",
    dark: "#1e293b",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "3rem",
  },
  typography: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      xxl: "1.5rem",
    },
  },
  borderRadius: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    full: "9999px",
  },
};

// Create theme context
const ThemeContext = createContext({
  ...defaultTokens,
  theme: "system",
  setTheme: () => null,
  /** The actual resolved value ("dark" | "light") currently applied to <html>. */
  resolvedTheme: "dark",
});

/** Apply the correct class to <html> and return the resolved theme. */
function applyTheme(theme) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    root.classList.add(resolved);
    return resolved;
  }

  root.classList.add(theme);
  return theme;
}

// Theme provider component
export const ThemeProvider = ({
  children,
  tokens = {},
  defaultTheme = "system",
  storageKey = "uni-manager-theme",
  /** Optional callback fired whenever setTheme is called by user action. */
  onThemeChange,
}) => {
  // Merge provided tokens with defaults
  const mergedTokens = {
    ...defaultTokens,
    ...tokens,
    colors: { ...defaultTokens.colors, ...tokens.colors },
    spacing: { ...defaultTokens.spacing, ...tokens.spacing },
    typography: {
      ...defaultTokens.typography,
      ...tokens.typography,
      fontSize: {
        ...defaultTokens.typography.fontSize,
        ...tokens.typography?.fontSize,
      },
    },
    borderRadius: { ...defaultTokens.borderRadius, ...tokens.borderRadius },
  };

  const [theme, setThemeState] = useState(
    () => localStorage.getItem(storageKey) || defaultTheme,
  );

  const [resolvedTheme, setResolvedTheme] = useState(() =>
    applyTheme(localStorage.getItem(storageKey) || defaultTheme),
  );

  // ── Sync <html> class whenever theme preference changes ──────────────────
  useEffect(() => {
    const resolved = applyTheme(theme);
    setResolvedTheme(resolved);

    // If in system mode, keep watching for OS-level changes
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onOsChange = () => {
      const newResolved = applyTheme("system");
      setResolvedTheme(newResolved);
    };

    // Use the modern addEventListener API with a fallback for Safari < 14
    if (mq.addEventListener) {
      mq.addEventListener("change", onOsChange);
    } else {
      mq.addListener(onOsChange); // legacy
    }

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener("change", onOsChange);
      } else {
        mq.removeListener(onOsChange); // legacy
      }
    };
  }, [theme]);

  const setTheme = (newTheme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
    // Notify parent (e.g. to persist to backend)
    onThemeChange?.(newTheme);
  };

  const value = {
    ...mergedTokens,
    theme, // "system" | "dark" | "light"  (user's preference)
    resolvedTheme, // "dark"   | "light"            (what's actually applied)
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
  tokens: PropTypes.shape({
    colors: PropTypes.object,
    spacing: PropTypes.object,
    typography: PropTypes.object,
    borderRadius: PropTypes.object,
  }),
  defaultTheme: PropTypes.string,
  storageKey: PropTypes.string,
  onThemeChange: PropTypes.func,
};

// Hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      ...defaultTokens,
      theme: "system",
      resolvedTheme: "dark",
      setTheme: () => null,
    };
  }
  return context;
};

// Export default tokens for backward compatibility
export { defaultTokens as tokens };
export default ThemeProvider;
