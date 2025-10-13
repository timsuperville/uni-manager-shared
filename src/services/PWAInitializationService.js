/* eslint-disable no-undef */

/**
 * PWA Initialization Service
 * Manages PWA setup and initialization across all frontend applications
 */

import PWAManager from './PWAManager.js';

class PWAInitializationService {
  constructor() {
    this.pwaManager = null;
    this.initialized = false;
    this.config = {
      enableNotifications: true,
      enableBackgroundSync: true,
      enableOfflineSupport: true,
      enableInstallPrompt: true,
      cacheStrategy: 'networkFirst',
      syncRetryAttempts: 3,
      notificationDefaults: {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200]
      }
    };
  }

  /**
   * Initialize PWA for the current application
   */
  async initialize(appConfig = {}) {
    try {
      if (this.initialized) {
        // console.log('PWA already initialized');
        return this.pwaManager;
      }

      // Merge app-specific config
      this.config = { ...this.config, ...appConfig };

      // Create and initialize PWA Manager
      this.pwaManager = new PWAManager();
      const success = await this.pwaManager.initialize();

      if (success) {
        this.initialized = true;
        // console.log('PWA initialized successfully');

        // Set up app-specific features
        await this.setupAppFeatures();

        // Register event listeners
        this.registerEventListeners();

        // Perform initial sync if needed
        await this.performInitialSync();

        return this.pwaManager;
      } else {
        // console.warn('PWA initialization failed');
        return null;
      }
    } catch (_error) {
      // console.error('Failed to initialize PWA:', error);
      return null;
    }
  }

  /**
   * Set up application-specific PWA features
   */
  async setupAppFeatures() {
    try {
      // Determine current app from URL
      const currentApp = this.getCurrentApp();

      switch (currentApp) {
      case 'church':
        await this.setupChurchAppFeatures();
        break;
      case 'home':
        await this.setupHomeAppFeatures();
        break;
      case 'admin':
        await this.setupAdminAppFeatures();
        break;
      case 'business':
        await this.setupBusinessAppFeatures();
        break;
      case 'personal':
        await this.setupPersonalAppFeatures();
        break;
      case 'playback':
        await this.setupPlaybackAppFeatures();
        break;
      default:
        await this.setupMainWebsiteFeatures();
      }

      // console.log(`PWA features set up for ${currentApp} app`);
    } catch (_error) {
      // console.error('Failed to set up app features:', error);
    }
  }

  /**
   * Set up Church app specific PWA features
   */
  async setupChurchAppFeatures() {
    // Cache critical church resources
    const churchResources = [
      '/church/services',
      '/church/members',
      '/church/events',
      '/api/church/services',
      '/api/church/members'
    ];

    await this.cacheResources(churchResources);

    // Set up church-specific notifications
    this.setupChurchNotifications();

    // Set up offline service creation
    this.setupOfflineServiceSync();
  }

  /**
   * Set up Home app specific PWA features
   */
  async setupHomeAppFeatures() {
    // Cache critical home resources
    const homeResources = [
      '/home/dashboard',
      '/home/family',
      '/home/budget',
      '/api/home/family',
      '/api/home/budget'
    ];

    await this.cacheResources(homeResources);

    // Set up family notifications
    this.setupFamilyNotifications();

    // Set up offline budget sync
    this.setupOfflineBudgetSync();
  }

  /**
   * Set up Admin app specific PWA features
   */
  async setupAdminAppFeatures() {
    // Cache critical admin resources
    const adminResources = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/analytics',
      '/api/admin/users',
      '/api/admin/analytics'
    ];

    await this.cacheResources(adminResources);

    // Set up admin notifications
    this.setupAdminNotifications();

    // Set up system monitoring
    this.setupSystemMonitoring();
  }

  /**
   * Set up Business app specific PWA features
   */
  async setupBusinessAppFeatures() {
    // Cache critical business resources
    const businessResources = [
      '/business/dashboard',
      '/business/projects',
      '/business/clients',
      '/api/business/projects',
      '/api/business/clients'
    ];

    await this.cacheResources(businessResources);

    // Set up business notifications
    this.setupBusinessNotifications();
  }

  /**
   * Set up Personal app specific PWA features
   */
  async setupPersonalAppFeatures() {
    // Cache critical personal resources
    const personalResources = [
      '/personal/dashboard',
      '/personal/goals',
      '/personal/notes',
      '/api/personal/goals',
      '/api/personal/notes'
    ];

    await this.cacheResources(personalResources);

    // Set up personal notifications
    this.setupPersonalNotifications();
  }

  /**
   * Set up Playback app specific PWA features
   */
  async setupPlaybackAppFeatures() {
    // Cache critical playback resources
    const playbackResources = [
      '/playback/dashboard',
      '/playback/media',
      '/playback/playlists',
      '/api/playback/media',
      '/api/playback/playlists'
    ];

    await this.cacheResources(playbackResources);

    // Set up media notifications
    this.setupMediaNotifications();
  }

  /**
   * Set up main website PWA features
   */
  async setupMainWebsiteFeatures() {
    // Cache main website resources
    const websiteResources = [
      '/',
      '/about',
      '/features',
      '/pricing',
      '/contact'
    ];

    await this.cacheResources(websiteResources);

    // Set up marketing notifications
    this.setupMarketingNotifications();
  }

  /**
   * Cache resources for offline access
   */
  async cacheResources(urls) {
    try {
      if (this.pwaManager && urls.length > 0) {
        await this.pwaManager.cacheResources(urls);
        // console.log(`Cached ${urls.length} resources for offline access`);
      }
    } catch (_error) {
      // console.error('Failed to cache resources:', error);
    }
  }

  /**
   * Register application event listeners
   */
  registerEventListeners() {
    // Connection status changes
    typeof window !== "undefined" && window.addEventListener('connectionchange', (event) => {
      this.handleConnectionChange(event.detail.isOnline);
    });

    // App visibility changes
    typeof document !== "undefined" && document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Before unload (app closing)
    typeof window !== "undefined" && window.addEventListener('beforeunload', () => {
      this.handleAppClosing();
    });

    // Handle app updates
    typeof window !== "undefined" && window.addEventListener('appupdateavailable', () => {
      this.handleAppUpdateAvailable();
    });
  }

  /**
   * Handle connection status changes
   */
  handleConnectionChange(isOnline) {
    const message = isOnline ?
      'Connection restored - syncing data...' :
      'You are offline - changes will sync when reconnected';

    this.showNotification('Connection Status', {
      body: message,
      icon: isOnline ? '/icons/icon-online.png' : '/icons/icon-offline.png',
      tag: 'connection-status'
    });

    // Update UI elements
    this.updateConnectionStatusUI(isOnline);
  }

  /**
   * Handle app visibility changes
   */
  handleVisibilityChange() {
    if (!typeof document !== "undefined" && document.hidden) {
      // App came to foreground - check for updates and sync
      this.checkForUpdatesAndSync();
    }
  }

  /**
   * Handle app closing
   */
  handleAppClosing() {
    // Save any pending data
    this.savePendingData();
  }

  /**
   * Handle app update availability
   */
  handleAppUpdateAvailable() {
    this.showNotification('App Update Available', {
      body: 'A new version is ready. Refresh to update.',
      requireInteraction: true,
      actions: [
        { action: 'update', title: 'Update Now' },
        { action: 'later', title: 'Later' }
      ]
    });
  }

  /**
   * Perform initial sync when app loads
   */
  async performInitialSync() {
    try {
      if (typeof navigator !== "undefined" && navigator.onLine && this.pwaManager) {
        // Process any queued sync items
        await this.pwaManager.processSyncQueue();
        // console.log('Initial sync completed');
      }
    } catch (_error) {
      // console.error('Initial sync failed:', error);
    }
  }

  /**
   * Check for updates and sync data
   */
  async checkForUpdatesAndSync() {
    try {
      if (this.pwaManager) {
        await this.pwaManager.checkForUpdates();

        if (typeof navigator !== "undefined" && navigator.onLine) {
          await this.pwaManager.processSyncQueue();
        }
      }
    } catch (_error) {
      // console.error('Update check failed:', error);
    }
  }

  /**
   * Save pending data before app closes
   */
  savePendingData() {
    try {
      // Get any unsaved form data
      const formData = this.collectUnsavedFormData();

      if (formData && Object.keys(formData).length > 0) {
        typeof localStorage !== "undefined" && localStorage.setItem('pendingFormData', JSON.stringify(formData));
        // console.log('Saved pending form data');
      }
    } catch (_error) {
      // console.error('Failed to save pending data:', error);
    }
  }

  /**
   * Collect unsaved form data
   */
  collectUnsavedFormData() {
    const formData = {};

    // Collect data from forms with data-persist attribute
    const persistentForms = typeof document !== "undefined" && document.querySelectorAll('form[data-persist]');

    persistentForms.forEach((form, index) => {
      const formId = form.id || `form_${index}`;
      const inputs = form.querySelectorAll('input, textarea, select');

      inputs.forEach(input => {
        if (input.value && input.value.trim() !== '') {
          if (!formData[formId]) formData[formId] = {};
          formData[formId][input.name || input.id] = input.value;
        }
      });
    });

    return formData;
  }

  /**
   * Update connection status UI elements
   */
  updateConnectionStatusUI(isOnline) {
    // Update status indicators
    const statusElements = typeof document !== "undefined" && document.querySelectorAll('[data-connection-status]');
    statusElements.forEach(element => {
      element.textContent = isOnline ? 'Online' : 'Offline';
      element.className = isOnline ? 'status-online' : 'status-offline';
    });

    // Show/hide offline features
    const offlineElements = typeof document !== "undefined" && document.querySelectorAll('[data-offline-only]');
    offlineElements.forEach(element => {
      element.style.display = isOnline ? 'none' : 'block';
    });

    const onlineElements = typeof document !== "undefined" && document.querySelectorAll('[data-online-only]');
    onlineElements.forEach(element => {
      element.style.display = isOnline ? 'block' : 'none';
    });
  }

  /**
   * Show notification using PWA Manager
   */
  async showNotification(title, options = {}) {
    try {
      if (this.pwaManager) {
        const notificationOptions = {
          ...this.config.notificationDefaults,
          ...options
        };

        await this.pwaManager.showNotification(title, notificationOptions);
      }
    } catch (_error) {
      // console.error('Failed to show notification:', error);
    }
  }

  /**
   * Add item to background sync queue
   */
  async addToSyncQueue(action, data) {
    try {
      if (this.pwaManager) {
        return await this.pwaManager.addToSyncQueue(action, data);
      }
      return null;
    } catch (_error) {
      // console.error('Failed to add to sync queue:', error);
      return null;
    }
  }

  /**
   * Get current app from URL
   */
  getCurrentApp() {
    const path = typeof window !== "undefined" && window.location.pathname;

    if (path.startsWith('/church')) return 'church';
    if (path.startsWith('/home')) return 'home';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/business')) return 'business';
    if (path.startsWith('/personal')) return 'personal';
    if (path.startsWith('/playback')) return 'playback';

    return 'website';
  }

  /**
   * Set up church-specific notifications
   */
  setupChurchNotifications() {
    // Set up service reminders, event notifications, etc.
    // console.log('Church notifications configured');
  }

  /**
   * Set up family notifications
   */
  setupFamilyNotifications() {
    // Set up family event reminders, chore notifications, etc.
    // console.log('Family notifications configured');
  }

  /**
   * Set up admin notifications
   */
  setupAdminNotifications() {
    // Set up system alerts, user activity notifications, etc.
    // console.log('Admin notifications configured');
  }

  /**
   * Set up business notifications
   */
  setupBusinessNotifications() {
    // Set up project deadlines, client notifications, etc.
    // console.log('Business notifications configured');
  }

  /**
   * Set up personal notifications
   */
  setupPersonalNotifications() {
    // Set up goal reminders, personal task notifications, etc.
    // console.log('Personal notifications configured');
  }

  /**
   * Set up media notifications
   */
  setupMediaNotifications() {
    // Set up playback notifications, media updates, etc.
    // console.log('Media notifications configured');
  }

  /**
   * Set up marketing notifications
   */
  setupMarketingNotifications() {
    // Set up feature announcements, newsletter notifications, etc.
    // console.log('Marketing notifications configured');
  }

  /**
   * Set up offline service sync for church app
   */
  setupOfflineServiceSync() {
    // Handle offline service creation and sync
    // console.log('Offline service sync configured');
  }

  /**
   * Set up offline budget sync for home app
   */
  setupOfflineBudgetSync() {
    // Handle offline budget changes and sync
    // console.log('Offline budget sync configured');
  }

  /**
   * Set up system monitoring for admin app
   */
  setupSystemMonitoring() {
    // Set up real-time system monitoring notifications
    // console.log('System monitoring configured');
  }

  /**
   * Get PWA status information
   */
  getStatus() {
    return {
      initialized: this.initialized,
      pwaManagerStatus: this.pwaManager ? this.pwaManager.getStatus() : null,
      currentApp: this.getCurrentApp(),
      config: this.config
    };
  }

  /**
   * Cleanup PWA resources
   */
  async cleanup() {
    try {
      // Remove event listeners
      typeof window !== "undefined" && window.removeEventListener('connectionchange', this.handleConnectionChange);
      typeof document !== "undefined" && document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      typeof window !== "undefined" && window.removeEventListener('beforeunload', this.handleAppClosing);

      // Save any pending data
      this.savePendingData();

      // console.log('PWA cleanup completed');
    } catch (_error) {
      // console.error('PWA cleanup failed:', error);
    }
  }
}

// Create singleton instance
const pwaInitializationService = new PWAInitializationService();

// Export both the class and singleton
export default pwaInitializationService;
export { PWAInitializationService };