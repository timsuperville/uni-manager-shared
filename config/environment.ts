/**
 * Shared Environment Configuration
 * Centralized configuration for shared services across all Uni-Manager applications
 */

/// <reference types="vite/client" />

export interface SharedEnvironmentConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  websocket: {
    url: string;
    reconnectAttempts: number;
    reconnectDelay: number;
  };
  environment: "development" | "staging" | "production";
}

/**
 * Get centralized configuration for shared services
 * Uses Vite environment variables with sensible fallbacks
 */
export const getSharedEnvironmentConfig = (): SharedEnvironmentConfig => {
  const isDevelopment =
    import.meta.env.MODE === "development" ||
    import.meta.env.DEV ||
    !import.meta.env.PROD;

  return {
    api: {
      baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000",
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
    },
    websocket: {
      url: import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:5000",
      reconnectAttempts:
        parseInt(import.meta.env.VITE_WS_RECONNECT_ATTEMPTS) || 5,
      reconnectDelay: parseInt(import.meta.env.VITE_WS_RECONNECT_DELAY) || 1000,
    },
    environment: isDevelopment
      ? "development"
      : (import.meta.env.VITE_ENV as any) || "production",
  };
};

/**
 * Get API base URL with /api suffix for legacy compatibility
 */
export const getApiBaseUrl = (): string => {
  const config = getSharedEnvironmentConfig();
  return `${config.api.baseUrl}/api`;
};

/**
 * Get WebSocket URL for real-time connections
 */
export const getWebSocketUrl = (): string => {
  const config = getSharedEnvironmentConfig();
  return config.websocket.url;
};

/**
 * Check if running in development mode
 */
export const isDevelopmentMode = (): boolean => {
  const config = getSharedEnvironmentConfig();
  return config.environment === "development";
};
