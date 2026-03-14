import ApiService from "./apiService";

export class DeveloperApiService extends ApiService {
  /**
   * List all API keys for the current user
   */
  async getApiKeys() {
    return this.get("/developer/keys");
  }

  /**
   * Generate a new API key
   * @param {string} name - Friendly name for the key
   * @param {string[]} roles - Array of roles/scopes (e.g., 'read-only')
   */
  async generateApiKey(name, roles = ["read-only"]) {
    return this.post("/developer/keys", { name, roles });
  }

  /**
   * Revoke an existing API key
   * @param {string} keyId - ID of the key to revoke
   */
  async revokeApiKey(keyId) {
    return this.delete(`/developer/keys/${keyId}`);
  }
}

export const developerApi = new DeveloperApiService();
export default developerApi;
