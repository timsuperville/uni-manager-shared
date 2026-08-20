import { useEffect, useRef } from 'react';
import type { AuthStateShape } from '../types/auth.types';

// Re-export so existing callers who import AuthStateShape from this module keep working.
export type { AuthStateShape } from '../types/auth.types';

interface AuthActions {
  initializeAuth?: () => Promise<void>;
  refreshAuth?: () => Promise<boolean>;
  logout?: () => Promise<{ success: boolean }>;
  /**
   * Synchronous state reset - called immediately on auth:failure BEFORE the
   * async logout() so React components stop seeing isAuthenticated=true and
   * TanStack Query stops firing authenticated requests during the async gap.
   */
  forceReset?: () => void;
  updateActivity?: () => void;
}

interface CallbackRef<T> {
  current: T | null | undefined;
}

interface ExternalCallbackRefs {
  onAuthStateChangeRef?: CallbackRef<
    ((state: Record<string, unknown>) => void) | null | undefined
  >;
  onErrorRef?: CallbackRef<((error: unknown) => void) | null | undefined>;
}

interface AuthConfig {
  tokenRefreshInterval?: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages auth side effects: token refresh intervals, session expiry monitoring,
 * cross-tab synchronization, and auth state change/error callback wiring.
 * Internal hook used exclusively by AuthProvider.
 */
export function useAuthCallbacks(
  state: AuthStateShape,
  actions: AuthActions,
  onAuthStateChange: ((state: Record<string, unknown>) => void) | undefined,
  onError: ((error: unknown) => void) | undefined,
  config: AuthConfig = {},
  externalCallbackRefs: ExternalCallbackRefs | null = null
): void {
  const onAuthStateChangeRef = useRef(onAuthStateChange);
  const onErrorRef = useRef(onError);
  const isInitializedRef = useRef(false);

  // Populate external refs for useAuthActions
  if (externalCallbackRefs) {
    externalCallbackRefs.onAuthStateChangeRef = onAuthStateChangeRef;
    externalCallbackRefs.onErrorRef = onErrorRef;
  }

  useEffect(() => {
    onAuthStateChangeRef.current = onAuthStateChange;
  }, [onAuthStateChange]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitializedRef.current && actions?.initializeAuth) {
      isInitializedRef.current = true;
      actions.initializeAuth();
    }
  }, [actions]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!state.isAuthenticated || !actions?.refreshAuth) return;

    const refreshInterval = config.tokenRefreshInterval ?? 15 * 60 * 1000;
    const interval = setInterval(async () => {
      try {
        await actions.refreshAuth?.();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[useAuthCallbacks] Auto-refresh failed:', error);
        }
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, actions, config.tokenRefreshInterval]);

  // Handle auth failure events (cross-tab)
  useEffect(() => {
    const handleAuthFailure = () => {
      // 1. Synchronously reset React state so isAuthenticated flips to false
      //    immediately. This prevents components and TanStack Query from firing
      //    more authenticated requests during the async gap before logout() settles.
      actions?.forceReset?.();

      // 2. Fire the async logout to clean up server-side session state (best-effort).
      //    Errors are swallowed here — the session is already locally invalidated.
      actions?.logout?.().catch(() => {
        // Intentionally silent — forceReset() already cleared local state.
        // Server-side cleanup failure is non-critical at this point.
        globalThis.conditionalLog?.(
          'warn',
          '[useAuthCallbacks] logout() after auth:failure failed (non-critical)'
        );
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:failure', handleAuthFailure);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:failure', handleAuthFailure);
      }
    };
  }, [actions]);

    // Activity tracking
  useEffect(() => {
    if (!state.isAuthenticated) return;

    let lastUpdated = 0;
    const THROTTLE_MS = 60 * 1000; // Only update activity once per minute

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdated > THROTTLE_MS) {
        lastUpdated = now;
        actions?.updateActivity?.();
      }
    };

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart'
    ] as const;

    events.forEach(event => {
      if (typeof document !== 'undefined') {
        document.addEventListener(event, handleActivity, true);
      }
    });

    return () => {
      events.forEach(event => {
        if (typeof document !== 'undefined') {
          document.removeEventListener(event, handleActivity, true);
        }
      });
    };
  }, [state.isAuthenticated]);

    // Cross-tab synchronization via storage events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const namespace = (config as any).storageNamespace || 'uni';
    const namespacedTokenKey = `${namespace}_auth_access_token`;

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === namespacedTokenKey ||
        e.key === 'accessToken' ||
        e.key === 'auth_token' ||
        e.key === 'church_auth_access_token'
      ) {
        if (e.newValue === null && state.isAuthenticated) {
          actions?.logout?.();
        } else if (e.newValue && !state.isAuthenticated) {
          actions?.initializeAuth?.();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [state.isAuthenticated, actions]);

  // Session expiry monitoring
  useEffect(() => {
    if (!state.isAuthenticated || !state.sessionExpiry) return;

    const checkExpiry = () => {
      const now = Date.now();
      if (state.sessionExpiry && now >= state.sessionExpiry) {
        if (import.meta.env.DEV) {
          console.warn('[useAuthCallbacks] Session expired');
        }
        actions?.logout?.();
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 60 * 1000);
    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.sessionExpiry, actions]);
}
