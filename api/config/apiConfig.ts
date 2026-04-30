/**
 * Unified API Configuration
 *
 * Single source of truth for all API-related configuration.
 *
 * KEY DESIGN DECISION: baseURL is a RELATIVE path ("/api/v1").
 *
 * Why relative?
 *   - In dev, Vite proxies /api/v1 → http://localhost:5000/api/v1
 *   - In prod, nginx proxies /api/v1 → the backend
 *   - No hardcoded hosts anywhere in the frontend bundle
 *   - One proxy rule per vite.config, not ten different baseURLs
 *
 * If VITE_API_URL is set (e.g. for cross-origin staging), it is used as the
 * full origin so the path becomes e.g. "https://api.staging.example.com/api/v1".
 */

export interface ApiConfig {
  /** Full baseURL for the Axios instance, e.g. "/api/v1" or "https://api.example.com/api/v1" */
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  cacheEnabled: boolean;
  authEnabled: boolean;
}

/**
 * Get the API origin.
 *
 * Returns an explicit origin if VITE_API_URL is configured, otherwise "".
 * An empty string means "same origin" — the Vite proxy or nginx handles routing.
 *
 * ONLY use this for absolute URL construction (e.g. <img src>, <video src>).
 * Do NOT use it to set ApiClient.baseURL — use getDefaultApiConfig() for that.
 */
export const getApiBaseUrl = (): string => {
  // Explicit origin override (e.g. cross-origin staging / production API)
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL
  ) {
    return import.meta.env.VITE_API_URL;
  }
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.VITE_API_URL
  ) {
    return process.env.VITE_API_URL;
  }
  // Same origin — browser resolves relative to window.location.origin
  // If running inside Tauri (native desktop shell), we fallback to localhost backend
  if (
    typeof window !== "undefined" &&
    (window.location.protocol === "tauri:" ||
      window.location.hostname === "tauri.localhost")
  ) {
    return "http://127.0.0.1:5000";
  }
  return "";
};

/**
 * Get the WebSocket origin.
 *
 * Resolves priority:
 * 1. Explicit VITE_WS_URL
 * 2. getApiBaseUrl() replacing http/https with ws/wss
 * 3. window.location.origin converting http to ws
 * 4. ws://localhost:5000 (Development fallback)
 */
export const getWebSocketUrl = (): string => {
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_WS_URL
  ) {
    return import.meta.env.VITE_WS_URL;
  }
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.VITE_WS_URL
  ) {
    return process.env.VITE_WS_URL;
  }

  const apiBase = getApiBaseUrl();
  if (apiBase) {
    return apiBase.replace(/^http/, "ws");
  }

  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    // If we're deployed on same origin (no explicit VITE_API_URL), use the host URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}`;
  }

  return "ws://127.0.0.1:5000";
};

/**
 * Convert a relative API path to an absolute URL.
 *
 * Used for asset src attributes (<img>, <video>) where browsers require full URLs.
 * Not needed for Axios requests — those use relative baseURL automatically.
 */
export const getAbsoluteUrl = (
  path: string | null | undefined,
): string | null => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) {
    const origin =
      getApiBaseUrl() ||
      (typeof window !== "undefined" ? window.location.origin : "");
    return `${origin}${path}`;
  }
  return path;
};

/**
 * Get default API configuration.
 *
 * baseURL is "/api/v1" (relative) by default, or
 * "<VITE_API_URL>/api/v1" if an explicit origin is configured.
 */
export const getDefaultApiConfig = (): ApiConfig => ({
  baseURL: `${getApiBaseUrl()}/api/v1`,
  timeout: 10000,
  retryAttempts: 3,
  cacheEnabled: true,
  authEnabled: true,
});

/**
 * Create API configuration for development (shorter timeout, 1 retry).
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
 * Create API configuration for production.
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
