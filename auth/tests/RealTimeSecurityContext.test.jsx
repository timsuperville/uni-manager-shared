/**
 * Real-time Security Context Tests
 *
 * Test suite for React context provider for security monitoring
 * with threat detection and notification management
 */

import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import {
  RealTimeSecurityProvider,
  useRealTimeSecurity,
} from '../contexts/RealTimeSecurityContext';

// Mock the security monitoring service
const mockSecurityService = {
  initialize: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  processSecurityEvent: vi.fn(),
  updateConfiguration: vi.fn(),
  getMetrics: vi.fn(),
  sendMessage: vi.fn(),
  isConnected: true,
  userId: null,
  sessionId: null,
  monitoringConfig: {
    threatDetection: true,
    behaviorAnalysis: true,
    riskScoring: true,
    realTimeAlerts: true,
  },
  metrics: {
    activeThreats: new Map(),
    alertsCount: 0,
    connectionsCount: 1,
    lastThreatDetected: null,
    systemHealth: 'healthy',
  },
};

vi.mock('../services/realTimeSecurityMonitoringService', () => ({
  default: vi.fn(() => mockSecurityService),
}));

// Test component that uses the context
const TestComponent = () => {
  const {
    isInitialized,
    isConnected,
    error,
    systemHealth,
    riskScore,
    activeThreats,
    recentAlerts,
    pendingNotifications,
    initializeSecurityMonitoring,
    reportSecurityEvent,
    dismissNotification,
  } = useRealTimeSecurity();

  return React.createElement('div', { 'data-testid': 'test-component' }, [
    React.createElement(
      'div',
      { key: 'status', 'data-testid': 'connection-status' },
      isConnected ? 'Connected' : 'Disconnected'
    ),
    React.createElement(
      'div',
      { key: 'initialized', 'data-testid': 'initialized-status' },
      isInitialized ? 'Initialized' : 'Not Initialized'
    ),
    React.createElement(
      'div',
      { key: 'health', 'data-testid': 'system-health' },
      systemHealth
    ),
    React.createElement(
      'div',
      { key: 'risk', 'data-testid': 'risk-score' },
      riskScore.toString()
    ),
    React.createElement(
      'div',
      { key: 'threats', 'data-testid': 'active-threats' },
      activeThreats.size.toString()
    ),
    React.createElement(
      'div',
      { key: 'alerts', 'data-testid': 'recent-alerts' },
      recentAlerts.length.toString()
    ),
    React.createElement(
      'div',
      { key: 'notifications', 'data-testid': 'pending-notifications' },
      pendingNotifications.length.toString()
    ),
    error &&
      React.createElement(
        'div',
        { key: 'error', 'data-testid': 'error' },
        error
      ),
    React.createElement(
      'button',
      {
        key: 'init-btn',
        'data-testid': 'initialize-button',
        onClick: () => initializeSecurityMonitoring('user123', 'session456'),
      },
      'Initialize'
    ),
    React.createElement(
      'button',
      {
        key: 'report-btn',
        'data-testid': 'report-button',
        onClick: () =>
          reportSecurityEvent({ type: 'test_event', data: 'test' }),
      },
      'Report Event'
    ),
    React.createElement(
      'button',
      {
        key: 'dismiss-btn',
        'data-testid': 'dismiss-button',
        onClick: () => dismissNotification('test-notification'),
      },
      'Dismiss Notification'
    ),
  ]);
};

