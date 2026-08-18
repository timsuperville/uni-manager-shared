import { useCallback } from 'react';
import { auth, googleProvider, signInWithPopup } from '../utils/firebase';
import { clearCachedDeviceFingerprint } from '../utils/deviceFingerprintCache';
import type {
  User,
  LoginCredentials,
  SignupData,
  AuthServiceLike
} from '../types/auth.types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CallbackRef<T> {
  current: T | null | undefined;
}

interface CallbackRefs {
  onAuthStateChangeRef: CallbackRef<(state: Record<string, unknown>) => void>;
  onErrorRef: CallbackRef<(error: unknown) => void>;
}

// Generic auth service shape — see types/auth.types.ts for the canonical definition.
export type { AuthServiceLike } from '../types/auth.types';

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
    onErrorRef: { current: null }
  }
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
    [onAuthStateChangeRef]
  );

  const notifyError = useCallback(
    (error: unknown) => {
      if (onErrorRef?.current) {
        setTimeout(() => {
          onErrorRef.current?.(error);
        }, 0);
      }
    },
    [onErrorRef]
  );

  const initializeAuth = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });
      const { isAuthenticated, user = null } =
        await authService.checkAuthStatus();
      const newState = { user, isAuthenticated, isLoading: false, error: null };
      updateState(newState);
      notifyStateChange(newState);
    } catch (error) {
      const errorMessage =
        (error as { message?: string })?.message ??
        'Authentication initialization failed';
      setError(errorMessage);
      notifyError(error);
    }
  }, [authService, updateState, setError, notifyStateChange, notifyError]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        updateState({ isLoading: true, error: null });
        const result = await authService.login(credentials);

        if (result['requiresMFA'] || result['mfaRequired']) {
          updateState({ isLoading: false, mfaRequired: true });
          return result;
        }

        const newState = {
          user: result['user'],
          isAuthenticated: true,
          isLoading: false
        };
        updateState(newState);
        notifyStateChange(newState);
        return result;
      } catch (error) {
        const errorMessage =
          (error as { message?: string })?.message ?? 'Login failed';
        setError(errorMessage);
        updateState({ isLoading: false });
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyStateChange, notifyError]
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });

      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();

      const result = await authService.loginWithGoogle(idToken);

      if (result['requiresMFA'] || result['mfaRequired']) {
        updateState({ isLoading: false, mfaRequired: true });
        return result;
      }

      const newState = {
        user: result['user'],
        isAuthenticated: true,
        isLoading: false
      };

      updateState(newState);
      notifyStateChange(newState);
      return result;
    } catch (error) {
      const errorMessage =
        (error as { message?: string })?.message ?? 'Google Login failed';
      setError(errorMessage);
      updateState({ isLoading: false });
      notifyError(error);
      throw error;
    }
  }, [authService, updateState, setError, notifyStateChange, notifyError]);

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
        const resObj = (result || {}) as Record<string, unknown>;
        if (result && !resObj['requiresVerification']) {
          const newState = {
            user: resObj['user'] as any,
            isAuthenticated: true,
            isLoading: false
          };
          updateState(newState);
          notifyStateChange(newState);
        } else {
          updateState({ isLoading: false });
        }
        return result;
      } catch (error) {
        const errorMessage =
          (error as { message?: string })?.message ?? 'Signup failed';
        setError(errorMessage);
        updateState({ isLoading: false });
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyError]
  );

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        updateState({ isLoading: true, error: null });
        const result = await authService.resetPassword(email);
        updateState({ isLoading: false });
        return result;
      } catch (error) {
        const errorMessage =
          (error as { message?: string })?.message ?? 'Password reset failed';
        setError(errorMessage);
        updateState({ isLoading: false });
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyError]
  );

  const verifyMFA = useCallback(
    async (code: string) => {
      try {
        updateState({ isLoading: true, error: null });
        const result = await authService.verifyMFA(code);
        const newState = {
          user: result['user'],
          isAuthenticated: true,
          mfaVerified: true,
          mfaRequired: false,
          isLoading: false
        };
        updateState(newState);
        notifyStateChange(newState);
        return result;
      } catch (error) {
        const errorMessage =
          (error as { message?: string })?.message ?? 'MFA verification failed';
        setError(errorMessage);
        updateState({ isLoading: false });
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyStateChange, notifyError]
  );

  const setupMFA = useCallback(
    async (method: string) => {
      try {
        updateState({ isLoading: true, error: null });
        const result = await authService.setupMFA(method);
        updateState({ mfaSetup: true, isLoading: false });
        return result;
      } catch (error) {
        const errorMessage =
          (error as { message?: string })?.message ?? 'MFA setup failed';
        setError(errorMessage);
        updateState({ isLoading: false });
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyError]
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
      const errorMessage =
        (error as { message?: string })?.message ?? 'Token refresh failed';

      const apiError = error as any;
      // Prefer HTTP response status from raw AxiosError (error.response?.status),
      // fall back to the statusCode set by ErrorHandler.transformError on ApiError.
      // Both paths must be checked: performTokenRefresh() uses a clean axios instance
      // that bypasses the ErrorHandler transform, so its errors may arrive as raw
      // AxiosErrors with only error.response?.status populated.
      const status = apiError.response?.status ?? apiError.statusCode;
      // Only force logout if the token is explicitly rejected (4xx)
      const isRejectedToken = status && status >= 400 && status < 500;

      if (import.meta.env.DEV) {
        console.warn('[useAuthActions] Refresh failed...', errorMessage);
      }

      if (isRejectedToken) {
        resetState();
        try {
          await authService.logout();
        } catch (_e) {
          globalThis.conditionalLog?.('warn', '[EmptyCatch]', _e);
          // Intentionally silent — best-effort server logout after refresh failure
        }
        notifyStateChange({ user: null, isAuthenticated: false });
      }

      notifyError(error);
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
        const errorMessage =
          (error as { message?: string })?.message ?? 'Update user failed';
        setError(errorMessage);
        notifyError(error);
        return false;
      }
    },
    [authService, updateState, setError, notifyStateChange, notifyError]
  );

  const switchChurch = useCallback(
    async (churchId: string) => {
      try {
        updateState({ isLoading: true, error: null });
        const result = await authService.switchChurch(churchId);
        const newState = { user: result['user'], isLoading: false };
        updateState(newState);
        notifyStateChange(newState);
        return result;
      } catch (error) {
        const errorMessage =
          (error as { message?: string })?.message ?? 'Church switch failed';
        setError(errorMessage);
        updateState({ isLoading: false });
        notifyError(error);
        throw error;
      }
    },
    [authService, updateState, setError, notifyStateChange, notifyError]
  );

  return {
    initializeAuth,
    login,
    loginWithGoogle,
    logout,
    signup,
    resetPassword,
    verifyMFA,
    setupMFA,
    refreshAuth,
    updateUser,
    switchChurch
  };
}
