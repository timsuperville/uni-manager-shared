/**
 * ApiProvider React Component
 *
 * React component that provides the core API client to the application tree.
 */

import React, { useEffect, useState, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiClient } from "../core/ApiClient";
import type { ApiClientConfig } from "../core/ApiClient";

// ==================== CONTEXT TYPES ====================

export interface ApiContextValue {
  apiClient: ApiClient;
  isInitialized: boolean;
  error: string | null;
}

// ==================== CONTEXT ====================

const ApiContext = React.createContext<ApiContextValue | null>(null);

// ==================== PROVIDER COMPONENT ====================

interface ApiProviderProps {
  children: React.ReactNode;
  config: ApiClientConfig;
  client?: ApiClient;
  onError?: (error: Error) => void;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({
  children,
  config,
  client: existingClient,
  onError,
}) => {
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a client for React Query
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 60 * 1000, // 1 minute default stale time
          },
        },
      }),
  );

  useEffect(() => {
    try {
      if (existingClient) {
        setApiClient(existingClient);
        setIsInitialized(true);
        setError(null);
        return;
      }

      const client = new ApiClient({
        ...config,
        timeout: config.timeout || 10000,
        retryAttempts: config.retryAttempts || 3,
        cacheEnabled: config.cacheEnabled !== false,
        authEnabled: config.authEnabled !== false,
      });

      setApiClient(client);
      setIsInitialized(true);
      setError(null);
    } catch (_err) {
      const errorMessage =
        _err instanceof Error
          ? _err.message
          : "Failed to initialize API client";
      setError(errorMessage);
      onError?.(_err instanceof Error ? _err : new Error(errorMessage));
    }
  }, [config, existingClient, onError]);

  const contextValue = useMemo(() => {
    if (!apiClient) return null;
    return {
      apiClient,
      isInitialized,
      error,
    };
  }, [apiClient, isInitialized, error]);

  if (!isInitialized && !error) {
    return <div>Initializing API services...</div>;
  }

  if (error) {
    return <div>Error initializing API services: {error}</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={contextValue}>{children}</ApiContext.Provider>
    </QueryClientProvider>
  );
};

export { ApiContext };
export default ApiProvider;
