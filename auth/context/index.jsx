/**
 * Authentication Context Exports
 *
 * Single import point for context-related auth primitives.
 * For hooks (useLogin, useLogout, useMFA, etc.) import from '@shared/auth'
 * or '@shared/auth/hooks' directly.
 */

import React from "react";

// Core exports — the only things in this module with actual consumers
export { AuthProvider, useAuth } from "./AuthContext.jsx";
export { SSOContext } from "./SSOContext.jsx";

/**
 * withAuth — HOC for components that need auth props injected.
 * Prefer the useAuth hook in function components; this exists for legacy
 * class-component callers only.
 */
export const withAuth = (WrappedComponent) => {
  return function ProtectedComponent(props) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useAuth: useAuthHook } = require("./AuthContext.jsx");
    const auth = useAuthHook();
    return <WrappedComponent {...props} auth={auth} />;
  };
};

/**
 * Deprecated — use AuthProvider directly.
 * Kept for backward compatibility; will be removed after all callers migrate.
 */
export { AuthProvider as AuthContextProvider } from "./AuthContext.jsx";
