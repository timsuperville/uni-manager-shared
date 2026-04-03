import { useAuth as useAuthFromProvider } from "../context/AuthContext";
import type { AuthContextType } from "../types/auth.types";

/**
 * useAuth — Primary Authentication Hook.
 *
 * Single re-export of the hook from AuthProvider. All components and hooks
 * in the codebase should import from this file (or from @shared/auth barrel),
 * never directly from AuthContext.
 *
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  return useAuthFromProvider() as AuthContextType;
}

export default useAuth;
