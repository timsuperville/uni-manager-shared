/**
 * Authentication Interceptor
 *
 * Handles authentication tokens, automatic token refresh,
 * and authentication-related request/response processing.
 */

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig
} from 'axios';

/** Augment the global Window to allow opt-in auth failure callbacks. */
declare global {
  interface Window {
    onAuthFailure?: () => void;
  }
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: number;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthInterceptorConfig {
  tokenStorage?: 'localStorage' | 'sessionStorage' | 'memory';
  tokenKey?: string;
  refreshTokenKey?: string;
  headerName?: string;
  tokenPrefix?: string;
  autoRefresh?: boolean;
  refreshThreshold?: number; // Minutes before expiry to refresh
  refreshEndpoint?: string;
  maxRetries?: number;
  enableStats?: boolean;
}

export class AuthInterceptor {
  private config: Required<AuthInterceptorConfig>;
  private tokens: AuthTokens | null = null;
  private isRefreshing = false;
  private refreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];
  /** The axios instance from ApiClient — used to retry requests on token refresh. */
  private axiosInstance: AxiosInstance | null = null;

  private processQueue(error: any, token: string | null = null): void {
    this.refreshQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token as string);
      }
    });
    this.refreshQueue = [];
  }

  constructor(config: AuthInterceptorConfig = {}) {
    this.config = {
      tokenStorage: config.tokenStorage || 'localStorage',
      tokenKey: config.tokenKey || 'accessToken',
      refreshTokenKey: config.refreshTokenKey || 'refreshToken',
      headerName: config.headerName || 'Authorization',
      tokenPrefix:
        config.tokenPrefix !== undefined ? config.tokenPrefix : 'Bearer ',
      autoRefresh: config.autoRefresh !== false,
      refreshThreshold: config.refreshThreshold || 5,
      refreshEndpoint: config.refreshEndpoint || '/auth/refresh-token',
      maxRetries: config.maxRetries || 1,
      enableStats: config.enableStats !== false
    };

    this.loadTokensFromStorage();
  }

  /**
   * Inject the AxiosInstance so token-refresh retries use the configured
   * instance (with correct baseURL, interceptors, and error normalization)
   * rather than the bare global `axios`.
   */
  setAxiosInstance(instance: AxiosInstance): void {
    this.axiosInstance = instance;
  }

  /**
   * Request interceptor - adds authentication token
   */
  onRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const token = this.getValidToken();

    if (token) {
      // Use AxiosHeaders.set() — the canonical Axios v1 API.
      // Direct bracket assignment on a plain-object cast can silently fail
      // when Axios merges headers during request dispatch.
      config.headers.set(
        this.config.headerName,
        `${this.config.tokenPrefix} ${token}`
      );
    }

    return config;
  }

  /**
   * Response interceptor - handles token updates
   */
  onResponse(response: AxiosResponse): AxiosResponse {
    // Check for new tokens in response headers
    const newAccessToken = response.headers['x-new-access-token'];
    const newRefreshToken = response.headers['x-new-refresh-token'];

    if (newAccessToken) {
      this.updateTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken || this.tokens?.refreshToken
      });
    }

    return response;
  }

  /**
   * Error interceptor - handles authentication errors and token refresh
   */
  async onError(error: AxiosError): Promise<AxiosError | unknown> {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 unauthorized errors — but only attempt refresh once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (this.isRefreshing) {
        try {
          const token = await new Promise<string>((resolve, reject) => {
            this.refreshQueue.push({ resolve, reject });
          });

          originalRequest._retry = true;
          if (originalRequest.headers) {
            originalRequest.headers[this.config.headerName] =
              `${this.config.tokenPrefix} ${token}`;
          }
          return (this.axiosInstance ?? axios).request(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;

      // Only attempt refresh if we have a refresh token. A 401 can mean
      // "insufficient role/permissions" (not "bad token"), so do NOT wipe
      // tokens unconditionally — only clear them when we confirm the token
      // itself is unrecoverable (refresh fails or no refresh token exists).
      if (this.config.autoRefresh && this.tokens?.refreshToken) {
        this.isRefreshing = true;
        try {
          const newToken = await this.performTokenRefresh();
          this.processQueue(null, newToken);

          if (newToken && originalRequest.headers) {
            originalRequest.headers[this.config.headerName] =
              `${this.config.tokenPrefix} ${newToken}`;

            // Retry the original request with the refreshed token.
            // Use the injected instance so the retry goes through the
            // configured baseURL, interceptors, and error normalization.
            return (this.axiosInstance ?? axios).request(originalRequest);
          }
        } catch (refreshError) {
          // Refresh explicitly failed
          this.processQueue(refreshError, null);

          const isAxiosError = axios.isAxiosError(refreshError);
          const status =
            isAxiosError && refreshError.response
              ? refreshError.response.status
              : null;
          const isRejectedToken = status && status >= 400 && status < 500;

          if (isRejectedToken) {
            this.clearTokens();
            this.notifyAuthFailure();
          }

          return Promise.reject(refreshError);
        } finally {
          this.isRefreshing = false;
        }
      }
      // No refresh token, or autoRefresh disabled: do NOT clear tokens here.
      // The token may still be valid for other endpoints — a 401 on this
      // specific request may simply mean the user lacks the required role.
    }

    return Promise.reject(error);
  }

  /**
   * Set authentication tokens
   */
  setToken(
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ): void {
    const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;

    this.updateTokens({
      accessToken,
      refreshToken: refreshToken || this.tokens?.refreshToken,
      expiresAt
    });
  }

  /**
   * Clear authentication tokens
   */
  clearToken(): void {
    this.clearTokens();
  }

  /**
   * Get current access token
   */
  getToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getValidToken();
  }

  /**
   * Check if token exists
   */
  hasToken(): boolean {
    return !!this.tokens?.accessToken;
  }

  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired(): boolean {
    if (!this.tokens?.expiresAt) {
      return false; // If no expiry info, assume not expired
    }

    const now = Date.now();
    const threshold = this.config.refreshThreshold * 60 * 1000; // Convert to milliseconds

    return this.tokens.expiresAt - now <= threshold;
  }

  /**
   * Manually refresh token
   */
  async refreshToken(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;

    try {
      const newToken = await this.performTokenRefresh();
      this.processQueue(null, newToken);
      return newToken;
    } catch (err) {
      this.processQueue(err, null);
      throw err;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    try {
      // Create a clean axios instance for the refresh request to avoid triggering
      // interceptors (like infinite 401 loops), but inherit the correct baseURL.
      const refreshAxios = axios.create({
        baseURL: this.axiosInstance?.defaults?.baseURL
      });

      let endpoint = this.config.refreshEndpoint;
      if (endpoint.startsWith('/api/v1')) {
        endpoint = endpoint.substring(7);
      } else if (endpoint.startsWith('api/v1')) {
        endpoint = endpoint.substring(6);
      }

      const response = await refreshAxios.post(endpoint, {
        refreshToken: this.tokens?.refreshToken
      });

      const responseData = response.data.data || response.data;
      const { accessToken, refreshToken, expiresIn }: TokenRefreshResponse =
        responseData;

      this.updateTokens({
        accessToken,
        refreshToken: refreshToken || this.tokens?.refreshToken,
        expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined
      });

      return accessToken;
    } catch (error) {
      const isAxiosError = axios.isAxiosError(error);
      const status =
        isAxiosError && error.response ? error.response.status : null;
      // Only clear tokens if explicitly rejected by server (e.g. 400, 401, 403)
      const isRejectedToken = status && status >= 400 && status < 500;

      if (isRejectedToken) {
        this.clearTokens();
      }

      if (import.meta.env?.DEV)
        console.warn(
          '[AuthInterceptor] Token refresh failed:',
          (error as Error).message
        );
      throw error;
    }
  }

  private getValidToken(): string | null {
    // If in-memory tokens are missing, re-read from storage.
    // This bridges the gap between the AuthService (which writes to storage
    // via TokenStorage after login/session restore) and the AuthInterceptor
    // (which only loaded from storage once in the constructor).
    if (!this.tokens?.accessToken) {
      this.loadTokensFromStorage();
    }

    if (!this.tokens?.accessToken) {
      return null;
    }

    // If token is expired or about to expire and auto-refresh is enabled
    if (
      this.config.autoRefresh &&
      this.isTokenExpired() &&
      this.tokens.refreshToken
    ) {
      // Start refresh in background (don't wait for it)
      if (!this.isRefreshing) {
        this.refreshToken().catch(() => {
          this.clearTokens();
          // Notify the UI so it doesn't enter a silent partial-auth state
          this.notifyAuthFailure();
        });
      }
    }

    return this.tokens.accessToken;
  }

  private updateTokens(tokens: Partial<AuthTokens>): void {
    this.tokens = {
      ...this.tokens,
      ...tokens
    } as AuthTokens;

    this.saveTokensToStorage();
  }

  private clearTokens(): void {
    this.tokens = null;
    this.removeTokensFromStorage();
  }

  private loadTokensFromStorage(): void {
    try {
      const storage = this.getStorage();

      let accessToken = storage.getItem(this.config.tokenKey);
      let refreshToken = storage.getItem(this.config.refreshTokenKey);
      let expiresAt = storage.getItem(`${this.config.tokenKey}_expires`);

      // Fallback: if the primary configured storage is empty, check the alternate.
      // TokenStorage.getAccessToken() checks sessionStorage THEN localStorage;
      // if the login flow wrote to the other bucket (e.g. persistent=true routes
      // the token to localStorage while we are configured for sessionStorage),
      // the interceptor must still find it so requests are authorised.
      if (!accessToken && typeof window !== 'undefined') {
        const altStorage =
          this.config.tokenStorage === 'sessionStorage'
            ? window.localStorage
            : window.sessionStorage;
        const altToken = altStorage.getItem(this.config.tokenKey);
        if (altToken) {
          accessToken = altToken;
          refreshToken = altStorage.getItem(this.config.refreshTokenKey);
          expiresAt = altStorage.getItem(`${this.config.tokenKey}_expires`);
        }
      }

      if (accessToken) {
        // Derive expiresAt from the stored value, or decode it directly from
        // the JWT `exp` claim so isTokenExpired() works without a separate key.
        let resolvedExpiresAt: number | undefined = expiresAt
          ? parseInt(expiresAt, 10)
          : undefined;

        if (!resolvedExpiresAt) {
          try {
            const payloadB64 = accessToken.split('.')[1];
            if (payloadB64) {
              const payload = JSON.parse(atob(payloadB64)) as { exp?: number };
              if (payload.exp) {
                resolvedExpiresAt = payload.exp * 1000; // Convert seconds → ms
              }
            }
          } catch (_err) {
            globalThis.conditionalLog?.('warn', '[EmptyCatch]', _err);
            // Intentionally silent — decoding is best-effort; refresh will still
            // fire on 401 via the onError interceptor.
          }
        }

        this.tokens = {
          accessToken,
          refreshToken: refreshToken || undefined,
          expiresAt: resolvedExpiresAt
        };
      }
    } catch (error) {
      // Storage may be unavailable in SSR or restricted private-browsing contexts.
      if (import.meta.env?.DEV) {
        console.warn(
          '[AuthInterceptor] loadTokensFromStorage failed:',
          (error as Error).message
        );
      }
    }
  }

  private saveTokensToStorage(): void {
    try {
      const storage = this.getStorage();

      if (this.tokens?.accessToken) {
        storage.setItem(this.config.tokenKey, this.tokens.accessToken);

        if (this.tokens.refreshToken) {
          storage.setItem(
            this.config.refreshTokenKey,
            this.tokens.refreshToken
          );
        }

        if (this.tokens.expiresAt) {
          storage.setItem(
            `${this.config.tokenKey}_expires`,
            this.tokens.expiresAt.toString()
          );
        }
      }
    } catch (error) {
      if (import.meta.env?.DEV) {
        console.warn(
          '[AuthInterceptor] saveTokensToStorage failed:',
          (error as Error).message
        );
      }
    }
  }

  private removeTokensFromStorage(): void {
    try {
      const storage = this.getStorage();

      storage.removeItem(this.config.tokenKey);
      storage.removeItem(this.config.refreshTokenKey);
      storage.removeItem(`${this.config.tokenKey}_expires`);
    } catch (error) {
      if (import.meta.env?.DEV) {
        console.warn(
          '[AuthInterceptor] removeTokensFromStorage failed:',
          (error as Error).message
        );
      }
    }
  }

  private getStorage(): Storage {
    if (typeof window === 'undefined') {
      // SSR or Node.js environment
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null
      };
    }

    switch (this.config.tokenStorage) {
      case 'sessionStorage':
        // typeof window guard already confirmed above — no inner check needed
        return window.sessionStorage;
      case 'memory':
        return this.createMemoryStorage();
      case 'localStorage':
      default:
        return window.localStorage;
    }
  }

  private createMemoryStorage(): Storage {
    const store = new Map<string, string>();

    return {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      // Getter so length reflects the live map size, not a stale snapshot
      get length() {
        return store.size;
      },
      key: (index: number) => Array.from(store.keys())[index] || null
    };
  }

  private notifyAuthFailure(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('auth:failure', {
          detail: { reason: 'token_expired' }
        })
      );
      window.onAuthFailure?.();
    }
  }
}

export default AuthInterceptor;
