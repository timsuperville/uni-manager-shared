/**
 * Centralized environment configuration for shared code.
 * Accesses Vite's import.meta.env to provide consistent config values.
 */
export const env = {
  // Core API URL
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:5000",

  // Environment Mode
  mode: import.meta.env.MODE || "development",
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,

  // Feature Flags or other shared vars can go here
};
