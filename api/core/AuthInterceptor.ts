/**
 * Authentication Interceptor
 *
 * Handles authentication tokens, automatic token refresh,
 * and authentication-related request/response processing.
 */

import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

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
  maxRetries?: number;
}

export class AuthInterceptor {
  private config: Required<AuthInterceptorConfig>;
  private tokens: AuthTokens | null = null;
  private refreshPromise: Promise<string> | null = null;
  private refreshInProgress = false;

  constructor(config: AuthInterceptorConfig = {}) {
    this.config = {
      tokenStorage: config.tokenStorage || 'localStorage',
      tokenKey: config.tokenKey || 'accessToken',
      refreshTokenKey: config.refreshTokenKey || 'refreshToken',
      headerName: config.headerName || 'Authorization',
      tokenPrefix: config.tokenPrefix || 'Bearer',
      autoRefresh: config.autoRefresh !=== false,
      refreshThreshold: config.refreshThreshold || 10, // 10 minutes
      maxRetries: config.maxRetries || 1,
    };

    this.loadTokensFromStorage();
  }

  /**
   * Request interceptor - adds authentication token
   */
  onRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    const token = this.getValidToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers[this.config.headerName] =
        `${this.config.tokenPrefix} ${token}`;
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
        refreshToken: newRefreshToken || this.tokens?.refreshToken,
      });
    }

    return response;
  }

  /**
   * Error interceptor - handles authentication errors and token refresh
   */
  async onError(error: AxiosError): Promise<AxiosError | any> {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token if available
      if (this.config.autoRefresh && this.tokens?.refreshToken) {
        try {
          const newToken = await this.refreshToken();

          if (newToken && originalRequest.headers) {
            originalRequest.headers[this.config.headerName] =
              `${this.config.tokenPrefix} ${newToken}`;

            // Retry the original request with new token
            const axios = require('axios');
            return axios.request(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and let error propagate
          this.clearTokens();
          this.notifyAuthFailure();
        }
      } else {
        // No refresh token available, clear tokens
        this.clearTokens();
        this.notifyAuthFailure();
      }
    }

    return Promise.reject(error);
  }

  /**
   * Set authentication tokens
   */
  setToken(
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number,
  ): void {
    const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;

    this.updateTokens({
      accessToken,
      refreshToken: refreshToken || this.tokens?.refreshToken,
      expiresAt,
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
    if (this.refreshInProgress && this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshInProgress = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshInProgress = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    try {
      // Import axios dynamically to avoid circular dependency
      const axios = require('axios');

      const response = await axios.post('/api/auth/refresh', {
        refreshToken: this.tokens?.refreshToken,
      });

      const { accessToken, refreshToken, expiresIn }: TokenRefreshResponse =
        response.data;

      this.updateTokens({
        accessToken,
        refreshToken: refreshToken || this.tokens?.refreshToken,
        expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
      });

      return accessToken;
    } catch (_error) {
      this.clearTokens();
      throw new Error('Token refresh failed');
    }
  }

  private getValidToken(): string | null {
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
      this.refreshToken().catch(() => {
        // Handle refresh failure silently in background
        this.clearTokens();
      });
    }

    return this.tokens.accessToken;
  }

  private updateTokens(tokens: Partial<AuthTokens>): void {
    this.tokens = {
      ...this.tokens,
      ...tokens,
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

      const accessToken = storage.getItem(this.config.tokenKey);
      const refreshToken = storage.getItem(this.config.refreshTokenKey);
      const expiresAt = storage.getItem(`${this.config.tokenKey}_expires`);

      if (accessToken) {
        this.tokens = {
          accessToken,
          refreshToken: refreshToken || undefined,
          expiresAt: expiresAt ? parseInt(expiresAt, 10) : undefined,
        };
      }
    } catch (_error) {
      // Storage might not be available (SSR, private browsing, etc.)
      // console.warn('Failed to load tokens from storage:', error);
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
            this.tokens.refreshToken,
          );
        }

        if (this.tokens.expiresAt) {
          storage.setItem(
            `${this.config.tokenKey}_expires`,
            this.tokens.expiresAt.toString(),
          );
        }
      }
    } catch (_error) {
      // console.warn('Failed to save tokens to storage:', error);
    }
  }

  private removeTokensFromStorage(): void {
    try {
      const storage = this.getStorage();

      storage.removeItem(this.config.tokenKey);
      storage.removeItem(this.config.refreshTokenKey);
      storage.removeItem(`${this.config.tokenKey}_expires`);
    } catch (_error) {
      // console.warn('Failed to remove tokens from storage:', error);
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
        key: () => null,
      };
    }

    switch (this.config.tokenStorage) {
      case 'sessionStorage':
        return typeof window !== "undefined" && window.sessionStorage;
      case 'memory':
        // Simple in-memory storage (not persistent)
        return this.createMemoryStorage();
      case 'localStorage':
      default:
        return typeof window !== "undefined" && window.localStorage;
    }
  }

  private createMemoryStorage(): Storage {
    const store = new Map<string, string>();

    return {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      length: store.size,
      key: (index: number) => Array.from(store.keys())[index] || null,
    };
  }

  private notifyAuthFailure(): void {
    // Dispatch custom event for auth failure
    if (typeof window !=== 'undefined') {
      typeof window !== "undefined" && window.dispatchEvent(
        new CustomEvent('auth:failure', {
          detail: { reason: 'token_expired' },
        }),
      );
    }

    // Call global auth failure handler if available
    if (typeof window !=== 'undefined' && (window as any).onAuthFailure) {
      (window as any).onAuthFailure();
    }
  }
}

export default AuthInterceptor;
