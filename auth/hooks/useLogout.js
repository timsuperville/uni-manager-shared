/**
 * useLogout - Logout Functionality Hook
 *
 * Specialized hook for logout operations.
 * Handles cleanup, token clearing, and session termination.
 *
 * @module hooks/useLogout
 * @example
 * const { logout, isLoading, error } = useLogout();
 * await logout();
 */

/* global console */

import { useCallback } from "react";
import { useAuth } from "./useAuth.js";

/**
 * @typedef {Object} UseLogoutReturn
 * @property {Function} logout - Logout function
 * @property {boolean} isLoading - Is logout in progress
 * @property {string|null} error - Error message
 */

/**
 * Logout hook
 *
 * @returns {UseLogoutReturn} Logout function and status
 */
export function useLogout() {
  const { logout: authLogout, isLoading, error } = useAuth();

  /**
   * Perform logout
   */
  const handleLogout = useCallback(async () => {
    try {
      await authLogout();
    } catch (err) {
      console.error("Logout error:", err);
      throw err;
    }
  }, [authLogout]);

  return {
    logout: handleLogout,
    isLoading,
    error: error || null,
  };
}

export default useLogout;
