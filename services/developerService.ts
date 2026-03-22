import ApiService from "./apiService";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ApiKey {
  _id?: string;
  id?: string;
  name: string;
  prefix: string;
  roles: string[];
  createdAt: string;
  lastUsedAt?: string;
  usageCount?: number;
}

export interface ApiKeyCreateResult {
  /** One-time revealed key value — store it immediately, never re-fetched */
  key: string;
  name: string;
  prefix: string;
  roles: string[];
  createdAt: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class DeveloperApiService extends ApiService {
  /** List all API keys for the current user */
  getApiKeys(): Promise<ApiKey[]> {
    // ── BACKEND NOT YET IMPLEMENTED ─────────────────────────────────────────
    // The /developer/keys endpoint does not exist yet. Return empty array so
    // ApiKeyList shows its clean empty state. Restore the real call below:
    //   return this.get<ApiKey[]>("/developer/keys");
    return Promise.resolve([]);
    // ────────────────────────────────────────────────────────────────────────
  }

  /**
   * Generate a new API key.
   * @param name   - Friendly display name for the key
   * @param roles  - Array of scopes (e.g. 'read-only')
   */
  generateApiKey(
    name: string,
    roles: string[] = ["read-only"],
  ): Promise<ApiKeyCreateResult> {
    return this.post<ApiKeyCreateResult>("/developer/keys", { name, roles });
  }

  /**
   * Permanently revoke an existing API key.
   * @param keyId - ID of the key to revoke
   */
  revokeApiKey(keyId: string): Promise<void> {
    return this.delete<void>(`/developer/keys/${keyId}`);
  }
}

export const developerApi = new DeveloperApiService();
export default developerApi;
