/**
 * Session Management React Hook
 *
 * Provides React integration for session management features including:
 * - Session creation and validation
 * - Device tracking and fingerprinting
 * - Concurrent session management
 * - Security monitoring integration
 * - Real-time session status updates
 *
 * @module useSessionManagement
 */

/* global window, console, setInterval, clearInterval */

import { useState, useEffect, useCallback, useRef } from "react";
import sessionManagementService from "../services/sessionManagementService";

/**
 * Main session management hook
 */
export const useSessionManagement = () => {
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionStatus, setSessionStatus] = useState("inactive"); // inactive, active, expired, invalid
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);
  const sessionCheckInterval = useRef(null);

  /**
   * Create a new session
   */
  const createSession = useCallback(async (sessionData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await sessionManagementService.createSession(sessionData);

      if (result.success) {
        setCurrentSession({
          sessionId: result.sessionId,
          deviceFingerprint: result.deviceFingerprint,
          expiresAt: result.expiresAt,
          requiresAdditionalVerification: result.requiresAdditionalVerification,
        });
        setDeviceFingerprint(result.deviceFingerprint);
        setSessionStatus("active");

        // Start session monitoring
        startSessionMonitoring();

        return { success: true, session: result };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Validate current session
   */
  const validateCurrentSession = useCallback(async () => {
    if (!currentSession?.sessionId) {
      setSessionStatus("inactive");
      return false;
    }

    const result = sessionManagementService.validateSession(
      currentSession.sessionId
    );

    if (result.valid) {
      setSessionStatus("active");
      setCurrentSession((prev) => ({
        ...prev,
        ...result.session,
      }));
      return true;
    } else {
      setSessionStatus(
        result.reason === "session_expired" ? "expired" : "invalid"
      );
      setCurrentSession(null);
      stopSessionMonitoring();
      return false;
    }
  }, [currentSession?.sessionId]);

  /**
   * Invalidate current session
   */
  const invalidateSession = useCallback(
    (reason = "manual") => {
      if (currentSession?.sessionId) {
        sessionManagementService.invalidateSession(
          currentSession.sessionId,
          reason
        );
        setCurrentSession(null);
        setSessionStatus("inactive");
        stopSessionMonitoring();
      }
    },
    [currentSession?.sessionId]
  );

  /**
   * Start session monitoring
   */
  const startSessionMonitoring = useCallback(() => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }

    sessionCheckInterval.current = setInterval(() => {
      validateCurrentSession();
    }, 60000); // Check every minute
  }, [validateCurrentSession]);

  /**
   * Stop session monitoring
   */
  const stopSessionMonitoring = useCallback(() => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
  }, []);

  /**
   * Generate device fingerprint
   */
  const generateDeviceFingerprint = useCallback(async () => {
    try {
      const fingerprint =
        await sessionManagementService.generateDeviceFingerprint();
      setDeviceFingerprint(fingerprint);
      return fingerprint;
    } catch (err) {
      console.error("Error generating device fingerprint:", err);
      return null;
    }
  }, []);

  /**
   * Get session analytics
   */
  const getSessionAnalytics = useCallback((userId = null) => {
    return sessionManagementService.getSessionAnalytics(userId);
  }, []);

  // Listen for session expiry events
  useEffect(() => {
    const handleSessionExpired = () => {
      setSessionStatus("expired");
      setCurrentSession(null);
      stopSessionMonitoring();
    };

    window.addEventListener("sessionExpired", handleSessionExpired);

    return () => {
      window.removeEventListener("sessionExpired", handleSessionExpired);
      stopSessionMonitoring();
    };
  }, [stopSessionMonitoring]);

  // Validate session on mount if there's a current session
  useEffect(() => {
    if (currentSession?.sessionId) {
      validateCurrentSession();
    }
  }, []); // Only run on mount

  return {
    // Session state
    currentSession,
    sessionStatus,
    deviceFingerprint,
    loading,
    error,

    // Session actions
    createSession,
    validateCurrentSession,
    invalidateSession,
    generateDeviceFingerprint,
    getSessionAnalytics,

    // Session status helpers
    isActive: sessionStatus === "active",
    isExpired: sessionStatus === "expired",
    isInvalid: sessionStatus === "invalid",
    isInactive: sessionStatus === "inactive",
  };
};

/**
 * Hook for managing user sessions
 */
