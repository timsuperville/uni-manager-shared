import { MFAService } from '../services/mfaService.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('MFA Service', () => {
  let mfaService;

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
        backupCodes: ['123456', '789012'],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const result = await mfaService.setupTOTP('test@example.com');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/mfa/totp/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
    });

    it('should verify TOTP token correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, verified: true }),
      });

      const result = await mfaService.verifyTOTP('123456');

      expect(result.verified).toBe(true);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/mfa/totp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: '123456', sessionId: null }),
      });
    });

    it('should handle TOTP verification failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: 'Invalid token',
        }),
      });

      await expect(mfaService.verifyTOTP('000000')).rejects.toThrow(
        'Invalid token'
      );
    });
  });

  describe('SMS Management', () => {
    it('should setup SMS MFA successfully', async () => {
      const mockResponse = { success: true, message: 'SMS setup complete' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const result = await mfaService.setupSMS('+1234567890');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/mfa/sms/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: '+1234567890' }),
      });
    });

    it('should send SMS verification code', async () => {
      const mockResponse = { success: true, message: 'Code sent' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const result = await mfaService.sendSMSCode();

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/mfa/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: null }),
      });
    });
  });

  describe('Email Management', () => {
    it('should setup email MFA successfully', async () => {
      const mockResponse = { success: true, message: 'Email MFA enabled' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const result = await mfaService.setupEmail('test@example.com');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/mfa/email/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
    });

    it('should verify email code correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, verified: true }),
      });

      const result = await mfaService.verifyEmail('123456');

      expect(result.verified).toBe(true);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/mfa/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: '123456', sessionId: null }),
      });
    });
  });

  describe('Backup Codes', () => {
    it('should generate backup codes successfully', async () => {
      const mockCodes = ['123456', '789012', '345678', '901234', '567890'];
      const mockResponse = { success: true, backupCodes: mockCodes };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const result = await mfaService.generateBackupCodes();

      expect(result.backupCodes).toEqual(mockCodes);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/mfa/backup-codes/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
    });

    it('should use backup code for verification', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, verified: true }),
      });

      const result = await mfaService.useBackupCode('123456');

      expect(result.verified).toBe(true);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/mfa/backup-codes/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: '123456', sessionId: null }),
      });
    });
  });

  describe('MFA Status and Management', () => {
    it('should get MFA status correctly', async () => {
      const mockStatus = {
        enabled: true,
        methods: ['totp', 'sms'],
        recoveryCodesRemaining: 3,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockStatus),
      });

      const result = await mfaService.getMFAStatus();

      expect(result).toEqual(mockStatus);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/mfa/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should disable MFA method successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      const result = await mfaService.disableMFA('totp');

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method: 'totp', confirmationCode: null }),
      });
    });

    it('should challenge MFA during login', async () => {
      const mockChallenge = {
        challengeId: 'abc123',
        availableMethods: ['totp', 'sms'],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockChallenge),
      });

      const result = await mfaService.challengeMFA('user123');

      expect(result).toEqual(mockChallenge);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/mfa/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: 'user123', method: null }),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(mfaService.getMFAStatus()).rejects.toThrow('Network error');
    });

    it('should handle API errors with proper error messages', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          message: 'MFA not enabled',
        }),
      });

      await expect(mfaService.verifyTOTP('123456')).rejects.toThrow(
        'MFA not enabled'
      );
    });

    it('should handle invalid JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
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
        writable: true,
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      await serviceWithToken.getMFAStatus();

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/mfa/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
      });
    });
  });
});
