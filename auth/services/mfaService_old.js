/**
 * Multi-Factor Authentication (MFA) Service
 * Provides comprehensive MFA capabilities including TOTP, SMS, and backup codes
 */
import ApiService from '../../services/apiService.js';

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
 */
export class MFAService {
  constructor(apiService) {
    this.apiService = apiService || new ApiService();
    this.baseUrl = '/auth/mfa';
  }

  /**
   * Get user's MFA status and enabled methods
   */
  async getMFAStatus() {
    try {
      const response = await this.apiService.get(`/api${this.baseUrl}/status`);
      return response;
    } catch (_error) {
      // console.error('Failed to get MFA status:', _error);
      return {
        success: false,
        error: _error.message || 'Failed to retrieve MFA status',
      };
    }
  }

  /**
   * Setup TOTP (Time-based One-Time Password)
   * Returns QR code and secret for authenticator apps
   */
  async setupTOTP(email) {
    try {
      const response = await this.apiService.post(`/api${this.baseUrl}/totp/setup`, {
        email: email,
      });
      return response;
    } catch (_error) {
      // console.error('Failed to setup TOTP:', _error);
      return {
        success: false,
        error: _error.message || 'Failed to setup TOTP',
      };
    }
  }

  /**
   * Verify TOTP setup with code from authenticator app
   */
  async verifyTOTPSetup(code) {
    try {
      const response = await this.apiService.post(
        `${this.baseUrl}/totp/verify`,
        {
          code: code,
        }
      );
      return response;
    } catch (_error) {
      // console.error('Failed to verify TOTP setup:', _error);
      return {
        success: false,
        error: _error.message || 'Failed to verify TOTP setup',
      };
    }
  }

  /**
   * Setup SMS-based MFA
   */
  async setupSMS(phoneNumber) {
    try {
      const response = await this.apiService.post(`/api${this.baseUrl}/sms/setup`, {
        phoneNumber: phoneNumber,
      });
      return response.data;
    } catch (_error) {
      // console.error('Failed to setup SMS MFA:', _error);
      return {
        success: false,
        error: _error.message || 'Failed to setup SMS verification',
      };
    }
  }

