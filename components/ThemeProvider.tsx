import React, { createContext, useContext, useEffect, useState } from 'react';

// ── Token types ────────────────────────────────────────────────────────────────

interface ColorTokens {
  primary?: string;
  secondary?: string;
  success?: string;
  danger?: string;
  warning?: string;
  info?: string;
  light?: string;
  dark?: string;
}

interface SpacingTokens {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}

interface FontSizeTokens {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  xxl?: string;
}

interface TypographyTokens {
  fontFamily?: string;
  fontSize?: FontSizeTokens;
}

interface BorderRadiusTokens {
  sm?: string;
  md?: string;
  lg?: string;
  full?: string;
}

interface ThemeTokens {
  colors?: ColorTokens;
  spacing?: SpacingTokens;
  typography?: TypographyTokens;
  borderRadius?: BorderRadiusTokens;
}

type ThemeMode = 'system' | 'dark' | 'light';

interface ThemeContextValue extends Required<ThemeTokens> {
  colors: Required<ColorTokens>;
  spacing: Required<SpacingTokens>;
  typography: { fontFamily: string; fontSize: Required<FontSizeTokens> };
  borderRadius: Required<BorderRadiusTokens>;
  theme: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: ThemeMode) => void;
}

// ── Defaults ───────────────────────────────────────────────────────────────────

const defaultTokens = {
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    light: '#f8fafc',
    dark: '#1e293b'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '3rem'
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem'
    }
  },
  borderRadius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', full: '9999px' }
} as const;

// ── Context ────────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue>({
  ...(defaultTokens as unknown as ThemeContextValue),
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => null
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function resolveTheme(theme: ThemeMode): 'dark' | 'light' {
  return theme === 'system' ? getSystemTheme() : theme;
}

// ── Provider ───────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
  tokens?: ThemeTokens;
  defaultTheme?: ThemeMode;
  storageKey?: string;
  onThemeChange?: (theme: ThemeMode) => void;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  tokens = {},
  defaultTheme = 'system',
  storageKey = 'uni-manager-theme',
  onThemeChange
}) => {
  const mergedTokens = {
    ...defaultTokens,
    ...tokens,
    colors: { ...defaultTokens.colors, ...(tokens.colors ?? {}) },
    spacing: { ...defaultTokens.spacing, ...(tokens.spacing ?? {}) },
    typography: {
      ...defaultTokens.typography,
      ...(tokens.typography ?? {}),
      fontSize: {
        ...defaultTokens.typography.fontSize,
        ...(tokens.typography?.fontSize ?? {})
      }
    },
    borderRadius: {
      ...defaultTokens.borderRadius,
      ...(tokens.borderRadius ?? {})
    }
  };

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return (
      (localStorage.getItem(storageKey) as ThemeMode | null) ?? defaultTheme
    );
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() =>
    resolveTheme(theme)
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);

    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onOsChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    if (mq.addEventListener) {
      mq.addEventListener('change', onOsChange);
    } else {
      mq.addListener(onOsChange); // Safari < 14 fallback
    }

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', onOsChange);
      } else {
        mq.removeListener(onOsChange);
      }
    };
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newTheme);
    }
    setThemeState(newTheme);
    onThemeChange?.(newTheme);
  };

  const value: ThemeContextValue = {
    ...mergedTokens,
    theme,
    resolvedTheme,
    setTheme
  } as ThemeContextValue;

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// ── Hook ───────────────────────────────────────────────────────────────────────

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  return context;
};

export { defaultTokens as tokens };
export default ThemeProvider;
