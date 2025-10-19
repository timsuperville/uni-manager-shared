/* global console */
/**
 * Multi-Factor Authentication (MFA) Service
 * Provides comprehensive MFA capabilities including TOTP, SMS, and backup codes
 */

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
    this.apiService = apiService;
    this.baseUrl = '/auth/mfa';
  }

  /**
   * Get user's MFA status and enabled methods
   */
  async getMFAStatus() {
    try {
      const response = await this.apiService.get(`${this.baseUrl}/status`);
      return {
        success: true,
        data: {
          enabled: response.data.enabled || false,
          methods: response.data.methods || [],
          backupCodesRemaining: response.data.backupCodesRemaining || 0,
          requireMFA: response.data.requireMFA || false,
          lastUsed: response.data.lastUsed || null,
        },
      };
    } catch (_error) {
      // console.error('Failed to get MFA status:', error);
      return {
        success: false,
        error: error.message || 'Failed to retrieve MFA status',
      };
    }
  }

  /**
   * Setup TOTP (Time-based One-Time Password)
   * Returns QR code and secret for authenticator apps
   */
  async setupTOTP() {
    try {
      const response = await this.apiService.post(`${this.baseUrl}/totp/setup`);
      return {
        success: true,
        data: {
          secret: response.data.secret,
          qrCode: response.data.qrCode,
          backupCodes: response.data.backupCodes,
          manualEntryKey: response.data.manualEntryKey,
        },
      };
    } catch (_error) {
      // console.error('Failed to setup TOTP:', error);
      return {
        success: false,
        error: error.message || 'Failed to setup TOTP',
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
      return {
        success: true,
        data: response.data,
      };
    } catch (_error) {
      // console.error('Failed to verify TOTP setup:', error);
      return {
        success: false,
        error: error.message || 'Invalid verification code',
      };
    }
  }

  /**
   * Setup SMS-based MFA
   */
  async setupSMS(phoneNumber) {
    try {
      const response = await this.apiService.post(`${this.baseUrl}/sms/setup`, {
        phoneNumber: phoneNumber,
      });
      return {
        success: true,
        data: {
          verificationId: response.data.verificationId,
          phoneNumber: response.data.phoneNumber,
        },
      };
    } catch (_error) {
      // console.error('Failed to setup SMS MFA:', error);
      return {
        success: false,
        error: error.message || 'Failed to setup SMS verification',
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
      // console.error('Failed to verify SMS setup:', error);
      return {
        success: false,
        error: error.message || 'Invalid SMS verification code',
      };
    }
  }

  /**
   * Setup Email-based MFA
   */
  async setupEmail(email) {
    try {
      const response = await this.apiService.post(
        `${this.baseUrl}/email/setup`,
        {
          email: email,
        }
      );
      return {
        success: true,
        data: {
          verificationId: response.data.verificationId,
          email: response.data.email,
        },
      };
    } catch (_error) {
      // console.error('Failed to setup Email MFA:', error);
      return {
        success: false,
        error: error.message || 'Failed to setup email verification',
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
      // console.error('Failed to verify Email setup:', error);
      return {
        success: false,
        error: error.message || 'Invalid email verification code',
      };
    }
  }

  /**
   * Generate new backup codes
   */
  async generateBackupCodes() {
    try {
      const response = await this.apiService.post(
        `${this.baseUrl}/backup-codes/generate`
      );
      return {
        success: true,
        data: {
          codes: response.data.codes,
          remainingCodes: response.data.remainingCodes,
        },
      };
    } catch (_error) {
      // console.error('Failed to generate backup codes:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate backup codes',
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
      // console.error('Failed to verify MFA code:', error);
      return {
        success: false,
        error: error.message || 'Invalid verification code',
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
      // console.error('Failed to request MFA challenge:', error);
      return {
        success: false,
        error: error.message || 'Failed to send verification code',
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
      // console.error('Failed to disable MFA method:', error);
      return {
        success: false,
        error: error.message || 'Failed to disable MFA method',
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
      // console.error('Failed to disable all MFA:', error);
      return {
        success: false,
        error: error.message || 'Failed to disable MFA',
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
      // console.error('Failed to get recovery options:', error);
      return {
        success: false,
        error: error.message || 'Failed to retrieve recovery options',
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

export default MFAService;
