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
import { AuthInterceptor, AuthInterceptorConfig } from "./AuthInterceptor";
import { SovereignApiGuard } from "./SovereignApiGuard";
import { contextManager } from "./ContextManager";

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
  cacheEnabled?: boolean;
  authEnabled?: boolean;
  defaultHeaders?: Record<string, string>;
  authConfig?: AuthInterceptorConfig;
  storageNamespace?: string;
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
  silent?: boolean; // Suppress global error events, console logs, and telemetry
}

export interface ApiResponse<T = unknown> {
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
  private authInterceptor: AuthInterceptor;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      authEnabled: true,
      ...config,
    };

    this.setupAxiosInstance();
    this.errorHandler = new ErrorHandler(this.config.retryAttempts || 3);
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
        // Evaluate Sovereign Shutdown Boundary
        if (SovereignApiGuard.shouldBlockRequest(config)) {
          // Reject with a specific cancellation message so the error handler knows it was the firewall
          return Promise.reject(new axios.Cancel("SOVEREIGN_SHUTDOWN_LOCKED"));
        }

        // Add authentication if enabled
        if (this.config.authEnabled) {
          config = this.authInterceptor.onRequest(config);
        }

        // Inject ContextManager headers (Active App / Tenant)
        const contextHeaders = contextManager.getHeaders();
        Object.assign(config.headers, contextHeaders);

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
    data?: unknown,
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
      responseType:
        options.responseType as unknown as XMLHttpRequestResponseType,
      ...(options.silent !== undefined ? { silent: options.silent } : {}),
    } as AxiosRequestConfig; // cast since silent is custom

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

      return apiResponse;
    } catch (_error) {
      throw this.errorHandler.transformError(_error as AxiosError);
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>("GET", endpoint, undefined, options);
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>("POST", endpoint, data, options);
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>("PUT", endpoint, data, options);
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>("PATCH", endpoint, data, options);
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>("DELETE", endpoint, undefined, options);
  }

  /**
   * Upload file with progress tracking
   */
  async upload<T = unknown>(
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
   * Clear cache (Legacy no-op)
   */
  clearCache(pattern?: string): void {
    // No-op: caching is now handled by TanStack Query
  }

  /**
   * Get cache statistics (Legacy no-op)
   */
  getCacheStats(): any {
    return { hits: 0, misses: 0, keys: 0, size: 0 };
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
