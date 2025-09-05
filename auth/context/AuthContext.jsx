/**
 * Unified Authentication Context
 *
 * Provides consistent authentication state management across all apps.
 * Each app can customize the context while using the same core functionality.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import UnifiedAuthService from "../services/UnifiedAuthService.js";
import { tokenStorage } from "../utils/tokenStorage.js";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({
  children,
  config = {},
  onAuthStateChange,
  onError,
}) => {
  // Initialize auth service with app-specific config
  const authService = new UnifiedAuthService(config);

  // Authentication state
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    lastActivity: Date.now(),
  });

  /**
   * Update authentication state
   */
  const updateAuthState = useCallback(
    (updates) => {
      setAuthState((prev) => {
        const newState = { ...prev, ...updates };

        // Notify parent component of auth state changes
        if (onAuthStateChange) {
          onAuthStateChange(newState);
        }

        return newState;
      });
    },
    [onAuthStateChange]
  );

  /**
   * Handle authentication errors
   */
  const handleError = useCallback(
    (error) => {
      const errorMessage = error?.message || "An authentication error occurred";

      updateAuthState({
        error: errorMessage,
        isLoading: false,
      });

      if (onError) {
        onError(error);
      }
    },
    [updateAuthState, onError]
  );

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    try {
      updateAuthState({ isLoading: true, error: null });

      const user = await authService.getCurrentUser();
      const isAuthenticated = await authService.isAuthenticated();

      updateAuthState({
        user,
        isAuthenticated,
        isLoading: false,
        lastActivity: Date.now(),
      });
    } catch (error) {
      handleError(error);
    }
  }, [authService, updateAuthState, handleError]);

  /**
   * Login user
   */
  const login = useCallback(
    async (credentials) => {
      try {
        updateAuthState({ isLoading: true, error: null });

        const result = await authService.login(credentials);

        updateAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          lastActivity: Date.now(),
        });

        return result;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [authService, updateAuthState, handleError]
  );

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      updateAuthState({ isLoading: true, error: null });

      await authService.logout();

      updateAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        lastActivity: Date.now(),
      });

      return { success: true };
    } catch (error) {
      // Still update state even if logout fails
      updateAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      handleError(error);
      return { success: true }; // Return success since user is logged out locally
    }
  }, [authService, updateAuthState, handleError]);

  /**
   * Signup user
   */
  const signup = useCallback(
    async (userData) => {
      try {
        updateAuthState({ isLoading: true, error: null });

        const result = await authService.signup(userData);

        updateAuthState({ isLoading: false });

        return result;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [authService, updateAuthState, handleError]
  );

  /**
   * Forgot password
   */
  const forgotPassword = useCallback(
    async (email) => {
      try {
        updateAuthState({ isLoading: true, error: null });

        const result = await authService.forgotPassword(email);

        updateAuthState({ isLoading: false });

        return result;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [authService, updateAuthState, handleError]
  );

  /**
   * Reset password
   */
  const resetPassword = useCallback(
    async (token, newPassword) => {
      try {
        updateAuthState({ isLoading: true, error: null });

        const result = await authService.resetPassword(token, newPassword);

        updateAuthState({ isLoading: false });

        return result;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [authService, updateAuthState, handleError]
  );

  /**
   * Refresh authentication
   */
  const refreshAuth = useCallback(async () => {
    try {
      await authService.refreshToken();
      await initializeAuth();
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [authService, initializeAuth, handleError]);

  /**
   * Update user data
   */
  const updateUser = useCallback(
    async (userData) => {
      try {
        const success = await tokenStorage.updateUser(userData);

        if (success) {
          const updatedUser = await authService.getCurrentUser();
          updateAuthState({ user: updatedUser });
        }

        return success;
      } catch (error) {
        handleError(error);
        return false;
      }
    },
    [authService, updateAuthState, handleError]
  );

  /**
   * Check current authentication state
   */
  const checkAuthState = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      const isAuthenticated = await authService.isAuthenticated();

      updateAuthState({
        user,
        isAuthenticated,
        isLoading: false,
      });

      return { user, isAuthenticated };
    } catch (error) {
      handleError(error);
      return { user: null, isAuthenticated: false };
    }
  }, [authService, updateAuthState, handleError]);

  /**
   * Update last activity timestamp
   */
  const updateActivity = useCallback(() => {
    updateAuthState({ lastActivity: Date.now() });
  }, [updateAuthState]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Set up activity tracking
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const handleActivity = () => updateActivity();

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [authState.isAuthenticated, updateActivity]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const refreshInterval = config.tokenRefreshInterval || 15 * 60 * 1000; // 15 minutes
    const interval = setInterval(async () => {
      await refreshAuth();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, refreshAuth, config.tokenRefreshInterval]);

  const contextValue = {
    // State
    ...authState,

    // Actions
    login,
    logout,
    signup,
    forgotPassword,
    resetPassword,
    refreshAuth,
    updateUser,
    checkAuthState,
    updateActivity,

    // Utilities
    authService,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
