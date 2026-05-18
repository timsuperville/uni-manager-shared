// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MFAService } from '../services/mfaService';
import { AuthService } from '../services/AuthService';

describe('MFA Integration Scenarios', () => {
  let mfaService: MFAService;
  let authService: AuthService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    if (typeof localStorage !== 'undefined') localStorage.clear();

    // Mock fetch
    global.fetch = vi.fn() as any;
    // Mock ApiClient for BaseService
    const mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      setAuthToken: vi.fn(),
      clearAuthToken: vi.fn(),
      hasAuthToken: vi.fn().mockReturnValue(false)
    };

    // Create service instances
    mfaService = new MFAService();
    authService = new AuthService(mockApiClient as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Complete Authentication Flow Integration', () => {
    it('should handle complete login flow with MFA verification', async () => {
      // Mock AuthService login response using ApiClient
      const mockPost = authService.client.post as any;
      mockPost.mockResolvedValueOnce({
        data: {
          success: true,
          requiresMFA: true,
          userId: 'user123',
          tempToken: 'temp-123',
          accessToken: '' // Provide empty accessToken if MFA required
        }
      });

      // Mock MFA challenge and verification via fetch
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({
            challengeId: 'challenge-abc',
            availableMethods: ['totp', 'sms'],
            requiresMFA: true
          })
        })
        // Mock successful MFA verification
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({
            success: true,
            verified: true,
            user: { id: 'user123', email: 'test@example.com' },
            token: 'final-token-789'
          })
        });

      // Step 1: Initial login
      const loginResult = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(loginResult.requiresMFA).toBe(true);
      expect(loginResult.userId).toBe('user123');

      // Step 2: Challenge MFA
      const challengeResult = await mfaService.challengeMFA('user123');
      expect(challengeResult.challengeId).toBe('challenge-abc');
      expect(challengeResult.availableMethods).toContain('totp');

      // Step 3: Verify MFA
      const verifyResult = await mfaService.verifyMFAChallenge(
        'challenge-abc',
        'totp',
        '123456'
      );

      expect(verifyResult.verified).toBe(true);
      expect(verifyResult.token).toBe('final-token-789');
    });

    it('should handle MFA setup for new users', async () => {
      // Mock TOTP setup flow
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            success: true,
            secret: 'ABCD1234EFGH5678',
            qrCodeUrl: 'data:image/png;base64,test'
          })
        })
        // Mock TOTP verification
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            success: true,
            verified: true
          })
        })
        // Mock backup codes generation
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            success: true,
            backupCodes: ['123456', '789012', '345678', '901234', '567890']
          })
        });

      // Complete MFA setup flow
      const setupResult = await mfaService.setupTOTP('test@example.com');
      expect(setupResult.success).toBe(true);
      expect(setupResult.secret).toBe('ABCD1234EFGH5678');

      const verifyResult = await mfaService.verifyTOTP('123456');
      expect(verifyResult.verified).toBe(true);

      const backupResult = await mfaService.generateBackupCodes();
      expect(backupResult.backupCodes).toHaveLength(5);
    });

    it('should handle backup code usage during emergency access', async () => {
      // Mock backup code verification
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          verified: true,
          codesRemaining: 2,
          warningMessage: 'Only 2 backup codes remaining'
        })
      });

      const result = await mfaService.useBackupCode('123456');

      expect(result.verified).toBe(true);
      expect(result.codesRemaining).toBe(2);
      expect(result.warningMessage).toContain('2 backup codes remaining');
    });
  });

  describe('Multi-Method MFA Support', () => {
    it('should support SMS as alternative MFA method', async () => {
      // Mock SMS setup and verification flow
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            success: true,
            message: 'SMS setup complete'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            success: true,
            message: 'Code sent'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            success: true,
            verified: true
          })
        });

      const setupResult = await mfaService.setupSMS('+1234567890');
      expect(setupResult.success).toBe(true);

      const sendResult = await mfaService.sendSMSCode();
      expect(sendResult.success).toBe(true);

      const verifyResult = await mfaService.verifySMS('654321');
      expect(verifyResult.verified).toBe(true);
    });

    it('should support email as MFA method', async () => {
      // Mock email MFA flow
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            success: true,
            message: 'Email MFA enabled'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            success: true,
            message: 'Verification email sent'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            success: true,
            verified: true
          })
        });

      const setupResult = await mfaService.setupEmail('test@example.com');
      expect(setupResult.success).toBe(true);

      const sendResult = await mfaService.sendEmailCode();
      expect(sendResult.success).toBe(true);

      const verifyResult = await mfaService.verifyEmail('789123');
      expect(verifyResult.verified).toBe(true);
    });
  });

  describe('MFA Management Operations', () => {
    it('should provide comprehensive MFA status information', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          enabled: true,
          methods: ['totp', 'sms'],
          recoveryCodesRemaining: 3,
          lastUsed: '2024-01-15T10:00:00Z',
          setupDate: '2024-01-01T12:00:00Z'
        })
      });

      const status = await mfaService.getMFAStatus();

      expect(status.enabled).toBe(true);
      expect(status.methods).toEqual(['totp', 'sms']);
      expect(status.recoveryCodesRemaining).toBe(3);
      expect(status.lastUsed).toBeDefined();
      expect(status.setupDate).toBeDefined();
    });

    it('should allow disabling specific MFA methods', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          remainingMethods: ['sms'],
          message: 'TOTP disabled successfully'
        })
      });

      const result = await mfaService.disableMFA('totp');

      expect(result.success).toBe(true);
      expect(result.remainingMethods).toEqual(['sms']);
    });

    it('should regenerate backup codes when requested', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          backupCodes: ['111111', '222222', '333333', '444444', '555555'],
          message: 'New backup codes generated'
        })
      });

      const result = await mfaService.generateBackupCodes();

      expect(result.success).toBe(true);
      expect(result.backupCodes).toHaveLength(5);
      expect(result.backupCodes).toEqual([
        '111111',
        '222222',
        '333333',
        '444444',
        '555555'
      ]);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle MFA verification failures gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          message: 'Invalid verification code',
          attemptsRemaining: 2
        })
      });

      await expect(mfaService.verifyTOTP('000000')).rejects.toThrow(
        'Invalid verification code'
      );
    });

    it('should handle account lockout scenarios', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          message: 'Account temporarily locked',
          lockoutUntil: '2024-01-15T11:00:00Z',
          lockoutReason: 'Too many failed MFA attempts'
        })
      });

      await expect(mfaService.verifyTOTP('123456')).rejects.toThrow(
        'Account temporarily locked'
      );
    });

    it('should handle network errors during MFA operations', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(mfaService.getMFAStatus()).rejects.toThrow('Network error');
    });

    it('should handle invalid JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      await expect(mfaService.getMFAStatus()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Token Management Integration', () => {
    it('should properly manage authentication tokens throughout MFA flow', async () => {
      // Set initial token and create service with it
      typeof localStorage !== 'undefined' &&
        localStorage.setItem('authToken', 'initial-token');
      const serviceWithToken = new MFAService('initial-token');

      // Mock status check with token
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          enabled: true,
          methods: ['totp']
        })
      });

      await serviceWithToken.getMFAStatus();
    });

    it('should handle token refresh during long MFA setup process', async () => {
      const serviceWithToken = new MFAService('custom-token');

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      });

      await serviceWithToken.getMFAStatus();

      expect(fetch).toHaveBeenCalledWith('/api/v1/auth/mfa/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer custom-token'
        }
      });
    });
  });

  describe('Cross-Browser MFA Support', () => {
    it('should detect MFA capabilities across different browsers', async () => {
      // Test TOTP support (should always be available)
      expect(mfaService.setupTOTP).toBeDefined();
      expect(mfaService.verifyTOTP).toBeDefined();

      // Test SMS support (should always be available)
      expect(mfaService.setupSMS).toBeDefined();
      expect(mfaService.verifySMS).toBeDefined();

      // Test email support (should always be available)
      expect(mfaService.setupEmail).toBeDefined();
      expect(mfaService.verifyEmail).toBeDefined();

      // Test backup codes (should always be available)
      expect(mfaService.generateBackupCodes).toBeDefined();
      expect(mfaService.useBackupCode).toBeDefined();
    });
  });
});
