/**
 * Unified Authentication Context (Refactored)
 *
 * Single source of truth for authentication state management across all applications.
 * Provides core auth functionality, MFA, session management, and RBAC integration.
 *
 * This file has been refactored to use custom hooks for better maintainability:
 * - useAuthState: State management
 * - useAuthActions: Action handlers
 * - useAuthCallbacks: Side effects and cleanup
 *
 * @example
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

import React, { createContext, useContext, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { AuthService } from "../services/authService.js";
import { useAuthState } from "../hooks/useAuthState.js";
import { useAuthActions } from "../hooks/useAuthActions.js";
import { useAuthCallbacks } from "../hooks/useAuthCallbacks.js";

const AuthContext = createContext(null);

/**
 * useAuth Hook
 * Access authentication state and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * AuthProvider Component
 * Provides authentication context to the app
 */
export const AuthProvider = ({
  children,
  config = {},
  onAuthStateChange,
  onError,
}) => {
  // Initialize auth service
  const authService = useMemo(() => new AuthService(config), [config]);

  // Use custom hooks for state management
  const {
    state,
    updateState,
    clearError,
    resetState,
    setLoading,
    setError,
    updateActivity,
  } = useAuthState();

  // Step 1: Create callback refs first (will be populated by useAuthCallbacks)
  const callbackRefsRef = useRef({
    onAuthStateChangeRef: { current: null },
    onErrorRef: { current: null },
  });

  // Step 2: Create actions with the callback refs
  const actions = useAuthActions(
    authService,
    updateState,
    setError,
    resetState,
    callbackRefsRef.current,
  );

  // Step 3: Set up callbacks with actions now available
  useAuthCallbacks(
    state,
    actions,
    onAuthStateChange,
    onError,
    config,
    callbackRefsRef.current,
  );

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      // State
      ...state,

      // Actions
      ...actions,

      // Utility methods
      clearError,
      updateActivity,

      // Service instance (for advanced use cases)
      authService,
    }),
    [state, actions, clearError, updateActivity, authService],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
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
