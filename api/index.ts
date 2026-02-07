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
  getAbsoluteUrl,
  getDefaultApiConfig,
  createDevApiConfig,
  createProdApiConfig,
} from "./config/apiConfig";

// Core exports
export { ApiClient } from "./core/ApiClient";
export type {
  ApiClientConfig,
  RequestOptions,
  ApiResponse,
} from "./core/ApiClient";

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

export { AuthService } from "./services/AuthService";

// Main service registry
export {
  default as ApiServices,
  createApiServices,
  createDevApiServices,
  createProdApiServices,
  initializeApiServices,
  getApiServices,
  getAuthService,
} from "./services";
export type { ApiServiceConfig } from "./services";

// Type exports
export * from "./types";

// React integration exports
export {
  useApi,
  useAuth,
  useChurch,
  useApiQuery,
  useApiMutation,
  useFileUpload,
} from "./hooks";

export { ApiProvider } from "./components/ApiProvider";

// ==================== CONVENIENCE EXPORTS ====================

/**
 * Quick setup for development environment
 */
export const setupDevApi = (baseURL?: string) => {
  const { createDevApiServices } = require("./services");
  return createDevApiServices(baseURL || "http://localhost:5000/api");
};

/**
 * Quick setup for production environment
 */
export const setupProdApi = (baseURL: string) => {
  const { createProdApiServices } = require("./services");
  return createProdApiServices(baseURL);
};

/**
 * Version information
 */
export const VERSION = "1.0.0";
export const API_VERSION = "v1";

export default {
  VERSION,
  API_VERSION,
  setupDevApi,
  setupProdApi,
};
