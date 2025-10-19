/* eslint-disable no-undef */

/**
 * React Hook for PWA Integration
 * Provides easy access to PWA functionality in React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import pwaInitializationService from '../services/PWAInitializationService.js';

/**
 * Custom hook for PWA functionality
 */
export function usePWA(options = {}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator?.onLine ?? true);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [syncQueue, setSyncQueue] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const pwaManagerRef = useRef(null);

  // Initialize PWA on mount
  useEffect(() => {
    const initializePWA = async () => {
      try {
        const pwaManager = await pwaInitializationService.initialize(options);
        pwaManagerRef.current = pwaManager;

        if (pwaManager) {
          setIsInitialized(true);

          // Get initial status
          const status = pwaManager.getStatus();
          setIsOnline(status.isOnline);
          setUpdateAvailable(status.updateAvailable);
          setSyncQueue(status.syncQueueLength || 0);
        }
      } catch (_error) {
        // console.error('Failed to initialize PWA in hook:', error);
      }
    };

    initializePWA();
  }, []); // Empty dependency array for mount-only effect

  // Set up event listeners
  useEffect(() => {
    if (!isInitialized) return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstallable(false);
    };

    const handleConnectionChange = (event) => {
      setIsOnline(event.detail.isOnline);
    };

    // Add event listeners
    typeof window !== "undefined" && window.addEventListener('online', handleOnline);
    typeof window !== "undefined" && window.addEventListener('offline', handleOffline);
    typeof window !== "undefined" && window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    typeof window !== "undefined" && window.addEventListener('appinstalled', handleAppInstalled);
    typeof window !== "undefined" && window.addEventListener('connectionchange', handleConnectionChange);

    // Cleanup
    return () => {
      typeof window !== "undefined" && window.removeEventListener('online', handleOnline);
      typeof window !== "undefined" && window.removeEventListener('offline', handleOffline);
      typeof window !== "undefined" && window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      typeof window !== "undefined" && window.removeEventListener('appinstalled', handleAppInstalled);
      typeof window !== "undefined" && window.removeEventListener('connectionchange', handleConnectionChange);
    };
  }, [isInitialized]);

  // Install app function
  const installApp = useCallback(async () => {
    try {
      if (!installPrompt) {
        throw new Error('No install prompt available');
      }

      const result = await installPrompt.prompt();
      // console.log('Install prompt result:', result.outcome);

      if (result.outcome === 'accepted') {
        setInstallPrompt(null);
        setIsInstallable(false);
      }

      return result.outcome;
    } catch (_error) {
      // console.error('Failed to install app:', error);
      throw error;
    }
  }, [installPrompt]);

  // Add to sync queue function
  const addToSyncQueue = useCallback(async (action, data) => {
    try {
      if (!pwaManagerRef.current) {
        throw new Error('PWA not initialized');
      }

      const syncId = await pwaManagerRef.current.addToSyncQueue(action, data);

      // Update sync queue count
      const status = pwaManagerRef.current.getStatus();
      setSyncQueue(status.syncQueueLength || 0);

      return syncId;
    } catch (_error) {
      // console.error('Failed to add to sync queue:', error);
      throw error;
    }
  }, []);

  // Show notification function
  const showNotification = useCallback(async (title, options = {}) => {
    try {
      if (!pwaManagerRef.current) {
        throw new Error('PWA not initialized');
      }

      const result = await pwaManagerRef.current.showNotification(title, options);

      // Add to local notifications list for UI display
      const notification = {
        id: Date.now(),
        title,
        ...options,
        timestamp: new Date()
      };

      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10

      return result;
    } catch (_error) {
      // console.error('Failed to show notification:', error);
      throw error;
    }
  }, []);

  // Cache resource function
  const cacheResource = useCallback(async (url) => {
    try {
      if (!pwaManagerRef.current) {
        throw new Error('PWA not initialized');
      }

      await pwaManagerRef.current.cacheResource(url);
      // console.log('Resource cached:', url);
    } catch (_error) {
      // console.error('Failed to cache resource:', error);
      throw error;
    }
  }, []);

  // Check for updates function
  const checkForUpdates = useCallback(async () => {
    try {
      if (!pwaManagerRef.current) {
        throw new Error('PWA not initialized');
      }

      await pwaManagerRef.current.checkForUpdates();

      // Update status
      const status = pwaManagerRef.current.getStatus();
      setUpdateAvailable(status.updateAvailable);
    } catch (_error) {
      // console.error('Failed to check for updates:', error);
      throw error;
    }
  }, []);

  // Apply update function
  const applyUpdate = useCallback(async () => {
    try {
      if (!pwaManagerRef.current) {
        throw new Error('PWA not initialized');
      }

      await pwaManagerRef.current.applyUpdate();
    } catch (_error) {
      // console.error('Failed to apply update:', error);
      throw error;
    }
  }, []);

  // Get PWA status function
  const getStatus = useCallback(() => {
    if (!pwaManagerRef.current) {
      return {
        initialized: false,
        isOnline: navigator?.onLine ?? true,
        serviceWorkerReady: false,
        updateAvailable: false,
        notificationsEnabled: false,
        syncQueueLength: 0
      };
    }

    return pwaManagerRef.current.getStatus();
  }, []);

  // Clear notifications function
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Dismiss notification function
  const dismissNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  return {
    // State
    isInitialized,
    isOnline,
    isInstallable,
    updateAvailable,
    syncQueue,
    notifications,

    // Actions
    installApp,
    addToSyncQueue,
    showNotification,
    cacheResource,
    checkForUpdates,
    applyUpdate,
    getStatus,
    clearNotifications,
    dismissNotification
  };
}

