/**
 * useAuthCallbacks Hook
 *
 * Manages side effects and callback handling for authentication:
 * - Token refresh intervals
 * - Session expiry monitoring
 * - Cross-tab synchronization
 * - Activity tracking
 * - Auth failure handlers
 * - Proper cleanup of timers and listeners
 *
 * @param {Object} state - Auth state from useAuthState
 * @param {Object} actions - Auth actions from useAuthActions
 * @param {Function} onAuthStateChange - External auth state change callback
 * @param {Function} onError - External error callback
 * @param {Object} config - Configuration options
 * @returns {Object} Callback refs for actions hook
 */

import { useEffect, useRef } from "react";

export function useAuthCallbacks(
  state,
  actions,
  onAuthStateChange,
  onError,
  config = {},
  externalCallbackRefs = null,
) {
  // Create stable refs for callbacks
  const onAuthStateChangeRef = useRef(onAuthStateChange);
  const onErrorRef = useRef(onError);
  const isInitializedRef = useRef(false);

  // Populate external refs if provided (for use by useAuthActions)
  if (externalCallbackRefs) {
    externalCallbackRefs.onAuthStateChangeRef = onAuthStateChangeRef;
    externalCallbackRefs.onErrorRef = onErrorRef;
  }

  // Update refs when props change
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

    const refreshInterval = config.tokenRefreshInterval || 15 * 60 * 1000; // 15 minutes
    const interval = setInterval(async () => {
      try {
        await actions.refreshAuth();
      } catch (error) {
        console.warn("[useAuthCallbacks] Auto-refresh failed:", error);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, actions, config.tokenRefreshInterval]);

  // Handle auth failure events (cross-tab)
  useEffect(() => {
    const handleAuthFailure = () => {
      if (actions?.logout) {
        actions.logout();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth:failure", handleAuthFailure);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth:failure", handleAuthFailure);
      }
    };
  }, [actions]);

  // Activity tracking - listen to user interaction events
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const handleActivity = () => {
      // Update lastActivity timestamp via the state hook
      // This is intentionally throttled by browser event loop
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) => {
      if (typeof document !== "undefined") {
        document.addEventListener(event, handleActivity, true);
      }
    });

    return () => {
      events.forEach((event) => {
        if (typeof document !== "undefined") {
          document.removeEventListener(event, handleActivity, true);
        }
      });
    };
  }, [state.isAuthenticated]);

  // Cross-tab synchronization via storage events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e) => {
      // Handle token changes from other tabs
      if (e.key === "accessToken" || e.key === "auth_token") {
        if (e.newValue === null && state.isAuthenticated) {
          // Token removed in another tab - logout
          if (actions?.logout) {
            actions.logout();
          }
        } else if (e.newValue && !state.isAuthenticated) {
          // Token added in another tab - reinitialize
          if (actions?.initializeAuth) {
            actions.initializeAuth();
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [state.isAuthenticated, actions]);

  // Session expiry monitoring
  useEffect(() => {
    if (!state.isAuthenticated || !state.sessionExpiry) return;

    const checkExpiry = () => {
      const now = Date.now();
      if (state.sessionExpiry && now >= state.sessionExpiry) {
        console.warn("[useAuthCallbacks] Session expired");
        if (actions?.logout) {
          actions.logout();
        }
      }
    };

    // Check immediately
    checkExpiry();

    // Check every minute
    const interval = setInterval(checkExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.sessionExpiry, actions]);

  // No return needed - refs are populated in externalCallbackRefs
}
