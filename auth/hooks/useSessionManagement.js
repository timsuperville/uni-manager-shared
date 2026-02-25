/**
 * Session Management Hooks
 *
 * Composite hooks for comprehensive session management functionality.
 * Exports four specialized hooks:
 * - useSessionManagement: Core session lifecycle management
 * - useUserSessions: User's active sessions tracking
 * - useSessionSecurity: Security monitoring and alerts
 * - useSessionAnalytics: Session analytics and statistics
 *
 * @module hooks/useSessionManagement
 */

/* global console, setInterval, clearInterval, fetch */

import { useCallback, useState, useEffect } from "react";
import { useAuth } from "./useAuth.js";
import { authService } from "../services/authService.js";

import { getApiBaseUrl } from "../../api/config/apiConfig.js";

// Canonical API base — resolved once at module init (same as other @shared services)
const API_URL = getApiBaseUrl();

/**
 * useSessionManagement Hook
 * Manages current session lifecycle and state
 *
 * @returns {Object} Session management methods and state
 */
export function useSessionManagement() {
  const { session, logout } = useAuth();
  const [sessionStatus, setSessionStatus] = useState("active");

  // Simulate device fingerprint
  const generateDeviceFingerprint = useCallback(() => {
    return `device_${Math.random().toString(36).substring(7)}`;
  }, []);

  const [deviceFingerprint] = useState(() => generateDeviceFingerprint());

  const invalidateSession = useCallback(async () => {
    try {
      setSessionStatus("invalidated");
      // Use authService to logout/invalidate current session
      await authService.logout();
      // Also trigger useAuth logout to update context
      if (logout) await logout();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to invalidate session:", err);
      }
    }
  }, [logout]);

  return {
    currentSession: session || null,
    sessionStatus,
    deviceFingerprint,
    invalidateSession,
    isActive: sessionStatus === "active" && !!session,
    isExpired: sessionStatus === "expired",
  };
}

/**
 * useUserSessions Hook
 * Tracks all user's active sessions
 *
 * @param {string} userId - User ID
 * @returns {Object} Sessions management methods and data
 */
export function useUserSessions(userId) {
  const { token } = useAuth();
  const [userSessions, setUserSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch user sessions on mount
  useEffect(() => {
    if (!userId || !token) return;

    const fetchSessions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/auth/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUserSessions(data.sessions || []);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Failed to fetch user sessions:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [userId, token]);

  const invalidateAllSessions = useCallback(async () => {
    try {
      setLoading(true);
      if (token) {
        await fetch(`${API_URL}/auth/sessions`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setUserSessions([]);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to invalidate all sessions:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const invalidateSpecificSession = useCallback(
    async (sessionId) => {
      try {
        if (token) {
          await fetch(`${API_URL}/auth/sessions/${sessionId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        setUserSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Failed to invalidate session:", err);
        }
      }
    },
    [token],
  );

  return {
    userSessions,
    loading,
    invalidateAllSessions,
    invalidateSpecificSession,
    activeSessionCount: userSessions.filter((s) => s.status === "active")
      .length,
    totalSessionCount: userSessions.length,
  };
}

/**
 * useSessionSecurity Hook
 * Monitors session security status and alerts
 *
 * @param {string} sessionId - Session ID to monitor
 * @returns {Object} Security status and methods
 */
export function useSessionSecurity(sessionId) {
  const { token } = useAuth();
  const [securityStatus, setSecurityStatus] = useState("secure");
  const [securityAlerts, setSecurityAlerts] = useState([]);

  useEffect(() => {
    if (!sessionId || !token) return;

    // Initialize security check
    const checkSecurity = async () => {
      try {
        const response = await fetch(
          `${API_URL}/auth/sessions/${sessionId}/security`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setSecurityStatus(data.status || "secure");
          setSecurityAlerts(data.alerts || []);
        } else {
          // Fallback default
          setSecurityStatus("secure");
          setSecurityAlerts([]);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Security check failed:", err);
        }
        setSecurityStatus("warning");
      }
    };

    checkSecurity();
  }, [sessionId, token]);

  const clearSecurityAlerts = useCallback(() => {
    setSecurityAlerts([]);
  }, []);

  return {
    securityStatus,
    securityAlerts,
    hasAlerts: securityAlerts.length > 0,
    clearSecurityAlerts,
  };
}

/**
 * useSessionAnalytics Hook
 * Provides session analytics and statistics
 *
 * @param {string} userId - User ID
 * @param {number} refreshInterval - Refresh interval in ms (default: 30000)
 * @returns {Object} Analytics data and state
 */
export function useSessionAnalytics(userId, refreshInterval = 30000) {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalSessions: 0,
    activeSessions: 0,
    avgSessionDuration: 0,
    lastActivity: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !token) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/auth/sessions/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Failed to fetch analytics:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    // Set up refresh interval
    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [userId, refreshInterval, token]);

  return {
    analytics,
    loading,
  };
}

export default {
  useSessionManagement,
  useUserSessions,
  useSessionSecurity,
  useSessionAnalytics,
};
