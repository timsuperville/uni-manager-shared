/// <reference types='vite/client' />

export const getSharedEnvironmentConfig = () => ({
  env: import.meta.env.VITE_ENV || "development",
  api: {
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000",
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  },
  apps: {
    church: import.meta.env.VITE_CHURCH_APP_URL || "http://localhost:5173",
    admin: import.meta.env.VITE_ADMIN_APP_URL || "http://localhost:5174",
    home: import.meta.env.VITE_HOME_APP_URL || "http://localhost:5175",
    business: import.meta.env.VITE_BUSINESS_APP_URL || "http://localhost:5176",
    personal: import.meta.env.VITE_PERSONAL_APP_URL || "http://localhost:5177",
    playback: import.meta.env.VITE_PLAYBACK_APP_URL || "http://localhost:5178",
    mainWebsite:
      import.meta.env.VITE_MAIN_WEBSITE_URL || "http://localhost:3000",
  },
});

export const getApiBaseUrl = (): string => {
  const config = getSharedEnvironmentConfig();
  return config.api.baseUrl;
};

export const getAppUrl = (
  appName: keyof ReturnType<typeof getSharedEnvironmentConfig>["apps"],
): string => {
  const config = getSharedEnvironmentConfig();
  return config.apps[appName];
};

export const getApiUrl = (): string => {
  const config = getSharedEnvironmentConfig();
  return config.api.baseUrl;
};

export const getWebSocketUrl = (): string => {
  const config = getSharedEnvironmentConfig();
  // Return WS URL if specified, otherwise transform API URL
  const wsUrl = import.meta.env.VITE_WS_URL;
  if (wsUrl) return wsUrl;

  const baseUrl = config.api.baseUrl;
  return baseUrl.replace(/^http/, "ws");
};
