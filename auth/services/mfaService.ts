/**
 * Multi-Factor Authentication (MFA) Service
 *
 * Network calls for all MFA flows (TOTP, SMS, Email, WebAuthn, backup codes).
 * Utility helpers (display names, validation, phone formatting) live in utils/mfaUtils.ts.
 */

import type { MFAMethod } from '../utils/mfaUtils';

// -- Types --------------------------------------------------------------------

interface MFARequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

interface DeviceInfoPayload {
  [key: string]: unknown;
}

// -- MFAService ---------------------------------------------------------------

export class MFAService {
  private authToken: string | null;
  private readonly baseUrl: string;
  private sessionId: string | null = null;

  constructor(authToken?: string | null) {
    this.authToken = authToken ?? null;
    this.baseUrl = `${import.meta.env.VITE_API_URL ?? ''}/v1/auth/mfa`;
  }

  /** Authenticated POST request helper */
  private async _makeRequest(
    endpoint: string,
    options: MFARequestOptions = {}
  ): Promise<unknown> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: options.method ?? 'POST',
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new Error(
        errorData.message ?? `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  }

  async getMFAStatus(): Promise<unknown> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;
    const response = await fetch(`${this.baseUrl}/status`, {
      method: 'GET',
      headers
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }

  async setupTOTP(email: string): Promise<unknown> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;
    const response = await fetch(`${this.baseUrl}/totp/setup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email })
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }

  async verifyTOTPSetup(code: string): Promise<unknown> {
    return this._makeRequest('/totp/verify', {
      body: JSON.stringify({ token: code, sessionId: this.sessionId })
    });
  }

  async verifyTOTP(token: string): Promise<unknown> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;
    const response = await fetch(`${this.baseUrl}/totp/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token, sessionId: this.sessionId })
    });
    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new Error(errorData.message ?? 'Invalid token');
    }
    return await response.json();
  }

  async setupSMS(phoneNumber: string): Promise<unknown> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;
    const response = await fetch(`${this.baseUrl}/sms/setup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phoneNumber })
    });
    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new Error(errorData.message ?? 'Invalid phone number format');
    }
    return await response.json();
  }

  async sendSMSCode(): Promise<unknown> {
    return this._makeRequest('/sms/send', {
      body: JSON.stringify({ sessionId: this.sessionId })
    });
  }

  async verifySMS(code: string): Promise<unknown> {
    return this._makeRequest('/sms/verify', {
      body: JSON.stringify({ code, sessionId: this.sessionId })
    });
  }

  async setupEmail(email: string): Promise<unknown> {
    return this._makeRequest('/email/setup', {
      body: JSON.stringify({ email })
    });
  }

  async sendEmailCode(): Promise<unknown> {
    return this._makeRequest('/email/send', {
      body: JSON.stringify({ sessionId: this.sessionId })
    });
  }

  async verifyEmail(code: string): Promise<unknown> {
    return this._makeRequest('/email/verify', {
      body: JSON.stringify({ code, sessionId: this.sessionId })
    });
  }

  async generateBackupCodes(): Promise<unknown> {
    return this._makeRequest('/backup-codes/generate', {
      body: JSON.stringify({})
    });
  }

  async useBackupCode(code: string): Promise<unknown> {
    return this._makeRequest('/backup-codes/use', {
      body: JSON.stringify({ code, sessionId: this.sessionId })
    });
  }

  async getBackupCodesCount(): Promise<unknown> {
    return this._makeRequest('/backup-codes/count', { method: 'GET' });
  }

  async verifyMFAChallenge(
    challengeId: string,
    method: MFAMethod,
    code: string
  ): Promise<unknown> {
    return this._makeRequest('/challenge/verify', {
      body: JSON.stringify({
        challengeId,
        method,
        code,
        sessionId: this.sessionId
      })
    });
  }

  async disableMFA(
    method: MFAMethod,
    confirmationCode: string | null = null
  ): Promise<unknown> {
    return this._makeRequest('/disable', {
      body: JSON.stringify({ method, confirmationCode })
    });
  }

  async enableMFA(method: MFAMethod): Promise<unknown> {
    return this._makeRequest('/enable', {
      body: JSON.stringify({ method })
    });
  }

  async challengeMFA(
    sessionId: string,
    method: MFAMethod | null = null
  ): Promise<unknown> {
    return this._makeRequest('/challenge', {
      body: JSON.stringify({ sessionId, method })
    });
  }

  async completeMFAChallenge(
    challengeId: string,
    response: unknown
  ): Promise<unknown> {
    return this._makeRequest('/challenge/complete', {
      body: JSON.stringify({ challengeId, response })
    });
  }

  async getRecoveryOptions(): Promise<unknown> {
    return this._makeRequest('/recovery', { method: 'GET' });
  }

  async resetMFA(recoveryCode: string): Promise<unknown> {
    return this._makeRequest('/reset', {
      body: JSON.stringify({ recoveryCode })
    });
  }

  async requiresMFA(userId: string): Promise<unknown> {
    return this._makeRequest(`/required?userId=${userId}`, { method: 'GET' });
  }

  async validateMFASession(sessionToken: string): Promise<unknown> {
    return this._makeRequest('/validate-session', {
      body: JSON.stringify({ sessionToken })
    });
  }

  async getMFASettings(): Promise<unknown> {
    return this._makeRequest('/settings', { method: 'GET' });
  }

  async updateMFASettings(settings: Record<string, unknown>): Promise<unknown> {
    return this._makeRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  clearSession(): void {
    this.sessionId = null;
  }

  async getTrustedDevices(): Promise<unknown> {
    return this._makeRequest('/trusted-devices', { method: 'GET' });
  }

  async addTrustedDevice(deviceInfo: DeviceInfoPayload): Promise<unknown> {
    return this._makeRequest('/trusted-devices', {
      body: JSON.stringify(deviceInfo)
    });
  }

  async removeTrustedDevice(deviceId: string): Promise<unknown> {
    return this._makeRequest(`/trusted-devices/${deviceId}`, {
      method: 'DELETE'
    });
  }

  async getMFAAuditLog(limit = 50): Promise<unknown> {
    return this._makeRequest(`/audit?limit=${limit}`, { method: 'GET' });
  }

  async checkDeviceTrust(deviceFingerprint: string): Promise<unknown> {
    return this._makeRequest('/check-device', {
      body: JSON.stringify({ deviceFingerprint })
    });
  }
}

export const mfaService = new MFAService();
export default MFAService;

// Re-export utilities so callers who import from mfaService can access helpers
// without a second import statement.
export {
  getMFAMethodDisplayName,
  getMFAMethodIcon,
  validateTOTPCode,
  validateSMSCode,
  formatPhoneNumber,
  type MFAMethod
} from '../utils/mfaUtils';
