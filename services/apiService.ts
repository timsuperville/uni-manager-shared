/**
 * shared/services/apiService.ts
 *
 * Base API service class for shared service modules.
 * Uses the @shared/api layer to ensure correct cross-app base URL resolution.
 */
import { getApiBaseUrl } from '@shared/api';

type QueryParams = Record<string, string | number | boolean | null | undefined>;
type RequestBody = Record<string, unknown> | unknown[];

class ApiService {
  private _base: string | null = null;

  get baseURL(): string {
    if (!this._base) {
      try {
        this._base = getApiBaseUrl();
      } catch {
        this._base =
          (typeof import.meta !== 'undefined' &&
            import.meta.env &&
            import.meta.env.VITE_API_URL) ??
          'http://127.0.0.1:5000';
      }
    }
    return this._base;
  }

  protected _token(): string | null {
    return (
      localStorage.getItem('admin_auth_token') ||
      localStorage.getItem('auth_token') ||
      null
    );
  }

  protected _headers(): Record<string, string> {
    const token = this._token();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  async request<T = unknown>(
    endpoint: string,
    options: RequestInit & { headers?: Record<string, string> } = {}
  ): Promise<T> {
    const url = `${this.baseURL}/api/v1${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: { ...this._headers(), ...(options.headers ?? {}) }
    });
    if (!res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(
          `API ${res.status}: Endpoint not found or misconfigured backend routing. Received HTML response.`
        );
      }
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`API ${res.status}: ${msg}`);
    }
    return res.json() as Promise<T>;
  }

  get<T = unknown>(endpoint: string, params: QueryParams = {}): Promise<T> {
    const qs = Object.keys(params).length
      ? '?' +
        new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v != null)
              .map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : '';
    return this.request<T>(`${endpoint}${qs}`, { method: 'GET' });
  }

  post<T = unknown>(endpoint: string, body: RequestBody = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put<T = unknown>(endpoint: string, body: RequestBody = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  delete<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export default ApiService;
