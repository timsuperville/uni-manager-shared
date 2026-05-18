import { useState, useCallback } from 'react';
import type { User } from '../types/auth.types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthStateShape {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: number;
  mfaRequired: boolean;
  mfaSetup: boolean;
  mfaVerified: boolean;
  sessionExpiry: number | null;
}

type PartialAuthState = Partial<AuthStateShape>;

interface UseAuthStateReturn {
  state: AuthStateShape;
  updateState: (updates: PartialAuthState) => void;
  clearError: () => void;
  resetState: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: unknown) => void;
  updateActivity: () => void;
}

const INITIAL_STATE: AuthStateShape = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  lastActivity: Date.now(),
  mfaRequired: false,
  mfaSetup: false,
  mfaVerified: false,
  sessionExpiry: null
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages the raw authentication state shape used by AuthProvider.
 * This is an internal hook — not exposed in the public barrel.
 */
export function useAuthState(): UseAuthStateReturn {
  const [state, setState] = useState<AuthStateShape>(INITIAL_STATE);

  const updateState = useCallback((updates: PartialAuthState) => {
    setState(prev => ({
      ...prev,
      ...updates,
      lastActivity: Date.now()
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      ...INITIAL_STATE,
      isLoading: false,
      lastActivity: Date.now()
    });
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: unknown) => {
    const errorMessage =
      (error as { message?: string })?.message ??
      (typeof error === 'string' ? error : 'An error occurred');
    setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
  }, []);

  const updateActivity = useCallback(() => {
    setState(prev => ({ ...prev, lastActivity: Date.now() }));
  }, []);

  return {
    state,
    updateState,
    clearError,
    resetState,
    setLoading,
    setError,
    updateActivity
  };
}
