/**
 * useSession - Session Management Hook
 *
 * Specialized hook for session management.
 * Handles session state, timeouts, and activity tracking.
 *
 * @module hooks/useSession
 * @example
 * const { session, isActive, timeRemaining, renewSession } = useSession();
 */

import { useCallback } from "react";
import { useAuth } from "./useAuth.js";

/**
 * @typedef {Object} UseSessionReturn
 * @property {import('../types/auth.types.js').Session|null} session - Current session
 * @property {boolean} isActive - Is session active
 * @property {number} timeRemaining - Milliseconds until expiration
 * @property {Function} renewSession - Renew current session
 * @property {Function} destroySession - Destroy session
 */

/**
 * Session hook
 *
 * @returns {UseSessionReturn} Session state and methods
 */
export function useSession() {
  const { session, sessionExpiry, refreshAuth, logout } = useAuth();

  /**
   * Renew session
   */
  const handleRenewSession = useCallback(async () => {
    try {
      await refreshAuth();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to renew session:", err);
      }
      throw err;
    }
  }, [refreshAuth]);

  /**
   * Destroy session — delegates to the canonical logout action
   */
  const handleDestroySession = useCallback(async () => {
    await logout();
  }, [logout]);

  /**
   * Compute milliseconds remaining until session expiry.
   * Returns 0 when no expiry is set or when the session has expired.
   */
  const timeRemaining = sessionExpiry
    ? Math.max(0, sessionExpiry - Date.now())
    : 0;

  return {
    session: session || null,
    isActive: !!session,
    timeRemaining,
    renewSession: handleRenewSession,
    destroySession: handleDestroySession,
  };
}

export default useSession;
