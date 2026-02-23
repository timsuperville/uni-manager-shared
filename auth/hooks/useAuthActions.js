/**
 * useAuthActions Hook
 *
 * Provides authentication actions (login, logout, signup, MFA, etc.)
 * Handles all user-initiated authentication operations.
 *
 * @param {Object} authService - AuthService instance
 * @param {Function} updateState - State update function from useAuthState
 * @param {Function} setError - Error setter from useAuthState
 * @param {Function} resetState - State reset function from useAuthState
 * @param {Object} callbackRefs - Refs to callback functions
 * @returns {Object} Authentication actions
 */

import { useCallback } from "react";
import { clearCachedDeviceFingerprint } from "../utils/deviceFingerprintCache.js";

export function useAuthActions(
  authService,
  updateState,
  setError,
  resetState,
  callbackRefs = {},
) {
  const { onAuthStateChangeRef, onErrorRef } = callbackRefs;

  /**
   * Notify auth state change callback
   */
  const notifyStateChange = useCallback(
    (newState) => {
      if (onAuthStateChangeRef?.current) {
        setTimeout(() => {
          onAuthStateChangeRef.current(newState);
        }, 0);
      }
    },
    [onAuthStateChangeRef],
  );

  /**
   * Notify error callback
   */
  const notifyError = useCallback(
    (error) => {
      if (onErrorRef?.current) {
        setTimeout(() => {
          onErrorRef.current(error);
        }, 0);
      }
    },
    [onErrorRef],
  );

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });

      // Initialize the auth service
      await authService.initialize();

      const user = await authService.getCurrentUser();
      const isAuthenticated = await authService.isAuthenticated();

      const newState = {
        user,
        isAuthenticated,
        isLoading: false,
        error: null,
      };

      updateState(newState);
      notifyStateChange(newState);
    } catch (error) {
      const errorMessage =
        error?.message || "Authentication initialization failed";
      setError(errorMessage);
      notifyError(error);
    }
  }, [authService, updateState, setError, notifyStateChange, notifyError]);

  /**
   * Login user
   */
  const login = useCallback(
    async (credentials) => {
      try {
        updateState({ isLoading: true, error: null });

        const result = await authService.login(credentials);

        const newState = {
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        };

        updateState(newState);
        notifyStateChange(newState);

        return result;
      } catch (error) {
        const errorMessage = error?.message || "Login failed";
        setError(errorMessage);
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyStateChange, notifyError],
  );

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });

      await authService.logout();

      // Clear device fingerprint cache on logout
      clearCachedDeviceFingerprint();

      resetState();
      notifyStateChange({ user: null, isAuthenticated: false });

      return { success: true };
    } catch (error) {
      // Still logout locally even if server call fails
      clearCachedDeviceFingerprint();
      resetState();
      notifyStateChange({ user: null, isAuthenticated: false });
      notifyError(error);

      return { success: true };
    }
  }, [authService, updateState, resetState, notifyStateChange, notifyError]);

  /**
   * Signup user
   */
  const signup = useCallback(
    async (userData) => {
      try {
        updateState({ isLoading: true, error: null });

        const result = await authService.signup(userData);

        updateState({ isLoading: false });

        return result;
      } catch (error) {
        const errorMessage = error?.message || "Signup failed";
        setError(errorMessage);
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyError],
  );

  /**
   * Reset password
   */
  const resetPassword = useCallback(
    async (email) => {
      try {
        updateState({ isLoading: true, error: null });

        const result = await authService.resetPassword(email);

        updateState({ isLoading: false });

        return result;
      } catch (error) {
        const errorMessage = error?.message || "Password reset failed";
        setError(errorMessage);
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyError],
  );

  /**
   * Verify MFA code
   */
  const verifyMFA = useCallback(
    async (code) => {
      try {
        updateState({ isLoading: true, error: null });

        const result = await authService.verifyMFA(code);

        const newState = {
          user: result.user,
          isAuthenticated: true,
          mfaVerified: true,
          mfaRequired: false,
          isLoading: false,
        };

        updateState(newState);
        notifyStateChange(newState);

        return result;
      } catch (error) {
        const errorMessage = error?.message || "MFA verification failed";
        setError(errorMessage);
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyStateChange, notifyError],
  );

  /**
   * Setup MFA
   */
  const setupMFA = useCallback(
    async (method) => {
      try {
        updateState({ isLoading: true, error: null });

        const result = await authService.setupMFA(method);

        updateState({ mfaSetup: true, isLoading: false });

        return result;
      } catch (error) {
        const errorMessage = error?.message || "MFA setup failed";
        setError(errorMessage);
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyError],
  );

  /**
   * Refresh authentication token
   */
  const refreshAuth = useCallback(async () => {
    try {
      const success = await authService.refreshToken();

      if (success) {
        await initializeAuth();
        return true;
      }

      return false;
    } catch (error) {
      const errorMessage = error?.message || "Token refresh failed";
      if (import.meta.env.DEV) {
        console.warn(
          "[useAuthActions] Refresh failed, logging out...",
          errorMessage,
        );
      }

      // Logout on refresh failure to prevent invalid state
      resetState();

      try {
        await authService.logout();
      } catch (e) {
        // Ignore logout errors
      }

      notifyError(error);
      notifyStateChange({ user: null, isAuthenticated: false });

      return false;
    }
  }, [authService, initializeAuth, resetState, notifyError, notifyStateChange]);

  /**
   * Update user data
   */
  const updateUser = useCallback(
    async (userData) => {
      try {
        const success = await authService.updateUser(userData);

        if (success) {
          const updatedUser = await authService.getCurrentUser();
          updateState({ user: updatedUser });
          notifyStateChange({ user: updatedUser });
        }

        return success;
      } catch (error) {
        const errorMessage = error?.message || "Update user failed";
        setError(errorMessage);
        notifyError(error);
        return false;
      }
    },
    [authService, updateState, setError, notifyStateChange, notifyError],
  );

  /**
   * Switch current church
   */
  const switchChurch = useCallback(
    async (churchId) => {
      try {
        updateState({ isLoading: true, error: null });

        const result = await authService.switchChurch(churchId);

        const newState = {
          user: result.user,
          isLoading: false,
        };

        updateState(newState);
        notifyStateChange(newState);

        return result;
      } catch (error) {
        const errorMessage = error?.message || "Church switch failed";
        setError(errorMessage);
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyStateChange, notifyError],
  );

  return {
    initializeAuth,
    login,
    logout,
    signup,
    resetPassword,
    verifyMFA,
    setupMFA,
    refreshAuth,
    updateUser,
    switchChurch,
  };
}
