/**
 * React Hooks for API Integration
 *
 * Provides React hooks for easy integration of the unified API layer
 * with React applications across the Uni-Manager ecosystem.
 */

import { useCallback, useContext, useEffect, useState } from "react";
import { ApiServices } from "../services";
import type { User } from "../types";
import { ApiContext } from "../components/ApiProvider";

// ==================== TYPES ====================

interface ApiContextValue {
  apiServices: ApiServices;
  isInitialized: boolean;
  error: string | null;
}

// ==================== FUNCTIONS ====================

/**
 * Hook to access API services
 */
export const useApi = (): ApiServices => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  if (!context.isInitialized) {
    throw new Error("API services not yet initialized");
  }
  return context.apiServices;
};

/**
 * Hook for authentication operations
 */
export const useAuth = () => {
  const api = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const authStatus = await api.auth.checkAuthStatus();
        setIsAuthenticated(authStatus.isAuthenticated);
        setUser(authStatus.user || null);
        setError(null);
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
        setError(
          error instanceof Error
            ? error.message
            : "Authentication check failed",
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [api]);

  const login = useCallback(
    async (credentials: any) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.auth.login(credentials);
        setUser(response.user);
        setIsAuthenticated(true);
        return response;
      } catch (error) {
        setError(error instanceof Error ? error.message : "Login failed");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [api],
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await api.auth.logout();
    } catch (_err) {
      // Log error but don't throw - logout should always succeed locally
      // console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      setError(null);
    }
  }, [api]);

  const signup = useCallback(
    async (userData: any) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.auth.signup(userData);
        setUser(response.user);
        setIsAuthenticated(true);
        return response;
      } catch (error) {
        setError(error instanceof Error ? error.message : "Signup failed");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [api],
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    signup,
    authService: api.auth,
  };
};

/**
 * Generic hook for API queries with caching and loading states
 */
export function useApiQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    cacheTime?: number;
  },
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  const { enabled = true, refetchOnMount = true } = options || {};

  const execute = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await queryFn();
      setData(result);
      setIsFetched(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Query failed");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, enabled]);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  useEffect(() => {
    if (enabled && (!isFetched || refetchOnMount)) {
      execute();
    }
  }, [execute, enabled, isFetched, refetchOnMount]);

  return {
    data,
    isLoading,
    error,
    isFetched,
    refetch,
  };
}

/**
 * Hook for API mutations with loading states
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
  },
) {
  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { onSuccess, onError } = options || {};

  const mutate = useCallback(
    async (variables: TVariables) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await mutationFn(variables);
        setData(result);
        onSuccess?.(result, variables);
        return result;
      } catch (caughtError) {
        const error =
          caughtError instanceof Error
            ? caughtError
            : new Error("Mutation failed");
        setError(error.message);
        onError?.(error, variables);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    mutate,
    data,
    isLoading,
    error,
    reset,
  };
}

/**
 * Hook for file uploads with progress tracking
 */
export const useFileUpload = (
  uploadFn: (file: File) => Promise<any>,
  options?: {
    onProgress?: (progress: number) => void;
    onSuccess?: (result: any) => void;
    onError?: (error: Error) => void;
  },
) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState(null);

  const { onProgress, onSuccess, onError } = options || {};

  const upload = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        setError(null);
        setProgress(0);

        // Listen for progress events
        const progressHandler = (event: any) => {
          const progress = event.detail?.progress || 0;
          setProgress(progress);
          onProgress?.(progress);
        };

        typeof window !== "undefined" &&
          window.addEventListener("avatar-upload-progress", progressHandler);
        typeof window !== "undefined" &&
          window.addEventListener(
            "church-logo-upload-progress",
            progressHandler,
          );
        typeof window !== "undefined" &&
          window.addEventListener(
            "church-cover-upload-progress",
            progressHandler,
          );

        const uploadResult = await uploadFn(file);
        setResult(uploadResult);
        setProgress(100);
        onSuccess?.(uploadResult);

        // Cleanup listeners
        typeof window !== "undefined" &&
          window.removeEventListener("avatar-upload-progress", progressHandler);
        typeof window !== "undefined" &&
          window.removeEventListener(
            "church-logo-upload-progress",
            progressHandler,
          );
        typeof window !== "undefined" &&
          window.removeEventListener(
            "church-cover-upload-progress",
            progressHandler,
          );

        return uploadResult;
      } catch (caughtError) {
        const error =
          caughtError instanceof Error
            ? caughtError
            : new Error("Upload failed");
        setError(error.message);
        onError?.(error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFn, onProgress, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setProgress(0);
    setError(null);
    setResult(null);
    setIsUploading(false);
  }, []);

  return {
    upload,
    isUploading,
    progress,
    error,
    result,
    reset,
  };
};

// Export types for external use
export type { ApiContextValue };