export const useUserSessions = (userId) => {
  const [userSessions, setUserSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load user sessions
   */
  const loadUserSessions = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const sessions = sessionManagementService.getUserSessions(userId);
      setUserSessions(sessions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Invalidate all user sessions except current
   */
  const invalidateAllSessions = useCallback(
    async (exceptSessionId = null) => {
      if (!userId) return { success: false, error: "No user ID provided" };

      try {
        const count = sessionManagementService.invalidateUserSessions(
          userId,
          exceptSessionId
        );
        await loadUserSessions(); // Refresh the list
        return { success: true, invalidatedCount: count };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [userId, loadUserSessions]
  );

  /**
   * Invalidate specific session
   */
  const invalidateSpecificSession = useCallback(
    async (sessionId, reason = "manual") => {
      try {
        sessionManagementService.invalidateSession(sessionId, reason);
        await loadUserSessions(); // Refresh the list
        return { success: true };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [loadUserSessions]
  );

  // Load sessions when userId changes
  useEffect(() => {
    loadUserSessions();
  }, [loadUserSessions]);

  return {
    userSessions,
    loading,
    error,
    loadUserSessions,
    invalidateAllSessions,
    invalidateSpecificSession,

    // Computed values
    activeSessionCount: userSessions.filter((s) => s.isActive).length,
    totalSessionCount: userSessions.length,
  };
};

/**
 * Hook for device session management
 */
export const useDeviceSessions = (deviceFingerprint) => {
  const [deviceSessions, setDeviceSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load device sessions
   */
  const loadDeviceSessions = useCallback(async () => {
    if (!deviceFingerprint) return;

    setLoading(true);
    setError(null);

    try {
      const sessions =
        sessionManagementService.getDeviceSessions(deviceFingerprint);
      setDeviceSessions(sessions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [deviceFingerprint]);

  // Load sessions when deviceFingerprint changes
  useEffect(() => {
    loadDeviceSessions();
  }, [loadDeviceSessions]);

  return {
    deviceSessions,
    loading,
    error,
    loadDeviceSessions,

    // Computed values
    activeSessionCount: deviceSessions.filter((s) => s.isActive).length,
    totalSessionCount: deviceSessions.length,
  };
};

/**
 * Hook for session security monitoring
 */
export const useSessionSecurity = (sessionId) => {
  const [securityStatus, setSecurityStatus] = useState("normal"); // normal, warning, suspicious
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Check session security
   */
  const checkSessionSecurity = useCallback(
    async (activityData = {}) => {
      if (!sessionId) return;

      setLoading(true);

      try {
        const result = sessionManagementService.detectSuspiciousActivity(
          sessionId,
          activityData
        );

        if (result.requiresReauth) {
          setSecurityStatus("suspicious");
          setSecurityAlerts((prev) => [
            ...prev,
            {
              timestamp: Date.now(),
              type: "requires_reauth",
              reason: result.reason,
              indicators: result.indicators,
            },
          ]);
        } else {
          setSecurityStatus("normal");
        }

        return result;
      } catch (err) {
        console.error("Error checking session security:", err);
        setSecurityStatus("warning");
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  /**
   * Clear security alerts
   */
  const clearSecurityAlerts = useCallback(() => {
    setSecurityAlerts([]);
    setSecurityStatus("normal");
  }, []);

  return {
    securityStatus,
    securityAlerts,
    loading,
    checkSessionSecurity,
    clearSecurityAlerts,

    // Security status helpers
    isNormal: securityStatus === "normal",
    hasWarning: securityStatus === "warning",
    isSuspicious: securityStatus === "suspicious",
    hasAlerts: securityAlerts.length > 0,
  };
};

/**
 * Hook for session analytics
 */
export const useSessionAnalytics = (userId = null, refreshInterval = 30000) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const analyticsInterval = useRef(null);

  /**
   * Load session analytics
   */
  const loadAnalytics = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      const data = sessionManagementService.getSessionAnalytics(userId);
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Start automatic refresh
   */
  const startAutoRefresh = useCallback(() => {
    if (analyticsInterval.current) {
      clearInterval(analyticsInterval.current);
    }

    analyticsInterval.current = setInterval(loadAnalytics, refreshInterval);
  }, [loadAnalytics, refreshInterval]);

  /**
   * Stop automatic refresh
   */
  const stopAutoRefresh = useCallback(() => {
    if (analyticsInterval.current) {
      clearInterval(analyticsInterval.current);
      analyticsInterval.current = null;
    }
  }, []);

  // Load analytics on mount and start auto-refresh
  useEffect(() => {
    loadAnalytics();
    if (refreshInterval > 0) {
      startAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [loadAnalytics, startAutoRefresh, stopAutoRefresh, refreshInterval]);

  return {
    analytics,
    loading,
    error,
    loadAnalytics,
    startAutoRefresh,
    stopAutoRefresh,
  };
};

export default useSessionManagement;
