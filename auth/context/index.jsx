/**
 * Authentication Context Exports
 * ================================
 *
 * Centralized export hub for all authentication context-related utilities.
 * Provides single import point for:
 * - AuthProvider component
 * - AuthContext object
 * - useAuth hook (context-based)
 * - Higher-order components
 * - Type definitions
 *
 * Usage Examples:
 * ===============
 *
 * 1. Setup Application:
 *    import { AuthProvider } from '@shared/auth/context';
 *    export default function App() {
 *      return (
 *        <AuthProvider config={{ appName: 'admin' }}>
 *          <MainApp />
 *        </AuthProvider>
 *      );
 *    }
 *
 * 2. Use Auth in Component:
 *    import { useAuth } from '@shared/auth/context';
 *    export default function Dashboard() {
 *      const { user, isAuthenticated, logout } = useAuth();
 *      return <div>{user?.email}</div>;
 *    }
 *
 * 3. Wrap Component with HOC:
 *    import { withAuth } from '@shared/auth/context';
 *    const ProtectedComponent = withAuth(Dashboard);
 *
 * Note: Prefer using useAuth hook from hooks/useAuth.js for new code.
 * This context is primarily used internally by the auth system.
 */

// ============================================================================
// Context Exports
// ============================================================================

// AuthProvider component - wraps application and provides auth state
export { AuthProvider } from "./AuthContext.jsx";

// useAuth hook from context (use AuthProvider.jsx implementation)
// Re-exported for backward compatibility
export { useAuth } from "./AuthContext.jsx";

// SSO Context for cross-application single sign-on
export { SSOContext } from "./SSOContext.jsx";

// ============================================================================
// Higher-Order Components (HOC)
// ============================================================================

import React from "react";

/**
 * withAuth - HOC for wrapping components that require authentication
 *
 * Usage:
 * ```jsx
 * const ProtectedDashboard = withAuth(Dashboard);
 * ```
 *
 * The wrapped component receives auth context as props
 */
export const withAuth = (WrappedComponent) => {
  return function ProtectedComponent(props) {
    const { useAuth } = require("./AuthContext.jsx");
    const auth = useAuth();

    return <WrappedComponent {...props} auth={auth} />;
  };
};

// ============================================================================
// Context Values Export
// ============================================================================

/**
 * Export the raw context for advanced use cases (e.g., context consumer patterns)
 *
 * Avoid using this directly - prefer useAuth hook instead
 */
export function getAuthContext() {
  try {
    const { AuthContext } = require("./AuthContext.jsx");
    return AuthContext;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to get AuthContext:", error);
    }
    return null;
  }
}

// ============================================================================
// Type Definitions (for IDE intellisense)
// ============================================================================

/**
 * @typedef {Object} AuthContextValue
 * @property {import('../types/auth.types.js').User|null} user - Current authenticated user
 * @property {boolean} isAuthenticated - Whether user is authenticated
 * @property {boolean} isLoading - Whether auth is loading
 * @property {string|null} error - Error message if any
 * @property {import('../types/auth.types.js').Session|null} session - Current session info
 * @property {string|null} token - Access token
 * @property {Function} login - Login function
 * @property {Function} logout - Logout function
 * @property {Function} clearError - Clear error state
 * @property {Function} refreshAuth - Refresh auth state
 * @property {Function} updateUser - Update user profile
 * @property {boolean} mfaRequired - Whether MFA verification is required
 * @property {boolean} mfaSetupRequired - Whether MFA setup is required
 * @property {Function} verifyMFALogin - Verify MFA for login
 * @property {Function} setupMFA - Setup MFA for user
 * @property {Function} disableMFA - Disable MFA for user
 */

/**
 * @typedef {Object} AuthProviderConfig
 * @property {string} [appName] - Application identifier (admin, church, business, etc.)
 * @property {string} [apiBase] - Base API URL
 * @property {number} [sessionTimeout] - Session timeout in minutes (default: 30)
 * @property {number} [inactivityTimeout] - Inactivity timeout in minutes (default: 15)
 * @property {boolean} [enableMFA] - Enable MFA feature (default: true)
 * @property {boolean} [enableOAuth] - Enable OAuth integration (default: true)
 * @property {Function} [onAuthError] - Error callback
 * @property {Function} [onAuthSuccess] - Success callback
 */

