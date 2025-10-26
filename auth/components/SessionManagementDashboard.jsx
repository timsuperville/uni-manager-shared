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
        <span className='inline-block px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800'>
          Inactive
        </span>
      );
    }

    const now = Date.now();
    if (now > session.expiresAt) {
      return (
        <span className='inline-block px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800'>
          Expired
        </span>
      );
    }

    const timeSinceActivity = now - session.lastActivity;
    if (timeSinceActivity > 30 * 60 * 1000) {
      // 30 minutes
      return (
        <span className='inline-block px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800'>
          Idle
        </span>
      );
    }

    if (session.flags?.includes('suspicious')) {
      return (
        <span className='inline-block px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800'>
          Suspicious
        </span>
      );
    }

    return (
      <span className='inline-block px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800'>
        Active
      </span>
    );
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
      <div className='max-w-4xl mx-auto px-5 py-5'>
        <div className='text-center py-12'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Session Management Unavailable
          </h3>
          <p className='text-gray-600'>Please log in to view session management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto px-5 py-5'>
      {/* Header */}
      <div className='flex justify-between items-start mb-6 pb-5 border-b border-gray-200'>
        <h2 className='text-2xl font-semibold text-gray-900 m-0'>Session Management</h2>
        <div className='flex gap-4'>
          <div className='bg-white border border-gray-200 rounded-lg p-4 text-center min-w-28 shadow-admin'>
            <div className='text-2xl font-bold text-gray-800 mb-1'>{activeSessionCount}</div>
            <div className='text-xs text-gray-500 uppercase tracking-wide'>Active Sessions</div>
          </div>
          <div className='bg-white border border-gray-200 rounded-lg p-4 text-center min-w-28 shadow-admin'>
            <div className='text-2xl font-bold text-gray-800 mb-1'>{totalSessionCount}</div>
            <div className='text-xs text-gray-500 uppercase tracking-wide'>Total Sessions</div>
          </div>
          {analytics && (
            <div className='bg-white border border-gray-200 rounded-lg p-4 text-center min-w-28 shadow-admin'>
              <div className='text-2xl font-bold text-gray-800 mb-1'>{analytics.suspiciousSessionCount}</div>
              <div className='text-xs text-gray-500 uppercase tracking-wide'>Suspicious</div>
            </div>
          )}
        </div>
      </div>

      {/* Security Alerts */}
      {hasAlerts && (
        <div className='mb-6'>
          <div className='bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4'>
            <div className='flex justify-between items-start mb-3'>
              <h4 className='m-0 text-yellow-800 text-base font-semibold'>🚨 Security Alerts</h4>
              <button
                className='bg-none border-none text-yellow-800 cursor-pointer text-xl font-bold hover:opacity-70'
                onClick={clearSecurityAlerts}
                aria-label='Clear alerts'
              >
                ×
              </button>
            </div>
            <div className='space-y-2'>
              {securityAlerts.map((alert, index) => (
                <div key={index} className='text-sm text-yellow-800'>
                  <strong>{alert.type}:</strong> {alert.reason}
                  <div className='text-xs text-yellow-700 mt-1'>
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
        <div className='mb-6'>
          <div className='bg-white border border-gray-200 rounded-lg p-5 shadow-admin'>
            <div className='flex justify-between items-start mb-4'>
              <h3 className='text-lg font-semibold text-gray-900 m-0'>Current Session</h3>
              {getStatusBadge({
                isActive: isActive,
                expiresAt: currentSession.expiresAt,
                lastActivity: Date.now(),
                flags: [],
              })}
            </div>
            <div className='space-y-3'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Session ID:</label>
                  <span className='font-mono text-sm text-gray-900'>{currentSession.sessionId}</span>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Status:</label>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800`}>
                    {sessionStatus}
                  </span>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Expires:</label>
                  <span className='text-sm text-gray-900'>{formatTimestamp(currentSession.expiresAt)}</span>
                </div>
                {showDeviceDetails && deviceFingerprint && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Device:</label>
                    <span className='text-sm text-gray-900'>🖥️ {deviceFingerprint.slice(0, 8)}...</span>
                  </div>
                )}
              </div>
              <div className='flex gap-2 pt-2'>
                <button
                  className='px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors'
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
        <div className='mb-6'>
          <div className='bg-white border border-gray-200 rounded-lg p-4'>
            <div className='flex justify-between items-center gap-4'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={selectedSessions.size === userSessions.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className='cursor-pointer'
                />
                <span className='text-sm text-gray-700'>Select All ({selectedSessions.size} selected)</span>
              </label>
              <div className='flex gap-2'>
                <button
                  className='px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  onClick={handleBulkTerminate}
                  disabled={selectedSessions.size === 0}
                >
                  Terminate Selected ({selectedSessions.size})
                </button>
                <button
                  className='px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors'
                  onClick={handleTerminateAllOthers}
                >
                  Terminate All Others
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className='mb-6'>
        <div className='bg-white border border-gray-200 rounded-lg overflow-hidden shadow-admin'>
          <div className='flex justify-between items-center p-5 border-b border-gray-200'>
            <h3 className='text-lg font-semibold text-gray-900 m-0'>All Sessions</h3>
            <button
              className='px-3 py-2 bg-transparent border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors'
              onClick={() => setShowSecurityDetails(!showSecurityDetails)}
            >
              {showSecurityDetails ? 'Hide' : 'Show'} Security Details
            </button>
          </div>

          {sessionsLoading ? (
            <div className='p-8 text-center text-gray-600'>Loading sessions...</div>
          ) : userSessions.length === 0 ? (
            <div className='p-8 text-center text-gray-600'>No sessions found</div>
          ) : (
            <div className='divide-y divide-gray-200'>
              {userSessions.map((session) => (
                <div key={session.sessionId} className='flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors'>
                  {allowBulkActions && (
                    <div className='flex items-center'>
                      <input
                        type='checkbox'
                        checked={selectedSessions.has(session.sessionId)}
                        onChange={(e) =>
                          handleSessionSelect(
                            session.sessionId,
                            e.target.checked
                          )
                        }
                        className='cursor-pointer'
                      />
                    </div>
                  )}

                  <div className='text-xl'>{getDeviceIcon(session.deviceInfo)}</div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex justify-between items-start mb-2'>
                      <div className='font-medium text-gray-900'>
                        {session.deviceInfo?.platform || 'Unknown Device'}
                      </div>
                      {getStatusBadge(session)}
                    </div>

                    <div className='grid grid-cols-3 gap-4 text-sm text-gray-600 mb-2'>
                      <div>
                        <span className='font-medium text-gray-700'>Created:</span> {formatTimestamp(session.createdAt)}
                      </div>
                      <div>
                        <span className='font-medium text-gray-700'>Last Activity:</span> {formatTimestamp(session.lastActivity)}
                      </div>
                      <div>
                        <span className='font-medium text-gray-700'>Duration:</span> {formatDuration(session.lastActivity - session.createdAt)}
                      </div>
                      {showDeviceDetails && (
                        <>
                          <div>
                            <span className='font-medium text-gray-700'>IP:</span> {session.ipAddress}
                          </div>
                          <div>
                            <span className='font-medium text-gray-700'>User Agent:</span> {session.userAgent?.slice(0, 60)}...
                          </div>
                        </>
                      )}
                      {showSecurityDetails && session.fraudAnalysis && (
                        <div>
                          <span className='font-medium text-gray-700'>Security Score:</span>
                          <span className={`ml-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            session.fraudAnalysis.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                            session.fraudAnalysis.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {Math.round(session.fraudAnalysis.score * 100)}% ({session.fraudAnalysis.riskLevel})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <button
                      className='px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors'
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
        <div className='mb-6'>
          <div className='bg-white border border-gray-200 rounded-lg p-5 shadow-admin'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 m-0'>Session Analytics</h3>
            <div className='grid grid-cols-3 gap-4'>
              <div className='border border-gray-200 rounded-lg p-4'>
                <h4 className='text-sm font-medium text-gray-700 mb-2 m-0'>Average Session Duration</h4>
                <div className='text-2xl font-bold text-gray-900'>
                  {formatDuration(analytics.averageSessionDuration)}
                </div>
              </div>

              <div className='border border-gray-200 rounded-lg p-4'>
                <h4 className='text-sm font-medium text-gray-700 mb-2 m-0'>Device Distribution</h4>
                <div className='space-y-1'>
                  {Object.entries(analytics.deviceDistribution).map(
                    ([device, count]) => (
                      <div key={device} className='flex justify-between text-sm text-gray-600'>
                        <span>{device}:</span>
                        <span className='font-medium'>{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className='border border-gray-200 rounded-lg p-4'>
                <h4 className='text-sm font-medium text-gray-700 mb-2 m-0'>Authentication Methods</h4>
                <div className='space-y-1'>
                  {Object.entries(analytics.authMethodDistribution).map(
                    ([method, count]) => (
                      <div key={method} className='flex justify-between text-sm text-gray-600'>
                        <span>{method}:</span>
                        <span className='font-medium'>{count}</span>
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
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h3 className='text-lg font-semibold text-gray-900 m-0'>{confirmDialog.title}</h3>
            </div>
            <div className='px-6 py-4'>
              <p className='text-gray-700 m-0'>{confirmDialog.message}</p>
            </div>
            <div className='px-6 py-4 border-t border-gray-200 flex gap-2 justify-end'>
              <button
                className='px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors'
                onClick={confirmDialog.onCancel}
              >
                Cancel
              </button>
              <button
                className='px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors'
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
