import { useCallback } from "react";
import { clearCachedDeviceFingerprint } from "../utils/deviceFingerprintCache.js";
import type { User, LoginCredentials, SignupData } from "../types/auth.types.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CallbackRef<T> {
  current: T | null | undefined;
}

interface CallbackRefs {
  onAuthStateChangeRef: CallbackRef<(state: Record<string, unknown>) => void>;
  onErrorRef: CallbackRef<(error: unknown) => void>;
}

// Generic auth service shape — the concrete class is in authService.js (not yet migrated)
interface AuthServiceLike {
  initialize(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): Promise<boolean>;
  login(credentials: LoginCredentials): Promise<Record<string, unknown>>;
  logout(): Promise<void>;
  signup(data: SignupData): Promise<unknown>;
  resetPassword(email: string): Promise<unknown>;
  verifyMFA(code: string): Promise<Record<string, unknown>>;
  setupMFA(method: string): Promise<unknown>;
  refreshToken(): Promise<boolean>;
  updateUser(userData: Partial<User>): Promise<boolean>;
  switchChurch(churchId: string): Promise<Record<string, unknown>>;
}

type StateUpdater = (updates: Record<string, unknown>) => void;
type ErrorSetter = (error: unknown) => void;
type StateResetter = () => void;

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Provides all authentication actions (login, logout, signup, MFA, etc.).
 * Internal hook used exclusively by AuthProvider.
 */
export function useAuthActions(
  authService: AuthServiceLike,
  updateState: StateUpdater,
  setError: ErrorSetter,
  resetState: StateResetter,
  callbackRefs: CallbackRefs = {
    onAuthStateChangeRef: { current: null },
    onErrorRef: { current: null },
  },
) {
  const { onAuthStateChangeRef, onErrorRef } = callbackRefs;

  const notifyStateChange = useCallback(
    (newState: Record<string, unknown>) => {
      if (onAuthStateChangeRef?.current) {
        setTimeout(() => {
          onAuthStateChangeRef.current?.(newState);
        }, 0);
      }
    },
    [onAuthStateChangeRef],
  );

  const notifyError = useCallback(
    (error: unknown) => {
      if (onErrorRef?.current) {
        setTimeout(() => {
          onErrorRef.current?.(error);
        }, 0);
      }
    },
    [onErrorRef],
  );

  const initializeAuth = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });
      await authService.initialize();
      const user = await authService.getCurrentUser();
      const isAuthenticated = await authService.isAuthenticated();
      const newState = { user, isAuthenticated, isLoading: false, error: null };
      updateState(newState);
      notifyStateChange(newState);
    } catch (error) {
      const errorMessage =
        (error as { message?: string })?.message ??
        "Authentication initialization failed";
      setError(errorMessage);
      notifyError(error);
    }
  }, [authService, updateState, setError, notifyStateChange, notifyError]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        updateState({ isLoading: true, error: null });
        const result = await authService.login(credentials);

        if (result["requiresMFA"] || result["mfaRequired"]) {
          updateState({ isLoading: false, mfaRequired: true });
          return result;
        }

        const newState = { user: result["user"], isAuthenticated: true, isLoading: false };
        updateState(newState);
        notifyStateChange(newState);
        return result;
      } catch (error) {
        const errorMessage = (error as { message?: string })?.message ?? "Login failed";
        setError(errorMessage);
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyStateChange, notifyError],
  );

  const logout = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });
      await authService.logout();
      clearCachedDeviceFingerprint();
      resetState();
      notifyStateChange({ user: null, isAuthenticated: false });
      return { success: true };
    } catch (error) {
      clearCachedDeviceFingerprint();
      resetState();
      notifyStateChange({ user: null, isAuthenticated: false });
      notifyError(error);
      return { success: true };
    }
  }, [authService, updateState, resetState, notifyStateChange, notifyError]);

  const signup = useCallback(
    async (userData: SignupData) => {
      try {
        updateState({ isLoading: true, error: null });
        const result = await authService.signup(userData);
        updateState({ isLoading: false });
        return result;
      } catch (error) {
        const errorMessage = (error as { message?: string })?.message ?? "Signup failed";
        setError(errorMessage);
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyError],
  );

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        updateState({ isLoading: true, error: null });
        const result = await authService.resetPassword(email);
        updateState({ isLoading: false });
        return result;
      } catch (error) {
        const errorMessage = (error as { message?: string })?.message ?? "Password reset failed";
        setError(errorMessage);
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyError],
  );

  const verifyMFA = useCallback(
    async (code: string) => {
      try {
        updateState({ isLoading: true, error: null });
        const result = await authService.verifyMFA(code);
        const newState = {
          user: result["user"],
          isAuthenticated: true,
          mfaVerified: true,
          mfaRequired: false,
          isLoading: false,
        };
        updateState(newState);
        notifyStateChange(newState);
        return result;
      } catch (error) {
        const errorMessage = (error as { message?: string })?.message ?? "MFA verification failed";
        setError(errorMessage);
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyStateChange, notifyError],
  );

  const setupMFA = useCallback(
    async (method: string) => {
      try {
        updateState({ isLoading: true, error: null });
        const result = await authService.setupMFA(method);
        updateState({ mfaSetup: true, isLoading: false });
        return result;
      } catch (error) {
        const errorMessage = (error as { message?: string })?.message ?? "MFA setup failed";
        setError(errorMessage);
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyError],
  );

  const refreshAuth = useCallback(async () => {
    try {
      const success = await authService.refreshToken();
      if (success) {
        await initializeAuth();
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = (error as { message?: string })?.message ?? "Token refresh failed";
      if (import.meta.env.DEV) {
        console.warn("[useAuthActions] Refresh failed, logging out...", errorMessage);
      }
      resetState();
      try {
        await authService.logout();
      } catch (_e) {
        // Intentionally silent — best-effort server logout after refresh failure
      }
      notifyError(error);
      notifyStateChange({ user: null, isAuthenticated: false });
      return false;
    }
  }, [authService, initializeAuth, resetState, notifyError, notifyStateChange]);

  const updateUser = useCallback(
    async (userData: Partial<User>) => {
      try {
        const success = await authService.updateUser(userData);
        if (success) {
          const updatedUser = await authService.getCurrentUser();
          updateState({ user: updatedUser });
          notifyStateChange({ user: updatedUser });
        }
        return success;
      } catch (error) {
        const errorMessage = (error as { message?: string })?.message ?? "Update user failed";
        setError(errorMessage);
        notifyError(error);
        return false;
      }
    },
    [authService, updateState, setError, notifyStateChange, notifyError],
  );

  const switchChurch = useCallback(
    async (churchId: string) => {
      try {
        updateState({ isLoading: true, error: null });
        const result = await authService.switchChurch(churchId);
        const newState = { user: result["user"], isLoading: false };
        updateState(newState);
        notifyStateChange(newState);
        return result;
      } catch (error) {
        const errorMessage = (error as { message?: string })?.message ?? "Church switch failed";
        setError(errorMessage);
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyStateChange, notifyError],
  );

  return {
    initializeAuth,
    login,
    logout,
    signup,
    resetPassword,
    verifyMFA,
    setupMFA,
    refreshAuth,
    updateUser,
    switchChurch,
  };
}
