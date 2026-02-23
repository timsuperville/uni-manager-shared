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

/* global console */

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
  const { session, refreshAuth } = useAuth();

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
   * Destroy session
   */
  const handleDestroySession = useCallback(async () => {
    console.log("Session will be destroyed");
    // TODO: Implement session destruction
  }, []);

  return {
    session: session || null,
    isActive: !!session,
    timeRemaining: 0, // TODO: Get from session service
    renewSession: handleRenewSession,
    destroySession: handleDestroySession,
  };
}

export default useSession;
