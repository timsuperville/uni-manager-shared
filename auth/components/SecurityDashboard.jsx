/**
 * Security Dashboard Component
 *
 * Displays comprehensive security monitoring information including:
 * - Real-time security statistics
 * - Recent security events
 * - Threat analysis and alerts
 * - Rate limiting status
 * - Fraud detection metrics
 */

import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import securityService from "../services/securityService";

const SecurityDashboard = ({
  refreshInterval = 30000, // 30 seconds
  className = "",
  onSecurityAlert = null,
}) => {
  const [securityStats, setSecurityStats] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState(24 * 60 * 60 * 1000); // 24 hours
  const [autoRefresh, setAutoRefresh] = useState(true);

  /**
   * Load security data
   */
  const loadSecurityData = useCallback(async () => {
    try {
      setError(null);

      // Load security statistics
      const stats = securityService.getSecurityStats(timeframe);
      setSecurityStats(stats);

      // Load recent security events
      const events = securityService.getSecurityEvents(50);
      setSecurityEvents(events);

      // Check for high-risk events
      const highRiskEvents = events.filter(
        (event) => event.severity === "high"
      );
      if (highRiskEvents.length > 0 && onSecurityAlert) {
        onSecurityAlert({
          type: "high_risk_events",
          count: highRiskEvents.length,
          events: highRiskEvents,
        });
      }
    } catch (err) {
      console.error("Error loading security data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timeframe, onSecurityAlert]);

  /**
   * Effect for initial load and auto-refresh
   */
  useEffect(() => {
    loadSecurityData();

    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(loadSecurityData, refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadSecurityData, refreshInterval, autoRefresh]);

  /**
   * Handle timeframe change
   */
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  /**
   * Get security score color
   */
  const getSecurityScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  /**
   * Get event severity badge
   */
  const getEventSeverityBadge = (severity) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (severity) {
      case "high":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "medium":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "low":
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  /**
   * Format timeframe options
   */
  const timeframeOptions = [
    { value: 60 * 60 * 1000, label: "1 Hour" },
    { value: 6 * 60 * 60 * 1000, label: "6 Hours" },
    { value: 24 * 60 * 60 * 1000, label: "24 Hours" },
    { value: 7 * 24 * 60 * 60 * 1000, label: "7 Days" },
    { value: 30 * 24 * 60 * 60 * 1000, label: "30 Days" },
  ];

  if (loading) {
    return (
      <div className={`security-dashboard ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading security data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`security-dashboard ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Security Data
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={loadSecurityData}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`security-dashboard space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Security Dashboard</h2>
        <div className="flex items-center space-x-4">
          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => handleTimeframeChange(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeframeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Auto-refresh Toggle */}
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-refresh</span>
          </label>

          {/* Manual Refresh */}
          <button
            onClick={loadSecurityData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Security Overview Cards */}
      {securityStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Security Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div
                  className={`text-3xl font-bold ${getSecurityScoreColor(securityStats.securityScore)}`}
                >
                  {securityStats.securityScore}
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">
                  Security Score
                </div>
                <div className="text-xs text-gray-400">
                  {securityStats.securityScore >= 80
                    ? "Excellent"
                    : securityStats.securityScore >= 60
                      ? "Good"
                      : "Needs Attention"}
                </div>
              </div>
            </div>
          </div>

          {/* Total Events */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl font-bold text-blue-600">
                  {securityStats.totalEvents}
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">
                  Security Events
                </div>
                <div className="text-xs text-gray-400">
                  Last{" "}
                  {timeframeOptions.find((o) => o.value === timeframe)?.label}
                </div>
              </div>
            </div>
          </div>

          {/* High Risk Events */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div
                  className={`text-3xl font-bold ${securityStats.highRiskEvents > 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {securityStats.highRiskEvents}
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">
                  High Risk Events
                </div>
                <div className="text-xs text-gray-400">Requires attention</div>
              </div>
            </div>
          </div>

          {/* Active Rate Limits */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div
                  className={`text-3xl font-bold ${securityStats.activeRateLimits > 0 ? "text-orange-600" : "text-green-600"}`}
                >
                  {securityStats.activeRateLimits}
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">
                  Active Rate Limits
                </div>
                <div className="text-xs text-gray-400">Currently blocked</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Types Breakdown */}
      {securityStats &&
        securityStats.eventsByType &&
        Object.keys(securityStats.eventsByType).length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Event Types</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(securityStats.eventsByType).map(
                  ([eventType, count]) => (
                    <div key={eventType} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {count}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {eventType.replace(/_/g, " ")}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

      {/* Recent Security Events */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Security Events
          </h3>
        </div>
        <div className="overflow-hidden">
          {securityEvents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No security events in the selected timeframe
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {securityEvents.slice(0, 20).map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(event.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {event.type.replace(/_/g, " ")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getEventSeverityBadge(event.severity)}>
                          {event.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {event.data && (
                          <div className="max-w-xs truncate">
                            {typeof event.data === "object"
                              ? JSON.stringify(event.data, null, 0).substring(
                                  0,
                                  100
                                ) + "..."
                              : String(event.data).substring(0, 100)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

SecurityDashboard.propTypes = {
  refreshInterval: PropTypes.number,
  className: PropTypes.string,
  onSecurityAlert: PropTypes.func,
};

export default SecurityDashboard;
