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
});

// Theme provider component
export const ThemeProvider = ({
  children,
  tokens = {},
  defaultTheme = "system",
  storageKey = "uni-manager-theme",
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

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(storageKey) || defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    ...mergedTokens,
    theme,
    setTheme: (theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
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
};

// Hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return { ...defaultTokens, theme: "system", setTheme: () => null };
  }
  return context;
};

// Export default tokens for backward compatibility
export { defaultTokens as tokens };
export default ThemeProvider;
