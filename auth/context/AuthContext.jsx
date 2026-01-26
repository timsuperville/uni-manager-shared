/**
 * Unified Authentication Context
 *
 * Single source of truth for authentication state management across all applications.
 * Provides core auth functionality, MFA, session management, and RBAC integration.
 *
 * Features:
 * - User authentication (login, signup, logout)
 * - Token management (access/refresh)
 * - Multi-factor authentication (MFA)
 * - Session management with auto-refresh
 * - Cross-tab synchronization
 * - Activity tracking
 * - Error handling with callbacks
 *
 * Usage:
 * ```jsx
 * import { AuthProvider, useAuth } from '@shared/auth';
 *
 * function App() {
 *   return (
 *     <AuthProvider config={{ appName: 'home' }}>
 *       <MainApp />
 *     </AuthProvider>
 *   );
 * }
 *
 * function Component() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *   return isAuthenticated ? <Dashboard /> : <LoginForm />;
 * }
 * ```
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import PropTypes from "prop-types";
import { AuthService } from "../services/authService.js";
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
  // Initialize auth service with app-specific config using useMemo for performance
  const authService = useMemo(() => new AuthService(config), [config]);

  // Use refs for stable prop references to prevent infinite loops
  const onAuthStateChangeRef = useRef(onAuthStateChange);
  const onErrorRef = useRef(onError);
  const isInitializedRef = useRef(false);

  // Update refs when props change
  useEffect(() => {
    onAuthStateChangeRef.current = onAuthStateChange;
  }, [onAuthStateChange]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

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
   * Using useRef for stable prop references to prevent infinite loops
   */
  const updateAuthState = useCallback((updates) => {
    setAuthState((prev) => {
      const newState = { ...prev, ...updates };
      return newState;
    });

    // Call callback after state update to avoid issues inside setState
    if (onAuthStateChangeRef.current) {
      setTimeout(() => {
        onAuthStateChangeRef.current(updates);
      }, 0);
    }
  }, []); // Empty dependency array - stable reference

  /**
   * Handle authentication errors
   * Using useRef for stable prop references to prevent infinite loops
   */
  const handleError = useCallback((error) => {
    const errorMessage = error?.message || "An authentication error occurred";

    setAuthState((prev) => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
    }));

    // Call error callback after state update
    if (onErrorRef.current) {
      setTimeout(() => {
        onErrorRef.current(error);
      }, 0);
    }
  }, []); // Empty dependency array - stable reference

  /**
   * Initialize authentication state
   * Using stable useRef references to prevent infinite loops
   */
  const initializeAuth = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Initialize the auth service first
      await authService.initialize();

      const user = await authService.getCurrentUser();
      const isAuthenticated = await authService.isAuthenticated();

      const newState = {
        user,
        isAuthenticated,
        isLoading: false,
        error: null,
        lastActivity: Date.now(),
      };

      setAuthState((prev) => ({ ...prev, ...newState }));

      // Call callback after state update
      if (onAuthStateChangeRef.current) {
        setTimeout(() => {
          onAuthStateChangeRef.current(newState);
        }, 0);
      }
    } catch (error) {
      const errorMessage = error?.message || "An authentication error occurred";

      setAuthState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));

      // Call error callback after state update
      if (onErrorRef.current) {
        setTimeout(() => {
          onErrorRef.current(error);
        }, 0);
      }
    }
  }, [authService]); // Only depend on authService

  /**
   * Login user
   */
  const login = useCallback(
    async (credentials) => {
      try {
        // Direct setState to avoid circular dependency
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const result = await authService.login(credentials);

        const newState = {
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          lastActivity: Date.now(),
        };

        setAuthState((prev) => ({ ...prev, ...newState }));

        // Notify callback after state update
        if (onAuthStateChangeRef.current) {
          setTimeout(() => {
            onAuthStateChangeRef.current(newState);
          }, 0);
        }

        return result;
      } catch (error) {
        const errorMessage = error?.message || "Login failed";

        setAuthState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        // Notify error callback after state update
        if (onErrorRef.current) {
          setTimeout(() => {
            onErrorRef.current(error);
          }, 0);
        }

        throw error;
      }
    },
    [authService], // Only depend on authService
  );

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      // Direct setState to avoid circular dependency
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      await authService.logout();

      const newState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        lastActivity: Date.now(),
      };

      setAuthState((prev) => ({ ...prev, ...newState }));

      // Notify callback after state update
      if (onAuthStateChangeRef.current) {
        setTimeout(() => {
          onAuthStateChangeRef.current(newState);
        }, 0);
      }

      return { success: true };
    } catch (error) {
      // Still update state even if logout fails
      const newState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };

      setAuthState((prev) => ({ ...prev, ...newState }));

      // Notify callbacks after state update
      if (onAuthStateChangeRef.current) {
        setTimeout(() => {
          onAuthStateChangeRef.current(newState);
        }, 0);
      }

      if (onErrorRef.current) {
        setTimeout(() => {
          onErrorRef.current(error);
        }, 0);
      }

      return { success: true }; // Return success since user is logged out locally
    }
  }, [authService]); // Only depend on authService

  /**
   * Signup user
   */
  const signup = useCallback(
    async (userData) => {
      try {
        // Direct setState to avoid circular dependency
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const result = await authService.signup(userData);

        setAuthState((prev) => ({ ...prev, isLoading: false }));

        return result;
      } catch (error) {
        const errorMessage = error?.message || "Signup failed";

        setAuthState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        // Notify error callback after state update
        if (onErrorRef.current) {
          setTimeout(() => {
            onErrorRef.current(error);
          }, 0);
        }

        throw error;
      }
    },
    [authService], // Only depend on authService
  );

  /**
   * Forgot password
   */
  const forgotPassword = useCallback(
    async (email) => {
      try {
        // Direct setState to avoid circular dependency
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const result = await authService.forgotPassword(email);

        setAuthState((prev) => ({ ...prev, isLoading: false }));

        return result;
      } catch (error) {
        const errorMessage = error?.message || "Forgot password failed";

        setAuthState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        // Notify error callback after state update
        if (onErrorRef.current) {
          setTimeout(() => {
            onErrorRef.current(error);
          }, 0);
        }

        throw error;
      }
    },
    [authService], // Only depend on authService
  );

  /**
   * Reset password
   */
  const resetPassword = useCallback(
    async (token, newPassword) => {
      try {
        // Direct setState to avoid circular dependency
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const result = await authService.resetPassword(token, newPassword);

        setAuthState((prev) => ({ ...prev, isLoading: false }));

        return result;
      } catch (error) {
        const errorMessage = error?.message || "Reset password failed";

        setAuthState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        // Notify error callback after state update
        if (onErrorRef.current) {
          setTimeout(() => {
            onErrorRef.current(error);
          }, 0);
        }

        throw error;
      }
    },
    [authService], // Only depend on authService
  );

  /**
   * Refresh authentication
   */
  const refreshAuth = useCallback(async () => {
    try {
      await authService.refreshToken();
      // Call initializeAuth directly instead of depending on it
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
      }
      await initializeAuth();
      return true;
      return true;
    } catch (error) {
      const errorMessage = error?.message || "Refresh failed";

      // If refresh fails, we must logout to prevent loops and invalid states
      console.warn(
        "[AuthContext] Refresh failed, logging out...",
        errorMessage,
      );

      // Clear local state
      const newState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        lastActivity: Date.now(),
        error: errorMessage,
      };

      setAuthState((prev) => ({ ...prev, ...newState }));

      // Clear persistence
      try {
        await authService.logout();
      } catch (e) {
        // Ignore logout errors (likely already invalid)
      }

      // Notify error callback after state update
      if (onErrorRef.current) {
        setTimeout(() => {
          onErrorRef.current(error);
        }, 0);
      }

      // Notify state change
      if (onAuthStateChangeRef.current) {
        setTimeout(() => {
          onAuthStateChangeRef.current(newState);
        }, 0);
      }

      return false;
    }
  }, [authService]); // Remove dependency on initializeAuth and handleError

  /**
   * Update user data
   */
  const updateUser = useCallback(
    async (userData) => {
      try {
        const success = await tokenStorage.updateUser(userData);

        if (success) {
          const updatedUser = await authService.getCurrentUser();

          // Direct setState to avoid circular dependency
          setAuthState((prev) => ({ ...prev, user: updatedUser }));

          // Notify callback after state update
          if (onAuthStateChangeRef.current) {
            setTimeout(() => {
              onAuthStateChangeRef.current({ user: updatedUser });
            }, 0);
          }
        }

        return success;
      } catch (error) {
        const errorMessage = error?.message || "Update user failed";

        setAuthState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        // Notify error callback after state update
        if (onErrorRef.current) {
          setTimeout(() => {
            onErrorRef.current(error);
          }, 0);
        }

        return false;
      }
    },
    [authService], // Only depend on authService
  );

  /**
   * Switch current church
   */
  const switchChurch = useCallback(
    async (churchId) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const result = await authService.switchChurch(churchId);

        const newState = {
          user: result.user,
          isLoading: false,
        };

        setAuthState((prev) => ({ ...prev, ...newState }));

        // Notify callback
        if (onAuthStateChangeRef.current) {
          setTimeout(() => {
            onAuthStateChangeRef.current(newState);
          }, 0);
        }

        return result;
      } catch (error) {
        const errorMessage = error?.message || "Switch church failed";

        setAuthState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        if (onErrorRef.current) {
          setTimeout(() => {
            onErrorRef.current(error);
          }, 0);
        }
        throw error;
      }
    },
    [authService],
  );

  /**
   * Check current authentication state
   */
  const checkAuthState = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      const isAuthenticated = await authService.isAuthenticated();

      const newState = {
        user,
        isAuthenticated,
        isLoading: false,
      };

      // Direct setState to avoid circular dependency
      setAuthState((prev) => ({ ...prev, ...newState }));

      // Notify callback after state update
      if (onAuthStateChangeRef.current) {
        setTimeout(() => {
          onAuthStateChangeRef.current(newState);
        }, 0);
      }

      return { user, isAuthenticated };
    } catch (error) {
      const errorMessage = error?.message || "Check auth state failed";

      setAuthState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));

      // Notify error callback after state update
      if (onErrorRef.current) {
        setTimeout(() => {
          onErrorRef.current(error);
        }, 0);
      }

      return { user: null, isAuthenticated: false };
    }
  }, [authService]); // Only depend on authService

  /**
   * Update last activity timestamp
   */
  const updateActivity = useCallback(() => {
    // Direct setState to avoid circular dependency
    setAuthState((prev) => ({ ...prev, lastActivity: Date.now() }));
  }, []); // Empty dependency array - stable reference

  // Initialize auth on mount - use ref to prevent infinite loops
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      initializeAuth();
    }
  }, []); // Empty dependency array - run only once

  // Set up activity tracking
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const handleActivity = () => {
      // Direct setState call to avoid circular dependency
      setAuthState((prev) => ({ ...prev, lastActivity: Date.now() }));
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      typeof document !== "undefined" &&
        document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach((event) => {
        typeof document !== "undefined" &&
          document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [authState.isAuthenticated]); // Remove updateActivity dependency

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const refreshInterval = config.tokenRefreshInterval || 15 * 60 * 1000; // 15 minutes
    const interval = setInterval(async () => {
      // Call refreshAuth directly to avoid circular dependency
      try {
        await authService.refreshToken();
        await initializeAuth();
      } catch (error) {
        const errorMessage = error?.message || "Auto-refresh failed";

        setAuthState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        // Notify error callback after state update
        if (onErrorRef.current) {
          setTimeout(() => {
            onErrorRef.current(error);
          }, 0);
        }
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authService, config.tokenRefreshInterval]); // Remove refreshAuth dependency

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    // Direct setState to avoid circular dependency
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []); // Empty dependency array - stable reference

  /**
   * Update user profile
   */
  const updateProfile = useCallback(
    async (profileData) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const result = await authService.updateProfile(profileData);

        const newState = {
          user: result.user,
          isLoading: false,
        };

        setAuthState((prev) => ({ ...prev, ...newState }));

        // Notify callback
        if (onAuthStateChangeRef.current) {
          setTimeout(() => {
            onAuthStateChangeRef.current(newState);
          }, 0);
        }

        return result;
      } catch (error) {
        const errorMessage = error?.message || "Update profile failed";

        setAuthState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        if (onErrorRef.current) {
          setTimeout(() => {
            onErrorRef.current(error);
          }, 0);
        }
        throw error;
      }
    },
    [authService],
  );

  /**
   * Upload avatar image
   */
  const uploadAvatar = useCallback(
    async (file) => {
      try {
        const result = await authService.uploadAvatar(file);

        // Update user state with new avatar URL
        setAuthState((prev) => ({
          ...prev,
          user: {
            ...prev.user,
            avatarUrl: result.avatarUrl,
          },
        }));

        return result;
      } catch (error) {
        if (onErrorRef.current) {
          setTimeout(() => {
            onErrorRef.current(error);
          }, 0);
        }
        throw error;
      }
    },
    [authService],
  );

  /**
   * Upload cover image
   */
  const uploadCoverImage = useCallback(
    async (file) => {
      try {
        const result = await authService.uploadCoverImage(file);

        // Update user state with new cover URL
        setAuthState((prev) => ({
          ...prev,
          user: {
            ...prev.user,
            coverImageUrl: result.coverImageUrl,
          },
        }));

        return result;
      } catch (error) {
        if (onErrorRef.current) {
          setTimeout(() => {
            onErrorRef.current(error);
          }, 0);
        }
        throw error;
      }
    },
    [authService],
  );

  /**
   * Change password
   */
  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      try {
        const result = await authService.changePassword(currentPassword, newPassword);
        return result;
      } catch (error) {
        if (onErrorRef.current) {
          setTimeout(() => {
            onErrorRef.current(error);
          }, 0);
        }
        throw error;
      }
    },
    [authService],
  );

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
    switchChurch,
    checkAuthState,
    updateActivity,
    clearError,

    // Profile management
    updateProfile,
    uploadAvatar,
    uploadCoverImage,
    changePassword,

    // Utilities
    authService,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

AuthContext.propTypes = {
  children: PropTypes.node.isRequired,
  config: PropTypes.shape({
    appName: PropTypes.string,
    tokenRefreshInterval: PropTypes.number,
  }),
  onAuthStateChange: PropTypes.func,
  onError: PropTypes.func,
};

// Export both named and default
export { AuthContext };
export default AuthContext;
