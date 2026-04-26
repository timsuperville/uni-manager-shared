import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import realTimeSecurityMonitoringService from "../services/realTimeSecurityMonitoringService";

// ── Types ─────────────────────────────────────────────────────────────────────

type SystemHealth = "initializing" | "healthy" | "disconnected" | "error";
type AlertSeverity = "low" | "medium" | "high" | "critical";

interface SecurityAlert {
  id: string;
  type: "threat" | "alert" | "anomaly";
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  actionRequired?: boolean;
  data?: unknown;
}

interface ThreatRecord {
  threatId: string;
  threatType: string;
  severity: AlertSeverity;
  timestamp: string;
  [key: string]: unknown;
}

interface MonitoringConfig {
  threatDetection: boolean;
  behaviorAnalysis: boolean;
  riskScoring: boolean;
  realTimeAlerts: boolean;
}

type SecurityServiceInstance = {
  initialize(userId: string, sessionId: string): Promise<{ success: boolean }>;
  on(event: string, handler: (data: unknown) => void): void;
  processSecurityEvent(event: unknown): Promise<void>;
  updateConfiguration(config: Partial<MonitoringConfig>): Promise<void>;
  destroy(): void;
};

interface RealTimeSecurityContextValue {
  isInitialized: boolean;
  isConnected: boolean;
  error: string | null;
  systemHealth: SystemHealth;
  riskScore: number;
  activeThreats: Map<string, ThreatRecord>;
  recentAlerts: SecurityAlert[];
  pendingNotifications: SecurityAlert[];
  monitoringConfig: MonitoringConfig;
  initializeSecurityMonitoring: (
    userId: string,
    sessionId: string,
  ) => Promise<void>;
  reportSecurityEvent: (event: unknown) => Promise<void>;
  dismissNotification: (notificationId: string) => void;
  updateMonitoringConfiguration: (
    config: Partial<MonitoringConfig>,
  ) => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const RealTimeSecurityContext =
  createContext<RealTimeSecurityContextValue | null>(null);

// ── RealTimeSecurityProvider ──────────────────────────────────────────────────

interface RealTimeSecurityProviderProps {
  children: React.ReactNode;
}

export function RealTimeSecurityProvider({
  children,
}: RealTimeSecurityProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] =
    useState<SystemHealth>("initializing");
  const [riskScore, setRiskScore] = useState(0);
  const [activeThreats, setActiveThreats] = useState(
    new Map<string, ThreatRecord>(),
  );
  const [recentAlerts, setRecentAlerts] = useState<SecurityAlert[]>([]);
  const [pendingNotifications, setPendingNotifications] = useState<
    SecurityAlert[]
  >([]);
  const [monitoringConfig, setMonitoringConfig] = useState<MonitoringConfig>({
    threatDetection: true,
    behaviorAnalysis: true,
    riskScoring: true,
    realTimeAlerts: true,
  });

  const securityServiceRef = useRef<SecurityServiceInstance | null>(null);

  const addAlert = useCallback((alert: SecurityAlert) => {
    setRecentAlerts((prev) => [alert, ...prev].slice(0, 20));
    if (
      alert.actionRequired ||
      alert.severity === "critical" ||
      alert.severity === "high"
    ) {
      setPendingNotifications((prev) => [alert, ...prev].slice(0, 20));
    }
  }, []);