/**
 * Hook for offline functionality
 */
export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator?.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    typeof window !== "undefined" && window.addEventListener('online', handleOnline);
    typeof window !== "undefined" && window.addEventListener('offline', handleOffline);

    return () => {
      typeof window !== "undefined" && window.removeEventListener('online', handleOnline);
      typeof window !== "undefined" && window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToOfflineQueue = useCallback((action, data) => {
    const queueItem = {
      id: Date.now(),
      action,
      data,
      timestamp: new Date()
    };

    setOfflineQueue(prev => [...prev, queueItem]);

    // Store in localStorage for persistence
    try {
      const stored = JSON.parse(typeof localStorage !== "undefined" && localStorage.getItem('offlineQueue') || '[]');
      stored.push(queueItem);
      typeof localStorage !== "undefined" && localStorage.setItem('offlineQueue', JSON.stringify(stored));
    } catch (_error) {
      // console.error('Failed to store offline queue item:', error);
    }

    return queueItem.id;
  }, []);

  const processOfflineQueue = useCallback(async () => {
    if (isOffline || offlineQueue.length === 0) return;

    const results = [];
    const remainingItems = [];

    for (const item of offlineQueue) {
      try {
        // Process the queued action
        await processOfflineAction(item.action, item.data);
        results.push({ ...item, success: true });
      } catch (_error) {
        // console.error('Failed to process offline queue item:', error);
        remainingItems.push(item);
        results.push({ ...item, success: false, error: error.message });
      }
    }

    setOfflineQueue(remainingItems);

    // Update localStorage
    try {
      typeof localStorage !== "undefined" && localStorage.setItem('offlineQueue', JSON.stringify(remainingItems));
    } catch (_error) {
      // console.error('Failed to update offline queue in storage:', error);
    }

    return results;
  }, [isOffline, offlineQueue]);

  const clearOfflineQueue = useCallback(() => {
    setOfflineQueue([]);
    try {
      typeof localStorage !== "undefined" && localStorage.removeItem('offlineQueue');
    } catch (_error) {
      // console.error('Failed to clear offline queue from storage:', error);
    }
  }, []);

  // Process offline queue when coming back online
  useEffect(() => {
    if (!isOffline) {
      processOfflineQueue();
    }
  }, [isOffline, processOfflineQueue]);

  // Load offline queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(typeof localStorage !== "undefined" && localStorage.getItem('offlineQueue') || '[]');
      setOfflineQueue(stored);
    } catch (_error) {
      // console.error('Failed to load offline queue from storage:', error);
    }
  }, []);

  return {
    isOffline,
    offlineQueue,
    addToOfflineQueue,
    processOfflineQueue,
    clearOfflineQueue
  };
}

/**
 * Hook for app installation
 */
export function useAppInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
    };

    typeof window !== "undefined" && window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    typeof window !== "undefined" && window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (typeof window !== "undefined" && window.matchMedia('(display-mode: standalone)').matches ||
        typeof window !== "undefined" && window.typeof navigator !== "undefined" && navigator.standalone === true) {
      setIsInstalled(true);
    }

    return () => {
      typeof window !== "undefined" && window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      typeof window !== "undefined" && window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) {
      throw new Error('App is not installable');
    }

    const result = await installPrompt.prompt();

    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstallable(false);
    }

    return result.outcome;
  }, [installPrompt]);

  return {
    isInstallable,
    isInstalled,
    installApp
  };
}

/**
 * Process offline action (helper function)
 */
async function processOfflineAction(action, data) {
  // Determine API endpoint and method based on action
  let endpoint = '';
  let method = 'POST';

  switch (action) {
  case 'createService':
    endpoint = '/church/services';
    break;
  case 'updateProfile':
    endpoint = '/user/profile';
    method = 'PUT';
    break;
  case 'addFamilyMember':
    endpoint = '/home/family/members';
    break;
  case 'submitFeedback':
    endpoint = '/feedback/submit';
    break;
  case 'createBudgetEntry':
    endpoint = '/home/budget/entries';
    break;
  case 'updateProject':
    endpoint = '/business/projects';
    method = 'PUT';
    break;
  default:
    throw new Error(`Unknown offline action: ${action}`);
  }

  // Get auth token
  const authToken = typeof localStorage !== "undefined" && localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

  // Make the request
  const response = await fetch(endpoint, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : ''
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}