import { useCallback, useState, useEffect } from 'react';
import securityService from '../services/securityService';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RateLimitOptions {
  identifier?: string | null;
  action?: string;
  maxAttempts?: number;
  windowMs?: number;
  autoDetectIP?: boolean;
}

interface RateLimitStatus {
  allowed: boolean;
  attemptsRemaining: number;
  remainingTime: number;
  reason: string | null;
  error?: string;
}

interface UseRateLimitReturn {
  rateLimitStatus: RateLimitStatus;
  isLoading: boolean;
  isBlocked: boolean;
  isNearLimit: boolean;
  clientIP: string | null;
  checkRateLimit: () => Promise<RateLimitStatus>;
  recordAttempt: (success?: boolean) => Promise<boolean>;
  executeWithRateLimit: <T>(
    actionFn: () => Promise<T>
  ) => Promise<
    | { success: true; data: T; rateLimitStatus: RateLimitStatus }
    | { success: false; error: string; rateLimitStatus: RateLimitStatus }
  >;
  resetRateLimit: () => Promise<boolean>;
  getFormattedRemainingTime: () => string;
  attemptsRemaining: number;
  remainingTime: number;
  formattedRemainingTime: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useRateLimit = (
  options: RateLimitOptions = {}
): UseRateLimitReturn => {
  const {
    identifier = null,
    action = 'default',
    maxAttempts = 5,
    windowMs = 60000,
    autoDetectIP = true
  } = options;

  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus>({
    allowed: true,
    attemptsRemaining: maxAttempts,
    remainingTime: 0,
    reason: null
  });

  const [clientIP, setClientIP] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const detectClientIP = useCallback(async (): Promise<string> => {
    if (!autoDetectIP && clientIP) return clientIP;

    try {
      if (import.meta.env.MODE === 'development') {
        const defaultIP = '127.0.0.1';
        setClientIP(defaultIP);
        return defaultIP;
      }
      const response = await fetch('/api/auth/client-ip');
      const data = (await response.json()) as { ip?: string };
      const detected = data.ip ?? '127.0.0.1';
      setClientIP(detected);
      return detected;
    } catch (_err) {
      const fallback = '127.0.0.1';
      setClientIP(fallback);
      return fallback;
    }
  }, [autoDetectIP, clientIP]);

  const checkRateLimit = useCallback(async (): Promise<RateLimitStatus> => {
    try {
      setIsLoading(true);
      const targetIdentifier = identifier ?? (await detectClientIP());
      const status = (
        securityService as {
          checkRateLimit(
            id: string,
            action: string,
            max: number,
            window: number
          ): RateLimitStatus;
        }
      ).checkRateLimit(targetIdentifier, action, maxAttempts, windowMs);
      setRateLimitStatus(status);
      return status;
    } catch (e) {
      const fallback: RateLimitStatus = {
        allowed: true,
        attemptsRemaining: 1,
        remainingTime: 0,
        reason: null,
        error: (e as Error).message
      };
      setRateLimitStatus(fallback);
      return fallback;
    } finally {
      setIsLoading(false);
    }
  }, [identifier, action, maxAttempts, windowMs, detectClientIP]);

  const recordAttempt = useCallback(
    async (success = false): Promise<boolean> => {
      try {
        const targetIdentifier = identifier ?? (await detectClientIP());
        (
          securityService as unknown as {
            recordAttempt(id: string, action: string, success: boolean): void;
          }
        ).recordAttempt(targetIdentifier, action, success);
        await checkRateLimit();
        return true;
      } catch (_err) {
        return false;
      }
    },
    [identifier, action, checkRateLimit, detectClientIP]
  );

  const executeWithRateLimit = useCallback(
    async <T>(actionFn: () => Promise<T>) => {
      try {
        const status = await checkRateLimit();
        if (!status.allowed) {
          throw new Error(
            `Rate limit exceeded: ${status.reason}. Try again in ${status.remainingTime}s.`
          );
        }
        try {
          const data = await actionFn();
          await recordAttempt(true);
          return { success: true as const, data, rateLimitStatus: status };
        } catch (actionError) {
          await recordAttempt(false);
          throw actionError;
        }
      } catch (e) {
        return {
          success: false as const,
          error: (e as Error).message,
          rateLimitStatus
        };
      }
    },
    [checkRateLimit, recordAttempt, rateLimitStatus]
  );

  const resetRateLimit = useCallback(async (): Promise<boolean> => {
    try {
      const targetIdentifier = identifier ?? (await detectClientIP());
      (
        securityService as unknown as {
          rateLimits: Map<string, unknown>;
        }
      ).rateLimits.delete(`${targetIdentifier}:${action}`);
      await checkRateLimit();
      return true;
    } catch (_err) {
      return false;
    }
  }, [identifier, action, checkRateLimit, detectClientIP]);

  const getFormattedRemainingTime = useCallback((): string => {
    if (rateLimitStatus.remainingTime <= 0) return '';
    const minutes = Math.floor(rateLimitStatus.remainingTime / 60);
    const seconds = rateLimitStatus.remainingTime % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }, [rateLimitStatus.remainingTime]);

  const isBlocked = !rateLimitStatus.allowed;
  const isNearLimit =
    rateLimitStatus.attemptsRemaining <= 1 && rateLimitStatus.allowed;

  useEffect(() => {
    checkRateLimit();
  }, [checkRateLimit]);

  useEffect(() => {
    if (!isBlocked) return;
    const interval = setInterval(checkRateLimit, 1000);
    return () => clearInterval(interval);
  }, [isBlocked, checkRateLimit]);

  return {
    rateLimitStatus,
    isLoading,
    isBlocked,
    isNearLimit,
    clientIP,
    checkRateLimit,
    recordAttempt,
    executeWithRateLimit,
    resetRateLimit,
    getFormattedRemainingTime,
    attemptsRemaining: rateLimitStatus.attemptsRemaining,
    remainingTime: rateLimitStatus.remainingTime,
    formattedRemainingTime: getFormattedRemainingTime()
  };
};

export const useLoginRateLimit = (userIdentifier: string | null = null) =>
  useRateLimit({
    identifier: userIdentifier,
    action: 'login',
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000
  });

export const useMFARateLimit = (userIdentifier: string | null = null) =>
  useRateLimit({
    identifier: userIdentifier,
    action: 'mfa',
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000
  });

export const useAPIRateLimit = (endpoint = 'api') =>
  useRateLimit({ action: endpoint, maxAttempts: 60, windowMs: 60 * 1000 });

export const usePasswordResetRateLimit = (
  userIdentifier: string | null = null
) =>
  useRateLimit({
    identifier: userIdentifier,
    action: 'password_reset',
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000
  });

export default useRateLimit;
