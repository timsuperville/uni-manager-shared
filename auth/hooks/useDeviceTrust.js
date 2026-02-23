/* global console */

/**
 * useDeviceTrust - Device Trust Management Hook
 * Handles device fingerprinting, trust, and verification
 */
import { useCallback, useState, useEffect, useMemo } from "react";
import { useAuth } from "./useAuth.js";
import { MFAService } from "../services/mfaService.js";
import {
  generateDeviceFingerprint,
  getDeviceInfo,
} from "../utils/socialAuth.js";

export function useDeviceTrust() {
  const { token } = useAuth();
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);
  const [isTrusted, setIsTrusted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize service
  const mfaService = useMemo(() => new MFAService(token), [token]);

  // Generate fingerprint on mount
  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const fingerprint = await generateDeviceFingerprint();
        setDeviceFingerprint(fingerprint);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Failed to generate fingerprint:", err);
        }
        setError("Failed to generate device ID");
      }
    };
    initFingerprint();
  }, []);

  // Check trust status when fingerprint is ready
  useEffect(() => {
    if (!deviceFingerprint || !token) {
      setIsLoading(false);
      return;
    }

    const checkTrust = async () => {
      try {
        const result = await mfaService.checkDeviceTrust(deviceFingerprint);
        setIsTrusted(result.isTrusted);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Failed to check device trust:", err);
        }
        // Don't set error here to avoid blocking UI, just assume untrusted
        setIsTrusted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTrust();
  }, [deviceFingerprint, token, mfaService]);

  const trustDevice = useCallback(async () => {
    if (!deviceFingerprint) return;

    setIsLoading(true);
    setError(null);
    try {
      const deviceInfo = {
        fingerprint: deviceFingerprint,
        ...getDeviceInfo(),
      };
      await mfaService.addTrustedDevice(deviceInfo);
      setIsTrusted(true);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to trust device:", err);
      }
      setError(err.message || "Failed to trust device");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [deviceFingerprint, mfaService]);

  const untrustDevice = useCallback(async () => {
    if (!deviceFingerprint) return;

    setIsLoading(true);
    setError(null);
    try {
      await mfaService.removeTrustedDevice(deviceFingerprint);
      setIsTrusted(false);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to untrust device:", err);
      }
      setError(err.message || "Failed to untrust device");
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
    untrustDevice,
  };
}

export default useDeviceTrust;
