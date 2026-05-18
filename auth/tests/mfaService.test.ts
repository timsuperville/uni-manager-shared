import { MFAService } from '../services/mfaService';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn() as any;

describe('MFA Service', () => {
  let mfaService: MFAService;

  beforeEach(() => {
    mfaService = new MFAService();
    vi.clearAllMocks();
  });

  describe('TOTP Management', () => {
    it('should setup TOTP successfully', async () => {
      const mockResponse = {
        success: true,
        secret: 'ABCD1234EFGH5678',
        qrCodeUrl: 'data:image/png;base64,iVBORw...',
        backupCodes: ['123456', '789012']
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      const result: any = await mfaService.setupTOTP('test@example.com');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/auth/mfa/totp/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: 'test@example.com' })
      });
    });

    it('should verify TOTP token correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, verified: true })
      });

      const result: any = await mfaService.verifyTOTP('123456');

      expect(result.verified).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/auth/mfa/totp/verify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token: '123456', sessionId: null })
        }
      );
    });

    it('should handle TOTP verification failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: 'Invalid token'
        })
      });

      await expect(mfaService.verifyTOTP('000000')).rejects.toThrow(
        'Invalid token'
      );
    });
  });

  describe('SMS Management', () => {
    it('should setup SMS MFA successfully', async () => {
      const mockResponse = { success: true, message: 'SMS setup complete' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      const result: any = await mfaService.setupSMS('+1234567890');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/auth/mfa/sms/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: '+1234567890' })
      });
    });

    it('should send SMS verification code', async () => {
      const mockResponse = { success: true, message: 'Code sent' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      const result: any = await mfaService.sendSMSCode();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/auth/mfa/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId: null })
      });
    });
  });

  describe('Email Management', () => {
    it('should setup email MFA successfully', async () => {
      const mockResponse = { success: true, message: 'Email MFA enabled' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      const result: any = await mfaService.setupEmail('test@example.com');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/auth/mfa/email/setup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: 'test@example.com' })
        }
      );
    });

    it('should verify email code correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, verified: true })
      });

      const result: any = await mfaService.verifyEmail('123456');

      expect(result.verified).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/auth/mfa/email/verify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code: '123456', sessionId: null })
        }
      );
    });
  });

  describe('Backup Codes', () => {
    it('should generate backup codes successfully', async () => {
      const mockCodes = ['123456', '789012', '345678', '901234', '567890'];
      const mockResponse = { success: true, backupCodes: mockCodes };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      const result: any = await mfaService.generateBackupCodes();

      expect(result.backupCodes).toEqual(mockCodes);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/auth/mfa/backup-codes/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      );
    });

    it('should use backup code for verification', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, verified: true })
      });

      const result: any = await mfaService.useBackupCode('123456');

      expect(result.verified).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/auth/mfa/backup-codes/use',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code: '123456', sessionId: null })
        }
      );
    });
  });

  describe('MFA Status and Management', () => {
    it('should get MFA status correctly', async () => {
      const mockStatus = {
        enabled: true,
        methods: ['totp', 'sms'],
        recoveryCodesRemaining: 3
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockStatus)
      });

      const result: any = await mfaService.getMFAStatus();

      expect(result).toEqual(mockStatus);
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/auth/mfa/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });

    it('should disable MFA method successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      });

      const result: any = await mfaService.disableMFA('totp');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ method: 'totp', confirmationCode: null })
      });
    });

    it('should challenge MFA during login', async () => {
      const mockChallenge = {
        challengeId: 'abc123',
        availableMethods: ['totp', 'sms']
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockChallenge)
      });

      const result: any = await mfaService.challengeMFA('user123');

      expect(result).toEqual(mockChallenge);
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/auth/mfa/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId: 'user123', method: null })
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(mfaService.getMFAStatus()).rejects.toThrow('Network error');
    });

    it('should handle API errors with proper error messages', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          message: 'MFA not enabled'
        })
      });

      await expect(mfaService.verifyTOTP('123456')).rejects.toThrow(
        'MFA not enabled'
      );
    });

    it('should handle invalid JSON responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      await expect(mfaService.getMFAStatus()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Token Management', () => {
    it('should use provided auth token', async () => {
      const serviceWithToken = new MFAService('test-token');

      // Mock localStorage for token retrieval test
      const mockGetItem = vi.fn().mockReturnValue('test-token');
      Object.defineProperty(window, 'localStorage', {
        value: { getItem: mockGetItem },
        writable: true
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      });

      await serviceWithToken.getMFAStatus();

      expect(global.fetch).toHaveBeenCalledWith('/api/v1/auth/mfa/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token'
        }
      });
    });
  });
});
