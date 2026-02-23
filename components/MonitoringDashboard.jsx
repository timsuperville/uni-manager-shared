/**
 * Advanced Monitoring Dashboard Component
 *
 * Real-time monitoring dashboard with:
 * - System metrics visualization
 * - Health status indicators
 * - Performance charts
 * - Alert management
 * - Auto-refresh capabilities
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/Card";
import { Alert, AlertDescription, AlertTitle } from "./ui/Alert";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Monitor,
  Server,
  Database,
  Wifi,
  RefreshCw,
} from "lucide-react";

const MonitoringDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/monitoring/dashboard");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
        setLastUpdate(new Date());
      } else {
        throw new Error(result.error || "Failed to fetch dashboard data");
      }
    } catch (err) {
      setError(err.message);
      if (import.meta.env.DEV) {
        console.error("Dashboard fetch error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 10000); // 10 seconds
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, autoRefresh]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Resolve alert
  const resolveAlert = async (alertId) => {
    try {
      const response = await fetch(
        `/api/monitoring/alerts/${alertId}/resolve`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to resolve alert:", err);
      }
    }
  };

  // Format uptime
  const formatUptime = (uptimeMs) => {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value?.toFixed(1) || 0}%`;
  };

  // Get status color
  const getStatusColor = (isHealthy) => {
    return isHealthy ? "text-green-600" : "text-red-600";
  };

  // Get status icon
  const getStatusIcon = (isHealthy) => {
    return isHealthy ? (
      <CheckCircle className="h-4 w-4" />
    ) : (
      <XCircle className="h-4 w-4" />
    );
  };

  // Get alert severity color
  const getAlertSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading monitoring dashboard...</span>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="p-6">
        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Monitoring Error</AlertTitle>
          <AlertDescription>
            Failed to load monitoring dashboard: {error}
            <Button
              onClick={handleRefresh}
              className="ml-2"
              size="sm"
              variant="outline"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { status, latestMetrics, healthCheck, activeAlerts, recentMetrics } =
    dashboardData || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Advanced Monitoring Dashboard</h1>
          <p className="text-gray-600">
            Real-time system monitoring and alerting
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={toggleAutoRefresh}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <Activity className="h-4 w-4 mr-1" />
            Auto-refresh {autoRefresh ? "ON" : "OFF"}
          </Button>
          <Button onClick={handleRefresh} size="sm" variant="outline">
            <RefreshCw
              className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={getStatusColor(status?.running)}>
                {getStatusIcon(status?.running)}
              </div>
              <div className="text-2xl font-bold">
                {status?.running ? "Online" : "Offline"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {status?.uptime ? formatUptime(status.uptime) : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={getStatusColor(healthCheck?.overall)}>
                {getStatusIcon(healthCheck?.overall)}
              </div>
              <div className="text-2xl font-bold">
                {healthCheck?.overall ? "Healthy" : "Issues"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Last check:{" "}
              {healthCheck?.timestamp
                ? new Date(healthCheck.timestamp).toLocaleTimeString()
                : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeAlerts?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeAlerts?.length === 0
                ? "No active alerts"
                : `${activeAlerts.length} requiring attention`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.metrics?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Collected metrics</p>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      {latestMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CPU Usage</CardTitle>
              <CardDescription>Current CPU utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {formatPercentage(latestMetrics.system?.cpu?.usage)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, latestMetrics.system?.cpu?.usage || 0)}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {latestMetrics.system?.cpu?.count} cores @{" "}
                {latestMetrics.system?.cpu?.speed}MHz
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Memory Usage</CardTitle>
              <CardDescription>Current memory utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {formatPercentage(latestMetrics.system?.memory?.percentage)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, latestMetrics.system?.memory?.percentage || 0)}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {latestMetrics.system?.memory?.used
                  ? `${(latestMetrics.system.memory.used / 1024 / 1024 / 1024).toFixed(1)}GB used`
                  : "Memory info unavailable"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Load Average</CardTitle>
              <CardDescription>System load over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {latestMetrics.system?.load?.avg1?.toFixed(2) || "0.00"}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>1m:</span>
                  <span>
                    {latestMetrics.system?.load?.avg1?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>5m:</span>
                  <span>
                    {latestMetrics.system?.load?.avg5?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>15m:</span>
                  <span>
                    {latestMetrics.system?.load?.avg15?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Health Checks */}
      {healthCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Health Checks</CardTitle>
            <CardDescription>Detailed system health status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <div
                  className={getStatusColor(
                    healthCheck.checks?.system?.healthy,
                  )}
                >
                  {getStatusIcon(healthCheck.checks?.system?.healthy)}
                </div>
                <div>
                  <div className="font-medium">System</div>
                  <div className="text-sm text-gray-600">
                    CPU:{" "}
                    {formatPercentage(healthCheck.checks?.system?.metrics?.cpu)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div
                  className={getStatusColor(
                    healthCheck.checks?.application?.healthy,
                  )}
                >
                  {getStatusIcon(healthCheck.checks?.application?.healthy)}
                </div>
                <div>
                  <div className="font-medium">Application</div>
                  <div className="text-sm text-gray-600">Event loop & deps</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div
                  className={getStatusColor(
                    healthCheck.checks?.database?.healthy,
                  )}
                >
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">Database</div>
                  <div className="text-sm text-gray-600">
                    Connection & queries
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div
                  className={getStatusColor(
                    healthCheck.checks?.external?.healthy,
                  )}
                >
                  <Wifi className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">External</div>
                  <div className="text-sm text-gray-600">
                    APIs & integrations
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      {activeAlerts && activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Alerts</CardTitle>
            <CardDescription>Alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <Badge variant="outline">
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{alert.type}</span>
                  </div>
                  <Button
                    onClick={() => resolveAlert(alert.id)}
                    size="sm"
                    variant="outline"
                  >
                    Resolve
                  </Button>
                </div>
                <p className="text-sm mt-1">{alert.message}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        {lastUpdate && <p>Last updated: {lastUpdate.toLocaleTimeString()}</p>}
        <p>Advanced Monitoring System v1.0</p>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
