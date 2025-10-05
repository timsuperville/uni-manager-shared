/**
 * Real-time Security Monitoring Service
 *
 * WebSocket-based live threat detection with automated response systems,
 * instant alert mechanisms, and integration with existing security infrastructure
 */

/* global console, window, document, WebSocket, clearInterval, setInterval, setTimeout, clearTimeout, Notification */

class RealTimeSecurityMonitoringService {
  constructor() {
    this.wsUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000"
    ).replace(/^http/, "ws");
    this.websocket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.heartbeatInterval = 30000; // 30 seconds
    this.heartbeatTimer = null;
    this.reconnectTimer = null;

    // Event listeners
    this.eventListeners = new Map();

    // Security monitoring configuration
    this.monitoringConfig = {
      threatDetection: true,
      behaviorAnalysis: true,
      riskScoring: true,
      anomalyDetection: true,
      geolocationTracking: true,
      deviceMonitoring: true,
      networkAnalysis: true,
      realTimeAlerts: true,
    };

    // Threat detection patterns
    this.threatPatterns = {
      bruteForce: { attempts: 5, timeWindow: 300000 }, // 5 attempts in 5 minutes
      suspiciousLogin: { geoDistance: 1000, timeWindow: 3600000 }, // 1000km in 1 hour
      deviceAnomaly: { confidence: 0.8 },
      behaviorAnomaly: { deviation: 0.7 },
      networkAnomaly: { suspiciousIPs: new Set() },
    };

    // Alert thresholds
    this.alertThresholds = {
      critical: 0.9,
      high: 0.7,
      medium: 0.5,
      low: 0.3,
    };

    // Real-time metrics
    this.metrics = {
      activeThreats: new Map(),
      alertsCount: 0,
      connectionsCount: 0,
      lastThreatDetected: null,
      systemHealth: "healthy",
    };

