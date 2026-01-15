/**
 * AuthContext - Compatibility wrapper
 * Provides authentication context with extended functionality
 * This is a compatibility layer for tests expecting AuthContext
 */

import React, { createContext, useContext } from "react";
import { AuthProvider, useAuth, AUTH_ACTIONS } from "../auth/context/index.jsx";

// Create auth context that extends the base auth context
const AuthContext = createContext(null);
const EnhancedAuthContext = createContext(null);

/**
 * Enhanced Auth Provider
 * Wraps the base AuthProvider with additional enhanced functionality
 */
export function EnhancedAuthProvider({ children, ...props }) {
  return (
    <AuthProvider {...props}>
      <EnhancedAuthContext.Provider value={{}}>
        {children}
      </EnhancedAuthContext.Provider>
    </AuthProvider>
  );
}

/**
 * Enhanced Auth Hook
 * Provides all base auth functionality plus enhanced features
 */
export function useEnhancedAuth() {
  const baseAuth = useAuth();
  const enhancedContext = useContext(EnhancedAuthContext);

  return {
    ...baseAuth,
    // Enhanced functionality can be added here
    isEnhanced: true,
    version: "2.0.0",
  };
}

// Re-export everything from base auth context for compatibility
export { AuthProvider, useAuth, AUTH_ACTIONS };

// Default export for convenience
export { EnhancedAuthContext };
export default EnhancedAuthContext;
