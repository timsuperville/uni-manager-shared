/**
 * shared/services/apiService.js
 *
 * Base API service class for shared service modules.
 * Uses the @shared/api layer to ensure correct cross-app base URL resolution.
 */
import { getApiBaseUrl } from "@shared/api";

class ApiService {
  constructor() {
    this._base = null; // resolved lazily
  }

  get baseURL() {
    if (!this._base) {
      try {
        this._base = getApiBaseUrl();
      } catch (_err) {
        this._base = import.meta.env?.VITE_API_URL ?? "http://localhost:5000";
      }
    }
    return this._base;
  }

  _token() {
    // Try admin token first, fall back to generic
    return (
      localStorage.getItem("admin_auth_token") ||
      localStorage.getItem("auth_token") ||
      null
    );
  }

  _headers() {
    const token = this._token();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api/v1${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: { ...this._headers(), ...(options.headers ?? {}) },
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`API ${res.status}: ${msg}`);
    }
    return res.json();
  }

  get(endpoint, params = {}) {
    const qs = Object.keys(params).length
      ? "?" + new URLSearchParams(params).toString()
      : "";
    return this.request(`${endpoint}${qs}`, { method: "GET" });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
}

export default ApiService;
