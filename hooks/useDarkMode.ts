import { useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

/**
 * Resolves the effective theme priority:
 *   1. Explicit user override stored in localStorage  ("light" | "dark")
 *   2. OS / browser prefers-color-scheme              (auto-detected)
 */
function resolveInitialTheme(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  // No explicit user preference — follow the OS
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(theme: Theme) {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
}

export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);

  // Apply class to <html> whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for OS theme changes — only acts when no user override is stored
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = (e: MediaQueryListEvent) => {
      // Respect an explicit user override; only auto-switch when following system
      const stored = localStorage.getItem('theme');
      if (!stored) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mq.addEventListener('change', handleSystemChange);
    return () => mq.removeEventListener('change', handleSystemChange);
  }, []);

  /**
   * Explicit user toggle — writes to localStorage so the choice is remembered.
   */
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  /**
   * Reset to automatic — clears the override and immediately re-follows the OS.
   */
  const resetToSystem = useCallback(() => {
    localStorage.removeItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light';
    setTheme(systemTheme);
  }, []);

  return { theme, toggleTheme, resetToSystem };
}
