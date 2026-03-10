/**
 * Authentication Context Exports
 *
 * Single import point for context-related auth primitives.
 * For hooks (useLogin, useLogout, useMFA, etc.) import from '@shared/auth'
 * or '@shared/auth/hooks' directly.
 */

import React from "react";
import { AuthProvider, useAuth, AuthContext } from "./AuthContext.tsx";

// Core exports
export { AuthProvider, useAuth, AuthContext };
export { SSOContext, SSOProvider, useSSO, withSSO } from "./SSOContext.tsx";
export {
  RealTimeSecurityProvider,
  useRealTimeSecurity,
} from "./RealTimeSecurityContext.tsx";

/**
 * withAuth HOC — for class-component callers only.
 * Prefer the useAuth hook in function components.
 */
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P & { auth: ReturnType<typeof useAuth> }>,
): React.FC<P> => {
  return function ProtectedComponent(props: P) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const auth = useAuth();
    return React.createElement(WrappedComponent, { ...props, auth });
  };
};

/**
 * Deprecated — use AuthProvider directly.
 * Kept for backward compatibility.
 */
export { AuthProvider as AuthContextProvider } from "./AuthContext.tsx";