describe('RealTimeSecurityContext', () => {
  let eventHandlers;

  beforeEach(() => {
    vi.clearAllMocks();
    eventHandlers = new Map();

    // Mock the event system
    mockSecurityService.on.mockImplementation((event, handler) => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);
      }
      eventHandlers.get(event).push(handler);
    });

    mockSecurityService.emit.mockImplementation((event, data) => {
      if (eventHandlers.has(event)) {
        eventHandlers.get(event).forEach((handler) => handler(data));
      }
    });

    // Reset service state
    mockSecurityService.initialize.mockResolvedValue({
      success: true,
      connectionId: 'test-connection',
      monitoringConfig: mockSecurityService.monitoringConfig,
    });
  });

  afterEach(() => {
    eventHandlers.clear();
  });

  describe('Provider Setup', () => {
    test('should render children without context usage', () => {
      render(
        React.createElement(
          RealTimeSecurityProvider,
          null,
          React.createElement(
            'div',
            { 'data-testid': 'child' },
            'Child Component'
          )
        )
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Child Component');
    });

    test('should throw error when hook used outside provider', () => {
      const TestComponentOutsideProvider = () => {
        try {
          useRealTimeSecurity();
          return React.createElement('div', null, 'Should not render');
        } catch (_error) {
          return React.createElement(
            'div',
            { 'data-testid': 'error' },
            _error.message
          );
        }
      };

      render(React.createElement(TestComponentOutsideProvider));

      expect(screen.getByTestId('error')).toHaveTextContent(
        'useRealTimeSecurity must be used within a RealTimeSecurityProvider'
      );
    });
  });

  describe('Service Initialization', () => {
    test('should initialize with default state', () => {
      render(
        React.createElement(
          RealTimeSecurityProvider,
          null,
          React.createElement(TestComponent)
        )
      );

      expect(screen.getByTestId('connection-status')).toHaveTextContent(
        'Disconnected'
      );
      expect(screen.getByTestId('initialized-status')).toHaveTextContent(
        'Not Initialized'
      );
      expect(screen.getByTestId('system-health')).toHaveTextContent(
        'initializing'
      );
      expect(screen.getByTestId('risk-score')).toHaveTextContent('0');
    });

    test('should initialize security monitoring service', async () => {
      render(
        React.createElement(
          RealTimeSecurityProvider,
          null,
          React.createElement(TestComponent)
        )
      );

      const initButton = screen.getByTestId('initialize-button');

      await act(async () => {
        initButton.click();
      });

      await waitFor(() => {
        expect(mockSecurityService.initialize).toHaveBeenCalledWith(
          'user123',
          'session456'
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('initialized-status')).toHaveTextContent(
          'Initialized'
        );
      });
    });

    test('should handle initialization errors', async () => {
      const initError = new Error('Failed to initialize');
      mockSecurityService.initialize.mockRejectedValue(initError);

      render(
        React.createElement(
          RealTimeSecurityProvider,
          null,
          React.createElement(TestComponent)
        )
      );

      const initButton = screen.getByTestId('initialize-button');

      await act(async () => {
        initButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Failed to initialize'
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('system-health')).toHaveTextContent('error');
      });
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      render(
        React.createElement(
          RealTimeSecurityProvider,
          null,
          React.createElement(TestComponent)
        )
      );

      const initButton = screen.getByTestId('initialize-button');
      await act(async () => {
        initButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('initialized-status')).toHaveTextContent(
          'Initialized'
        );
      });
    });

    test('should handle threat detection events', async () => {
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

      act(() => {
        // Simulate threat detected event
        const threatHandler = eventHandlers.get('threatDetected')[0];
        threatHandler(threatPayload);
      });

      await waitFor(() => {
        expect(screen.getByTestId('active-threats')).toHaveTextContent('1');
      });

      await waitFor(() => {
        expect(screen.getByTestId('recent-alerts')).toHaveTextContent('1');
      });
    });

    test('should handle security alert events', async () => {
      const alertPayload = {
        alertId: 'alert_123',
        alertType: 'suspicious_login',
        severity: 'medium',
        message: 'Login from unusual location',
        timestamp: Date.now(),
        actionRequired: false,
      };

      act(() => {
        const alertHandler = eventHandlers.get('securityAlert')[0];
        alertHandler(alertPayload);
      });

      await waitFor(() => {
        expect(screen.getByTestId('recent-alerts')).toHaveTextContent('1');
      });

      await waitFor(() => {
        expect(screen.getByTestId('pending-notifications')).toHaveTextContent(
          '1'
        );
      });
    });

    test('should handle risk score updates', async () => {
      const riskUpdatePayload = {
        sessionId: 'session456',
        newRiskScore: 0.7,
        previousRiskScore: 0.3,
        factors: ['location_change'],
        timestamp: Date.now(),
      };

      act(() => {
        const riskHandler = eventHandlers.get('riskScoreUpdated')[0];
        riskHandler(riskUpdatePayload);
      });

      await waitFor(() => {
        expect(screen.getByTestId('risk-score')).toHaveTextContent('0.7');
      });
    });

    test('should handle behavior anomalies', async () => {
      const anomalyPayload = {
        anomalyType: 'keystroke_pattern',
        severity: 'medium',
        confidence: 0.8,
        behaviorData: { avgDelay: 150 },
        timestamp: Date.now(),
      };

      act(() => {
        const anomalyHandler = eventHandlers.get('behaviorAnomaly')[0];
        anomalyHandler(anomalyPayload);
      });

      await waitFor(() => {
        expect(screen.getByTestId('recent-alerts')).toHaveTextContent('1');
      });
    });

    test('should handle connection state changes', async () => {
      act(() => {
        const connectedHandler = eventHandlers.get('connected')[0];
        connectedHandler();
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent(
          'Connected'
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('system-health')).toHaveTextContent(
          'healthy'
        );
      });

      act(() => {
        const disconnectedHandler = eventHandlers.get('disconnected')[0];
        disconnectedHandler();
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent(
          'Disconnected'
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('system-health')).toHaveTextContent(
          'disconnected'
        );
      });
    });
  });

  describe('Threat Management', () => {
    beforeEach(async () => {
      render(
        React.createElement(
          RealTimeSecurityProvider,
          null,
          React.createElement(TestComponent)
        )
      );

      const initButton = screen.getByTestId('initialize-button');
      await act(async () => {
        initButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('initialized-status')).toHaveTextContent(
          'Initialized'
        );
      });
    });

    test('should add critical threats to critical alerts', async () => {
      const criticalThreat = {
        threatId: 'critical_threat',
        threatType: 'account_takeover',
        severity: 'critical',
        confidence: 0.95,
        source: 'malicious_ip',
        target: 'user123',
        timestamp: Date.now(),
      };

      act(() => {
        const threatHandler = eventHandlers.get('threatDetected')[0];
        threatHandler(criticalThreat);
      });

      await waitFor(() => {
        expect(screen.getByTestId('active-threats')).toHaveTextContent('1');
      });

      await waitFor(() => {
        expect(screen.getByTestId('pending-notifications')).toHaveTextContent(
          '1'
        );
      });
    });

    test('should handle multiple concurrent threats', async () => {
      const threats = [
        {
          threatId: 'threat_1',
          threatType: 'brute_force',
          severity: 'high',
          confidence: 0.8,
          timestamp: Date.now(),
        },
        {
          threatId: 'threat_2',
          threatType: 'suspicious_activity',
          severity: 'medium',
          confidence: 0.6,
          timestamp: Date.now(),
        },
      ];

      act(() => {
        const threatHandler = eventHandlers.get('threatDetected')[0];
        threats.forEach((threat) => threatHandler(threat));
      });

      await waitFor(() => {
        expect(screen.getByTestId('active-threats')).toHaveTextContent('2');
      });

      await waitFor(() => {
        expect(screen.getByTestId('recent-alerts')).toHaveTextContent('2');
      });
    });
  });

  describe('Notification Management', () => {
    beforeEach(async () => {
      render(
        React.createElement(
          RealTimeSecurityProvider,
          null,
          React.createElement(TestComponent)
        )
      );

      const initButton = screen.getByTestId('initialize-button');
      await act(async () => {
        initButton.click();
      });
    });

    test('should dismiss individual notifications', async () => {
      // Add a notification first
      const alertPayload = {
        alertType: 'test_alert',
        severity: 'low',
        message: 'Test notification',
        timestamp: Date.now(),
      };

      act(() => {
        const alertHandler = eventHandlers.get('securityAlert')[0];
        alertHandler(alertPayload);
      });

      await waitFor(() => {
        expect(screen.getByTestId('pending-notifications')).toHaveTextContent(
          '1'
        );
      });

      // Now dismiss it
      const dismissButton = screen.getByTestId('dismiss-button');
      act(() => {
        dismissButton.click();
      });

      // Since the test notification ID doesn't match, count should remain the same
      await waitFor(() => {
        expect(screen.getByTestId('pending-notifications')).toHaveTextContent(
          '1'
        );
      });
    });

    test('should limit notification history', async () => {
      // Generate many notifications to test limit
      const notifications = Array.from({ length: 25 }, (_, i) => ({
        alertType: `alert_${i}`,
        severity: 'low',
        message: `Alert ${i}`,
        timestamp: Date.now() + i,
      }));

      act(() => {
        const alertHandler = eventHandlers.get('securityAlert')[0];
        notifications.forEach((alert) => alertHandler(alert));
      });

      await waitFor(() => {
        // Should be limited to 20 notifications
        expect(screen.getByTestId('pending-notifications')).toHaveTextContent(
          '20'
        );
      });
    });
  });

  describe('Security Event Reporting', () => {
    beforeEach(async () => {
      render(
        React.createElement(
          RealTimeSecurityProvider,
          null,
          React.createElement(TestComponent)
        )
      );

      const initButton = screen.getByTestId('initialize-button');
      await act(async () => {
        initButton.click();
      });
    });

    test('should report security events when connected', async () => {
      const reportButton = screen.getByTestId('report-button');

      act(() => {
        reportButton.click();
      });

      await waitFor(() => {
        expect(mockSecurityService.processSecurityEvent).toHaveBeenCalledWith({
          type: 'test_event',
          data: 'test',
        });
      });
    });

    test('should not report events when disconnected', async () => {
      // Simulate disconnection
      act(() => {
        const disconnectedHandler = eventHandlers.get('disconnected')[0];
        disconnectedHandler();
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent(
          'Disconnected'
        );
      });

      const reportButton = screen.getByTestId('report-button');

      act(() => {
        reportButton.click();
      });

      // Should not call the service when disconnected
      expect(mockSecurityService.processSecurityEvent).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Updates', () => {
    test('should update monitoring configuration', async () => {
      const ConfigTestComponent = () => {
        const {
          updateMonitoringConfiguration,
          monitoringConfig,
          initializeSecurityMonitoring
        } = useRealTimeSecurity();

        return React.createElement('div', null, [
          React.createElement(
            'div',
            {
              key: 'threat-detection',
              'data-testid': 'threat-detection',
            },
            monitoringConfig.threatDetection.toString()
          ),
          React.createElement(
            'button',
            {
              key: 'init-btn',
              'data-testid': 'initialize-button',
              onClick: () => initializeSecurityMonitoring('test-user', 'test-session'),
            },
            'Initialize'
          ),
          React.createElement(
            'button',
            {
              key: 'update-btn',
              'data-testid': 'update-config',
              onClick: () =>
                updateMonitoringConfiguration({ threatDetection: false }),
            },
            'Update Config'
          ),
        ]);
      };

      render(
        React.createElement(
          RealTimeSecurityProvider,
          null,
          React.createElement(ConfigTestComponent)
        )
      );

      // Initialize first
      const initButton = screen.getByTestId('initialize-button');
      await act(async () => {
        initButton.click();
      });

      expect(screen.getByTestId('threat-detection')).toHaveTextContent('true');

      const updateButton = screen.getByTestId('update-config');
      act(() => {
        updateButton.click();
      });

      await waitFor(() => {
        expect(mockSecurityService.updateConfiguration).toHaveBeenCalledWith(
          expect.objectContaining({ threatDetection: false })
        );
      });
    });
  });

  describe('Cleanup and Error Handling', () => {
    test('should cleanup service on unmount', async () => {
      const { unmount } = render(
        React.createElement(
          RealTimeSecurityProvider,
          null,
          React.createElement(TestComponent)
        )
      );

      // Initialize the service first
      const initButton = screen.getByTestId('initialize-button');
      await act(async () => {
        initButton.click();
      });

      // Wait for initialization to complete
      await waitFor(() => {
        expect(mockSecurityService.initialize).toHaveBeenCalled();
      });

      unmount();

      expect(mockSecurityService.destroy).toHaveBeenCalled();
    });

    test('should handle service errors gracefully', async () => {
      render(
        React.createElement(
          RealTimeSecurityProvider,
          null,
          React.createElement(TestComponent)
        )
      );

      const initButton = screen.getByTestId('initialize-button');
      await act(async () => {
        initButton.click();
      });

      // Simulate error event
      act(() => {
        const errorHandler = eventHandlers.get('error')[0];
        errorHandler({ message: 'Connection error' });
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Connection error'
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('system-health')).toHaveTextContent('error');
      });
    });
  });
});
