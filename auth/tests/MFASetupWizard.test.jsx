import { MFAService } from "../services/mfaService.js";

// Mock fetch globally
global.fetch = vi.fn();

describe("MFA Integration Tests", () => {
  let mfaService;

  beforeEach(() => {
    mfaService = new MFAService();
    vi.clearAllMocks();
  });

  describe("MFA Setup Flow Integration", () => {
    it("should complete TOTP setup flow successfully", async () => {
      // Mock TOTP setup
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          secret: "ABCD1234EFGH5678",
          qrCodeUrl: "data:image/png;base64,test",
        }),
      });

      const setupResult = await mfaService.setupTOTP("test@example.com");
      expect(setupResult.success).toBe(true);
      expect(setupResult.secret).toBeDefined();

      // Mock TOTP verification
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          verified: true,
        }),
      });

      const verifyResult = await mfaService.verifyTOTP("123456");
      expect(verifyResult.verified).toBe(true);

      // Mock backup codes generation
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          backupCodes: ["123456", "789012", "345678", "901234", "567890"],
        }),
      });

      const backupResult = await mfaService.generateBackupCodes();
      expect(backupResult.backupCodes).toHaveLength(5);
    });

    it("should complete SMS setup flow successfully", async () => {
      // Mock SMS setup
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          message: "SMS setup complete",
        }),
      });

      const setupResult = await mfaService.setupSMS("+1234567890");
      expect(setupResult.success).toBe(true);

      // Mock SMS code sending
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          message: "Code sent",
        }),
      });

      const sendResult = await mfaService.sendSMSCode();
      expect(sendResult.success).toBe(true);

      // Mock SMS verification
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          verified: true,
        }),
      });

      const verifyResult = await mfaService.verifySMS("123456");
      expect(verifyResult.verified).toBe(true);
    });

    it("should complete email setup flow successfully", async () => {
      // Mock email setup
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          message: "Email MFA enabled",
        }),
      });

      const setupResult = await mfaService.setupEmail("test@example.com");
      expect(setupResult.success).toBe(true);

      // Mock email code sending
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          message: "Verification email sent",
        }),
      });

      const sendResult = await mfaService.sendEmailCode();
      expect(sendResult.success).toBe(true);

      // Mock email verification
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          verified: true,
        }),
      });

      const verifyResult = await mfaService.verifyEmail("123456");
      expect(verifyResult.verified).toBe(true);
    });
  });

  describe("MFA Login Flow Integration", () => {
    it("should handle MFA challenge and verification during login", async () => {
      // Mock MFA challenge
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          challengeId: "abc123",
          availableMethods: ["totp", "sms"],
          requiresMFA: true,
        }),
      });

      const challengeResult = await mfaService.challengeMFA("user123");
      expect(challengeResult.requiresMFA).toBe(true);
      expect(challengeResult.availableMethods).toContain("totp");

      // Mock MFA verification
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          verified: true,
          token: "auth-token-123",
        }),
      });

      const verifyResult = await mfaService.verifyMFAChallenge(
        challengeResult.challengeId,
        "totp",
        "123456",
      );
      expect(verifyResult.verified).toBe(true);
      expect(verifyResult.token).toBeDefined();
    });

    it("should handle backup code usage during login", async () => {
      // Mock backup code verification
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          verified: true,
          codesRemaining: 2,
        }),
      });

      const result = await mfaService.useBackupCode("123456");
      expect(result.verified).toBe(true);
      expect(result.codesRemaining).toBe(2);
    });
  });

  describe("MFA Management Integration", () => {
    it("should get comprehensive MFA status", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          enabled: true,
          methods: ["totp", "sms"],
          recoveryCodesRemaining: 3,
          lastUsed: "2024-01-15T10:00:00Z",
          setupDate: "2024-01-01T12:00:00Z",
        }),
      });

      const status = await mfaService.getMFAStatus();
      expect(status.enabled).toBe(true);
      expect(status.methods).toHaveLength(2);
      expect(status.recoveryCodesRemaining).toBe(3);
    });

    it("should disable MFA methods correctly", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          remainingMethods: ["sms"],
        }),
      });

      const result = await mfaService.disableMFA("totp");
      expect(result.success).toBe(true);
      expect(result.remainingMethods).toContain("sms");
    });
  });

  describe("Error Recovery Integration", () => {
    it("should handle MFA setup failures gracefully", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: "Invalid phone number format",
        }),
      });

      await expect(mfaService.setupSMS("invalid-phone")).rejects.toThrow(
        "Invalid phone number format",
      );
    });

    it("should handle verification failures with retry information", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          message: "Invalid code",
          attemptsRemaining: 2,
        }),
      });

      await expect(mfaService.verifyTOTP("000000")).rejects.toThrow(
        "Invalid code",
      );
    });

    it("should handle account lockout scenarios", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          message: "Account temporarily locked",
          lockoutUntil: "2024-01-15T11:00:00Z",
        }),
      });

      await expect(mfaService.verifyTOTP("123456")).rejects.toThrow(
        "Account temporarily locked",
      );
    });
  });
});
