import { useCallback, useState, useMemo } from 'react';
import { useAuth } from './useAuth';
import { MFAService } from '../services/mfaService';

// ── Types ─────────────────────────────────────────────────────────────────────

type MFAMethod = 'totp' | 'sms';

interface MFASetupResult {
  success?: boolean;
  [key: string]: unknown;
}

interface BackupCodesResult {
  backupCodes?: string[];
  [key: string]: unknown;
}

interface UseMFAReturn {
  mfaStatus: string | null;
  isLoading: boolean;
  error: string | null;
  backupCodes: string[];
  setupMFA: (
    method?: MFAMethod,
    identifier?: string | null
  ) => Promise<MFASetupResult>;
  verifyCode: (code: string, isSetup?: boolean) => Promise<unknown>;
  disableMFA: (method?: MFAMethod, code?: string | null) => Promise<void>;
  generateBackupCodes: () => Promise<BackupCodesResult>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Multi-Factor Authentication hook.
 * Handles setup, verification, backup codes, and MFA management.
 */
export function useMFA(): UseMFAReturn {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const mfaService = useMemo(() => new MFAService(token), [token]);

  const handleSetupMFA = useCallback(
    async (
      method: MFAMethod = 'totp',
      identifier: string | null = null
    ): Promise<MFASetupResult> => {
      setIsLoading(true);
      setError(null);
      try {
        let result: MFASetupResult;
        if (method === 'totp') {
          const targetEmail = identifier ?? user?.email;
          if (!targetEmail) throw new Error('Email is required for TOTP setup');
          result = (await mfaService.setupTOTP(targetEmail)) as MFASetupResult;
        } else if (method === 'sms') {
          if (!identifier)
            throw new Error('Phone number is required for SMS setup');
          result = (await mfaService.setupSMS(identifier)) as MFASetupResult;
        } else {
          throw new Error(`Unsupported MFA method: ${method}`);
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'MFA setup failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mfaService, user?.email]
  );

  const handleVerifyCode = useCallback(
    async (code: string, isSetup = false): Promise<unknown> => {
      setIsLoading(true);
      setError(null);
      try {
        let result: unknown;
        if (isSetup) {
          result = (await mfaService.verifyTOTPSetup(code)) as MFASetupResult;
          if ((result as MFASetupResult).success) {
            try {
              const codes =
                (await mfaService.generateBackupCodes()) as BackupCodesResult;
              setBackupCodes(codes.backupCodes ?? []);
            } catch (e) {
              if (import.meta.env.DEV) {
                console.warn('Failed to auto-generate backup codes', e);
              }
            }
          }
        } else {
          result = await mfaService.verifyTOTP(code);
        }
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Code verification failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mfaService]
  );

  const handleDisableMFA = useCallback(
    async (
      method: MFAMethod = 'totp',
      code: string | null = null
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await mfaService.disableMFA(method, code);
        setBackupCodes([]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to disable MFA';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mfaService]
  );

  const handleGenerateBackupCodes =
    useCallback(async (): Promise<BackupCodesResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const result =
          (await mfaService.generateBackupCodes()) as BackupCodesResult;
        setBackupCodes(result.backupCodes ?? []);
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to generate backup codes';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    }, [mfaService]);

  const extUser = user as typeof user & { mfaStatus?: string };

  return {
    mfaStatus: extUser?.mfaStatus ?? null,
    isLoading,
    error,
    backupCodes,
    setupMFA: handleSetupMFA,
    verifyCode: handleVerifyCode,
    disableMFA: handleDisableMFA,
    generateBackupCodes: handleGenerateBackupCodes
  };
}

export default useMFA;
