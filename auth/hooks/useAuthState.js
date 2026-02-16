/**
 * useAuthState Hook
 *
 * Manages authentication state including user, authentication status,
 * loading states, errors, and activity tracking.
 *
 * @returns {Object} State management object
 * @returns {Object} state - Current auth state
 * @returns {Function} updateState - Update state function
 * @returns {Function} clearError - Clear error state
 */

import { useState, useCallback } from "react";

export function useAuthState() {
  // Initialize auth state
  const [state, setState] = useState({
    // User state
    user: null,
    isAuthenticated: false,

    // Loading state
    isLoading: true,

    // Error state
    error: null,

    // Activity tracking
    lastActivity: Date.now(),

    // MFA state
    mfaRequired: false,
    mfaSetup: false,
    mfaVerified: false,

    // Session state
    sessionExpiry: null,
  });

  /**
   * Update authentication state
   * Merges updates with existing state
   */
  const updateState = useCallback((updates) => {
    setState((prev) => ({
      ...prev,
      ...updates,
      lastActivity: Date.now(), // Always update activity timestamp
    }));
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset state to initial values
   * Used for logout or auth failure
   */
  const resetState = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastActivity: Date.now(),
      mfaRequired: false,
      mfaSetup: false,
      mfaVerified: false,
      sessionExpiry: null,
    });
  }, []);

  /**
   * Set loading state
   */
  const setLoading = useCallback((isLoading) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  /**
   * Set error state
   */
  const setError = useCallback((error) => {
    const errorMessage = error?.message || error || "An error occurred";
    setState((prev) => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
    }));
  }, []);

  /**
   * Update last activity timestamp
   */
  const updateActivity = useCallback(() => {
    setState((prev) => ({ ...prev, lastActivity: Date.now() }));
  }, []);

  return {
    state,
    updateState,
    clearError,
    resetState,
    setLoading,
    setError,
    updateActivity,
  };
}
