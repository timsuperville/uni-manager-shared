import { BaseService } from "../../../api/services/BaseService";
import { ApiClient } from "../../../api/core/ApiClient";
import { ApiKey, ApiKeyCreateResult } from "../../../api/types";

export class DeveloperService extends BaseService {
  constructor(client: ApiClient) {
    super(client, "/developer", "DeveloperService");
  }

  /**
   * List all API keys for the current user
   */
  async getApiKeys(): Promise<ApiKey[]> {
    // ── BACKEND NOT YET IMPLEMENTED ─────────────────────────────────────────
    // The /developer/keys endpoint does not exist yet. Return empty array so
    // ApiKeyList shows its clean empty state. Restore the real call below:
    //   return this.get<ApiKey[]>("/keys");
    return Promise.resolve([]);
    // ────────────────────────────────────────────────────────────────────────
  }

  /**
   * Generate a new API key.
   * @param name   - Friendly display name for the key
   * @param roles  - Array of scopes (e.g. 'read-only')
   */
  async generateApiKey(
    name: string,
    roles: string[] = ["read-only"],
  ): Promise<ApiKeyCreateResult> {
    return this.post<ApiKeyCreateResult>("/keys", { name, roles });
  }

  /**
   * Permanently revoke an existing API key.
   * @param keyId - ID of the key to revoke
   */
  async revokeApiKey(keyId: string): Promise<void> {
    return this.delete<void>(`/keys/${keyId}`).then(() => {});
  }
}
