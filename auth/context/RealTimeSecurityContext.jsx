/**
 * Real-time Security Context
 * React context provider for security monitoring with threat detection and notification management
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import realTimeSecurityMonitoringService from '../services/realTimeSecurityMonitoringService';

// Create the context
const RealTimeSecurityContext = createContext(null);

/**
 * Real-time Security Provider Component
 * Provides security monitoring context to child components
 */
export function RealTimeSecurityProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState('initializing');
  const [riskScore, setRiskScore] = useState(0);
  const [activeThreats, setActiveThreats] = useState(new Map());
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [pendingNotifications, setPendingNotifications] = useState([]);
  const [monitoringConfig, setMonitoringConfig] = useState({
    threatDetection: true,
    behaviorAnalysis: true,
    riskScoring: true,
    realTimeAlerts: true,
  });

  const securityServiceRef = useRef(null);
  const eventHandlersRef = useRef(new Map());

  // Initialize security monitoring service
  const initializeSecurityMonitoring = useCallback(async (userId, sessionId) => {
    try {
      setError(null);
      setSystemHealth('initializing');

      if (!securityServiceRef.current) {
        securityServiceRef.current = realTimeSecurityMonitoringService();
      }

      const result = await securityServiceRef.current.initialize(userId, sessionId);

      if (result.success) {
        setIsInitialized(true);
        setIsConnected(true);
        setSystemHealth('healthy');

        // Set up event handlers
        setupEventHandlers();
      } else {
        throw new Error('Failed to initialize security monitoring');
      }
    } catch (err) {
      setError(err.message);
      setSystemHealth('error');
      console.error('Security monitoring initialization failed:', err);
    }
  }, []);

  // Set up event handlers for security events
  const setupEventHandlers = useCallback(() => {
    if (!securityServiceRef.current) return;

    const service = securityServiceRef.current;

    // Threat detection events
    service.on('threatDetected', (threat) => {
      setActiveThreats(prev => new Map(prev).set(threat.threatId, threat));
      addAlert({
        id: threat.threatId,
        type: 'threat',
        severity: threat.severity,
        message: `Threat detected: ${threat.threatType}`,
        timestamp: threat.timestamp,
        data: threat,
      });
    });

    // Security alert events
    service.on('securityAlert', (alert) => {
      addAlert({
        id: alert.alertId,
        type: 'alert',
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp,
        actionRequired: alert.actionRequired,
        data: alert,
      });
    });

    // Risk score updates
    service.on('riskScoreUpdated', (update) => {
      setRiskScore(update.newRiskScore);
    });

    // Behavior anomaly events
    service.on('behaviorAnomaly', (anomaly) => {
      addAlert({
        id: `anomaly_${Date.now()}`,
        type: 'anomaly',
        severity: anomaly.severity,
        message: `Behavior anomaly detected: ${anomaly.anomalyType}`,
        timestamp: anomaly.timestamp,
        data: anomaly,
      });
    });

    // Connection state changes
    service.on('connected', () => {
      setIsConnected(true);
      setSystemHealth('healthy');
    });

    service.on('disconnected', () => {
      setIsConnected(false);
      setSystemHealth('disconnected');
    });

    // Error events
    service.on('error', (err) => {
      setError(err.message);
      setSystemHealth('error');
    });

    eventHandlersRef.current = service;
  }, []);

  // Add alert to recent alerts and notifications
  const addAlert = useCallback((alert) => {
    setRecentAlerts(prev => {
      const newAlerts = [alert, ...prev];
      // Keep only the most recent 20 alerts
      return newAlerts.slice(0, 20);
    });

    // Add to pending notifications if it requires action
    if (alert.actionRequired || alert.severity === 'critical' || alert.severity === 'high') {
      setPendingNotifications(prev => {
        const newNotifications = [alert, ...prev];
        // Keep only the most recent 20 notifications
        return newNotifications.slice(0, 20);
      });
    }
  }, []);

  // Report security event
  const reportSecurityEvent = useCallback(async (event) => {
    if (!isConnected || !securityServiceRef.current) {
      console.warn('Cannot report security event: service not connected');
      return;
    }

    try {
      await securityServiceRef.current.processSecurityEvent(event);
    } catch (err) {
      console.error('Failed to report security event:', err);
    }
  }, [isConnected]);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId) => {
    setPendingNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  }, []);

  // Update monitoring configuration
  const updateMonitoringConfiguration = useCallback(async (config) => {
    if (!securityServiceRef.current) return;

    try {
      await securityServiceRef.current.updateConfiguration(config);
      setMonitoringConfig(prev => ({ ...prev, ...config }));
    } catch (err) {
      console.error('Failed to update monitoring configuration:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (securityServiceRef.current) {
        securityServiceRef.current.destroy();
      }
    };
  }, []);

  const contextValue = {
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

RealTimeSecurityProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to use the real-time security context
 */
export function useRealTimeSecurity() {
  const context = useContext(RealTimeSecurityContext);

  if (!context) {
    throw new Error('useRealTimeSecurity must be used within a RealTimeSecurityProvider');
  }

  return context;
}

export default RealTimeSecurityProvider;