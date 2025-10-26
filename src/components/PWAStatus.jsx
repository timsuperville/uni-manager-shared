/* eslint-disable no-undef */

/**
 * PWA Status Component
 * Shows connection status, sync queue, and PWA features
 */

import React from 'react';
import { usePWA, useOffline } from '../hooks/usePWA.js';

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
      // console.log('App installation result:', result);

      if (result === 'accepted') {
        showNotification('App Installed', {
          body: 'Uni-Manager has been installed successfully!',
          icon: '/icons/icon-192x192.png'
        });
      }
    } catch (_error) {
      // console.error('Failed to install app:', error);
      showNotification('Installation Failed', {
        body: 'Failed to install the app. Please try again.',
        icon: '/icons/icon-error.png'
      });
    }
  };

  const handleUpdateApp = async () => {
    try {
      await applyUpdate();
    } catch (_error) {
      // console.error('Failed to update app:', error);
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
    } catch (_error) {
      // console.error('Failed to check for updates:', error);
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
    } catch (_error) {
      // console.error('Failed to process offline queue:', error);
    }
  };

  if (!isInitialized) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className='inline-block w-3 h-3 bg-gray-400 rounded-full animate-pulse' />
        <span className='text-sm text-gray-600'>Initializing PWA...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showConnectionStatus && (
          <div className='flex items-center gap-1'>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className='text-xs text-gray-600'>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        )}

        {showSyncStatus && syncQueue > 0 && (
          <div className='flex items-center gap-1'>
            <span className='text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded'>
              {syncQueue} pending
            </span>
          </div>
        )}

        {updateAvailable && (
          <button
            className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors'
            onClick={handleUpdateApp}
            title='Update available'
          >
            ↻ Update
          </button>
        )}

        {showInstallButton && isInstallable && (
          <button
            className='px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors'
            onClick={handleInstallApp}
            title='Install app'
          >
            ⬇ Install
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Connection Status */}
      {showConnectionStatus && (
        <div className={`rounded-lg border p-4 ${isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className='flex items-center gap-2 mb-2'>
            <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`font-semibold ${isOnline ? 'text-green-900' : 'text-red-900'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {isOffline && (
            <div className='space-y-2'>
              <p className={isOnline ? 'text-green-800' : 'text-red-800'}>
                You're currently offline. Changes will sync when reconnected.
              </p>
              {offlineQueue.length > 0 && (
                <div className='flex flex-col gap-2'>
                  <span className={isOnline ? 'text-green-700' : 'text-red-700'}>
                    {offlineQueue.length} items queued for sync
                  </span>
                  <div className='flex gap-2'>
                    <button
                      className={`px-3 py-1 text-sm font-medium rounded ${
                        isOffline
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } transition-colors`}
                      onClick={handleProcessOfflineQueue}
                      disabled={isOffline}
                    >
                      Process Queue
                    </button>
                    <button
                      className='px-3 py-1 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors'
                      onClick={clearOfflineQueue}
                    >
                      Clear Queue
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sync Status */}
      {showSyncStatus && syncQueue > 0 && (
        <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
          <div className='flex items-center gap-2 mb-2'>
            <span className='text-lg'>⏳</span>
            <span className='font-semibold text-yellow-900'>Sync Queue</span>
          </div>
          <div className='space-y-2'>
            <p className='text-yellow-800'>{syncQueue} items waiting to sync</p>
            <button
              className='px-3 py-1 text-sm font-medium bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors'
              onClick={() => typeof window !== 'undefined' && window.location.reload()}
            >
              Force Sync
            </button>
          </div>
        </div>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
          <div className='flex items-center gap-2 mb-2'>
            <span className='text-lg'>🔄</span>
            <span className='font-semibold text-blue-900'>Update Available</span>
          </div>
          <div className='space-y-2'>
            <p className='text-blue-800'>A new version of the app is ready to install.</p>
            <div className='flex gap-2'>
              <button
                className='px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'
                onClick={handleUpdateApp}
              >
                Update Now
              </button>
              <button
                className='px-3 py-1 text-sm font-medium bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors'
                onClick={() => typeof window !== 'undefined' && window.location.reload()}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install App */}
      {showInstallButton && isInstallable && (
        <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
          <div className='flex items-center gap-2 mb-2'>
            <span className='text-lg'>📱</span>
            <span className='font-semibold text-green-900'>Install App</span>
          </div>
          <div className='space-y-2'>
            <p className='text-green-800'>Install Uni-Manager for a better experience with offline support!</p>
            <div className='flex gap-2'>
              <button
                className='px-3 py-1 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors'
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
        <div className='rounded-lg border border-purple-200 bg-purple-50 p-4'>
          <div className='flex items-center justify-between gap-2 mb-2'>
            <div className='flex items-center gap-2'>
              <span className='text-lg'>🔔</span>
              <span className='font-semibold text-purple-900'>Notifications</span>
            </div>
            <button
              className='px-2 py-1 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors'
              onClick={clearNotifications}
            >
              Clear All
            </button>
          </div>
          <div className='space-y-2'>
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className='flex items-start justify-between gap-2 bg-white rounded p-2 border border-purple-100'>
                <div className='flex-1'>
                  <h4 className='font-medium text-purple-900 text-sm mb-0.5'>{notification.title}</h4>
                  {notification.body && (
                    <p className='text-xs text-purple-800 mb-0.5'>{notification.body}</p>
                  )}
                  <small className='text-xs text-purple-600'>{notification.timestamp.toLocaleTimeString()}</small>
                </div>
                <button
                  className='text-lg text-purple-600 hover:text-purple-800 font-bold transition-colors'
                  onClick={() => dismissNotification(notification.id)}
                >
                  ×
                </button>
              </div>
            ))}
            {notifications.length > 3 && (
              <div className='text-xs text-purple-700 italic'>
                +{notifications.length - 3} more notifications
              </div>
            )}
          </div>
        </div>
      )}

      {/* PWA Controls */}
      <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
        <div className='flex items-center gap-2 mb-2'>
          <span className='text-lg'>⚙️</span>
          <span className='font-semibold text-gray-900'>PWA Controls</span>
        </div>
        <div className='flex gap-2'>
          <button
            className='px-3 py-1 text-sm font-medium bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors'
            onClick={handleCheckUpdates}
          >
            Check Updates
          </button>
          <button
            className='px-3 py-1 text-sm font-medium bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors'
            onClick={() => typeof window !== 'undefined' && window.location.reload()}
          >
            Refresh App
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAStatus;