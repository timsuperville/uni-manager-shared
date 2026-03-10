import { ApiClient, ApiClientConfig } from "../core/ApiClient";
import { AuthService } from "./AuthService";
import { FileService } from "./FileService";
import { NotificationService } from "./NotificationService";

/** DEV-only: expose API utilities on window for console debugging. */
declare global {
  interface Window {
    apiServices?: ApiServices;
    clearApiCache?: () => void;
    apiCacheStats?: () => Record<string, unknown>;
    apiHealthCheck?: () => Promise<Record<string, unknown>>;
  }
}

// Import types for easier access
export * from "../types";
export { ApiClient } from "../core/ApiClient";
export type {
  ApiClientConfig,
  RequestOptions,
  ApiResponse as ApiClientResponse,
} from "../core/ApiClient";

export * from "../core/ErrorHandler";
export * from "../core/CacheManager";
export * from "../core/AuthInterceptor";
export * from "./BaseService";

export interface ApiServiceConfig extends ApiClientConfig {
  // Additional service-specific configuration
  enableDebugLogging?: boolean;
  serviceTimeout?: {
    auth?: number;
    default?: number;
  };
}

export class ApiServices {
  private client: ApiClient;
  private _auth: AuthService;
  private _files: FileService;
  private _notifications: NotificationService;

  constructor(config: ApiServiceConfig) {
    // Create API client with configuration
    this.client = new ApiClient({
      ...config,
      // Default configuration for all services
      timeout: config.timeout || 10000,
      retryAttempts: config.retryAttempts || 3,
      cacheEnabled: config.cacheEnabled !== false,
      authEnabled: config.authEnabled !== false,
    });

    // Initialize services
    this._auth = new AuthService(this.client);
    this._files = new FileService(this.client);
    this._notifications = new NotificationService(this.client);

    // Setup debug logging if enabled
    if (config.enableDebugLogging) {
      this.setupDebugLogging();
    }
  }

  /**
   * Authentication service
   */
  get auth(): AuthService {
    return this._auth;
  }

  /**
   * File management service
   */
  get files(): FileService {
    return this._files;
  }

  /**
   * Notification management service
   */
  get notifications(): NotificationService {
    return this._notifications;
  }

  /**
   * Get the underlying API client
   */
  get apiClient(): ApiClient {
    return this.client;
  }

  /**
   * Update global configuration
   */
  updateConfig(updates: Partial<ApiServiceConfig>): void {
    this.client.updateConfig(updates);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.client.clearCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return this.client.getCacheStats();
  }

  /**
   * Set authentication token globally
   */
  setAuthToken(token: string): void {
    this.client.setAuthToken(token);
  }

  /**
   * Clear authentication token globally
   */
  clearAuthToken(): void {
    this.client.clearAuthToken();
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    services: Record<string, "up" | "down" | "degraded">;
    timestamp: string;
  }> {
    const results: Record<string, "up" | "down" | "degraded"> = {};

    try {
      // Test auth service
      try {
        await this.auth.checkAuthStatus();
        results.auth = "up";
      } catch (_error) {
        results.auth = "down";
      }

      // Determine overall status
      const downServices = Object.values(results).filter(
        (status) => status === "down",
      ).length;
      const totalServices = Object.keys(results).length;

      let overallStatus: "healthy" | "degraded" | "unhealthy";
      if (downServices === 0) {
        overallStatus = "healthy";
      } else if (downServices < totalServices) {
        overallStatus = "degraded";
      } else {
        overallStatus = "unhealthy";
      }

      return {
        status: overallStatus,
        services: results,
        timestamp: new Date().toISOString(),
      };
    } catch (_error) {
      return {
        status: "unhealthy",
        services: results,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Setup debug logging for development
   */
  private setupDebugLogging(): void {
    if (typeof window !== "undefined") {
      // Add global debug helpers (DEV only — removed in destroy())
      window.apiServices = this;
      window.clearApiCache = () => this.clearAllCaches();
      window.apiCacheStats = () => this.getCacheStats() as Record<string, unknown>;
      window.apiHealthCheck = () => this.healthCheck() as Promise<Record<string, unknown>>;
    }
  }

  /**
   * Destroy services and cleanup
   */
  destroy(): void {
    // Clear any timers or listeners
    this.client.clearCache();

    // Remove debug helpers
    if (typeof window !== "undefined") {
      delete window.apiServices;
      delete window.clearApiCache;
      delete window.apiCacheStats;
      delete window.apiHealthCheck;
    }
  }
}

// ==================== FACTORY FUNCTIONS ====================

/**
 * Create API services instance with default configuration
 */
export function createApiServices(config: ApiServiceConfig): ApiServices {
  return new ApiServices(config);
}

/**
 * Create API services for development environment
 */
export function createDevApiServices(baseURL?: string): ApiServices {
  return new ApiServices({
    baseURL: baseURL || "http://localhost:5000/api",
    enableDebugLogging: true,
    timeout: 15000,
    retryAttempts: 1,
    cacheEnabled: true,
    authEnabled: true,
    authConfig: {
      tokenKey: "uni_auth_access_token",
      refreshTokenKey: "uni_auth_refresh_token",
      tokenStorage: "sessionStorage",
    },
  });
}

/**
 * Create API services for production environment
 */
export function createProdApiServices(baseURL: string): ApiServices {
  return new ApiServices({
    baseURL,
    enableDebugLogging: false,
    timeout: 10000,
    retryAttempts: 3,
    cacheEnabled: true,
    authEnabled: true,
    authConfig: {
      tokenKey: "uni_auth_access_token",
      refreshTokenKey: "uni_auth_refresh_token",
      tokenStorage: "sessionStorage",
    },
  });
}

// ==================== DEFAULT INSTANCE ====================

// Default instance for backward compatibility
let defaultApiServices: ApiServices | null = null;

/**
 * Initialize default API services instance
 */
export function initializeApiServices(config: ApiServiceConfig): ApiServices {
  defaultApiServices = createApiServices(config);
  return defaultApiServices;
}

/**
 * Get default API services instance
 */
export function getApiServices(): ApiServices {
  if (!defaultApiServices) {
    throw new Error(
      "API Services not initialized. Call initializeApiServices() first.",
    );
  }
  return defaultApiServices;
}

/**
 * Convenience function to get auth service
 */
export function getAuthService(): AuthService {
  return getApiServices().auth;
}

// ==================== EXPORTS ====================

export { AuthService };
export default ApiServices;
