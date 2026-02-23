/**
 * useMFA - Multi-Factor Authentication Hook
 *
 * Specialized hook for MFA operations.
 * Handles setup, verification, backup codes, and management.
 *
 * @module hooks/useMFA
 * @example
 * const { mfaStatus, setupMFA, verifyCode, backupCodes } = useMFA();
 */

/* global console */

import { useCallback, useState, useMemo } from "react";
import { useAuth } from "./useAuth.js";
import { MFAService } from "../services/mfaService.js";

/**
 * @typedef {Object} UseMFAReturn
 * @property {string|null} mfaStatus - Current MFA status
 * @property {boolean} isLoading - Is MFA operation in progress
 * @property {string|null} error - Error message
 * @property {Function} setupMFA - Start MFA setup (returns prompt data like QR code)
 * @property {Function} verifyCode - Verify MFA code for setup or auth
 * @property {Function} disableMFA - Disable MFA
 * @property {Function} generateBackupCodes - Generate backup codes
 * @property {string[]} backupCodes - Backup codes for recovery
 */

/**
 * MFA hook
 *
 * @returns {UseMFAReturn} MFA state and methods
 */
export function useMFA() {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backupCodes, setBackupCodes] = useState([]);

  // Create service instance with current token
  const mfaService = useMemo(() => new MFAService(token), [token]);

  /**
   * Setup MFA
   * @param {string} method - MFA method (totp, sms, etc.)
   * @param {string} identifier - Email or phone number
   */
  const handleSetupMFA = useCallback(
    async (method = "totp", identifier = null) => {
      setIsLoading(true);
      setError(null);

      try {
        let result;
        if (method === "totp") {
          const targetEmail = identifier || user?.email;
          if (!targetEmail) throw new Error("Email is required for TOTP setup");
          result = await mfaService.setupTOTP(targetEmail);
        } else if (method === "sms") {
          if (!identifier)
            throw new Error("Phone number is required for SMS setup");
          result = await mfaService.setupSMS(identifier);
        } else {
          throw new Error(`Unsupported MFA method: ${method}`);
        }
        return result;
      } catch (err) {
        setError(err.message || "MFA setup failed");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mfaService, user?.email],
  );

  /**
   * Verify MFA code
   * @param {string} code - Verification code
   * @param {boolean} isSetup - Whether this is verification during setup
   */
  const handleVerifyCode = useCallback(
    async (code, isSetup = false) => {
      setIsLoading(true);
      setError(null);

      try {
        let result;
        if (isSetup) {
          result = await mfaService.verifyTOTPSetup(code);
          // If setup verified, we might want to generate backup codes automatically
          if (result.success) {
            try {
              const codes = await mfaService.generateBackupCodes();
              setBackupCodes(codes.backupCodes || codes);
            } catch (e) {
              if (import.meta.env.DEV) {
                console.warn("Failed to auto-generate backup codes", e);
              }
            }
          }
        } else {
          result = await mfaService.verifyTOTP(code);
        }
        return result;
      } catch (err) {
        setError(err.message || "Code verification failed");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mfaService],
  );

  /**
   * Disable MFA
   */
  const handleDisableMFA = useCallback(
    async (method = "totp", code = null) => {
      setIsLoading(true);
      setError(null);

      try {
        await mfaService.disableMFA(method, code);
        setBackupCodes([]);
      } catch (err) {
        setError(err.message || "Failed to disable MFA");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mfaService],
  );

  /**
   * Generate Backup Codes explicitly
   */
  const handleGenerateBackupCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mfaService.generateBackupCodes();
      setBackupCodes(result.backupCodes || result);
      return result;
    } catch (err) {
      setError(err.message || "Failed to generate backup codes");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mfaService]);

  return {
    mfaStatus: user?.mfaStatus || null,
    isLoading,
    error,
    setupMFA: handleSetupMFA,
    verifyCode: handleVerifyCode,
    disableMFA: handleDisableMFA,
    generateBackupCodes: handleGenerateBackupCodes,
    backupCodes,
  };
}

export default useMFA;