    // Automated response configuration
    this.automatedResponses = {
      blockSuspiciousIP: true,
      requireAdditionalAuth: true,
      limitSessionAccess: true,
      notifyAdministrators: true,
      escalateToSOC: true,
    };
  }

  /**
   * Initialize real-time security monitoring
   */
  async initialize(userId = null, sessionId = null) {
    try {
      this.userId = userId;
      this.sessionId = sessionId;

      // Establish WebSocket connection
      await this.connect();

      // Register for security events
      this.registerSecurityEventListeners();

      // Start health monitoring
      this.startHealthMonitoring();

      // Initialize threat detection
      this.initializeThreatDetection();

      console.log("Real-time Security Monitoring initialized successfully");

      return {
        success: true,
        connectionId: this.websocket?.id || "unknown",
        monitoringConfig: this.monitoringConfig,
      };
    } catch (error) {
      console.error(
        "Failed to initialize real-time security monitoring:",
        error
      );
      throw error;
    }
  }

  /**
   * Establish WebSocket connection
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsEndpoint = `${this.wsUrl}/api/security-monitoring/websocket`;
        console.log("Connecting to security monitoring WebSocket:", wsEndpoint);

        this.websocket = new WebSocket(wsEndpoint);

        this.websocket.onopen = (event) => {
          console.log("Security monitoring WebSocket connected");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;

          // Send authentication and configuration
          this.authenticateConnection();

          // Start heartbeat
          this.startHeartbeat();

          this.emit("connected", event);
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.websocket.onclose = (event) => {
          console.log(
            "Security monitoring WebSocket disconnected:",
            event.code,
            event.reason
          );
          this.isConnected = false;
          this.stopHeartbeat();

          this.emit("disconnected", event);

          // Attempt reconnection if not intentional
          if (event.code !== 1000) {
            this.scheduleReconnect();
          }
        };

        this.websocket.onerror = (error) => {
          console.error("Security monitoring WebSocket error:", error);
          this.emit("error", error);
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (this.websocket?.readyState !== WebSocket.OPEN) {
            reject(new Error("WebSocket connection timeout"));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Authenticate WebSocket connection
   */
  authenticateConnection() {
    const authMessage = {
      type: "authenticate",
      payload: {
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        monitoringConfig: this.monitoringConfig,
      },
    };

    this.sendMessage(authMessage);
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "threat_detected":
          this.handleThreatDetection(message.payload);
          break;

        case "security_alert":
          this.handleSecurityAlert(message.payload);
          break;

        case "risk_score_update":
          this.handleRiskScoreUpdate(message.payload);
          break;

        case "behavior_anomaly":
          this.handleBehaviorAnomaly(message.payload);
          break;

        case "system_alert":
          this.handleSystemAlert(message.payload);
          break;

        case "automated_response":
          this.handleAutomatedResponse(message.payload);
          break;

        case "heartbeat_response":
          // Keep-alive response
          break;

        case "authentication_success":
          console.log("Security monitoring authentication successful");
          break;

        case "authentication_failed":
          console.error(
            "Security monitoring authentication failed:",
            message.payload
          );
          break;

        default:
          console.warn("Unknown message type:", message.type);
      }

      // Emit generic message event
      this.emit("message", message);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  }

  /**
   * Handle threat detection
   */
  handleThreatDetection(payload) {
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

    console.warn(
      `🚨 THREAT DETECTED: ${threatType} (Severity: ${severity}, Confidence: ${confidence})`
    );

    // Store threat in active threats
    this.metrics.activeThreats.set(threatId, {
      threatType,
      severity,
      confidence,
      source,
      target,
      timestamp: new Date(timestamp),
      metadata,
      status: "active",
    });

    this.metrics.lastThreatDetected = new Date(timestamp);

    // Trigger automated response if configured
    if (this.shouldTriggerAutomatedResponse(severity, confidence)) {
      this.triggerAutomatedResponse(payload);
    }

    // Emit threat detection event
    this.emit("threatDetected", payload);

    // Update UI if callback registered
    this.emit("metricsUpdated", this.metrics);
  }

  /**
   * Handle security alerts
   */
  handleSecurityAlert(payload) {
    const {
      _alertId,
      alertType,
      severity,
      message,
      _timestamp,
      actionRequired,
    } = payload;

    console.log(`🔔 SECURITY ALERT: ${alertType} - ${message}`);

    this.metrics.alertsCount++;

    // Show notification if browser supports it
    this.showBrowserNotification(
      `Security Alert: ${alertType}`,
      message,
      severity
    );

    // Emit alert event
    this.emit("securityAlert", payload);

    // Take action if required
    if (actionRequired) {
      this.handleActionRequired(payload);
    }
  }

  /**
   * Handle risk score updates
   */
  handleRiskScoreUpdate(payload) {
    const {
      _sessionId,
      newRiskScore,
      previousRiskScore,
      _factors,
      _timestamp,
    } = payload;

    console.log(`📊 Risk Score Update: ${previousRiskScore} → ${newRiskScore}`);

    // Check if risk score crossed critical threshold
    if (
      newRiskScore >= this.alertThresholds.critical &&
      previousRiskScore < this.alertThresholds.critical
    ) {
      this.handleCriticalRiskScore(payload);
    }

    this.emit("riskScoreUpdated", payload);
  }

  /**
   * Handle behavior anomalies
   */
  handleBehaviorAnomaly(payload) {
    const { anomalyType, _severity, confidence, _behaviorData, _timestamp } =
      payload;

    console.log(
      `🔍 Behavior Anomaly: ${anomalyType} (Confidence: ${confidence})`
    );

    // Check if confidence is above threshold
    if (confidence >= this.threatPatterns.behaviorAnomaly.deviation) {
      this.handleHighConfidenceAnomaly(payload);
    }

    this.emit("behaviorAnomaly", payload);
  }

  /**
   * Handle system alerts
   */
  handleSystemAlert(payload) {
    const { alertType, severity, message, _systemComponent, _timestamp } =
      payload;

    console.log(`⚙️ System Alert: ${alertType} - ${message}`);

    // Update system health if critical
    if (severity === "critical") {
      this.metrics.systemHealth = "critical";
    } else if (severity === "high" && this.metrics.systemHealth === "healthy") {
      this.metrics.systemHealth = "degraded";
    }

    this.emit("systemAlert", payload);
  }

  /**
   * Handle automated responses
   */
  handleAutomatedResponse(payload) {
    const { responseType, action, target, _result, _timestamp } = payload;

    console.log(
      `🤖 Automated Response: ${responseType} - ${action} on ${target}`
    );

    this.emit("automatedResponse", payload);
  }

  /**
   * Check if automated response should be triggered
   */
  shouldTriggerAutomatedResponse(severity, confidence) {
    // Trigger for high severity and high confidence threats
    return (
      (severity === "critical" && confidence >= 0.8) ||
      (severity === "high" && confidence >= 0.9)
    );
  }

  /**
   * Trigger automated response
   */
  triggerAutomatedResponse(threatPayload) {
    const responseMessage = {
      type: "trigger_automated_response",
      payload: {
        threatId: threatPayload.threatId,
        threatType: threatPayload.threatType,
        severity: threatPayload.severity,
        responses: this.automatedResponses,
        timestamp: Date.now(),
      },
    };

    this.sendMessage(responseMessage);
  }

  /**
   * Handle critical risk score
   */
  handleCriticalRiskScore(payload) {
    console.error("🚨 CRITICAL RISK SCORE DETECTED:", payload);

    // Request immediate additional authentication
    this.requestAdditionalAuthentication(payload);

    // Notify administrators
    this.notifyAdministrators("critical_risk_score", payload);
  }

  /**
   * Handle high confidence anomalies
   */
  handleHighConfidenceAnomaly(payload) {
    console.warn("🔍 HIGH CONFIDENCE ANOMALY:", payload);

    // Flag session for enhanced monitoring
    this.flagSessionForEnhancedMonitoring(payload);
  }

  /**
   * Handle action required alerts
   */
  handleActionRequired(alertPayload) {
    const { actionType, actionData } = alertPayload;

    switch (actionType) {
      case "require_mfa":
        this.requestMFAVerification(actionData);
        break;

      case "limit_session":
        this.limitSessionAccess(actionData);
        break;

      case "block_ip":
        this.requestIPBlock(actionData);
        break;

      case "logout_user":
        this.initiateSecurityLogout(actionData);
        break;

      default:
        console.warn("Unknown action type:", actionType);
    }
  }

  /**
   * Register security event listeners
   */
  registerSecurityEventListeners() {
    // Listen for security events from other parts of the application
    window.addEventListener("securityEvent", (event) => {
      this.processSecurityEvent(event.detail);
    });

    // Listen for page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });

    // Listen for network changes
    window.addEventListener("online", () => {
      this.handleNetworkReconnect();
    });

    window.addEventListener("offline", () => {
      this.handleNetworkDisconnect();
    });
  }

  /**
   * Process security events from application
   */
  processSecurityEvent(eventData) {
    const securityMessage = {
      type: "security_event",
      payload: {
        ...eventData,
        source: "client",
        timestamp: Date.now(),
      },
    };

    this.sendMessage(securityMessage);
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    // Monitor WebSocket connection health
    setInterval(() => {
      if (!this.isConnected) {
        this.metrics.systemHealth = "disconnected";
      } else if (this.metrics.activeThreats.size > 0) {
        this.metrics.systemHealth = "threats_detected";
      } else {
        this.metrics.systemHealth = "healthy";
      }

      this.emit("healthUpdate", this.metrics.systemHealth);
    }, 5000);
  }

  /**
   * Initialize threat detection
   */
  initializeThreatDetection() {
    // Set up client-side threat detection patterns
    this.setupFailedLoginDetection();
    this.setupSuspiciousActivityDetection();
    this.setupNetworkAnomalyDetection();
  }

  /**
   * Setup failed login detection
   */
  setupFailedLoginDetection() {
    const failedAttempts = new Map();

    this.on("loginFailed", (data) => {
      const { userId, ip, timestamp } = data;
      const key = `${userId || "unknown"}_${ip}`;

      if (!failedAttempts.has(key)) {
        failedAttempts.set(key, []);
      }

      const attempts = failedAttempts.get(key);
      attempts.push(timestamp);

      // Clean old attempts
      const cutoff = timestamp - this.threatPatterns.bruteForce.timeWindow;
      const recentAttempts = attempts.filter((t) => t > cutoff);
      failedAttempts.set(key, recentAttempts);

      // Check for brute force
      if (recentAttempts.length >= this.threatPatterns.bruteForce.attempts) {
        this.reportThreat("brute_force_attack", {
          target: userId || ip,
          attempts: recentAttempts.length,
          timeWindow: this.threatPatterns.bruteForce.timeWindow,
        });
      }
    });
  }

  /**
   * Setup suspicious activity detection
   */
  setupSuspiciousActivityDetection() {
    this.on("suspiciousActivity", (data) => {
      const { activityType, confidence, metadata } = data;

      if (confidence >= this.threatPatterns.deviceAnomaly.confidence) {
        this.reportThreat("suspicious_activity", {
          activityType,
          confidence,
          metadata,
        });
      }
    });
  }

  /**
   * Setup network anomaly detection
   */
  setupNetworkAnomalyDetection() {
    this.on("networkAnomaly", (data) => {
      const { sourceIP, anomalyType, severity } = data;

      this.threatPatterns.networkAnomaly.suspiciousIPs.add(sourceIP);

      this.reportThreat("network_anomaly", {
        sourceIP,
        anomalyType,
        severity,
      });
    });
  }

  /**
   * Report threat to monitoring system
   */
  reportThreat(threatType, threatData) {
    const threatMessage = {
      type: "report_threat",
      payload: {
        threatId: this.generateThreatId(),
        threatType,
        timestamp: Date.now(),
        source: "client_detection",
        data: threatData,
      },
    };

    this.sendMessage(threatMessage);
  }

  /**
   * Generate unique threat ID
   */
  generateThreatId() {
    return `threat_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Send message via WebSocket
   */
  sendMessage(message) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    } else {
      console.warn("Cannot send message - WebSocket not connected");
    }
  }

  /**
   * Start heartbeat mechanism
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({
          type: "heartbeat",
          payload: { timestamp: Date.now() },
        });
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat mechanism
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      this.emit("maxReconnectAttemptsReached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(
      `Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error("Reconnection failed:", error);
        this.scheduleReconnect();
      });
    }, delay);
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(title, message, severity) {
    if ("Notification" in window && Notification.permission === "granted") {
      const options = {
        body: message,
        icon: this.getNotificationIcon(severity),
        badge: "/icons/security-badge.png",
        tag: "security-alert",
        requireInteraction: severity === "critical",
      };

      new Notification(title, options);
    }
  }

  /**
   * Get notification icon based on severity
   */
  getNotificationIcon(severity) {
    const icons = {
      critical: "/icons/alert-critical.png",
      high: "/icons/alert-high.png",
      medium: "/icons/alert-medium.png",
      low: "/icons/alert-low.png",
    };

    return icons[severity] || icons.medium;
  }

  /**
   * Request additional authentication
   */
  requestAdditionalAuthentication(payload) {
    this.emit("additionalAuthRequired", payload);
  }

  /**
   * Request MFA verification
   */
  requestMFAVerification(actionData) {
    this.emit("mfaVerificationRequired", actionData);
  }

  /**
   * Limit session access
   */
  limitSessionAccess(actionData) {
    this.emit("sessionAccessLimited", actionData);
  }

  /**
   * Request IP block
   */
  requestIPBlock(actionData) {
    this.emit("ipBlockRequested", actionData);
  }

  /**
   * Initiate security logout
   */
  initiateSecurityLogout(actionData) {
    this.emit("securityLogoutInitiated", actionData);
  }

  /**
   * Notify administrators
   */
  notifyAdministrators(alertType, payload) {
    const notificationMessage = {
      type: "admin_notification",
      payload: {
        alertType,
        timestamp: Date.now(),
        data: payload,
      },
    };

    this.sendMessage(notificationMessage);
  }

  /**
   * Flag session for enhanced monitoring
   */
  flagSessionForEnhancedMonitoring(payload) {
    const flagMessage = {
      type: "flag_enhanced_monitoring",
      payload: {
        sessionId: this.sessionId,
        reason: payload.anomalyType,
        timestamp: Date.now(),
      },
    };

    this.sendMessage(flagMessage);
  }

  /**
   * Handle page hidden
   */
  handlePageHidden() {
    // Reduce monitoring frequency when page is hidden
    this.sendMessage({
      type: "page_hidden",
      payload: { timestamp: Date.now() },
    });
  }

  /**
   * Handle page visible
   */
  handlePageVisible() {
    // Resume normal monitoring when page becomes visible
    this.sendMessage({
      type: "page_visible",
      payload: { timestamp: Date.now() },
    });
  }

  /**
   * Handle network reconnect
   */
  handleNetworkReconnect() {
    console.log("Network reconnected - resuming security monitoring");
    if (!this.isConnected) {
      this.connect().catch((error) => {
        console.error("Failed to reconnect after network recovery:", error);
      });
    }
  }

  /**
   * Handle network disconnect
   */
  handleNetworkDisconnect() {
    console.log("Network disconnected - security monitoring offline");
    this.metrics.systemHealth = "offline";
    this.emit("networkOffline");
  }

  /**
   * Event emitter functionality
   */
  on(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(callback);
  }

  off(eventType, callback) {
    if (this.eventListeners.has(eventType)) {
      const listeners = this.eventListeners.get(eventType);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(eventType, data) {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Update monitoring configuration
   */
  updateConfiguration(newConfig) {
    this.monitoringConfig = { ...this.monitoringConfig, ...newConfig };

    const configMessage = {
      type: "update_configuration",
      payload: {
        configuration: this.monitoringConfig,
        timestamp: Date.now(),
      },
    };

    this.sendMessage(configMessage);
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.websocket) {
      this.websocket.close(1000, "Client disconnect");
      this.websocket = null;
    }

    this.isConnected = false;
    this.eventListeners.clear();

    console.log("Real-time security monitoring disconnected");
  }

  /**
   * Destroy instance and cleanup
   */
  destroy() {
    this.disconnect();
    this.metrics.activeThreats.clear();
    this.threatPatterns.networkAnomaly.suspiciousIPs.clear();
  }
}

export default RealTimeSecurityMonitoringService;
