/**
 * Unified API Configuration
 *
 * Single source of truth for all API-related configuration.
 * This replaces scattered configuration across multiple files.
 */

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  cacheEnabled: boolean;
  authEnabled: boolean;
}

/**
 * Get API base URL from environment variables
 * Checks multiple sources in order of preference
 */
export const getApiBaseUrl = (): string => {
  // Vite environment (most common in dev)
  if (
    typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_API_URL
  ) {
    return (import.meta as any).env.VITE_API_URL;
  }

  // Process environment (Node.js, SSR)
  if (typeof process !== "undefined" && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }

  // Production fallback - use relative URLs
  if (
    typeof window !== "undefined" &&
    window.location.origin !== "http://localhost:5173"
  ) {
    return window.location.origin;
  }

  // Development default
  return "http://localhost:5000";
};

/**
 * Convert a relative path to an absolute URL
 *
 * This is needed because Vite proxy only works for fetch/XHR requests,
 * not for static asset requests like <img src="...">
 *
 * @param path - Relative or absolute path
 * @returns Absolute URL or null if path is null
 */
export const getAbsoluteUrl = (
  path: string | null | undefined,
): string | null => {
  if (!path) return null;

  // Already absolute
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Make relative paths absolute
  if (path.startsWith("/")) {
    return `${getApiBaseUrl()}${path}`;
  }

  return path;
};

/**
 * Get default API configuration
 */
export const getDefaultApiConfig = (): ApiConfig => ({
  baseUrl: `${getApiBaseUrl()}/api/v1`,
  timeout: 10000,
  retryAttempts: 3,
  cacheEnabled: true,
  authEnabled: true,
});

/**
 * Create API configuration for development
 */
export const createDevApiConfig = (
  overrides?: Partial<ApiConfig>,
): ApiConfig => ({
  ...getDefaultApiConfig(),
  timeout: 15000,
  retryAttempts: 1,
  ...overrides,
});

/**
 * Create API configuration for production
 */
export const createProdApiConfig = (
  overrides?: Partial<ApiConfig>,
): ApiConfig => ({
  ...getDefaultApiConfig(),
  timeout: 10000,
  retryAttempts: 3,
  ...overrides,
});

// Export as default for convenience
export default {
  getApiBaseUrl,
  getAbsoluteUrl,
  getDefaultApiConfig,
  createDevApiConfig,
  createProdApiConfig,
};
