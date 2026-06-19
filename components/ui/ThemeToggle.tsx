import React from 'react';
import { useDarkMode } from '../../hooks';

/**
 * ThemeToggle
 *
 * 3-state cycle:  system (auto) → force light → force dark → system
 *
 * When the user hasn't made an explicit choice, the button shows the current
 * resolved theme with a small "auto" indicator so they know the site is
 * following their OS setting.
 */
export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, resetToSystem } = useDarkMode();

  // Detect whether a user override is stored
  const hasOverride =
    typeof localStorage !== 'undefined' && !!localStorage.getItem('theme');

  const handleClick = () => {
    if (!hasOverride) {
      // First click: user explicitly sets a theme, starting with the opposite of current
      // (toggleTheme already writes to localStorage)
    }
    toggleTheme();
  };

  const label = hasOverride
    ? `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`
    : `Following system theme (${theme}). Click to override.`;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleClick}
        className="relative p-2 rounded-full transition-colors duration-200
          hover:bg-[var(--glass-surface)]
          focus:outline-none focus:ring-2 focus:ring-[var(--primary-live-sync)]"
        aria-label={label}
        title={label}
      >
        {theme === 'light' ? (
          /* Moon — currently light, click to go dark */
          <svg
            className="w-5 h-5"
            style={{ color: 'var(--text-secondary)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          /* Sun — currently dark, click to go light */
          <svg
            className="w-5 h-5 text-amber-500"
            style={{ color: 'var(--color-amber-500)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )}

        {/* Small "auto" dot — only shown when following system, not overridden */}
        {!hasOverride && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-surface)]"
            style={{
              backgroundColor: 'var(--primary-live-sync)',
              borderColor: 'var(--bg-surface)'
            }}
            title="Following system theme"
          />
        )}
      </button>

      {/* Reset-to-system button — only shown when user has an explicit override */}
      {hasOverride && (
        <button
          onClick={resetToSystem}
          className="p-1.5 rounded-full transition-colors duration-200
            hover:bg-[var(--glass-surface)]
            focus:outline-none focus:ring-2 focus:ring-[var(--primary-live-sync)]"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Reset to system theme"
          title="Reset to system theme (auto)"
        >
          {/* Auto/system icon */}
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ThemeToggle;
