import { useCallback } from "react";
import { useAuth } from "./useAuth.ts";
import type { Session } from "../types/auth.types.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UseSessionReturn {
  session: Session | null;
  isActive: boolean;
  timeRemaining: number;
  renewSession: () => Promise<void>;
  destroySession: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Session hook — provides session state and lifecycle methods.
 */
export function useSession(): UseSessionReturn {
  const { session, sessionExpiry, refreshAuth, logout } = useAuth() as unknown as {
    session: Session | null | undefined;
    sessionExpiry: number | undefined;
    refreshAuth: (() => Promise<boolean>) | undefined;
    logout: () => Promise<void | { success: boolean }>;
  };

  const handleRenewSession = useCallback(async (): Promise<void> => {
    if (!refreshAuth) return;
    try {
      await refreshAuth();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to renew session:", err);
      }
      throw err;
    }
  }, [refreshAuth]);

  const handleDestroySession = useCallback(async (): Promise<void> => {
    await logout();
  }, [logout]);

  const timeRemaining = sessionExpiry
    ? Math.max(0, sessionExpiry - Date.now())
    : 0;

  return {
    session: session ?? null,
    isActive: !!session,
    timeRemaining,
    renewSession: handleRenewSession,
    destroySession: handleDestroySession,
  };
}

export default useSession;
