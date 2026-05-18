import { useCallback } from 'react';
import { useAuth } from './useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UseLogoutReturn {
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Logout hook — delegates to the canonical authLogout action.
 * Handles cleanup, token clearing, and session termination.
 */
export function useLogout(): UseLogoutReturn {
  const { logout: authLogout, isLoading, error } = useAuth();

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await (authLogout as () => Promise<void>)();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Logout error:', err);
      }
      throw err;
    }
  }, [authLogout]);

  return {
    logout: handleLogout,
    isLoading,
    error: error ?? null
  };
}

export default useLogout;
