/**
 * useAuth - Primary Authentication Hook
 *
 * Main hook for authentication. Provides access to:
 * - Current user and auth state
 * - Login/logout functionality
 * - Token management
 * - Session information
 * - Auth status and error handling
 *
 * @module hooks/useAuth
 * @example
 * const { user, isAuthenticated, login, logout, error } = useAuth();
 *
 * if (isAuthenticated) {
 *   console.log('User:', user.email);
 * }
 *
 * const handleLogin = async (email, password) => {
 *   try {
 *     await login({ email, password });
 *   } catch (err) {
 *     console.error('Login failed:', err.message);
 *   }
 * };
 */

import { useAuth as useAuthFromProvider } from "../context/AuthContext.jsx";

/**
 * @typedef {Object} UseAuthReturn
 * @property {import('../types/auth.types.js').User|null} user - Current user
 * @property {boolean} isAuthenticated - Is user logged in
 * @property {boolean} isLoading - Is auth operation in progress
 * @property {string|null} error - Error message if operation failed
 * @property {import('../types/auth.types.js').Session|null} session - Current session
 * @property {string|null} token - Access token
 * @property {Function} login - Login with credentials
 * @property {Function} logout - Logout user
 * @property {Function} clearError - Clear error message
 * @property {Function} refreshAuth - Refresh authentication state
 */

/**
 * Main authentication hook
 *
 * @returns {UseAuthReturn} Auth state and methods
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
  // Use the hook directly from AuthProvider for consistent context
  return useAuthFromProvider();
}

export default useAuth;
