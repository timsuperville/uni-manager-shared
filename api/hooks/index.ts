/**
 * React Hooks for API Integration
 *
 * Provides React hooks for easy integration of the unified API layer
 * with React applications across the Uni-Manager ecosystem.
 */

import { useCallback, useContext, useEffect, useState } from "react";
import { ApiServices } from "../services";
import type { User, LoginRequest, SignupRequest } from "../types";

import { ApiContext } from "../components/ApiProvider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { syncEngine } from "../syncEngine";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

// ==================== TYPES ====================

interface ApiContextValue {
  apiServices: ApiServices;
  isInitialized: boolean;
  error: string | null;
}

/**
 * Options accepted by `useApiQuery` and passthrough hooks built on top of it.
 * Mirrors the shape of the options parameter in `useApiQuery`.
 */
export interface ApiQueryOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  /** @deprecated Use staleTime instead */
  cacheTime?: number;
  staleTime?: number;
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
    async (credentials: LoginRequest) => {
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
      // Intentionally silent — logout should always succeed locally even if network fails.
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      setError(null);
    }
  }, [api]);

  const signup = useCallback(
    async (userData: SignupRequest) => {
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
  queryKey: string | any[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    cacheTime?: number;
    staleTime?: number;
  },
) {
  const { enabled = true, refetchOnMount = true, staleTime } = options || {};

  const { data, isLoading, error, isFetched, refetch } = useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    enabled,
    refetchOnMount,
    staleTime,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error ? error.message : null,
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
    mutationKey?: string;
    mutationName?: string; // e.g., 'ministry.create'
  },
) {
  const isOnline = useOnlineStatus();
  const { mutateAsync, data, isPending, error, reset } = useMutation({
    mutationFn: async (variables: TVariables) => {
      if (!isOnline && options?.mutationName) {
        await syncEngine.queueMutation(
          options.mutationKey || "general",
          [variables],
          options.mutationName,
        );
        // Offline path: queue mutation for sync when connection is restored.
        // Returns a sentinel value conforming to TData so callers can check `data.offline`.
        return { offline: true } as unknown as TData;
      }
      return mutationFn(variables);
    },
    ...options,
    mutationKey: options?.mutationKey ? [options.mutationKey] : undefined,
  });

  return {
    mutate: mutateAsync,
    mutateAsync,
    data: data ?? null,
    isLoading: isPending,
    error: error ? error.message : null,
    reset,
  };
}

/**
 * Hook for file uploads with progress tracking
 */
export const useFileUpload = <TResult = unknown>(
  uploadFn: (file: File) => Promise<TResult>,
  options?: {
    onProgress?: (progress: number) => void;
    onSuccess?: (result: TResult) => void;
    onError?: (error: Error) => void;
  },
) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TResult | null>(null);

  const { onProgress, onSuccess, onError } = options || {};

  const upload = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        setError(null);
        setProgress(0);

        // Listen for progress CustomEvents dispatched by upload services.
        const progressHandler = (event: Event) => {
          const customEvent = event as CustomEvent<{ progress: number }>;
          const pct = customEvent.detail?.progress ?? 0;
          setProgress(pct);
          onProgress?.(pct);
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
