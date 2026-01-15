/* eslint-disable no-undef */

/**
 * Progressive Web App Service Worker Manager
 * Handles service worker registration, caching strategies, offline functionality
 * Note: This file uses browser globals that may not be defined in Node.js environment
 */
class PWAManager {
  constructor() {
    this.serviceWorker = null;
    this.registration = null;
    this.isOnline = typeof navigator !== "undefined" && navigator.onLine;
    this.cacheName = "uni-manager-v1";
    this.initialized = false;
    this.updateAvailable = false;
    this.syncQueue = [];
    this.notificationQueue = [];
  }

  /**
   * Initialize PWA capabilities
   */
  async initialize() {
    try {
      // Check if service workers are supported
      if (!("serviceWorker" in navigator)) {
        // console.warn('Service Workers not supported');
        return false;
      }

      // Register service worker
      await this.registerServiceWorker();

      // Set up event listeners
      this.setupEventListeners();

      // Initialize notification system
      await this.initializeNotifications();

      // Initialize background sync
      this.initializeBackgroundSync();

      // Check for app updates
      this.checkForUpdates();

      this.initialized = true;
      // console.log('PWA Manager initialized successfully');
      return true;
    } catch (_error) {
      // console.error('Failed to initialize PWA Manager:', error);
      return false;
    }
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    try {
      this.registration =
        (await typeof navigator) !== "undefined" &&
        navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

      // console.log('Service Worker registered:', this.registration.scope);

      // Listen for updates
      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration.installing;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            typeof navigator !== "undefined" &&
            navigator.serviceWorker.controller
          ) {
            this.updateAvailable = true;
            this.notifyUpdateAvailable();
          }
        });
      });

      return this.registration;
    } catch (_error) {
      // console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for PWA functionality
   */
  setupEventListeners() {
    // Online/offline status
    typeof window !== "undefined" &&
      window.addEventListener("online", () => {
        this.isOnline = true;
        this.handleOnlineStatusChange(true);
      });

    typeof window !== "undefined" &&
      window.addEventListener("offline", () => {
        this.isOnline = false;
        this.handleOnlineStatusChange(false);
      });

    // App installation prompt
    typeof window !== "undefined" &&
      window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        this.handleInstallPrompt(event);
      });

    // App was installed
    typeof window !== "undefined" &&
      window.addEventListener("appinstalled", () => {
        this.handleAppInstalled();
      });

    // Visibility change (app focus)
    typeof document !== "undefined" &&
      document.addEventListener("visibilitychange", () => {
        this.handleVisibilityChange();
      });
  }

  /**
   * Initialize push notifications
   */
  async initializeNotifications() {
    try {
      if (!("Notification" in window)) {
        // console.warn('Notifications not supported');
        return false;
      }

      // Check current permission
      let permission = Notification.permission;

      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission === "granted") {
        // console.log('Notification permission granted');

        // Subscribe to push notifications if supported
        if ("PushManager" in window && this.registration) {
          await this.subscribeToPushNotifications();
        }

        return true;
      } else {
        // console.log('Notification permission denied');
        return false;
      }
    } catch (_error) {
      // console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications() {
    try {
      const applicationServerKey = this.urlB64ToUint8Array(
        process.env.VAPID_PUBLIC_KEY || "your-vapid-public-key",
      );

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      // console.log('Push subscription:', subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (_error) {
      // console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Send push subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch("/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error("Failed to send subscription to server");
      }

      // console.log('Subscription sent to server');
    } catch (_error) {
      // console.error('Failed to send subscription to server:', error);
    }
  }

  /**
   * Initialize background sync
   */
  initializeBackgroundSync() {
    if (
      "serviceWorker" in navigator &&
      "sync" in typeof window !== "undefined" &&
      window.ServiceWorkerRegistration.prototype
    ) {
      // Listen for sync events from service worker
      typeof navigator !== "undefined" &&
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "SYNC_COMPLETE") {
            this.handleSyncComplete(event.data.payload);
          }
        });

      // console.log('Background sync initialized');
    } else {
      // console.warn('Background sync not supported');
    }
  }

  /**
   * Add item to sync queue for background processing
   */
  async addToSyncQueue(action, data) {
    try {
      const syncItem = {
        id: this.generateSyncId(),
        action: action,
        data: data,
        timestamp: Date.now(),
        retryCount: 0,
      };

      this.syncQueue.push(syncItem);

      // Try to sync immediately if online
      if (this.isOnline) {
        await this.processSyncQueue();
      } else {
        // Register for background sync
        if (this.registration && "sync" in this.registration) {
          await this.registration.sync.register("background-sync");
        }
      }

      return syncItem.id;
    } catch (_error) {
      // console.error('Failed to add to sync queue:', error);
      throw error;
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    try {
      const pendingItems = [...this.syncQueue];
      this.syncQueue = [];

      for (const item of pendingItems) {
        try {
          await this.processSyncItem(item);
        } catch (_error) {
          // console.error('Failed to process sync item:', error);

          // Retry logic
          if (item.retryCount < 3) {
            item.retryCount++;
            this.syncQueue.push(item);
          } else {
            // console.error('Max retries exceeded for sync item:', item);
          }
        }
      }
    } catch (_error) {
      // console.error('Failed to process sync queue:', error);
    }
  }

  /**
   * Process individual sync item
   */
  async processSyncItem(item) {
    try {
      let endpoint = "";
      let method = "POST";

      switch (item.action) {
        case "createService":
          endpoint = "/church/services";
          break;
        case "updateProfile":
          endpoint = "/user/profile";
          method = "PUT";
          break;
        case "addFamilyMember":
          endpoint = "/home/family/members";
          break;
        case "submitFeedback":
          endpoint = "/feedback/submit";
          break;
        default:
          throw new Error(`Unknown sync action: ${item.action}`);
      }

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(item.data),
      });

      if (!response.ok) {
        throw new Error(`Sync request failed: ${response.status}`);
      }

      // console.log(`Sync item processed: ${item.action}`);
      return await response.json();
    } catch (_error) {
      // console.error('Failed to process sync item:', error);
      throw error;
    }
  }

  /**
   * Show local notification
   */
  async showNotification(title, options = {}) {
    try {
      if (Notification.permission !== "granted") {
        // console.warn('Notification permission not granted');
        return false;
      }

      const defaultOptions = {
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        vibrate: [200, 100, 200],
        tag: "default",
        requireInteraction: false,
        actions: [],
      };

      const notificationOptions = { ...defaultOptions, ...options };

      let notification;

      if (this.registration) {
        // Use service worker to show notification
        await this.registration.showNotification(title, notificationOptions);
      } else {
        // Fallback to regular notification
        notification = new Notification(title, notificationOptions);

        // Auto-close after 5 seconds if not set to require interaction
        if (!notificationOptions.requireInteraction) {
          setTimeout(() => {
            notification.close();
          }, 5000);
        }
      }

      // console.log('Notification shown:', title);
      return true;
    } catch (_error) {
      // console.error('Failed to show notification:', error);
      return false;
    }
  }

  /**
   * Cache resource for offline use
   */
  async cacheResource(url, cacheName = this.cacheName) {
    try {
      const cache = await caches.open(cacheName);
      await cache.add(url);
      // console.log(`Cached resource: ${url}`);
    } catch (_error) {
      // console.error('Failed to cache resource:', error);
    }
  }

  /**
   * Cache multiple resources
   */
  async cacheResources(urls, cacheName = this.cacheName) {
    try {
      const cache = await caches.open(cacheName);
      await cache.addAll(urls);
      // console.log(`Cached ${urls.length} resources`);
    } catch (_error) {
      // console.error('Failed to cache resources:', error);
    }
  }

  /**
   * Get cached resource
   */
  async getCachedResource(url) {
    try {
      const cache = await caches.open(this.cacheName);
      const response = await cache.match(url);
      return response;
    } catch (_error) {
      // console.error('Failed to get cached resource:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  async clearCache(cacheName = this.cacheName) {
    try {
      await caches.delete(cacheName);
      // console.log(`Cache cleared: ${cacheName}`);
    } catch (_error) {
      // console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Handle online status change
   */
  handleOnlineStatusChange(isOnline) {
    // console.log(`Connection status changed: ${isOnline ? 'online' : 'offline'}`);

    if (isOnline) {
      // Process sync queue when back online
      this.processSyncQueue();

      // Show notification
      this.showNotification("Connection Restored", {
        body: "You are back online. Syncing pending changes...",
        icon: "/icons/icon-online.png",
      });
    } else {
      // Show offline notification
      this.showNotification("You are Offline", {
        body: "Your changes will be synced when connection is restored.",
        icon: "/icons/icon-offline.png",
      });
    }

    // Dispatch custom event
    typeof window !== "undefined" &&
      window.dispatchEvent(
        new CustomEvent("connectionchange", {
          detail: { isOnline },
        }),
      );
  }

  /**
   * Handle app installation prompt
   */
  handleInstallPrompt(event) {
    // Show custom install prompt
    this.showInstallPrompt(event);
  }

  /**
   * Show custom install prompt
   */
  showInstallPrompt(deferredPrompt) {
    // Create custom install UI
    const installPrompt =
      typeof document !== "undefined" && document.createElement("div");
    installPrompt.className = "install-prompt";
    installPrompt.innerHTML = `
      <div class='install-prompt-content'>
        <h3>Install Uni-Manager</h3>
        <p>Install our app for a better experience with offline support!</p>
        <button id='install-button'>Install</button>
        <button id='dismiss-button'>Maybe Later</button>
      </div>
    `;

    typeof document !== "undefined" && document.body.appendChild(installPrompt);

    // Handle install button click
    typeof document !== "undefined" &&
      document
        .getElementById("install-button")
        .addEventListener("click", async () => {
          // Hide the prompt
          installPrompt.remove();

          // Show the install prompt
          deferredPrompt.prompt();

          // Wait for the user to respond
          const { outcome } = await deferredPrompt.userChoice;
          // console.log(`Install prompt outcome: ${outcome}`);
        });

    // Handle dismiss button click
    typeof document !== "undefined" &&
      document
        .getElementById("dismiss-button")
        .addEventListener("click", () => {
          installPrompt.remove();
        });
  }

  /**
   * Handle app installed
   */
  handleAppInstalled() {
    // console.log('App was installed');

    this.showNotification("App Installed", {
      body: "Uni-Manager has been installed successfully!",
      icon: "/icons/icon-192x192.png",
    });

    // Track installation
    this.trackEvent("app_installed");
  }

  /**
   * Handle visibility change (app focus/blur)
   */
  handleVisibilityChange() {
    if (typeof document !== "undefined" && document.hidden) {
      // console.log('App went to background');
      this.trackEvent("app_backgrounded");
    } else {
      // console.log('App came to foreground');
      this.trackEvent("app_foregrounded");

      // Check for updates when app comes back to foreground
      this.checkForUpdates();
    }
  }

  /**
   * Handle sync completion
   */
  handleSyncComplete(payload) {
    // console.log('Background sync completed:', payload);

    this.showNotification("Sync Complete", {
      body: "Your changes have been synchronized.",
      icon: "/icons/icon-sync.png",
    });
  }

  /**
   * Check for app updates
   */
  async checkForUpdates() {
    try {
      if (!this.registration) return;

      await this.registration.update();

      if (this.updateAvailable) {
        this.notifyUpdateAvailable();
      }
    } catch (_error) {
      // console.error('Failed to check for updates:', error);
    }
  }

  /**
   * Notify user of available update
   */
  notifyUpdateAvailable() {
    this.showNotification("Update Available", {
      body: "A new version of the app is available. Click to refresh.",
      icon: "/icons/icon-update.png",
      requireInteraction: true,
      actions: [
        {
          action: "update",
          title: "Update Now",
        },
        {
          action: "dismiss",
          title: "Later",
        },
      ],
    });

    // Listen for notification actions
    if (this.registration) {
      typeof navigator !== "undefined" &&
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "NOTIFICATION_ACTION") {
            if (event.data.action === "update") {
              this.applyUpdate();
            }
          }
        });
    }
  }

  /**
   * Apply available update
   */
  async applyUpdate() {
    try {
      if (!this.registration || !this.registration.waiting) {
        return;
      }

      // Tell the waiting service worker to skip waiting
      this.registration.waiting.postMessage({ type: "SKIP_WAITING" });

      // Reload the page to apply the update
      typeof window !== "undefined" && window.location.reload();
    } catch (_error) {
      // console.error('Failed to apply update:', error);
    }
  }

  /**
   * Get current app status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      isOnline: this.isOnline,
      serviceWorkerReady: !!this.registration,
      updateAvailable: this.updateAvailable,
      notificationsEnabled: Notification.permission === "granted",
      syncQueueLength: this.syncQueue.length,
      cacheName: this.cacheName,
    };
  }

  /**
   * Utility: Convert base64 URL to Uint8Array
   */
  urlB64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = typeof window !== "undefined" && window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Generate unique sync ID
   */
  generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get authentication token
   */
  getAuthToken() {
    return (
      (typeof localStorage !== "undefined" &&
        localStorage.getItem("authToken")) ||
      sessionStorage.getItem("authToken")
    );
  }

  /**
   * Track analytics event
   */
  trackEvent(eventName, data = {}) {
    // Send to analytics service
    // console.log('PWA Event:', eventName, data);

    // Could integrate with Google Analytics, custom analytics, etc.
    if (typeof window !== "undefined" && window.gtag) {
      typeof window !== "undefined" && window.gtag("event", eventName, data);
    }
  }
}

// Export PWA Manager
export default PWAManager;
