/**
 * Real-time Security Monitoring Service Tests
 *
 * Test suite for WebSocket-based security monitoring with threat detection
 * and automated response capabilities
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import RealTimeSecurityMonitoringService from '../services/realTimeSecurityMonitoringService';

// Mock WebSocket at module level
vi.stubGlobal('WebSocket', vi.fn());

let mockWebSocket;

beforeEach(() => {
  // Reset mock for each test
  mockWebSocket = {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1,
  };

  global.WebSocket.mockImplementation(() => mockWebSocket);
  global.WebSocket.CONNECTING = 0;
  global.WebSocket.OPEN = 1;
  global.WebSocket.CLOSING = 2;
  global.WebSocket.CLOSED = 3;
});

// Mock other browser APIs
global.Notification = {
  permission: 'granted',
  requestPermission: vi.fn(() => Promise.resolve('granted')),
};

vi.mock('../services/realTimeSecurityMonitoringService', async () => {
  const actual = await vi.importActual(
    '../services/realTimeSecurityMonitoringService'
  );
  return {
    ...actual,
    default: class MockRealTimeSecurityMonitoringService extends actual.default {
      constructor() {
        super();
        this.mockWebSocket = mockWebSocket;
      }

      async connect() {
        this.websocket = this.mockWebSocket;
        this.isConnected = true;

        // Simulate successful connection
        setTimeout(() => {
          this.emit('connected');
        }, 10);

        return Promise.resolve();
      }
    },
  };
});

describe('RealTimeSecurityMonitoringService', () => {
  let securityService;
  let mockConsole;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock console methods
    mockConsole = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    // Create fresh service instance
    securityService = new RealTimeSecurityMonitoringService();
  });

  afterEach(() => {
    // Cleanup
    if (securityService) {
      securityService.destroy();
    }

    // Restore console methods
    Object.values(mockConsole).forEach((mock) => mock.mockRestore());
  });

  describe('Service Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(securityService.wsUrl).toBeTruthy();
      expect(securityService.isConnected).toBe(false);
      expect(securityService.monitoringConfig.threatDetection).toBe(true);
      expect(securityService.monitoringConfig.realTimeAlerts).toBe(true);
    });

    test('should initialize successfully with valid parameters', async () => {
      const result = await securityService.initialize('user123', 'session456');

      expect(result.success).toBe(true);
      expect(securityService.userId).toBe('user123');
      expect(securityService.sessionId).toBe('session456');
      expect(securityService.isConnected).toBe(true);
    });

    test('should handle initialization errors gracefully', async () => {
      // Mock connection failure
      securityService.connect = vi
        .fn()
        .mockRejectedValue(new Error('Connection failed'));

      await expect(
        securityService.initialize('user123', 'session456')
      ).rejects.toThrow('Connection failed');
    });
  });

  describe('WebSocket Connection Management', () => {
    test('should establish WebSocket connection', async () => {
      await securityService.connect();

      expect(global.WebSocket).toHaveBeenCalled();
      expect(securityService.isConnected).toBe(true);
    });

    test('should handle connection timeout', async () => {
      // Mock connection that never opens
      const slowWebSocket = {
        ...mockWebSocket,
        readyState: 0, // CONNECTING
      };
      global.WebSocket.mockImplementation(() => slowWebSocket);

      const connectPromise = securityService.connect();

      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(15000);

      await expect(connectPromise).rejects.toThrow(
        'WebSocket connection timeout'
      );
    });

    test('should authenticate connection after establishing', async () => {
      securityService.userId = 'user123';
      securityService.sessionId = 'session456';

      await securityService.connect();

      securityService.authenticateConnection();

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"authenticate"')
      );
    });

    test('should handle connection errors', async () => {
      const errorSpy = vi.fn();
      securityService.on('error', errorSpy);

      await securityService.connect();

      // Simulate connection error
      const errorEvent = new Error('Network error');
      securityService.websocket.onerror(errorEvent);

      expect(errorSpy).toHaveBeenCalledWith(errorEvent);
    });

    test('should schedule reconnection on unexpected disconnect', async () => {
      await securityService.connect();

      const scheduleReconnectSpy = vi.spyOn(
        securityService,
        'scheduleReconnect'
      );

      // Simulate unexpected disconnect (code !== 1000)
      securityService.websocket.onclose({
        code: 1006,
        reason: 'Network error',
      });

      expect(scheduleReconnectSpy).toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await securityService.initialize('user123', 'session456');
    });

    test('should handle threat detection messages', () => {
      const threatPayload = {
        threatId: 'threat_123',
        threatType: 'brute_force_attack',
        severity: 'high',
        confidence: 0.9,
        source: '192.168.1.100',
        target: 'user123',
        timestamp: Date.now(),
        metadata: { attempts: 5 },
      };

      const threatDetectedSpy = vi.fn();
      securityService.on('threatDetected', threatDetectedSpy);

      const message = {
        data: JSON.stringify({
          type: 'threat_detected',
          payload: threatPayload,
        }),
      };

      securityService.handleMessage(message);

      expect(threatDetectedSpy).toHaveBeenCalledWith(threatPayload);
      expect(securityService.metrics.activeThreats.has('threat_123')).toBe(
        true
      );
    });

    test('should handle security alerts', () => {
      const alertPayload = {
        alertId: 'alert_123',
        alertType: 'suspicious_login',
        severity: 'medium',
        message: 'Login from unusual location',
        timestamp: Date.now(),
        actionRequired: false,
      };

      const securityAlertSpy = vi.fn();
      securityService.on('securityAlert', securityAlertSpy);

      const message = {
        data: JSON.stringify({
          type: 'security_alert',
          payload: alertPayload,
        }),
      };

      securityService.handleMessage(message);

      expect(securityAlertSpy).toHaveBeenCalledWith(alertPayload);
      expect(securityService.metrics.alertsCount).toBe(1);
    });

    test('should handle risk score updates', () => {
      const riskUpdatePayload = {
        sessionId: 'session456',
        newRiskScore: 0.7,
        previousRiskScore: 0.3,
        factors: ['location_change', 'device_change'],
        timestamp: Date.now(),
      };

      const riskScoreUpdatedSpy = vi.fn();
      securityService.on('riskScoreUpdated', riskScoreUpdatedSpy);

      const message = {
        data: JSON.stringify({
          type: 'risk_score_update',
          payload: riskUpdatePayload,
        }),
      };

      securityService.handleMessage(message);

      expect(riskScoreUpdatedSpy).toHaveBeenCalledWith(riskUpdatePayload);
    });

    test('should handle behavior anomalies', () => {
      const anomalyPayload = {
        anomalyType: 'keystroke_pattern',
        severity: 'medium',
        confidence: 0.8,
        behaviorData: { avgDelay: 150, rhythm: 'irregular' },
        timestamp: Date.now(),
      };

      const behaviorAnomalySpy = vi.fn();
      securityService.on('behaviorAnomaly', behaviorAnomalySpy);

      const message = {
        data: JSON.stringify({
          type: 'behavior_anomaly',
          payload: anomalyPayload,
        }),
      };

      securityService.handleMessage(message);

      expect(behaviorAnomalySpy).toHaveBeenCalledWith(anomalyPayload);
    });

    test('should handle automated responses', () => {
      const responsePayload = {
        responseType: 'ip_block',
        action: 'block_suspicious_ip',
        target: '192.168.1.100',
        result: 'success',
        timestamp: Date.now(),
      };

      const automatedResponseSpy = vi.fn();
      securityService.on('automatedResponse', automatedResponseSpy);

      const message = {
        data: JSON.stringify({
          type: 'automated_response',
          payload: responsePayload,
        }),
      };

      securityService.handleMessage(message);

      expect(automatedResponseSpy).toHaveBeenCalledWith(responsePayload);
    });

    test('should handle malformed messages gracefully', () => {
      const message = {
        data: 'invalid json',
      };

      expect(() => {
        securityService.handleMessage(message);
      }).not.toThrow();

      expect(mockConsole.error).toHaveBeenCalledWith(
        'Failed to parse WebSocket message:',
        expect.any(Error)
      );
    });
  });

  describe('Threat Detection', () => {
    beforeEach(async () => {
      await securityService.initialize('user123', 'session456');
    });

    test('should trigger automated response for high severity threats', () => {
      const threatPayload = {
        threatId: 'threat_critical',
        threatType: 'account_takeover',
        severity: 'critical',
        confidence: 0.9,
      };

      const triggerSpy = vi.spyOn(securityService, 'triggerAutomatedResponse');

      securityService.handleThreatDetection(threatPayload);

      expect(triggerSpy).toHaveBeenCalledWith(threatPayload);
    });

    test('should not trigger automated response for low severity threats', () => {
      const threatPayload = {
        threatId: 'threat_low',
        threatType: 'unusual_behavior',
        severity: 'low',
        confidence: 0.4,
      };

      const triggerSpy = vi.spyOn(securityService, 'triggerAutomatedResponse');

      securityService.handleThreatDetection(threatPayload);

      expect(triggerSpy).not.toHaveBeenCalled();
    });

    test('should detect brute force patterns', () => {
      const loginFailures = Array.from({ length: 6 }, (_, i) => ({
        userId: 'user123',
        ip: '192.168.1.100',
        timestamp: Date.now() - i * 10000, // 10 seconds apart
      }));

      const reportThreatSpy = vi.spyOn(securityService, 'reportThreat');

      // Simulate multiple failed login attempts
      loginFailures.forEach((failure) => {
        securityService.emit('loginFailed', failure);
      });

      expect(reportThreatSpy).toHaveBeenCalledWith(
        'brute_force_attack',
        expect.objectContaining({
          target: 'user123',
          attempts: expect.any(Number),
        })
      );
    });

    test('should generate unique threat IDs', () => {
      const id1 = securityService.generateThreatId();
      const id2 = securityService.generateThreatId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^threat_\d+_[a-z0-9]+$/);
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await securityService.initialize('user123', 'session456');
    });

    test('should update monitoring configuration', () => {
      const newConfig = {
        threatDetection: false,
        behaviorAnalysis: true,
        realTimeAlerts: false,
      };

      securityService.updateConfiguration(newConfig);

      expect(securityService.monitoringConfig.threatDetection).toBe(false);
      expect(securityService.monitoringConfig.behaviorAnalysis).toBe(true);
      expect(securityService.monitoringConfig.realTimeAlerts).toBe(false);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"update_configuration"')
      );
    });

    test('should preserve existing configuration when updating', () => {
      const originalConfig = { ...securityService.monitoringConfig };

      securityService.updateConfiguration({
        threatDetection: false,
      });

      expect(securityService.monitoringConfig.behaviorAnalysis).toBe(
        originalConfig.behaviorAnalysis
      );
    });
  });

  describe('Metrics and Monitoring', () => {
    beforeEach(async () => {
      await securityService.initialize('user123', 'session456');
    });

    test('should track active threats', () => {
      const threatPayload = {
        threatId: 'threat_123',
        threatType: 'suspicious_activity',
        severity: 'medium',
        confidence: 0.7,
        source: 'client',
        target: 'user123',
        timestamp: Date.now(),
      };

      securityService.handleThreatDetection(threatPayload);

      const metrics = securityService.getMetrics();
      expect(metrics.activeThreats.has('threat_123')).toBe(true);
      expect(metrics.isConnected).toBe(true);
    });

    test('should track alerts count', () => {
      const initialCount = securityService.metrics.alertsCount;

      securityService.handleSecurityAlert({
        alertType: 'test_alert',
        severity: 'low',
        message: 'Test alert',
      });

      expect(securityService.metrics.alertsCount).toBe(initialCount + 1);
    });

    test('should update last threat detected timestamp', () => {
      const threatPayload = {
        threatId: 'threat_123',
        threatType: 'test_threat',
        severity: 'low',
        confidence: 0.5,
        timestamp: Date.now(),
      };

      securityService.handleThreatDetection(threatPayload);

      expect(securityService.metrics.lastThreatDetected).toBeTruthy();
      expect(securityService.metrics.lastThreatDetected).toBeInstanceOf(Date);
    });
  });

  describe('Event Handling', () => {
    test('should support event listeners', () => {
      const listener = vi.fn();

      securityService.on('test_event', listener);
      securityService.emit('test_event', { data: 'test' });

      expect(listener).toHaveBeenCalledWith({ data: 'test' });
    });

    test('should remove event listeners', () => {
      const listener = vi.fn();

      securityService.on('test_event', listener);
      securityService.off('test_event', listener);
      securityService.emit('test_event', { data: 'test' });

      expect(listener).not.toHaveBeenCalled();
    });

    test('should handle errors in event listeners gracefully', () => {
      const badListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      securityService.on('test_event', badListener);

      expect(() => {
        securityService.emit('test_event', { data: 'test' });
      }).not.toThrow();

      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error in event listener for test_event:',
        expect.any(Error)
      );
    });
  });

  describe('Heartbeat and Connection Health', () => {
    beforeEach(async () => {
      vi.useFakeTimers();
      await securityService.initialize('user123', 'session456');
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('should send heartbeat messages', () => {
      securityService.startHeartbeat();

      // Fast-forward time to trigger heartbeat
      vi.advanceTimersByTime(35000); // Past heartbeat interval

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"heartbeat"')
      );
    });

    test('should stop heartbeat on disconnect', () => {
      securityService.startHeartbeat();
      securityService.stopHeartbeat();

      // Fast-forward time
      vi.advanceTimersByTime(35000);

      // Should not send heartbeat after stopping
      const heartbeatCalls = mockWebSocket.send.mock.calls.filter((call) =>
        call[0].includes('"type":"heartbeat"')
      );
      expect(heartbeatCalls.length).toBe(0);
    });
  });

  describe('Cleanup and Destruction', () => {
    test('should disconnect cleanly', () => {
      securityService.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalledWith(
        1000,
        'Client disconnect'
      );
      expect(securityService.isConnected).toBe(false);
    });

    test('should clear all data on destroy', () => {
      // Add some test data
      securityService.metrics.activeThreats.set('test_threat', {});
      securityService.threatPatterns.networkAnomaly.suspiciousIPs.add(
        '192.168.1.1'
      );

      securityService.destroy();

      expect(securityService.metrics.activeThreats.size).toBe(0);
      expect(
        securityService.threatPatterns.networkAnomaly.suspiciousIPs.size
      ).toBe(0);
      expect(securityService.isConnected).toBe(false);
    });
  });

  describe('Browser Notifications', () => {
    beforeEach(async () => {
      await securityService.initialize('user123', 'session456');
    });

    test('should show browser notifications for security alerts', () => {
      const NotificationSpy = vi.spyOn(global, 'Notification');

      securityService.showBrowserNotification(
        'Security Alert',
        'Suspicious activity detected',
        'high'
      );

      expect(NotificationSpy).toHaveBeenCalledWith(
        'Security Alert',
        expect.objectContaining({
          body: 'Suspicious activity detected',
          icon: expect.stringContaining('alert-high.png'),
        })
      );
    });

    test('should handle missing notification permission gracefully', () => {
      global.Notification.permission = 'denied';

      expect(() => {
        securityService.showBrowserNotification(
          'Security Alert',
          'Test message',
          'medium'
        );
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle WebSocket send errors gracefully', async () => {
      await securityService.initialize('user123', 'session456');

      // Mock send method to throw error
      mockWebSocket.send.mockImplementation(() => {
        throw new Error('Send failed');
      });

      expect(() => {
        securityService.sendMessage({ type: 'test' });
      }).not.toThrow();

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Cannot send message - WebSocket not connected'
      );
    });

    test('should handle initialization errors', async () => {
      const badService = new RealTimeSecurityMonitoringService();
      badService.connect = vi
        .fn()
        .mockRejectedValue(new Error('Network error'));

      await expect(
        badService.initialize('user123', 'session456')
      ).rejects.toThrow('Network error');
    });
  });
});
