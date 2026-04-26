/* global setTimeout, clearTimeout */
/**
 * Real-time Security Monitoring Service
 * Service for monitoring security events and threats in real-time.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

type EventHandler<T = unknown> = (data: T) => void;

type Severity = "low" | "medium" | "high" | "critical";

interface MonitoringConfig {
  threatDetection: boolean;
  behaviorAnalysis: boolean;
  riskScoring: boolean;
  realTimeAlerts: boolean;
}

interface Threat {
  threatId: string;
  threatType: string;
  severity: Severity;
  confidence: number;
  source: string;
  target: string | null;
  timestamp: number;
  metadata: Record<string, unknown>;
}

interface BehaviorAnomaly {
  anomalyType: string;
  severity: Severity;
  confidence: number;
  behaviorData: Record<string, unknown>;
  timestamp: number;
}

interface SecurityAlert {
  alertId: string;
  alertType: string;
  severity: Severity;
  message: string;
  timestamp: number;
  actionRequired: boolean;
}

interface SecurityEventPayload {
  type: "threat_detected" | "behavior_anomaly" | "security_alert";
  data: Record<string, unknown>;
}

interface ServiceMetrics {
  activeThreats: Map<string, Threat>;
  alertsCount: number;
  connectionsCount: number;
  lastThreatDetected: number | null;
  systemHealth: string;
}

// ── RealTimeSecurityMonitoringService ────────────────────────────────────────

class RealTimeSecurityMonitoringService {
  private isConnected = false;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private readonly eventHandlers = new Map<string, EventHandler[]>();
  private monitoringConfig: MonitoringConfig = {
    threatDetection: true,
    behaviorAnalysis: true,
    riskScoring: true,
    realTimeAlerts: true,
  };
  private readonly metrics: ServiceMetrics = {
    activeThreats: new Map(),
    alertsCount: 0,
    connectionsCount: 0,
    lastThreatDetected: null,
    systemHealth: "initializing",
  };

  async initialize(
    userId: string,
    sessionId: string,
  ): Promise<{
    success: boolean;
    connectionId?: string;
    monitoringConfig?: MonitoringConfig;
    error?: string;
  }> {
    try {
      this.userId = userId;
      this.sessionId = sessionId;
      this.isConnected = true;
      this.metrics.connectionsCount++;

      await new Promise<void>((resolve) => setTimeout(resolve, 100));

      this.emit("connected", undefined);
      this.metrics.systemHealth = "healthy";

      return {
        success: true,
        connectionId: `connection_${Date.now()}`,
        monitoringConfig: this.monitoringConfig,
      };
    } catch (error) {
      this.emit("error", { message: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;
    this.isConnected = true;
    this.emit("connected", undefined);
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.emit("disconnected", undefined);
  }

  async destroy(): Promise<void> {
    this.isConnected = false;
    this.eventHandlers.clear();
    this.metrics.activeThreats.clear();
  }

  on<T = unknown>(event: string, handler: EventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler as EventHandler);
  }

  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;
    const index = handlers.indexOf(handler as EventHandler);
    if (index > -1) handlers.splice(index, 1);
  }

  emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        if (import.meta.env?.DEV) {
          console.warn(
            `[RealTimeSecurityMonitoringService] Error in ${event} handler:`,
            (error as Error).message,
          );
        }
      }
    });
  }

  async processSecurityEvent(event: SecurityEventPayload): Promise<void> {
    if (!this.isConnected) throw new Error("Service not connected");

    switch (event.type) {
      case "threat_detected":
        await this.handleThreat(event.data);
        break;
      case "behavior_anomaly":
        await this.handleBehaviorAnomaly(event.data);
        break;
      case "security_alert":
        await this.handleSecurityAlert(event.data);
        break;
      default:
        if (import.meta.env?.DEV)
          console.warn(
            "[RealTimeSecurityMonitoringService] Unknown security event type:",
            (event as SecurityEventPayload).type,
          );
    }
  }

  private async handleThreat(
    threatData: Record<string, unknown>,
  ): Promise<void> {
    const threat: Threat = {
      threatId:
        (threatData["threatId"] as string | undefined) ??
        `threat_${Date.now()}`,
      threatType: threatData["threatType"] as string,
      severity: (threatData["severity"] as Severity | undefined) ?? "medium",
      confidence: (threatData["confidence"] as number | undefined) ?? 0.5,
      source: threatData["source"] as string,
      target: (threatData["target"] as string | undefined) ?? this.userId,
      timestamp: (threatData["timestamp"] as number | undefined) ?? Date.now(),
      metadata:
        (threatData["metadata"] as Record<string, unknown> | undefined) ?? {},
    };

    this.metrics.activeThreats.set(threat.threatId, threat);
    this.metrics.lastThreatDetected = threat.timestamp;
    this.metrics.alertsCount++;

    this.emit("threatDetected", threat);
  }

  private async handleBehaviorAnomaly(
    anomalyData: Record<string, unknown>,
  ): Promise<void> {
    const anomaly: BehaviorAnomaly = {
      anomalyType: anomalyData["anomalyType"] as string,
      severity: (anomalyData["severity"] as Severity | undefined) ?? "low",
      confidence: (anomalyData["confidence"] as number | undefined) ?? 0.5,
      behaviorData:
        (anomalyData["behaviorData"] as Record<string, unknown> | undefined) ??
        {},
      timestamp: (anomalyData["timestamp"] as number | undefined) ?? Date.now(),
    };
    this.emit("behaviorAnomaly", anomaly);
  }

  private async handleSecurityAlert(
    alertData: Record<string, unknown>,
  ): Promise<void> {
    const alert: SecurityAlert = {
      alertId:
        (alertData["alertId"] as string | undefined) ?? `alert_${Date.now()}`,
      alertType: alertData["alertType"] as string,
      severity: (alertData["severity"] as Severity | undefined) ?? "low",
      message: alertData["message"] as string,
      timestamp: (alertData["timestamp"] as number | undefined) ?? Date.now(),
      actionRequired:
        (alertData["actionRequired"] as boolean | undefined) ?? false,
    };
    this.emit("securityAlert", alert);
  }

  async updateConfiguration(
    config: Partial<MonitoringConfig>,
  ): Promise<{ success: true; config: MonitoringConfig }> {
    this.monitoringConfig = { ...this.monitoringConfig, ...config };
    return { success: true, config: this.monitoringConfig };
  }

  getMetrics(): ServiceMetrics {
    return { ...this.metrics };
  }

  async sendMessage(message: unknown): Promise<void> {
    if (!this.isConnected) throw new Error("Service not connected");
    if (import.meta.env?.DEV)
      console.log("[SecurityMonitor] message:", message);
  }
}

// ── Factory function (backward-compatible default export) ─────────────────────

function realTimeSecurityMonitoringService(): RealTimeSecurityMonitoringService {
  return new RealTimeSecurityMonitoringService();
}

export default realTimeSecurityMonitoringService;
export { RealTimeSecurityMonitoringService };
