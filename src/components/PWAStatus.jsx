/* eslint-disable no-undef */

/**
 * PWA Status Component
 * Shows connection status, sync queue, and PWA features
 */

import React from 'react';
import { usePWA, useOffline } from '../hooks/usePWA.js';
import './PWAStatus.css';

const PWAStatus = ({
  showInstallButton = true,
  showNotifications = false,
  showSyncStatus = true,
  showConnectionStatus = true,
  compact = false,
  className = ''
}) => {
  const {
    isInitialized,
    isOnline,
    isInstallable,
    updateAvailable,
    syncQueue,
    notifications,
    installApp,
    showNotification,
    checkForUpdates,
    applyUpdate,
    clearNotifications,
    dismissNotification
  } = usePWA();

  const {
    isOffline,
    offlineQueue,
    processOfflineQueue,
    clearOfflineQueue
  } = useOffline();

  const handleInstallApp = async () => {
    try {
      const result = await installApp();
      console.log('App installation result:', result);

      if (result === 'accepted') {
        showNotification('App Installed', {
          body: 'Uni-Manager has been installed successfully!',
          icon: '/icons/icon-192x192.png'
        });
      }
    } catch (error) {
      console.error('Failed to install app:', error);
      showNotification('Installation Failed', {
        body: 'Failed to install the app. Please try again.',
        icon: '/icons/icon-error.png'
      });
    }
  };

  const handleUpdateApp = async () => {
    try {
      await applyUpdate();
    } catch (error) {
      console.error('Failed to update app:', error);
      showNotification('Update Failed', {
        body: 'Failed to update the app. Please try again.',
        icon: '/icons/icon-error.png'
      });
    }
  };

  const handleCheckUpdates = async () => {
    try {
      await checkForUpdates();
      showNotification('Checked for Updates', {
        body: updateAvailable ? 'Update available!' : 'You are using the latest version.',
        icon: '/icons/icon-update.png'
      });
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  const handleProcessOfflineQueue = async () => {
    try {
      const results = await processOfflineQueue();
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      showNotification('Sync Complete', {
        body: `${successCount} items synced successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}.`,
        icon: '/icons/icon-sync.png'
      });
    } catch (error) {
      console.error('Failed to process offline queue:', error);
    }
  };

  if (!isInitialized) {
    return (
      <div className={`pwa-status pwa-status--loading ${className}`}>
        <div className="pwa-status__indicator">
          <span className="pwa-status__spinner" />
          <span className="pwa-status__text">Initializing PWA...</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`pwa-status pwa-status--compact ${className}`}>
        {showConnectionStatus && (
          <div className={`pwa-status__connection ${isOnline ? 'online' : 'offline'}`}>
            <span className="pwa-status__dot" />
            <span className="pwa-status__text">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        )}

        {showSyncStatus && syncQueue > 0 && (
          <div className="pwa-status__sync">
            <span className="pwa-status__count">{syncQueue}</span>
            <span className="pwa-status__text">pending</span>
          </div>
        )}

        {updateAvailable && (
          <button
            className="pwa-status__update-btn"
            onClick={handleUpdateApp}
            title="Update available"
          >
            ↻
          </button>
        )}

        {showInstallButton && isInstallable && (
          <button
            className="pwa-status__install-btn"
            onClick={handleInstallApp}
            title="Install app"
          >
            ⬇
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`pwa-status ${className}`}>
      {/* Connection Status */}
      {showConnectionStatus && (
        <div className={`pwa-status__section pwa-status__connection ${isOnline ? 'online' : 'offline'}`}>
          <div className="pwa-status__header">
            <span className="pwa-status__dot" />
            <span className="pwa-status__title">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {isOffline && (
            <div className="pwa-status__details">
              <p>You're currently offline. Changes will sync when reconnected.</p>
              {offlineQueue.length > 0 && (
                <div className="pwa-status__offline-queue">
                  <span>{offlineQueue.length} items queued for sync</span>
                  <button
                    className="pwa-status__btn pwa-status__btn--small"
                    onClick={handleProcessOfflineQueue}
                    disabled={isOffline}
                  >
                    Process Queue
                  </button>
                  <button
                    className="pwa-status__btn pwa-status__btn--small pwa-status__btn--danger"
                    onClick={clearOfflineQueue}
                  >
                    Clear Queue
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sync Status */}
      {showSyncStatus && syncQueue > 0 && (
        <div className="pwa-status__section pwa-status__sync">
          <div className="pwa-status__header">
            <span className="pwa-status__icon">⏳</span>
            <span className="pwa-status__title">Sync Queue</span>
          </div>
          <div className="pwa-status__details">
            <p>{syncQueue} items waiting to sync</p>
            <button
              className="pwa-status__btn pwa-status__btn--small"
              onClick={() => window.location.reload()}
            >
              Force Sync
            </button>
          </div>
        </div>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <div className="pwa-status__section pwa-status__update">
          <div className="pwa-status__header">
            <span className="pwa-status__icon">🔄</span>
            <span className="pwa-status__title">Update Available</span>
          </div>
          <div className="pwa-status__details">
            <p>A new version of the app is ready to install.</p>
            <div className="pwa-status__actions">
              <button
                className="pwa-status__btn pwa-status__btn--primary"
                onClick={handleUpdateApp}
              >
                Update Now
              </button>
              <button
                className="pwa-status__btn pwa-status__btn--secondary"
                onClick={() => window.location.reload()}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install App */}
      {showInstallButton && isInstallable && (
        <div className="pwa-status__section pwa-status__install">
          <div className="pwa-status__header">
            <span className="pwa-status__icon">📱</span>
            <span className="pwa-status__title">Install App</span>
          </div>
          <div className="pwa-status__details">
            <p>Install Uni-Manager for a better experience with offline support!</p>
            <div className="pwa-status__actions">
              <button
                className="pwa-status__btn pwa-status__btn--primary"
                onClick={handleInstallApp}
              >
                Install Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {showNotifications && notifications.length > 0 && (
        <div className="pwa-status__section pwa-status__notifications">
          <div className="pwa-status__header">
            <span className="pwa-status__icon">🔔</span>
            <span className="pwa-status__title">Notifications</span>
            <button
              className="pwa-status__btn pwa-status__btn--small"
              onClick={clearNotifications}
            >
              Clear All
            </button>
          </div>
          <div className="pwa-status__notifications-list">
            {notifications.slice(0, 3).map(notification => (
              <div key={notification.id} className="pwa-status__notification">
                <div className="pwa-status__notification-content">
                  <h4>{notification.title}</h4>
                  {notification.body && <p>{notification.body}</p>}
                  <small>{notification.timestamp.toLocaleTimeString()}</small>
                </div>
                <button
                  className="pwa-status__notification-dismiss"
                  onClick={() => dismissNotification(notification.id)}
                >
                  ×
                </button>
              </div>
            ))}
            {notifications.length > 3 && (
              <div className="pwa-status__notification-more">
                +{notifications.length - 3} more notifications
              </div>
            )}
          </div>
        </div>
      )}

      {/* PWA Controls */}
      <div className="pwa-status__section pwa-status__controls">
        <div className="pwa-status__header">
          <span className="pwa-status__icon">⚙️</span>
          <span className="pwa-status__title">PWA Controls</span>
        </div>
        <div className="pwa-status__actions">
          <button
            className="pwa-status__btn pwa-status__btn--small"
            onClick={handleCheckUpdates}
          >
            Check Updates
          </button>
          <button
            className="pwa-status__btn pwa-status__btn--small"
            onClick={() => window.location.reload()}
          >
            Refresh App
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAStatus;