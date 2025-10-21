/**
 * OAuth Service
 * Handles OAuth provider authentication
 */

class OAuthService {
  constructor() {
    this.providers = new Map();
    this.baseUrl = 'http://localhost:5000'; // Will be configurable
  }

  /**
   * Get available OAuth providers
   * @returns {Promise<Array>} List of available providers
   */
  async getProviders() {
    try {
      const response = await globalThis.fetch(`${this.baseUrl}/api/auth/oauth/providers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch OAuth providers');
      }

      const data = await response.json();
      return data.providers || [];
    } catch (error) {
      // Error handling without console
      return [];
    }
  }

  /**
   * Authenticate with OAuth provider
   * @param {string} provider - Provider name (google, github, etc.)
   * @param {Object} options - Authentication options
   * @returns {Promise<Object>} Authentication result
   */
  async authenticate(provider, options = {}) {
    const redirectUri = options.redirectUri || (typeof globalThis.location !== 'undefined' ? globalThis.location.origin : 'http://localhost:3000');

    const response = await globalThis.fetch(`${this.baseUrl}/api/auth/oauth/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirectUri,
        state: options.state,
        ...options,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'OAuth authentication failed');
    }

    const data = await response.json();
    return {
      success: true,
      authUrl: data.authUrl,
      token: data.token,
      user: data.user,
      ...data,
    };
  }

  /**
   * Handle OAuth callback
   * @param {string} provider - Provider name
   * @param {string} code - Authorization code
   * @param {string} state - State parameter
   * @returns {Promise<Object>} Authentication result
   */
  async handleCallback(provider, code, state) {
    const response = await globalThis.fetch(`${this.baseUrl}/api/auth/oauth/${provider}/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'OAuth callback failed');
    }

    const data = await response.json();
    return {
      success: true,
      token: data.token,
      user: data.user,
      ...data,
    };
  }

  /**
   * Revoke OAuth token
   * @param {string} provider - Provider name
   * @param {string} token - Token to revoke
   * @returns {Promise<boolean>} Success status
   */
  async revokeToken(provider, token) {
    try {
      const response = await globalThis.fetch(`${this.baseUrl}/api/auth/oauth/${provider}/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Create and export singleton instance
const oauthService = new OAuthService();
export default oauthService;