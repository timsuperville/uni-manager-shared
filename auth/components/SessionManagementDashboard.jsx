/**
 * Session Management Dashboard Component
 *
 * Provides comprehensive session management interface including:
 * - Active session monitoring and control
 * - Device management and recognition
 * - Security alerts and monitoring
 * - Session analytics and statistics
 * - Bulk session operations
 *
 * @component SessionManagementDashboard
 */

import React, { useState, useEffect } from 'react';
import {
  useSessionManagement,
  useUserSessions,
  useSessionSecurity,
  useSessionAnalytics,
} from '../hooks/useSessionManagement';
import './SessionManagementDashboard.css';

const SessionManagementDashboard = ({
  userId,
  showDeviceDetails = true,
  allowBulkActions = true,
}) => {
  const {
    currentSession,
    sessionStatus,
    deviceFingerprint,
    invalidateSession,
    isActive,
    isExpired,
  } = useSessionManagement();

  const {
    userSessions,
    loading: sessionsLoading,
    invalidateAllSessions,
    invalidateSpecificSession,
    activeSessionCount,
    totalSessionCount,
  } = useUserSessions(userId);

  const { securityStatus, securityAlerts, hasAlerts, clearSecurityAlerts } =
    useSessionSecurity(currentSession?.sessionId);

  const { analytics, loading: analyticsLoading } = useSessionAnalytics(
    userId,
    30000
  ); // Refresh every 30 seconds

  const [selectedSessions, setSelectedSessions] = useState(new Set());
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  /**
   * Format duration for display
   */
  const formatDuration = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  /**
   * Get device type icon
   */
  const getDeviceIcon = (deviceInfo) => {
    const platform = deviceInfo?.platform?.toLowerCase() || '';

    if (
      platform.includes('mobile') ||
      platform.includes('android') ||
      platform.includes('iphone')
    ) {
      return '📱';
    } else if (platform.includes('tablet') || platform.includes('ipad')) {
      return '📱';
    } else if (platform.includes('mac') || platform.includes('darwin')) {
      return '🖥️';
    } else if (platform.includes('win')) {
      return '💻';
    } else if (platform.includes('linux')) {
      return '🐧';
    }
    return '🖥️';
  };

  /**
   * Get session status badge
   */
  const getStatusBadge = (session) => {
    if (!session.isActive) {
      return (
        <span className='session-badge session-badge--inactive'>Inactive</span>
      );
    }

    const now = Date.now();
    if (now > session.expiresAt) {
      return (
        <span className='session-badge session-badge--expired'>Expired</span>
      );
    }

    const timeSinceActivity = now - session.lastActivity;
    if (timeSinceActivity > 30 * 60 * 1000) {
      // 30 minutes
      return <span className='session-badge session-badge--idle'>Idle</span>;
    }

    if (session.flags?.includes('suspicious')) {
      return (
        <span className='session-badge session-badge--suspicious'>
          Suspicious
        </span>
      );
    }

    return <span className='session-badge session-badge--active'>Active</span>;
  };

  /**
   * Handle session selection
   */
  const handleSessionSelect = (sessionId, checked) => {
    const newSelected = new Set(selectedSessions);
    if (checked) {
      newSelected.add(sessionId);
    } else {
      newSelected.delete(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  /**
   * Handle select all sessions
   */
  const handleSelectAll = (checked) => {
    if (checked) {
      const allSessionIds = userSessions.map((s) => s.sessionId);
      setSelectedSessions(new Set(allSessionIds));
    } else {
      setSelectedSessions(new Set());
    }
  };

  /**
   * Handle bulk session termination
   */
  const handleBulkTerminate = async () => {
    if (selectedSessions.size === 0) return;

    setConfirmDialog({
      title: 'Terminate Sessions',
      message: `Are you sure you want to terminate ${selectedSessions.size} selected session(s)?`,
      onConfirm: async () => {
        for (const sessionId of selectedSessions) {
          await invalidateSpecificSession(sessionId, 'bulk_termination');
        }
        setSelectedSessions(new Set());
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  /**
   * Handle terminate all other sessions
   */
  const handleTerminateAllOthers = async () => {
    setConfirmDialog({
      title: 'Terminate All Other Sessions',
      message:
        'Are you sure you want to terminate all other sessions except the current one?',
      onConfirm: async () => {
        await invalidateAllSessions(currentSession?.sessionId);
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  /**
   * Handle current session termination
   */
  const handleTerminateCurrentSession = () => {
    setConfirmDialog({
      title: 'Terminate Current Session',
      message:
        'Are you sure you want to terminate your current session? You will be logged out.',
      onConfirm: () => {
        invalidateSession('manual_logout');
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  if (!userId) {
    return (
      <div className='session-dashboard'>
        <div className='session-dashboard__error'>
          <h3>Session Management Unavailable</h3>
          <p>Please log in to view session management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='session-dashboard'>
      {/* Header */}
      <div className='session-dashboard__header'>
        <h2>Session Management</h2>
        <div className='session-dashboard__stats'>
          <div className='stat-card'>
            <div className='stat-card__value'>{activeSessionCount}</div>
            <div className='stat-card__label'>Active Sessions</div>
          </div>
          <div className='stat-card'>
            <div className='stat-card__value'>{totalSessionCount}</div>
            <div className='stat-card__label'>Total Sessions</div>
          </div>
          {analytics && (
            <div className='stat-card'>
              <div className='stat-card__value'>
                {analytics.suspiciousSessionCount}
              </div>
              <div className='stat-card__label'>Suspicious</div>
            </div>
          )}
        </div>
      </div>

      {/* Security Alerts */}
      {hasAlerts && (
        <div className='session-dashboard__alerts'>
          <div className='alert alert--warning'>
            <div className='alert__header'>
              <h4>🚨 Security Alerts</h4>
              <button
                className='alert__close'
                onClick={clearSecurityAlerts}
                aria-label='Clear alerts'
              >
                ×
              </button>
            </div>
            <div className='alert__content'>
              {securityAlerts.map((alert, index) => (
                <div key={index} className='alert__item'>
                  <strong>{alert.type}:</strong> {alert.reason}
                  <div className='alert__timestamp'>
                    {formatTimestamp(alert.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Session */}
      {currentSession && (
        <div className='session-dashboard__current'>
          <div className='session-card session-card--current'>
            <div className='session-card__header'>
              <h3>Current Session</h3>
              {getStatusBadge({
                isActive: isActive,
                expiresAt: currentSession.expiresAt,
                lastActivity: Date.now(),
                flags: [],
              })}
            </div>
            <div className='session-card__content'>
              <div className='session-info'>
                <div className='session-info__item'>
                  <label>Session ID:</label>
                  <span className='session-id'>{currentSession.sessionId}</span>
                </div>
                <div className='session-info__item'>
                  <label>Status:</label>
                  <span
                    className={`session-status session-status--${sessionStatus}`}
                  >
                    {sessionStatus}
                  </span>
                </div>
                <div className='session-info__item'>
                  <label>Expires:</label>
                  <span>{formatTimestamp(currentSession.expiresAt)}</span>
                </div>
                {showDeviceDetails && deviceFingerprint && (
                  <div className='session-info__item'>
                    <label>Device:</label>
                    <span className='device-info'>
                      🖥️ {deviceFingerprint.slice(0, 8)}...
                    </span>
                  </div>
                )}
              </div>
              <div className='session-actions'>
                <button
                  className='btn btn--danger btn--sm'
                  onClick={handleTerminateCurrentSession}
                >
                  Terminate Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {allowBulkActions && userSessions.length > 0 && (
        <div className='session-dashboard__bulk-actions'>
          <div className='bulk-actions'>
            <div className='bulk-actions__selection'>
              <label className='checkbox-label'>
                <input
                  type='checkbox'
                  checked={selectedSessions.size === userSessions.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                Select All ({selectedSessions.size} selected)
              </label>
            </div>
            <div className='bulk-actions__buttons'>
              <button
                className='btn btn--secondary btn--sm'
                onClick={handleBulkTerminate}
                disabled={selectedSessions.size === 0}
              >
                Terminate Selected ({selectedSessions.size})
              </button>
              <button
                className='btn btn--warning btn--sm'
                onClick={handleTerminateAllOthers}
              >
                Terminate All Others
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className='session-dashboard__sessions'>
        <div className='session-list'>
          <div className='session-list__header'>
            <h3>All Sessions</h3>
            <button
              className='btn btn--ghost btn--sm'
              onClick={() => setShowSecurityDetails(!showSecurityDetails)}
            >
              {showSecurityDetails ? 'Hide' : 'Show'} Security Details
            </button>
          </div>

          {sessionsLoading ? (
            <div className='session-list__loading'>Loading sessions...</div>
          ) : userSessions.length === 0 ? (
            <div className='session-list__empty'>No sessions found</div>
          ) : (
            <div className='session-list__content'>
              {userSessions.map((session) => (
                <div key={session.sessionId} className='session-item'>
                  {allowBulkActions && (
                    <div className='session-item__select'>
                      <input
                        type='checkbox'
                        checked={selectedSessions.has(session.sessionId)}
                        onChange={(e) =>
                          handleSessionSelect(
                            session.sessionId,
                            e.target.checked
                          )
                        }
                      />
                    </div>
                  )}

                  <div className='session-item__icon'>
                    {getDeviceIcon(session.deviceInfo)}
                  </div>

                  <div className='session-item__content'>
                    <div className='session-item__header'>
                      <div className='session-item__title'>
                        {session.deviceInfo?.platform || 'Unknown Device'}
                      </div>
                      {getStatusBadge(session)}
                    </div>

                    <div className='session-item__details'>
                      <div className='session-detail'>
                        <span className='session-detail__label'>Created:</span>
                        <span>{formatTimestamp(session.createdAt)}</span>
                      </div>
                      <div className='session-detail'>
                        <span className='session-detail__label'>
                          Last Activity:
                        </span>
                        <span>{formatTimestamp(session.lastActivity)}</span>
                      </div>
                      <div className='session-detail'>
                        <span className='session-detail__label'>Duration:</span>
                        <span>
                          {formatDuration(
                            session.lastActivity - session.createdAt
                          )}
                        </span>
                      </div>
                      {showDeviceDetails && (
                        <>
                          <div className='session-detail'>
                            <span className='session-detail__label'>IP:</span>
                            <span>{session.ipAddress}</span>
                          </div>
                          <div className='session-detail'>
                            <span className='session-detail__label'>
                              User Agent:
                            </span>
                            <span className='session-detail__user-agent'>
                              {session.userAgent?.slice(0, 60)}...
                            </span>
                          </div>
                        </>
                      )}
                      {showSecurityDetails && session.fraudAnalysis && (
                        <div className='session-detail'>
                          <span className='session-detail__label'>
                            Security Score:
                          </span>
                          <span
                            className={`security-score security-score--${session.fraudAnalysis.riskLevel}`}
                          >
                            {Math.round(session.fraudAnalysis.score * 100)}% (
                            {session.fraudAnalysis.riskLevel})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='session-item__actions'>
                    <button
                      className='btn btn--danger btn--xs'
                      onClick={() =>
                        invalidateSpecificSession(
                          session.sessionId,
                          'manual_termination'
                        )
                      }
                      title='Terminate this session'
                    >
                      Terminate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analytics */}
      {analytics && !analyticsLoading && (
        <div className='session-dashboard__analytics'>
          <div className='analytics-panel'>
            <h3>Session Analytics</h3>
            <div className='analytics-grid'>
              <div className='analytics-card'>
                <h4>Average Session Duration</h4>
                <div className='analytics-value'>
                  {formatDuration(analytics.averageSessionDuration)}
                </div>
              </div>

              <div className='analytics-card'>
                <h4>Device Distribution</h4>
                <div className='analytics-list'>
                  {Object.entries(analytics.deviceDistribution).map(
                    ([device, count]) => (
                      <div key={device} className='analytics-item'>
                        <span>{device}:</span>
                        <span>{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className='analytics-card'>
                <h4>Authentication Methods</h4>
                <div className='analytics-list'>
                  {Object.entries(analytics.authMethodDistribution).map(
                    ([method, count]) => (
                      <div key={method} className='analytics-item'>
                        <span>{method}:</span>
                        <span>{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className='modal-overlay'>
          <div className='modal'>
            <div className='modal__header'>
              <h3>{confirmDialog.title}</h3>
            </div>
            <div className='modal__content'>
              <p>{confirmDialog.message}</p>
            </div>
            <div className='modal__actions'>
              <button
                className='btn btn--secondary'
                onClick={confirmDialog.onCancel}
              >
                Cancel
              </button>
              <button
                className='btn btn--danger'
                onClick={confirmDialog.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManagementDashboard;