// ============================================================================
// Provider Helper Functions
// ============================================================================

/**
 * Get the current auth state (for use outside React components)
 * Note: This is a helper function, prefer React hooks within components
 */
export function getAuthState() {
  try {
    // This would require context to be accessible outside React
    // For now, return null - use hooks instead
    return null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to get auth state:", error);
    }
    return null;
  }
}

/**
 * Create a custom context provider with specific configuration
 *
 * Usage:
 * ```jsx
 * const CustomAuthProvider = createCustomAuthProvider({
 *   sessionTimeout: 60,
 *   enableMFA: true
 * });
 * ```
 */
export function createCustomAuthProvider(config = {}) {
  return function CustomProvider({ children }) {
    const { AuthProvider: AP } = require("./AuthContext.jsx");
    return React.createElement(AP, { config }, children);
  };
}

// ============================================================================
// Backward Compatibility Exports
// ============================================================================

/**
 * Deprecated: Use useAuth from hooks/useAuth.js instead
 * Kept for backward compatibility
 */
export function useAuthContext() {
  if (import.meta.env.DEV) {
    console.warn(
      "useAuthContext is deprecated. Use useAuth from @shared/auth/hooks instead.",
    );
  }
  const { useAuth } = require("./AuthContext.jsx");
  return useAuth();
}
/**
 * Deprecated: Use AuthProvider directly
 * This is kept for backward compatibility with older code
 */
export { AuthProvider as AuthContextProvider } from "./AuthContext.jsx";

// ============================================================================
// Re-exports from related modules
// ============================================================================

/**
 * Re-export useAuth hook from main hooks module
 * This ensures consistency with primary hook location
 */
export async function getHookAuth() {
  try {
    const hooks = await import("../hooks/useAuth.js");
    return hooks.useAuth;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to get useAuth from hooks:", error);
    }
    return null;
  }
}

// ============================================================================
// Available Exports List
// ============================================================================

/**
 * Get list of all available context exports
 * Useful for debugging and introspection
 */
export function listAvailableContextExports() {
  return [
    "AuthProvider",
    "useAuth",
    "SSOContext",
    "withAuth",
    "getAuthContext",
    "getAuthState",
    "createCustomAuthProvider",
    "useAuthContext (deprecated)",
    "AuthContextProvider (deprecated)",
    "getHookAuth",
    "listAvailableContextExports",
  ];
}

// ============================================================================
// Context Status and Debugging
// ============================================================================

/**
 * Check if AuthProvider is properly initialized
 * Useful for debugging context issues
 */
export function isAuthContextReady() {
  try {
    const { AuthContext } = require("./AuthContext.jsx");
    return AuthContext !== null && AuthContext !== undefined;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to check auth context status:", error);
    }
    return false;
  }
}

/**
 * Log current context configuration (development only)
 */
export function logContextConfig() {
  if (process.env.NODE_ENV !== "development") {
    console.warn("Context config logging only available in development");
    return;
  }

  console.log("Authentication Context Configuration:", {
    contextAvailable: isAuthContextReady(),
    exports: listAvailableContextExports(),
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// Export Summary
// ============================================================================

/**
 * Summary of what's exported from this module:
 *
 * **Core Exports:**
 * - AuthProvider: Component that wraps your app with auth context
 * - useAuth: Hook to access auth state and methods (deprecated - use hooks/useAuth)
 * - SSOContext: Context for single sign-on across apps
 *
 * **Utilities:**
 * - withAuth: Higher-order component for protected components
 * - getAuthContext: Get the React Context object directly
 * - createCustomAuthProvider: Create provider with custom config
 *
 * **Debugging:**
 * - listAvailableContextExports: See all available exports
 * - isAuthContextReady: Check if context is initialized
 * - logContextConfig: Log current configuration
 *
 * **Backward Compatibility:**
 * - useAuthContext (deprecated)
 * - AuthContextProvider (deprecated)
 *
 * **Migration Guide:**
 * If you're using the old useAuth from context, switch to:
 * - import { useAuth } from '@shared/auth/hooks';
 * This provides better performance and cleaner API.
 */
