/// <reference types='vite/client' />

export const getSharedEnvironmentConfig = () => ({
  env: import.meta.env.VITE_ENV || "development",
  environment: import.meta.env.VITE_ENV || "development",
  api: {
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000",
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  },
  apps: {
    church: import.meta.env.VITE_CHURCH_APP_URL || "http://localhost:5173",
    admin: import.meta.env.VITE_ADMIN_APP_URL || "http://localhost:5174",
    home: import.meta.env.VITE_HOME_APP_URL || "http://localhost:5175",
    work: import.meta.env.VITE_WORK_APP_URL || "http://localhost:5176",
    personal: import.meta.env.VITE_PERSONAL_APP_URL || "http://localhost:5177",
    playback: import.meta.env.VITE_PLAYBACK_APP_URL || "http://localhost:5178",
    mainWebsite:
      import.meta.env.VITE_MAIN_WEBSITE_URL || "http://localhost:5172",
  },
});

// ── Canonical API URL ──────────────────────────────────────────────────────
// Single source of truth lives in @shared/api/config/apiConfig.ts.
// Re-exported here so that consumers of @shared/config get the real value
// (with SSR guard, origin-detection, and correct prod fallback logic).
export { getApiBaseUrl } from "../api/config/apiConfig";

export const getAppUrl = (
  appName: keyof ReturnType<typeof getSharedEnvironmentConfig>["apps"],
): string => {
  const config = getSharedEnvironmentConfig();
  return config.apps[appName];
};

export const getWebSocketUrl = (): string => {
  // Prefer an explicitly configured WS URL
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  // Derive from the API URL (canonical env var → no double-declaration)
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return apiBase.replace(/^http/, "ws");
};
