/**
 * Unified API Layer - Main Entry Point
 *
 * This is the main entry point for the unified API layer that serves
 * all 6 Uni-Manager applications with consistent patterns and types.
 */

// Core exports
export { ApiClient, ApiClientConfig, RequestOptions } from './core/ApiClient';

export { ErrorHandler, ApiError, ApiErrorType } from './core/ErrorHandler';

export { CacheManager, CacheOptions, CacheStats } from './core/CacheManager';

export {
  AuthInterceptor,
  AuthTokens,
  AuthInterceptorConfig,
} from './core/AuthInterceptor';

// Service exports
export {
  BaseService,
  ValidationSchema,
  PaginationParams,
  PaginatedResponse,
} from './services/BaseService';

export { AuthService } from './services/AuthService';
export { ChurchService } from './services/ChurchService';

// Main service registry
export {
  default as ApiServices,
  ApiServiceConfig,
  createApiServices,
  createDevApiServices,
  createProdApiServices,
  initializeApiServices,
  getApiServices,
  getAuthService,
  getChurchService,
} from './services';

// Type exports
export * from './types';

// React integration exports
export {
  useApi,
  useAuth,
  useChurch,
  useApiQuery,
  useApiMutation,
  useFileUpload,
} from './hooks';

export { ApiProvider } from './components/ApiProvider';

// ==================== CONVENIENCE EXPORTS ====================

/**
 * Quick setup for development environment
 */
export const setupDevApi = (baseURL?: string) => {
  const { createDevApiServices } = require('./services');
  return createDevApiServices(baseURL || 'http://localhost:5000/api');
};

/**
 * Quick setup for production environment
 */
export const setupProdApi = (baseURL: string) => {
  const { createProdApiServices } = require('./services');
  return createProdApiServices(baseURL);
};

/**
 * Version information
 */
export const VERSION = '1.0.0';
export const API_VERSION = 'v1';

export default {
  VERSION,
  API_VERSION,
  setupDevApi,
  setupProdApi,
};
