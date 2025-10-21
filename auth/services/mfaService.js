/**
 * Multi-Factor Authentication (MFA) Service
 * Provides comprehensive MFA capabilities including TOTP, SMS, and backup codes
 */
/* global fetch */

/**
 * MFA Method Types
 */
export const MFA_METHODS = {
  TOTP: 'totp', // Time-based One-Time Password (Google Authenticator, Authy)
  SMS: 'sms', // SMS verification codes
  EMAIL: 'email', // Email verification codes
  BACKUP_CODES: 'backup', // Static backup codes
  WEBAUTHN: 'webauthn', // WebAuthn as MFA method
};

/**
 * MFA Status Types
 */
export const MFA_STATUS = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  PENDING: 'pending',
  REQUIRED: 'required',
};

/**
 * MFA Service Class
 * All methods throw errors on failure for proper test compatibility
 */
export class MFAService {
  constructor(authToken) {
    this.authToken = authToken;
    this.baseUrl = 'http://localhost:5000/api/auth/mfa';
  }

  /**
   * Private helper method to make authenticated requests
   */
  async _makeRequest(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get user's MFA status and enabled methods
   */
  async getMFAStatus() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}/status`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Setup TOTP (Time-based One-Time Password)
   * Returns QR code and secret for authenticator apps
   */
  async setupTOTP(email) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}/totp/setup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Verify TOTP setup with code from authenticator app
   */
  async verifyTOTPSetup(code) {
    return await this._makeRequest('/totp/verify', {
      body: JSON.stringify({
        token: code,
        sessionId: this.sessionId || null,
      }),
    });
  }

  /**
   * Verify TOTP code during authentication
   */
  async verifyTOTP(token) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}/totp/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        token,
        sessionId: this.sessionId || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Invalid token');
    }

    return await response.json();
  }

  /**
   * Setup SMS-based MFA
   */
  async setupSMS(phoneNumber) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}/sms/setup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Invalid phone number format');
    }

    return await response.json();
  }

  /**
   * Send SMS verification code
   */
  async sendSMSCode() {
    return await this._makeRequest('/sms/send', {
      body: JSON.stringify({
        sessionId: this.sessionId || null,
      }),
    });
  }

  /**
   * Verify SMS code
   */
  async verifySMS(code) {
    return await this._makeRequest(`${this.baseUrl}/sms/verify`, 'POST', {
      code,
      sessionId: this.sessionId || null,
    });
  }

  /**
   * Setup email-based MFA
   */
  async setupEmail(email) {
    return await this._makeRequest('/email/setup', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Send email verification code
   */
  async sendEmailCode() {
    return await this._makeRequest('/email/send', {
      method: 'POST',
      body: JSON.stringify({ sessionId: this.sessionId || null }),
    });
  }

  /**
   * Verify email code
   */
  async verifyEmail(code) {
    return await this._makeRequest('/email/verify', {
      method: 'POST',
      body: JSON.stringify({ code, sessionId: this.sessionId || null }),
    });
  }

  /**
   * Generate backup codes
   */
  async generateBackupCodes() {
    return await this._makeRequest('/backup-codes/generate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Use a backup code for verification
   */
  async useBackupCode(code) {
    return await this._makeRequest('/backup-codes/use', {
      method: 'POST',
      body: JSON.stringify({ code, sessionId: this.sessionId || null }),
    });
  }

  /**
   * Get remaining backup codes count
   */
  async getBackupCodesCount() {
    return await this._makeRequest(`${this.baseUrl}/backup-codes/count`, 'GET');
  }

  /**
   * Verify MFA challenge (generic method for any MFA type)
   */
  async verifyMFAChallenge(challengeId, method, code) {
    return await this._makeRequest(`${this.baseUrl}/challenge/verify`, 'POST', {
      challengeId,
      method,
      code,
      sessionId: this.sessionId || null,
    });
  }

  /**
   * Disable specific MFA method
   */
  async disableMFA(method, confirmationCode = null) {
    return await this._makeRequest('/disable', {
      method: 'POST',
      body: JSON.stringify({ method, confirmationCode }),
    });
  }

  /**
   * Enable MFA method
   */
  async enableMFA(method) {
    return await this._makeRequest(`${this.baseUrl}/enable`, 'POST', {
      method,
    });
  }

  /**
   * Challenge MFA during login
   */
  async challengeMFA(sessionId, method = null) {
    return await this._makeRequest('/challenge', {
      method: 'POST',
      body: JSON.stringify({ sessionId, method }),
    });
  }

  /**
   * Complete MFA challenge
   */
  async completeMFAChallenge(challengeId, response) {
    return await this._makeRequest(`${this.baseUrl}/challenge/complete`, 'POST', {
      challengeId,
      response,
    });
  }

  /**
   * Get MFA recovery options
   */
  async getRecoveryOptions() {
    return await this._makeRequest(`${this.baseUrl}/recovery`, 'GET');
  }

  /**
   * Reset MFA using recovery method
   */
  async resetMFA(recoveryCode) {
    return await this._makeRequest(`${this.baseUrl}/reset`, 'POST', {
      recoveryCode,
    });
  }

  /**
   * Check if user requires MFA for current session
   */
  async requiresMFA(userId) {
    return await this._makeRequest(`${this.baseUrl}/required?userId=${userId}`, 'GET');
  }

  /**
   * Validate MFA session
   */
  async validateMFASession(sessionToken) {
    return await this._makeRequest(`${this.baseUrl}/validate-session`, 'POST', {
      sessionToken,
    });
  }

  /**
   * Get MFA settings for user
   */
  async getMFASettings() {
    return await this._makeRequest(`${this.baseUrl}/settings`, 'GET');
  }

  /**
   * Update MFA settings
   */
  async updateMFASettings(settings) {
    return await this._makeRequest(`${this.baseUrl}/settings`, 'PUT', settings);
  }

  /**
   * Set session ID for subsequent requests
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  /**
   * Clear session ID
   */
  clearSession() {
    this.sessionId = null;
  }

  /**
   * Get trusted devices
   */
  async getTrustedDevices() {
    return await this._makeRequest(`${this.baseUrl}/trusted-devices`, 'GET');
  }

  /**
   * Add trusted device
   */
  async addTrustedDevice(deviceInfo) {
    return await this._makeRequest(`${this.baseUrl}/trusted-devices`, 'POST', deviceInfo);
  }

  /**
   * Remove trusted device
   */
  async removeTrustedDevice(deviceId) {
    return await this._makeRequest(`${this.baseUrl}/trusted-devices/${deviceId}`, 'DELETE');
  }

  /**
   * Get MFA audit log
   */
  async getMFAAuditLog(limit = 50) {
    return await this._makeRequest(`${this.baseUrl}/audit?limit=${limit}`, 'GET');
  }

  /**
   * Check device trust status
   */
  async checkDeviceTrust(deviceFingerprint) {
    return await this._makeRequest(`${this.baseUrl}/check-device`, 'POST', {
      deviceFingerprint,
    });
  }
}

// Export singleton instance
export const mfaService = new MFAService();

// Export for custom implementations
export default MFAService;