import { useCallback, useState, useEffect } from "react";
import { useAuth } from "./useAuth.ts";
// removed authService import
import { getApiBaseUrl } from "../../api/config/apiConfig.ts";
import type { Session, SecurityAlert } from "../types/auth.types.ts";

const API_URL = getApiBaseUrl() as string;

// ── useSessionManagement ──────────────────────────────────────────────────────

interface UseSessionManagementReturn {
  currentSession: Session | null;
  sessionStatus: string;
  deviceFingerprint: string;
  invalidateSession: () => Promise<void>;
  isActive: boolean;
  isExpired: boolean;
}

export function useSessionManagement(): UseSessionManagementReturn {
  const { session, logout } = useAuth() as unknown as {
    session: Session | null | undefined;
    logout: () => Promise<void | { success: boolean }>;
  };
  const [sessionStatus, setSessionStatus] = useState("active");

  const generateDeviceFingerprint = useCallback(
    () => `device_${Math.random().toString(36).substring(7)}`,
    [],
  );
  const [deviceFingerprint] = useState<string>(() =>
    generateDeviceFingerprint(),
  );

  const invalidateSession = useCallback(async (): Promise<void> => {
    try {
      setSessionStatus("invalidated");
      const { getApiClient } = await import("../../api/index.ts");
      const AuthService = (await import("../services/AuthService.ts")).default;
      const authService = new AuthService(getApiClient());
      await authService.logout();
      if (logout) await logout();
    } catch (err) {
      if (import.meta.env.DEV)
        console.error("Failed to invalidate session:", err);
    }
  }, [logout]);

  return {
    currentSession: session ?? null,
    sessionStatus,
    deviceFingerprint,
    invalidateSession,
    isActive: sessionStatus === "active" && !!session,
    isExpired: sessionStatus === "expired",
  };
}

// ── useUserSessions ───────────────────────────────────────────────────────────

interface SessionRecord {
  id: string;
  status: string;
  [key: string]: unknown;
}

interface UseUserSessionsReturn {
  userSessions: SessionRecord[];
  loading: boolean;
  invalidateAllSessions: () => Promise<void>;
  invalidateSpecificSession: (sessionId: string) => Promise<void>;
  activeSessionCount: number;
  totalSessionCount: number;
}

export function useUserSessions(userId: string | null): UseUserSessionsReturn {
  const { token } = useAuth();
  const [userSessions, setUserSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !token) return;
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/auth/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = (await response.json()) as {
            sessions?: SessionRecord[];
          };
          setUserSessions(data.sessions ?? []);
        }
      } catch (err) {
        if (import.meta.env.DEV)
          console.error("Failed to fetch user sessions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [userId, token]);

  const invalidateAllSessions = useCallback(async (): Promise<void> => {
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
      if (import.meta.env.DEV)
        console.error("Failed to invalidate all sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const invalidateSpecificSession = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        if (token) {
          await fetch(`${API_URL}/auth/sessions/${sessionId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        setUserSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } catch (err) {
        if (import.meta.env.DEV)
          console.error("Failed to invalidate session:", err);
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

// ── useSessionSecurity ────────────────────────────────────────────────────────

interface UseSessionSecurityReturn {
  securityStatus: string;
  securityAlerts: SecurityAlert[];
  hasAlerts: boolean;
  clearSecurityAlerts: () => void;
}

export function useSessionSecurity(
  sessionId: string | null,
): UseSessionSecurityReturn {
  const { token } = useAuth();
  const [securityStatus, setSecurityStatus] = useState("secure");
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);

  useEffect(() => {
    if (!sessionId || !token) return;
    const checkSecurity = async () => {
      try {
        const response = await fetch(
          `${API_URL}/auth/sessions/${sessionId}/security`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.ok) {
          const data = (await response.json()) as {
            status?: string;
            alerts?: SecurityAlert[];
          };
          setSecurityStatus(data.status ?? "secure");
          setSecurityAlerts(data.alerts ?? []);
        } else {
          setSecurityStatus("secure");
          setSecurityAlerts([]);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error("Security check failed:", err);
        setSecurityStatus("warning");
      }
    };
    checkSecurity();
  }, [sessionId, token]);

  const clearSecurityAlerts = useCallback(() => setSecurityAlerts([]), []);

  return {
    securityStatus,
    securityAlerts,
    hasAlerts: securityAlerts.length > 0,
    clearSecurityAlerts,
  };
}

// ── useSessionAnalytics ───────────────────────────────────────────────────────

interface SessionAnalytics {
  totalSessions: number;
  activeSessions: number;
  avgSessionDuration: number;
  lastActivity: string | null;
}

interface UseSessionAnalyticsReturn {
  analytics: SessionAnalytics;
  loading: boolean;
}

export function useSessionAnalytics(
  userId: string | null,
  refreshInterval = 30000,
): UseSessionAnalyticsReturn {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<SessionAnalytics>({
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
          const data = (await response.json()) as SessionAnalytics;
          setAnalytics(data);
        }
      } catch (err) {
        if (import.meta.env.DEV)
          console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [userId, refreshInterval, token]);

  return { analytics, loading };
}

export default {
  useSessionManagement,
  useUserSessions,
  useSessionSecurity,
  useSessionAnalytics,
};
