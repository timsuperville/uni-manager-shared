/**
 * Rate Limiting Hook
 *
 * Provides React hook for integrating rate limiting into components
 * Handles authentication attempts, API calls, and user actions
 */

/* global console, process, fetch, setInterval, clearInterval */

import { useState, useCallback, useEffect } from "react";
import securityService from "../services/securityService";

/**
 * Hook for rate limiting functionality
 * @param {Object} options - Configuration options
 * @returns {Object} Rate limiting state and functions
 */
export const useRateLimit = (options = {}) => {
  const {
    identifier = null, // IP address or user ID
    action = "default", // Type of action being rate limited
    maxAttempts = 5,
    windowMs = 60000, // 1 minute
    autoDetectIP = true,
  } = options;

  const [rateLimitStatus, setRateLimitStatus] = useState({
    allowed: true,
    attemptsRemaining: maxAttempts,
    remainingTime: 0,
    reason: null,
  });

  const [clientIP, setClientIP] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Detect client IP address
   */
  const detectClientIP = useCallback(async () => {
    if (!autoDetectIP || clientIP) return clientIP;

    try {
      // In development, use a default IP
      if (process.env.NODE_ENV === "development") {
        const defaultIP = "127.0.0.1";
        setClientIP(defaultIP);
        return defaultIP;
      }

      // In production, you would implement actual IP detection
      // This could be done via API call to your backend
      const response = await fetch("/api/auth/client-ip");
      const data = await response.json();
      const detectedIP = data.ip || "127.0.0.1";
      setClientIP(detectedIP);
      return detectedIP;
    } catch (error) {
      console.error("Error detecting client IP:", error);
      const fallbackIP = "127.0.0.1";
      setClientIP(fallbackIP);
      return fallbackIP;
    }
  }, [autoDetectIP, clientIP]);

  /**
   * Check rate limit status
   */
  const checkRateLimit = useCallback(async () => {
    try {
      setIsLoading(true);

      const targetIdentifier = identifier || (await detectClientIP());

      const status = securityService.checkRateLimit(
        targetIdentifier,
        action,
        maxAttempts,
        windowMs
      );

      setRateLimitStatus(status);
      return status;
    } catch (error) {
      console.error("Error checking rate limit:", error);
      // Fail open - allow the action if there's an error
      const fallbackStatus = {
        allowed: true,
        attemptsRemaining: 1,
        remainingTime: 0,
        reason: null,
        error: error.message,
      };
      setRateLimitStatus(fallbackStatus);
      return fallbackStatus;
    } finally {
      setIsLoading(false);
    }
  }, [identifier, action, maxAttempts, windowMs, detectClientIP]);

  /**
   * Record an attempt
   */
  const recordAttempt = useCallback(
    async (success = false) => {
      try {
        const targetIdentifier = identifier || (await detectClientIP());

        securityService.recordAttempt(targetIdentifier, action, success);

        // Update rate limit status after recording
        await checkRateLimit();

        return true;
      } catch (error) {
        console.error("Error recording attempt:", error);
        return false;
      }
    },
    [identifier, action, checkRateLimit, detectClientIP]
  );

  /**
   * Execute an action with rate limiting
   */
  const executeWithRateLimit = useCallback(
    async (actionFunction) => {
      try {
        // Check rate limit first
        const status = await checkRateLimit();

        if (!status.allowed) {
          throw new Error(
            `Rate limit exceeded: ${status.reason}. Try again in ${status.remainingTime} seconds.`
          );
        }

        // Execute the action
        try {
          const result = await actionFunction();

          // Record successful attempt
          await recordAttempt(true);

          return {
            success: true,
            data: result,
            rateLimitStatus: status,
          };
        } catch (actionError) {
          // Record failed attempt
          await recordAttempt(false);

          throw actionError;
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
          rateLimitStatus,
        };
      }
    },
    [checkRateLimit, recordAttempt, rateLimitStatus]
  );

  /**
   * Reset rate limit for current identifier
   */
  const resetRateLimit = useCallback(async () => {
    try {
      const targetIdentifier = identifier || (await detectClientIP());

      // Clear rate limit data for this identifier
      securityService.rateLimits.delete(`${targetIdentifier}:${action}`);

      // Update status
      await checkRateLimit();

      return true;
    } catch (error) {
      console.error("Error resetting rate limit:", error);
      return false;
    }
  }, [identifier, action, checkRateLimit, detectClientIP]);

  /**
   * Get remaining time in human-readable format
   */
  const getFormattedRemainingTime = useCallback(() => {
    if (rateLimitStatus.remainingTime <= 0) return "";

    const minutes = Math.floor(rateLimitStatus.remainingTime / 60);
    const seconds = rateLimitStatus.remainingTime % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [rateLimitStatus.remainingTime]);

  /**
   * Check if action is currently blocked
   */
  const isBlocked = rateLimitStatus.allowed === false;

  /**
   * Check if close to rate limit
   */
  const isNearLimit =
    rateLimitStatus.attemptsRemaining <= 1 && rateLimitStatus.allowed;

  /**
   * Initialize rate limit check on mount
   */
  useEffect(() => {
    checkRateLimit();
  }, [checkRateLimit]);

  /**
   * Auto-refresh status when blocked
   */
  useEffect(() => {
    if (!isBlocked) return;

    const refreshInterval = setInterval(() => {
      checkRateLimit();
    }, 1000); // Check every second when blocked

    return () => clearInterval(refreshInterval);
  }, [isBlocked, checkRateLimit]);

  return {
    // Status
    rateLimitStatus,
    isLoading,
    isBlocked,
    isNearLimit,
    clientIP,

    // Actions
    checkRateLimit,
    recordAttempt,
    executeWithRateLimit,
    resetRateLimit,

    // Utilities
    getFormattedRemainingTime,

    // Computed values
    attemptsRemaining: rateLimitStatus.attemptsRemaining,
    remainingTime: rateLimitStatus.remainingTime,
    formattedRemainingTime: getFormattedRemainingTime(),
  };
};

/**
 * Hook specifically for login rate limiting
 */
export const useLoginRateLimit = (userIdentifier = null) => {
  return useRateLimit({
    identifier: userIdentifier,
    action: "login",
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Hook specifically for MFA rate limiting
 */
export const useMFARateLimit = (userIdentifier = null) => {
  return useRateLimit({
    identifier: userIdentifier,
    action: "mfa",
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook specifically for API rate limiting
 */
export const useAPIRateLimit = (endpoint = "api") => {
  return useRateLimit({
    action: endpoint,
    maxAttempts: 60,
    windowMs: 60 * 1000, // 1 minute
  });
};

/**
 * Hook for password reset rate limiting
 */
export const usePasswordResetRateLimit = (userIdentifier = null) => {
  return useRateLimit({
    identifier: userIdentifier,
    action: "password_reset",
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  });
};

export default useRateLimit;
