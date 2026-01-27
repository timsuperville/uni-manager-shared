/**
 * ApiProvider React Component
 *
 * React component that provides the unified API layer to the application tree.
 */

import React, { useEffect, useState, useMemo } from "react";
import { ApiServices } from "../services";
import type { ApiServiceConfig } from "../services";

// ==================== CONTEXT TYPES ====================

interface ApiContextValue {
  apiServices: ApiServices;
  isInitialized: boolean;
  error: string | null;
}

// ==================== CONTEXT ====================

const ApiContext = React.createContext<ApiContextValue | null>(null);

// ==================== PROVIDER COMPONENT ====================

interface ApiProviderProps {
  children: React.ReactNode;
  config: ApiServiceConfig;
  onError?: (error: Error) => void;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({
  children,
  config,
  onError,
}) => {
  const [apiServices, setApiServices] = useState<ApiServices | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const services = new ApiServices(config);
      setApiServices(services);
      setIsInitialized(true);
      setError(null);
    } catch (_err) {
      const errorMessage =
        _err instanceof Error
          ? _err.message
          : "Failed to initialize API services";
      setError(errorMessage);
      onError?.(_err instanceof Error ? _err : new Error(errorMessage));
    }
  }, [config, onError]);

  const contextValue = useMemo(() => {
    if (!apiServices) {
      return {
        apiServices: null as any,
        isInitialized: false,
        error,
      };
    }
    return {
      apiServices,
      isInitialized,
      error,
    };
  }, [apiServices, isInitialized, error]);

  if (!isInitialized && !error) {
    return <div>Initializing API services...</div>;
  }

  if (error) {
    return <div>Error initializing API services: {error}</div>;
  }

  return (
    <ApiContext.Provider value={contextValue}>{children}</ApiContext.Provider>
  );
};

export { ApiContext };
export default ApiProvider;