  const setupEventHandlers = useCallback(() => {
    const service = securityServiceRef.current;
    if (!service) return;

    service.on("threatDetected", (raw) => {
      const threat = raw as ThreatRecord;
      setActiveThreats((prev) => new Map(prev).set(threat.threatId, threat));
      addAlert({
        id: threat.threatId,
        type: "threat",
        severity: threat.severity,
        message: `Threat detected: ${threat.threatType}`,
        timestamp: threat.timestamp,
        data: threat,
      });
    });

    service.on("securityAlert", (raw) => {
      const alert = raw as {
        alertId: string;
        severity: AlertSeverity;
        message: string;
        timestamp: string;
        actionRequired?: boolean;
      };
      addAlert({
        id: alert.alertId,
        type: "alert",
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp,
        actionRequired: alert.actionRequired,
        data: alert,
      });
    });

    service.on("riskScoreUpdated", (raw) => {
      const update = raw as { newRiskScore: number };
      setRiskScore(update.newRiskScore);
    });

    service.on("behaviorAnomaly", (raw) => {
      const anomaly = raw as {
        severity: AlertSeverity;
        anomalyType: string;
        timestamp: string;
      };
      addAlert({
        id: `anomaly_${Date.now()}`,
        type: "anomaly",
        severity: anomaly.severity,
        message: `Behavior anomaly detected: ${anomaly.anomalyType}`,
        timestamp: anomaly.timestamp,
        data: anomaly,
      });
    });

    service.on("connected", () => {
      setIsConnected(true);
      setSystemHealth("healthy");
    });
    service.on("disconnected", () => {
      setIsConnected(false);
      setSystemHealth("disconnected");
    });
    service.on("error", (raw) => {
      const err = raw as Error;
      setError(err.message);
      setSystemHealth("error");
    });
  }, [addAlert]);

  const initializeSecurityMonitoring = useCallback(
    async (userId: string, sessionId: string): Promise<void> => {
      try {
        setError(null);
        setSystemHealth("initializing");

        if (!securityServiceRef.current) {
          securityServiceRef.current = (
            realTimeSecurityMonitoringService as unknown as () => SecurityServiceInstance
          )();
        }

        const result = await securityServiceRef.current.initialize(
          userId,
          sessionId,
        );
        if (result.success) {
          setIsInitialized(true);
          setIsConnected(true);
          setSystemHealth("healthy");
          setupEventHandlers();
        } else {
          throw new Error("Failed to initialize security monitoring");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Initialization failed";
        setError(message);
        setSystemHealth("error");
        if (import.meta.env.DEV)
          console.error("Security monitoring initialization failed:", err);
      }
    },
    [setupEventHandlers],
  );

  const reportSecurityEvent = useCallback(
    async (event: unknown): Promise<void> => {
      if (!isConnected || !securityServiceRef.current) {
        if (import.meta.env.DEV)
          console.warn("Cannot report security event: service not connected");
        return;
      }
      try {
        await securityServiceRef.current.processSecurityEvent(event);
      } catch (err) {
        if (import.meta.env.DEV)
          console.error("Failed to report security event:", err);
      }
    },
    [isConnected],
  );

  const dismissNotification = useCallback((notificationId: string): void => {
    setPendingNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId),
    );
  }, []);

  const updateMonitoringConfiguration = useCallback(
    async (config: Partial<MonitoringConfig>): Promise<void> => {
      if (!securityServiceRef.current) return;
      try {
        await securityServiceRef.current.updateConfiguration(config);
        setMonitoringConfig((prev) => ({ ...prev, ...config }));
      } catch (err) {
        if (import.meta.env.DEV)
          console.error("Failed to update monitoring configuration:", err);
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      securityServiceRef.current?.destroy();
    };
  }, []);

  const contextValue: RealTimeSecurityContextValue = {
    isInitialized,
    isConnected,
    error,
    systemHealth,
    riskScore,
    activeThreats,
    recentAlerts,
    pendingNotifications,
    monitoringConfig,
    initializeSecurityMonitoring,
    reportSecurityEvent,
    dismissNotification,
    updateMonitoringConfiguration,
  };

  return (
    <RealTimeSecurityContext.Provider value={contextValue}>
      {children}
    </RealTimeSecurityContext.Provider>
  );
}

// ── useRealTimeSecurity ───────────────────────────────────────────────────────

export function useRealTimeSecurity(): RealTimeSecurityContextValue {
  const context = useContext(RealTimeSecurityContext);
  if (!context) {
    throw new Error(
      "useRealTimeSecurity must be used within a RealTimeSecurityProvider",
    );
  }
  return context;
}

export default RealTimeSecurityProvider;
