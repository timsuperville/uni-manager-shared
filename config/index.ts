// @shared/config — Shared configuration utilities
// Provides environment resolution and URL helpers for all shells.
//
// NOTE: For full API-layer configuration (type-safe, with CacheManager, AuthInterceptor, etc.)
// use @shared/api/config/apiConfig instead.

export {
  getSharedEnvironmentConfig,
  getApiBaseUrl,
  getAppUrl,
  getWebSocketUrl
} from './environment.js';

// Bundle optimization helpers (Vite build-time only — not imported at runtime)
// Export if needed:  export { createOptimizedConfig, BundleAnalyzer } from "./bundleOptimization.js";

export { PLATFORM_CONFIG } from './platformConfig';
export type { PlatformConfig } from './platformConfig';