  /**
   * Verify SMS setup with code
   */
  async verifySMSSetup(verificationId, code) {
    try {
      const response = await this.apiService.post(
        `${this.baseUrl}/sms/verify`,
        {
          verificationId: verificationId,
          code: code,
        }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (_error) {
      // console.error('Failed to verify SMS setup:', _error);
      return {
        success: false,
        error: _error.message || 'Invalid SMS verification code',
      };
    }
  }

  /**
   * Setup Email-based MFA
   */
  async setupEmail(email) {
    try {
      const response = await this.apiService.post(`/api${this.baseUrl}/email/setup`, {
        email: email,
      });
      return response.data;
    } catch (_error) {
      // console.error('Failed to setup Email MFA:', _error);
      return {
        success: false,
        error: _error.message || 'Failed to setup email verification',
      };
    }
  }

  /**
   * Verify Email setup with code
   */
  async verifyEmailSetup(verificationId, code) {
    try {
      const response = await this.apiService.post(
        `${this.baseUrl}/email/verify`,
        {
          verificationId: verificationId,
          code: code,
        }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (_error) {
      // console.error('Failed to verify Email setup:', _error);
      return {
        success: false,
        error: _error.message || 'Invalid email verification code',
      };
    }
  }

  /**
   * Generate new backup codes
   */
  async generateBackupCodes() {
    try {
      const response = await this.apiService.post(`/api${this.baseUrl}/backup-codes/generate`);
      return response.data;
    } catch (_error) {
      // console.error('Failed to generate backup codes:', _error);
      return {
        success: false,
        error: _error.message || 'Failed to generate backup codes',
      };
    }
  }

  /**
   * Verify MFA code during login
   */
  async verifyMFA(method, code, sessionId) {
    try {
      const response = await this.apiService.post(`${this.baseUrl}/verify`, {
        method: method,
        code: code,
        sessionId: sessionId,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (_error) {
      // console.error('Failed to verify MFA code:', _error);
      return {
        success: false,
        error: _error.message || 'Invalid verification code',
      };
    }
  }

  /**
   * Request MFA challenge (send SMS/Email)
   */
  async requestMFAChallenge(method, sessionId) {
    try {
      const response = await this.apiService.post(`${this.baseUrl}/challenge`, {
        method: method,
        sessionId: sessionId,
      });
      return {
        success: true,
        data: {
          challengeId: response.data.challengeId,
          method: method,
          expiresAt: response.data.expiresAt,
        },
      };
    } catch (_error) {
      // console.error('Failed to request MFA challenge:', _error);
      return {
        success: false,
        error: _error.message || 'Failed to send verification code',
      };
    }
  }

  /**
   * Disable specific MFA method
   */
  async disableMFAMethod(method, confirmationCode) {
    try {
      const response = await this.apiService.post(`${this.baseUrl}/disable`, {
        method: method,
        confirmationCode: confirmationCode,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (_error) {
      // console.error('Failed to disable MFA method:', _error);
      return {
        success: false,
        error: _error.message || 'Failed to disable MFA method',
      };
    }
  }

  /**
   * Disable all MFA methods (requires backup code or alternative verification)
   */
  async disableAllMFA(verificationCode, verificationMethod = 'backup') {
    try {
      const response = await this.apiService.post(
        `${this.baseUrl}/disable-all`,
        {
          verificationCode: verificationCode,
          verificationMethod: verificationMethod,
        }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (_error) {
      // console.error('Failed to disable all MFA:', _error);
      return {
        success: false,
        error: _error.message || 'Failed to disable MFA',
      };
    }
  }

  /**
   * Get MFA recovery options
   */
  async getRecoveryOptions() {
    try {
      const response = await this.apiService.get(`${this.baseUrl}/recovery`);
      return {
        success: true,
        data: {
          backupCodesAvailable: response.data.backupCodesAvailable || 0,
          recoveryEmail: response.data.recoveryEmail || null,
          recoveryPhone: response.data.recoveryPhone || null,
          trustedDevices: response.data.trustedDevices || [],
        },
      };
    } catch (_error) {
      // console.error('Failed to get recovery options:', _error);
      return {
        success: false,
        error: _error.message || 'Failed to retrieve recovery options',
      };
    }
  }

  /**
   * Verify TOTP code (alias for verifyMFA with TOTP method)
   */
  async verifyTOTP(token, sessionId = null) {
    try {
      const response = await this.apiService.post(`/api${this.baseUrl}/totp/verify`, {
        token: token,
        sessionId: sessionId,
      });
      return response.data;
    } catch (_error) {
      return {
        success: false,
        error: _error.message || 'Invalid verification code',
      };
    }
  }

  /**
   * Send SMS verification code (alias for requestMFAChallenge with SMS method)
   */
  async sendSMSCode(sessionId = null) {
    try {
      const response = await this.apiService.post(`/api${this.baseUrl}/sms/send`, {
        sessionId: sessionId,
      });
      return response.data;
    } catch (_error) {
      return {
        success: false,
        error: _error.message || 'Failed to send SMS code',
      };
    }
  }

  /**
   * Verify email code (alias for verifyMFA with EMAIL method)
   */
  async verifyEmail(code, sessionId = null) {
    try {
      const response = await this.apiService.post(`/api${this.baseUrl}/email/verify`, {
        code: code,
        sessionId: sessionId,
      });
      return response.data;
    } catch (_error) {
      return {
        success: false,
        error: _error.message || 'Invalid email verification code',
      };
    }
  }

  /**
   * Use backup code for verification (alias for verifyMFA with BACKUP_CODES method)
   */
  async useBackupCode(code, sessionId = null) {
    try {
      const response = await this.apiService.post(`/api${this.baseUrl}/backup-codes/use`, {
        code: code,
        sessionId: sessionId,
      });
      return response.data;
    } catch (_error) {
      return {
        success: false,
        verified: false,
        error: _error.message || 'Invalid backup code',
      };
    }
  }

  /**
   * Disable MFA (alias for disableMFAMethod)
   */
  async disableMFA(method, confirmationCode = null) {
    try {
      const response = await this.apiService.post(`/api${this.baseUrl}/disable`, {
        method: method,
        confirmationCode: confirmationCode,
      });
      return response.data;
    } catch (_error) {
      return {
        success: false,
        error: _error.message || 'Failed to disable MFA method',
      };
    }
  }

  /**
   * Challenge MFA during login (alias for requestMFAChallenge)
   */
  async challengeMFA(sessionId, method = null) {
    try {
      const response = await this.apiService.post(`/api${this.baseUrl}/challenge`, {
        sessionId: sessionId,
        method: method,
      });
      return response.data;
    } catch (_error) {
      return {
        success: false,
        error: _error.message || 'Failed to initiate MFA challenge',
      };
    }
  }

  /**
   * Verify MFA challenge with code
   */
  async verifyMFAChallenge(challengeId, code, method) {
    try {
      const response = await this.apiService.post(`/api${this.baseUrl}/verify-challenge`, {
        challengeId: challengeId,
        code: code,
        method: method,
      });
      return response.data;
    } catch (_error) {
      return {
        success: false,
        error: _error.message || 'Failed to verify MFA challenge',
      };
    }
  }

  /**
   * Verify SMS code
   */
  async verifySMS(code, sessionId = null) {
    try {
      const response = await this.apiService.post(`/api${this.baseUrl}/sms/verify`, {
        code: code,
        sessionId: sessionId,
      });
      return response.data;
    } catch (_error) {
      return {
        success: false,
        error: _error.message || 'Invalid SMS verification code',
      };
    }
  }
}

/**
 * MFA Utility Functions
 */

/**
 * Validate TOTP code format
 */
export const validateTOTPCode = (code) => {
  return /^\d{6}$/.test(code);
};

/**
 * Validate SMS code format
 */
export const validateSMSCode = (code) => {
  return /^\d{4,6}$/.test(code);
};

/**
 * Validate backup code format
 */
export const validateBackupCode = (code) => {
  return /^[A-Z0-9]{8}-[A-Z0-9]{8}$/.test(code);
};

/**
 * Format phone number for SMS
 */
export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Add country code if missing (assumes US +1)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+${cleaned}`;
  }

  return `+${cleaned}`;
};

/**
 * Get MFA method display name
 */
export const getMFAMethodDisplayName = (method) => {
  const displayNames = {
    [MFA_METHODS.TOTP]: 'Authenticator App',
    [MFA_METHODS.SMS]: 'SMS Text Message',
    [MFA_METHODS.EMAIL]: 'Email Verification',
    [MFA_METHODS.BACKUP_CODES]: 'Backup Codes',
    [MFA_METHODS.WEBAUTHN]: 'Security Key',
  };
  return displayNames[method] || method;
};

/**
 * Get MFA method icon
 */
export const getMFAMethodIcon = (method) => {
  const icons = {
    [MFA_METHODS.TOTP]: '📱',
    [MFA_METHODS.SMS]: '💬',
    [MFA_METHODS.EMAIL]: '📧',
    [MFA_METHODS.BACKUP_CODES]: '🔐',
    [MFA_METHODS.WEBAUTHN]: '🔑',
  };
  return icons[method] || '🔒';
};

// Create default instance with shared apiService
const apiService = new ApiService();
const mfaService = new MFAService(apiService);

export default mfaService;
