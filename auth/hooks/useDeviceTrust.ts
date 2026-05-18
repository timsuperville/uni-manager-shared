import { useCallback, useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { MFAService } from '../services/mfaService';
import { generateDeviceFingerprint, getDeviceInfo } from '../utils/socialAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UseDeviceTrustReturn {
  deviceFingerprint: string | null;
  isTrusted: boolean;
  isLoading: boolean;
  error: string | null;
  trustDevice: () => Promise<void>;
  untrustDevice: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Handles device fingerprinting, trust status verification, and trust management.
 */
export function useDeviceTrust(): UseDeviceTrustReturn {
  const { token } = useAuth();
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(
    null
  );
  const [isTrusted, setIsTrusted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mfaService = useMemo(() => new MFAService(token), [token]);

  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const fingerprint = await generateDeviceFingerprint();
        setDeviceFingerprint(fingerprint as string);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Failed to generate fingerprint:', err);
        }
        setError('Failed to generate device ID');
      }
    };
    initFingerprint();
  }, []);

  useEffect(() => {
    if (!deviceFingerprint || !token) {
      setIsLoading(false);
      return;
    }

    const checkTrust = async () => {
      try {
        const result = (await mfaService.checkDeviceTrust(
          deviceFingerprint
        )) as { isTrusted: boolean };
        setIsTrusted(result.isTrusted);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Failed to check device trust:', err);
        }
        // Don't set error to avoid blocking UI — just assume untrusted
        setIsTrusted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTrust();
  }, [deviceFingerprint, token, mfaService]);

  const trustDevice = useCallback(async (): Promise<void> => {
    if (!deviceFingerprint) return;

    setIsLoading(true);
    setError(null);
    try {
      const deviceInfo = {
        fingerprint: deviceFingerprint,
        ...(getDeviceInfo() as object)
      };
      await mfaService.addTrustedDevice(deviceInfo);
      setIsTrusted(true);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to trust device:', err);
      }
      const message =
        err instanceof Error ? err.message : 'Failed to trust device';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [deviceFingerprint, mfaService]);

  const untrustDevice = useCallback(async (): Promise<void> => {
    if (!deviceFingerprint) return;

    setIsLoading(true);
    setError(null);
    try {
      await mfaService.removeTrustedDevice(deviceFingerprint);
      setIsTrusted(false);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to untrust device:', err);
      }
      const message =
        err instanceof Error ? err.message : 'Failed to untrust device';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [deviceFingerprint, mfaService]);

  return {
    deviceFingerprint,
    isTrusted,
    isLoading,
    error,
    trustDevice,
    untrustDevice
  };
}

export default useDeviceTrust;
