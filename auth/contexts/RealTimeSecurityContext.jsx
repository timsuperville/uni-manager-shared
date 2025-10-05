/**
 * Real-time Security Monitoring Context
 *
 * React context provider for WebSocket-based security monitoring,
 * threat detection, and automated response capabilities
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import RealTimeSecurityMonitoringService from "../services/realTimeSecurityMonitoringService";

const RealTimeSecurityContext = createContext(null);

export const useRealTimeSecurity = () => {
  const context = useContext(RealTimeSecurityContext);
  if (!context) {
    throw new Error(
      "useRealTimeSecurity must be used within a RealTimeSecurityProvider"
    );
  }
  return context;
};

export const RealTimeSecurityProvider = ({ children }) => {
  // Core state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [securityService, setSecurityService] = useState(null);

  // Security monitoring state
  const [activeThreats, setActiveThreats] = useState(new Map());
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState("initializing");
  const [riskScore, setRiskScore] = useState(0);
  const [metrics, setMetrics] = useState({
    alertsCount: 0,
    connectionsCount: 0,
    lastThreatDetected: null,
    systemHealth: "initializing",
  });

  // Real-time notifications
  const [pendingNotifications, setPendingNotifications] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);

  // Configuration
  const [monitoringConfig, setMonitoringConfig] = useState({
    threatDetection: true,
    behaviorAnalysis: true,
    riskScoring: true,
    anomalyDetection: true,
    geolocationTracking: true,
    deviceMonitoring: true,
    networkAnalysis: true,
    realTimeAlerts: true,
  });

  // Initialize security monitoring service
  const initializeSecurityMonitoring = useCallback(
    async (userId = null, sessionId = null) => {
      try {
        setError(null);
        setSystemHealth("initializing");

        const service = new RealTimeSecurityMonitoringService();

        // Set up event listeners
        setupEventListeners(service);

        // Initialize the service
        const result = await service.initialize(userId, sessionId);

        setSecurityService(service);
        setIsInitialized(true);
        setIsConnected(true);
        setSystemHealth("healthy");
        setMonitoringConfig(result.monitoringConfig);

        console.log("Real-time security monitoring initialized successfully");

        return result;
      } catch (error) {
        console.error(
          "Failed to initialize real-time security monitoring:",
          error
        );
        setError(error.message);
        setSystemHealth("error");
        throw error;
      }
    },
    []
  );

  // Setup event listeners for security service
  const setupEventListeners = useCallback((service) => {
    // Connection events
    service.on("connected", () => {
      setIsConnected(true);
      setSystemHealth("healthy");
      setError(null);
    });

    service.on("disconnected", () => {
      setIsConnected(false);
      setSystemHealth("disconnected");
    });

    service.on("error", (error) => {
      setError(error.message || "Connection error");
      setSystemHealth("error");
    });

    service.on("maxReconnectAttemptsReached", () => {
      setError("Unable to maintain connection to security monitoring service");
      setSystemHealth("critical");
    });

    // Security events
    service.on("threatDetected", (payload) => {
      handleThreatDetected(payload);
    });

    service.on("securityAlert", (payload) => {
      handleSecurityAlert(payload);
    });

    service.on("riskScoreUpdated", (payload) => {
      handleRiskScoreUpdate(payload);
    });

    service.on("behaviorAnomaly", (payload) => {
      handleBehaviorAnomaly(payload);
    });

    service.on("systemAlert", (payload) => {
      handleSystemAlert(payload);
    });

    service.on("automatedResponse", (payload) => {
      handleAutomatedResponse(payload);
    });

    // Metrics updates
    service.on("metricsUpdated", (newMetrics) => {
      setMetrics(newMetrics);
    });

    service.on("healthUpdate", (health) => {
      setSystemHealth(health);
    });

    // Network events
    service.on("networkOffline", () => {
      setSystemHealth("offline");
    });

    // Action required events
    service.on("additionalAuthRequired", (payload) => {
      handleAdditionalAuthRequired(payload);
    });

    service.on("mfaVerificationRequired", (payload) => {
      handleMFAVerificationRequired(payload);
    });

    service.on("sessionAccessLimited", (payload) => {
      handleSessionAccessLimited(payload);
    });

    service.on("ipBlockRequested", (payload) => {
      handleIPBlockRequested(payload);
    });

    service.on("securityLogoutInitiated", (payload) => {
      handleSecurityLogoutInitiated(payload);
    });
  }, []);

  // Handle threat detection
  const handleThreatDetected = useCallback((payload) => {
    const {
      threatId,
      threatType,
      severity,
      confidence,
      source,
      target,
      timestamp,
      metadata,
    } = payload;

    // Update active threats
    setActiveThreats((prev) => {
      const newThreats = new Map(prev);
      newThreats.set(threatId, {
        threatType,
        severity,
        confidence,
        source,
        target,
        timestamp: new Date(timestamp),
        metadata,
        status: "active",
      });
      return newThreats;
    });

    // Add to recent alerts
    const alert = {
      id: `threat_${threatId}`,
      type: "threat",
      severity,
      title: `${threatType.replace("_", " ").toUpperCase()} Detected`,
      message: `${threatType} detected from ${source} targeting ${target} (confidence: ${Math.round(confidence * 100)}%)`,
      timestamp: new Date(timestamp),
      data: payload,
    };

    setRecentAlerts((prev) => [alert, ...prev.slice(0, 49)]); // Keep last 50

    // Add critical alerts for high severity threats
    if (severity === "critical" || severity === "high") {
      setCriticalAlerts((prev) => [alert, ...prev.slice(0, 9)]); // Keep last 10
    }

    // Create notification for user
    addNotification({
      id: `threat_notification_${threatId}`,
      type: "threat",
      severity,
      title: alert.title,
      message: alert.message,
      timestamp: new Date(),
      persistent: severity === "critical",
    });

    console.warn(`🚨 THREAT DETECTED: ${threatType} (${severity})`, payload);
  }, []);

  // Handle security alerts
  const handleSecurityAlert = useCallback((payload) => {
    const { alertType, severity, message, actionRequired } = payload;

    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      type: "security",
      severity,
      title: `Security Alert: ${alertType}`,
      message,
      timestamp: new Date(),
      actionRequired,
      data: payload,
    };

    setRecentAlerts((prev) => [alert, ...prev.slice(0, 49)]);

    if (severity === "critical" || severity === "high") {
      setCriticalAlerts((prev) => [alert, ...prev.slice(0, 9)]);
    }

    addNotification({
      id: `security_notification_${alert.id}`,
      type: "security",
      severity,
      title: alert.title,
      message: alert.message,
      timestamp: new Date(),
      actionRequired,
      persistent: severity === "critical" || actionRequired,
    });

    console.log(`🔔 SECURITY ALERT: ${alertType} - ${message}`);
  }, []);

  // Handle risk score updates
  const handleRiskScoreUpdate = useCallback((payload) => {
    const { newRiskScore, previousRiskScore } = payload;

    setRiskScore(newRiskScore);

    // Notify if significant increase
    if (newRiskScore > previousRiskScore + 0.2) {
      addNotification({
        id: `risk_increase_${Date.now()}`,
        type: "risk",
        severity: newRiskScore >= 0.7 ? "high" : "medium",
        title: "Risk Score Increased",
        message: `Session risk score increased from ${Math.round(previousRiskScore * 100)}% to ${Math.round(newRiskScore * 100)}%`,
        timestamp: new Date(),
        persistent: newRiskScore >= 0.9,
      });
    }

    console.log(
      `📊 Risk Score Update: ${Math.round(previousRiskScore * 100)}% → ${Math.round(newRiskScore * 100)}%`
    );
  }, []);

  // Handle behavior anomalies
  const handleBehaviorAnomaly = useCallback((payload) => {
    const { anomalyType, confidence } = payload;

    const alert = {
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      type: "anomaly",
      severity: confidence >= 0.8 ? "high" : "medium",
      title: "Behavior Anomaly Detected",
      message: `${anomalyType.replace("_", " ")} anomaly detected (confidence: ${Math.round(confidence * 100)}%)`,
      timestamp: new Date(),
      data: payload,
    };

    setRecentAlerts((prev) => [alert, ...prev.slice(0, 49)]);

    if (confidence >= 0.8) {
      addNotification({
        id: `anomaly_notification_${alert.id}`,
        type: "anomaly",
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: new Date(),
        persistent: false,
      });
    }

    console.log(
      `🔍 Behavior Anomaly: ${anomalyType} (confidence: ${Math.round(confidence * 100)}%)`
    );
  }, []);

  // Handle system alerts
  const handleSystemAlert = useCallback((payload) => {
    const { alertType, severity, message } = payload;

    const alert = {
      id: `system_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      type: "system",
      severity,
      title: `System Alert: ${alertType}`,
      message,
      timestamp: new Date(),
      data: payload,
    };

    setRecentAlerts((prev) => [alert, ...prev.slice(0, 49)]);

    if (severity === "critical") {
      setCriticalAlerts((prev) => [alert, ...prev.slice(0, 9)]);

      addNotification({
        id: `system_notification_${alert.id}`,
        type: "system",
        severity,
        title: alert.title,
        message: alert.message,
        timestamp: new Date(),
        persistent: true,
      });
    }

    console.log(`⚙️ System Alert: ${alertType} - ${message}`);
  }, []);

  // Handle automated responses
  const handleAutomatedResponse = useCallback((payload) => {
    const { responseType, action, target } = payload;

    addNotification({
      id: `response_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      type: "response",
      severity: "info",
      title: "Automated Response",
      message: `${responseType.replace("_", " ")} - ${action} applied to ${target}`,
      timestamp: new Date(),
      persistent: false,
    });

    console.log(`🤖 Automated Response: ${responseType} - ${action}`);
  }, []);

  // Handle action required events
  const handleAdditionalAuthRequired = useCallback((payload) => {
    addNotification({
      id: `auth_required_${Date.now()}`,
      type: "action",
      severity: "high",
      title: "Additional Authentication Required",
      message: "Please verify your identity to continue",
      timestamp: new Date(),
      persistent: true,
      actionRequired: "additional_auth",
      actionData: payload,
    });
  }, []);

  const handleMFAVerificationRequired = useCallback((payload) => {
    addNotification({
      id: `mfa_required_${Date.now()}`,
      type: "action",
      severity: "high",
      title: "MFA Verification Required",
      message: "Multi-factor authentication is required",
      timestamp: new Date(),
      persistent: true,
      actionRequired: "mfa_verification",
      actionData: payload,
    });
  }, []);

  const handleSessionAccessLimited = useCallback((payload) => {
    addNotification({
      id: `access_limited_${Date.now()}`,
      type: "warning",
      severity: "medium",
      title: "Session Access Limited",
      message: "Your session access has been limited due to security concerns",
      timestamp: new Date(),
      persistent: true,
      actionData: payload,
    });
  }, []);

  const handleIPBlockRequested = useCallback((payload) => {
    addNotification({
      id: `ip_block_${Date.now()}`,
      type: "warning",
      severity: "high",
      title: "Suspicious Activity Detected",
      message: "Your IP address has been flagged for suspicious activity",
      timestamp: new Date(),
      persistent: true,
      actionData: payload,
    });
  }, []);

  const handleSecurityLogoutInitiated = useCallback((payload) => {
    addNotification({
      id: `security_logout_${Date.now()}`,
      type: "action",
      severity: "critical",
      title: "Security Logout Initiated",
      message: "You will be logged out due to security concerns",
      timestamp: new Date(),
      persistent: true,
      actionRequired: "security_logout",
      actionData: payload,
    });
  }, []);

  // Add notification
  const addNotification = useCallback((notification) => {
    setPendingNotifications((prev) => [notification, ...prev.slice(0, 19)]); // Keep last 20
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId) => {
    setPendingNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setPendingNotifications([]);
  }, []);

  // Report security event
  const reportSecurityEvent = useCallback(
    (eventData) => {
      if (securityService && isConnected) {
        securityService.processSecurityEvent(eventData);
      }
    },
    [securityService, isConnected]
  );

  // Update monitoring configuration
  const updateMonitoringConfiguration = useCallback(
    (newConfig) => {
      if (securityService) {
        const updatedConfig = { ...monitoringConfig, ...newConfig };
        setMonitoringConfig(updatedConfig);
        securityService.updateConfiguration(updatedConfig);
      }
    },
    [securityService, monitoringConfig]
  );

  // Get current metrics
  const getCurrentMetrics = useCallback(() => {
    if (securityService) {
      return securityService.getMetrics();
    }
    return metrics;
  }, [securityService, metrics]);

  // Disconnect security monitoring
  const disconnect = useCallback(() => {
    if (securityService) {
      securityService.disconnect();
      setIsConnected(false);
      setIsInitialized(false);
      setSystemHealth("disconnected");
    }
  }, [securityService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (securityService) {
        securityService.destroy();
      }
    };
  }, [securityService]);

  // Context value
  const value = {
    // State
    isInitialized,
    isConnected,
    error,
    systemHealth,
    riskScore,
    metrics,
    monitoringConfig,

    // Data
    activeThreats,
    recentAlerts,
    criticalAlerts,
    pendingNotifications,

    // Actions
    initializeSecurityMonitoring,
    disconnect,
    reportSecurityEvent,
    updateMonitoringConfiguration,
    getCurrentMetrics,

    // Notifications
    dismissNotification,
    clearAllNotifications,

    // Service instance (for advanced usage)
    securityService,
  };

  return (
    <RealTimeSecurityContext.Provider value={value}>
      {children}
    </RealTimeSecurityContext.Provider>
  );
};

export default RealTimeSecurityProvider;
