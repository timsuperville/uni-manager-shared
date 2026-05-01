/**
 * Unified API Layer - Main Entry Point
 *
 * This is the main entry point for the unified API layer that serves
 * all 6 Uni-Manager applications with consistent patterns and types.
 */

// Configuration exports (Single source of truth)
export type { ApiConfig } from "./config/apiConfig";
export {
  getApiBaseUrl,
  getWebSocketUrl,
  getAbsoluteUrl,
  getDefaultApiConfig,
  createDevApiConfig,
  createProdApiConfig,
} from "./config/apiConfig";

// Core exports
export { ApiClient, initializeApiClient, getApiClient } from "./core/ApiClient";
export type {
  ApiClientConfig,
  RequestOptions,
  ApiResponse,
} from "./core/ApiClient";

export {
  SovereignApiGuard,
  isShutdownLocked,
  setShutdownLocked,
} from "./core/SovereignApiGuard";

export { ErrorHandler, ApiErrorType } from "./core/ErrorHandler";
export type { ApiError, ErrorContext } from "./core/ErrorHandler";

export { CacheManager } from "./core/CacheManager";
export type { CacheOptions, CacheStats, CacheEntry } from "./core/CacheManager";

export { AuthInterceptor } from "./core/AuthInterceptor";
export type {
  AuthTokens,
  AuthInterceptorConfig,
  TokenRefreshResponse,
} from "./core/AuthInterceptor";

// Service exports
export { BaseService } from "./services/BaseService";
export type {
  ValidationSchema,
  PaginationParams,
  PaginatedResponse,
} from "./services/BaseService";

// Type exports
export * from "./types";

// React integration exports
export { useApi, useApiQuery, useApiMutation, useFileUpload } from "./hooks";
export type { ApiQueryOptions } from "./hooks";

export { ApiProvider } from "./components/ApiProvider";

// Offline sync queue (IndexedDB-backed — used by church App.jsx on network recovery)
export { syncEngine } from "./syncEngine";
export type { SyncEntry, ServiceMap } from "./syncEngine";

// ==================== CONVENIENCE EXPORTS ====================

export const VERSION = "1.0.0";
export const API_VERSION = "v1";

export {
  artNetBridgeService,
  initArtNetBridge,
} from "./services/ArtNetBridgeService";
