/**
 * Core API Client
 *
 * Unified HTTP client for all Uni-Manager applications with built-in
 * authentication, error handling, caching, and request optimization.
 *
 * ─── FUTURE MIGRATION: Eliminate Axios ──────────────────────────────────────
 * Axios is the ONLY remaining direct HTTP client dependency declared across the
 * entire frontend. It is intentionally isolated here in `frontend/shared` as a
 * single controlled owner (all app-level package.json files are axios-free).
 *
 * To remove it entirely, two pieces of work are required:
 *
 * 1. Replace `this.axios.request()` calls with native `fetch()`.
 *    The interceptor pipeline (auth headers, token refresh, retry-on-401)
 *    will need to be reimplemented as a small middleware chain around `fetch`.
 *    AuthInterceptor.ts will also need a parallel rewrite.
 *
 * 2. Replace `onUploadProgress` (line ~150, passed to axios AxiosRequestConfig)
 *    with a native `XMLHttpRequest` wrapper for endpoints that report file
 *    upload progress. Example pattern:
 *
 *      function uploadWithProgress(url, formData, onProgress) {
 *        return new Promise((resolve, reject) => {
 *          const xhr = new XMLHttpRequest();
 *          xhr.open('POST', url);
 *          xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
 *          xhr.upload.onprogress = (e) => {
 *            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
 *          };
 *          xhr.onload = () => (xhr.status < 300 ? resolve(xhr.response) : reject(xhr));
 *          xhr.onerror = reject;
 *          xhr.send(formData);
 *        });
 *      }
 *
 * Once both pieces are complete, `axios` can be removed from
 * `frontend/shared/package.json` and the supply-chain exposure is zero.
 * ────────────────────────────────────────────────────────────────────────────
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosProgressEvent,
  RawAxiosRequestHeaders,
} from "axios";
import { ErrorHandler } from "./ErrorHandler";
import { CacheManager, CacheStats } from "./CacheManager";
import { AuthInterceptor, AuthInterceptorConfig } from "./AuthInterceptor";

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
  cacheEnabled?: boolean;
  authEnabled?: boolean;
  defaultHeaders?: Record<string, string>;
  authConfig?: AuthInterceptorConfig;
}

export interface RequestOptions {
  cache?: boolean;
  cacheTTL?: number;
  retry?: boolean;
  retryAttempts?: number;
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void;
  signal?: AbortSignal;
  responseType?:
    | "arraybuffer"
    | "blob"
    | "document"
    | "json"
    | "text"
    | "stream";
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  message?: string;
  timestamp?: string;
}

export class ApiClient {
  private axios!: AxiosInstance;
  private errorHandler: ErrorHandler;
  private cacheManager: CacheManager;
  private authInterceptor: AuthInterceptor;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      cacheEnabled: true,
      authEnabled: true,
      ...config,
    };

    this.setupAxiosInstance();
    this.errorHandler = new ErrorHandler(this.config.retryAttempts || 3);
    this.cacheManager = new CacheManager();
    this.authInterceptor = new AuthInterceptor(this.config.authConfig);

    this.setupInterceptors();
    // Wire the interceptor to THIS instance so 401-retry requests use the
    // correct baseURL and interceptor chain, not the bare global axios.
    this.authInterceptor.setAxiosInstance(this.axios);
  }

  private setupAxiosInstance(): void {
    this.axios = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...this.config.defaultHeaders,
      },
      withCredentials: true,
    });
  }

  private setupInterceptors(): void {
    // Request interceptors
    this.axios.interceptors.request.use(
      (config) => {
        // Add authentication if enabled
        if (this.config.authEnabled) {
          config = this.authInterceptor.onRequest(config);
        }

        // Add request ID for tracking
        config.headers["X-Request-ID"] = this.generateRequestId();

        // Add timestamp
        config.headers["X-Request-Timestamp"] = new Date().toISOString();

        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptors
    this.axios.interceptors.response.use(
      (response) => {
        // Process successful response through auth interceptor
        if (this.config.authEnabled) {
          response = this.authInterceptor.onResponse(response);
        }

        return response;
      },
      async (error: AxiosError) => {
        // Handle authentication errors
        if (this.config.authEnabled) {
          const handledError = await this.authInterceptor.onError(error);
          if (handledError !== error) {
            return handledError;
          }
        }

        // Handle other errors through error handler
        return this.errorHandler.handleError(error, this.axios);
      },
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      method,
      url: endpoint,
      data,
      timeout: options.timeout || this.config.timeout,
      headers: options.headers as RawAxiosRequestHeaders,
      params: options.params,
      onUploadProgress: options.onUploadProgress,
      onDownloadProgress: options.onDownloadProgress,
      signal: options.signal,
      responseType: options.responseType as any,
    };

    // Check cache for GET requests
    if (
      method === "GET" &&
      options.cache !== false &&
      this.config.cacheEnabled
    ) {
      const cacheKey = this.cacheManager.generateKey(endpoint, data);
      const cachedResponse = this.cacheManager.get<ApiResponse<T>>(cacheKey);

      if (cachedResponse) {
        return cachedResponse;
      }
    }

    try {
      const response: AxiosResponse<T> =
        await this.axios.request(requestConfig);

      const apiResponse: ApiResponse<T> = {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        message: response.headers["x-response-message"],
        timestamp: response.headers["x-response-timestamp"],
      };

      // Cache GET responses if caching is enabled
      if (
        method === "GET" &&
        options.cache !== false &&
        this.config.cacheEnabled
      ) {
        const cacheKey = this.cacheManager.generateKey(endpoint, data);
        const cacheTTL = options.cacheTTL || 300000; // 5 minutes default
        this.cacheManager.set(cacheKey, apiResponse, cacheTTL);
      }

      return apiResponse;
    } catch (_error) {
      throw this.errorHandler.transformError(_error as AxiosError);
    }
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>("GET", endpoint, undefined, options);
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>("POST", endpoint, data, options);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>("PUT", endpoint, data, options);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>("PATCH", endpoint, data, options);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>("DELETE", endpoint, undefined, options);
  }

  /**
   * Upload file with progress tracking
   */
  async upload<T = any>(
    endpoint: string,
    file: File | FormData,
    options?: RequestOptions & { fieldName?: string },
  ): Promise<ApiResponse<T>> {
    const formData = file instanceof FormData ? file : new FormData();

    if (file instanceof File) {
      formData.append(options?.fieldName || "file", file);
    }

    const uploadOptions: RequestOptions = {
      ...options,
      headers: {
        "Content-Type": "multipart/form-data",
        ...options?.headers,
      },
    };

    return this.executeRequest<T>("POST", endpoint, formData, uploadOptions);
  }

  /**
   * Download file
   */
  async download(endpoint: string, options?: RequestOptions): Promise<Blob> {
    const downloadOptions: RequestOptions = {
      ...options,
      responseType: "blob",
      headers: {
        Accept: "application/octet-stream",
        ...options?.headers,
      },
    };

    const response = await this.executeRequest<Blob>(
      "GET",
      endpoint,
      undefined,
      downloadOptions,
    );
    return response.data;
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    this.cacheManager.clear(pattern);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return this.cacheManager.getStats();
  }

  /**
   * Update authentication token
   */
  setAuthToken(token: string): void {
    this.authInterceptor.setToken(token);
  }

  /**
   * Check if authentication token exists
   */
  hasAuthToken(): boolean {
    return this.authInterceptor.hasToken();
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authInterceptor.clearToken();
  }

  /**
   * Get current configuration
   */
  getConfig(): ApiClientConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...updates };

    // Update axios instance if baseURL or timeout changed
    if (updates.baseURL || updates.timeout) {
      this.axios.defaults.baseURL = this.config.baseURL;
      this.axios.defaults.timeout = this.config.timeout;
    }
  }
}

// ==================== DEFAULT INSTANCE ====================

let defaultApiClient: ApiClient | null = null;

/**
 * Initialize default API client instance
 */
export function initializeApiClient(config: ApiClientConfig): ApiClient {
  defaultApiClient = new ApiClient(config);
  return defaultApiClient;
}

/**
 * Get default API client instance
 */
export function getApiClient(): ApiClient {
  if (!defaultApiClient) {
    throw new Error(
      "API Client not initialized. Call initializeApiClient() first.",
    );
  }
  return defaultApiClient;
}

export default ApiClient;
