/**
 * React Hooks for API Integration
 *
 * Provides React hooks for easy integration of the unified API layer
 * with React applications across the Uni-Manager ecosystem.
 */

import { useCallback, useContext, useState } from "react";
import type { ApiClient } from "../core/ApiClient";

import { ApiContext, ApiContextValue } from "../components/ApiProvider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { syncEngine } from "../syncEngine";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

// ==================== TYPES ====================

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
 * Hook to access core API client
 */
export const useApi = (): { apiClient: ApiClient } => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  if (!context.isInitialized || !context.apiClient) {
    throw new Error("API services not yet initialized");
  }
  return { apiClient: context.apiClient };
};

/**
 * Generic hook for API queries with caching and loading states
 */
export function useApiQuery<T>(
  queryKey: string | unknown[],
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
    error: error ?? null,
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
    onError: (err: Error, variables: TVariables) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("api-mutation-failure", {
            detail: { error: err, mutationName: options?.mutationName },
          }),
        );
      }
      options?.onError?.(err, variables);
    },
    mutationKey: options?.mutationKey ? [options.mutationKey] : undefined,
  });

  return {
    mutate: mutateAsync,
    mutateAsync,
    data: data ?? null,
    isLoading: isPending,
    /** TanStack Query v5 canonical name — alias for isLoading */
    isPending,
    error: error ?? null,
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

        if (typeof window !== "undefined") {
          window.addEventListener("avatar-upload-progress", progressHandler);
          window.addEventListener(
            "church-logo-upload-progress",
            progressHandler,
          );
          window.addEventListener(
            "church-cover-upload-progress",
            progressHandler,
          );
        }

        try {
          const uploadResult = await uploadFn(file);
          setResult(uploadResult);
          setProgress(100);
          onSuccess?.(uploadResult);
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
          // Always remove listeners — even on upload failure.
          // Without this, every failed attempt adds a permanent ghost listener.
          if (typeof window !== "undefined") {
            window.removeEventListener(
              "avatar-upload-progress",
              progressHandler,
            );
            window.removeEventListener(
              "church-logo-upload-progress",
              progressHandler,
            );
            window.removeEventListener(
              "church-cover-upload-progress",
              progressHandler,
            );
          }
        }
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
