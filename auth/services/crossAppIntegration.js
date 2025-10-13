// Cross-App Integration Layer for Uni-Manager
// Orchestrates shared authentication, notifications, and data caching
/* global setTimeout, setInterval, clearInterval */
import sharedAuthService from './CrossAppService.js';
import crossAppNotifications from './crossAppNotifications.js';
import sharedDataCache from './sharedDataCache.js';
class CrossAppIntegration {
  constructor() {
    this.registeredApps = new Map();
    this.integrationConfig = {
      enableAuth: true,
      enableNotifications: true,
      enableDataCache: true,
      enableCrossAppSync: true,
    };
    this.crossAppService = sharedAuthService;
    this.init();
  }
  init() {
    // Set up inter-service communication
    this.setupServiceIntegration();
    // Start health monitoring
    this.startHealthMonitoring();
  }
  // Main registration method for applications
  registerApplication(appName, config = {}) {
    const appConfig = {
      appName,
      domain: config.domain || appName,
      features: {
        auth: config.enableAuth !== false,
        notifications: config.enableNotifications !== false,
        dataCache: config.enableDataCache !== false,
        crossAppSync: config.enableCrossAppSync !== false,
      },
      apiEndpoints: config.apiEndpoints || {},
      preferences: config.preferences || {},
      registeredAt: new Date(),
    };
    // Register with individual services
    const services = this.initializeAppServices(appName, appConfig);
    // Store app configuration
    this.registeredApps.set(appName, {
      ...appConfig,
      services,
    });
    // Set up cross-service event handlers
    this.setupAppEventHandlers(appName, services);
    return {
      // Authentication API
      auth: services.auth
        ? {
            login: (credentials) => services.auth.login(credentials, appName),
            logout: () => services.auth.logout(appName),
            getCurrentUser: () => services.auth.getCurrentUser(),
            isAuthenticated: () => services.auth.isAuthenticated(),
            onAuthChange: (callback) => this.onAuthChange(appName, callback),
          }
        : null,
      // Notifications API
      notifications: services.notifications
        ? {
            send: (type, data, options) =>
              services.notifications.sendNotification(
                appName,
                type,
                data,
                options
              ),
            sendDataUpdate: (updateType, data, targetApp) =>
              services.notifications.sendDataUpdate(
                appName,
                updateType,
                data,
                targetApp
              ),
            sendUserAction: (action, context, targetApp) =>
              services.notifications.sendUserAction(
                appName,
                action,
                context,
                targetApp
              ),
            sendSystemAlert: (alertType, message, options) =>
              services.notifications.sendSystemAlert(
                appName,
                alertType,
                message,
                options
              ),
            onNotification: (handlers) =>
              this.setupNotificationHandlers(appName, handlers),
          }
        : null,
      // Data Cache API
      cache: services.cache
        ? {
            get: services.cache.get,
            set: services.cache.set,
            delete: services.cache.delete,
            clear: services.cache.clear,
            mget: services.cache.mget,
            mset: services.cache.mset,
            subscribe: services.cache.subscribe,
            invalidate: services.cache.invalidate,
            stats: services.cache.stats,
          }
        : null,
      // Cross-App Communication
      crossApp: {
        shareData: (targetApp, key, data, options) =>
          this.shareDataBetweenApps(appName, targetApp, key, data, options),
        requestData: (sourceApp, key, timeout) =>
          this.requestDataFromApp(appName, sourceApp, key, timeout),
        broadcastEvent: (eventName, eventData, targetApps) =>
          this.broadcastEvent(appName, eventName, eventData, targetApps),
        subscribeToApp: (sourceApp, eventType, callback) =>
          this.subscribeToAppEvents(appName, sourceApp, eventType, callback),
      },
      // Application Management
      getRegisteredApps: () => this.getRegisteredApps(),
      getAppStatus: (targetApp) => this.getAppStatus(targetApp),
      unregister: () => this.unregisterApplication(appName),
      // Health and Diagnostics
      healthCheck: () => this.getAppHealthStatus(appName),
      getIntegrationStats: () => this.getIntegrationStats(),
    };
  }
  initializeAppServices(appName, appConfig) {
    const services = {};
    // Initialize authentication service
    if (appConfig.features.auth && this.integrationConfig.enableAuth) {
      services.auth = this.crossAppService.registerApplication(appName);
    }
    // Initialize notification service
    if (
      appConfig.features.notifications &&
      this.integrationConfig.enableNotifications
    ) {
      services.notifications = crossAppNotifications.registerApplication(
        appName,
        {
          dataUpdate: (data, context) =>
            this.handleDataUpdate(appName, data, context),
          userAction: (data, context) =>
            this.handleUserAction(appName, data, context),
          systemAlert: (data, context) =>
            this.handleSystemAlert(appName, data, context),
          customEvent: (data, context) =>
            this.handleCustomEvent(appName, data, context),
        }
      );
    }
    // Initialize data cache service
    if (
      appConfig.features.dataCache &&
      this.integrationConfig.enableDataCache
    ) {
      services.cache = sharedDataCache.registerApp(appName, {
        namespace: appConfig.domain,
        syncEnabled: appConfig.features.crossAppSync,
        persistEnabled: true,
        maxCacheEntries: 200,
        defaultTTL: 30 * 60 * 1000, // 30 minutes
      });
    }
    return services;
  }
  setupServiceIntegration() {
    // Auth service events
    this.crossAppService.on('auth-login', (data) => {
      // Notify all apps about authentication change
      crossAppNotifications.sendSystemAlert(
        'integration',
        'user-authenticated',
        {
          user: data.user,
          source: data.source,
          timestamp: data.timestamp,
        }
      );
      // Cache user data across apps
      if (sharedDataCache) {
        sharedDataCache.set('global:current_user', data.user, {
          ttl: 24 * 60 * 60 * 1000, // 24 hours
          syncAcrossApps: true,
          persist: true,
        });
      }
    });
    this.crossAppService.on('auth-logout', (data) => {
      // Clear cached user data
      if (sharedDataCache) {
        sharedDataCache.delete('global:current_user');
        // Clear all user-specific cached data
        for (const [appName] of this.registeredApps) {
          sharedDataCache.clearNamespace(appName, 'user:*');
        }
      }
      // Notify all apps about logout
      crossAppNotifications.sendSystemAlert('integration', 'user-logged-out', {
        source: data.source,
        timestamp: data.timestamp,
      });
    });
    // Cache service events
    if (sharedDataCache) {
      // Monitor cache changes for cross-app synchronization
      for (const [appName] of this.registeredApps) {
        sharedDataCache.subscribe(appName, '*', (event) => {
          if (event.operation === 'set') {
            crossAppNotifications.sendDataUpdate(
              'integration',
              'cache-updated',
              {
                key: event.key,
                appName: event.appName,
                timestamp: event.timestamp,
              }
            );
          }
        });
      }
    }
  }
  setupAppEventHandlers(appName, services) {
    const appConfig = this.registeredApps.get(appName);
    if (!appConfig) return;
    // Set up notification handlers if custom handlers weren't provided
    if (services.notifications && !appConfig.customHandlers) {
      services.notifications.updateHandlers({
        dataUpdate: (data, context) =>
          this.handleDataUpdate(appName, data, context),
        userAction: (data, context) =>
          this.handleUserAction(appName, data, context),
        systemAlert: (data, context) =>
          this.handleSystemAlert(appName, data, context),
        customEvent: (data, context) =>
          this.handleCustomEvent(appName, data, context),
      });
    }
  }
  // Event handlers
  handleDataUpdate(appName, data, context) {
    // Cache the update for other apps
    if (this.registeredApps.get(appName)?.services?.cache) {
      const cacheKey = `updates:${data.updateType}:${Date.now()}`;
      this.registeredApps.get(appName).services.cache.set(
        cacheKey,
        {
          updateType: data.updateType,
          data: data.data,
          sourceApp: context.sourceApp,
          timestamp: context.timestamp,
        },
        { ttl: 5 * 60 * 1000 }
      ); // 5 minutes
    }
  }
  handleUserAction(appName, data, context) {
    // Log important user actions across apps
    const actionLog = {
      action: data.action,
      context: data.context,
      appName,
      sourceApp: context.sourceApp,
      timestamp: context.timestamp,
    };
    // Cache recent actions for analytics
    if (this.registeredApps.get(appName)?.services?.cache) {
      this.registeredApps.get(appName).services.cache.set(
        `actions:${data.action}:${Date.now()}`,
        actionLog,
        { ttl: 60 * 60 * 1000 } // 1 hour
      );
    }
  }
  handleSystemAlert(appName, data) {
    // Handle critical system alerts
    if (data.level === 'critical') {
      // Broadcast to all apps
      for (const [otherAppName] of this.registeredApps) {
        if (otherAppName !== appName) {
          crossAppNotifications.sendSystemAlert(
            appName,
            data.alertType,
            data.message,
            {
              targetApp: otherAppName,
              priority: 'high',
            }
          );
        }
      }
    }
  }
  handleCustomEvent(appName, data, context) {
    // Process custom cross-app events
    if (data.eventName.startsWith('cross-app:')) {
      const eventType = data.eventName.replace('cross-app:', '');
      this.processCrossAppEvent(appName, eventType, data.eventData, context);
    }
  }
  // Cross-app communication methods
  shareDataBetweenApps(sourceApp, targetApp, key, data, options = {}) {
    const sharedKey = `shared:${sourceApp}:${targetApp}:${key}`;
    if (sharedDataCache) {
      sharedDataCache.set(sharedKey, data, {
        ttl: options.ttl || 30 * 60 * 1000,
        syncAcrossApps: true,
        persist: options.persist !== false,
      });
    }
    // Notify target app
    crossAppNotifications.sendCustomEvent(
      sourceApp,
      'data-shared',
      {
        key,
        sourceApp,
        sharedKey,
        dataType: typeof data,
      },
      targetApp
    );
    return sharedKey;
  }
  async requestDataFromApp(requestingApp, sourceApp, key, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // Set up response handler
      const responseHandler = (data) => {
        if (
          data.eventName === 'data-response' &&
          data.eventData.requestId === requestId
        ) {
          resolve(data.eventData.data);
        }
      };
      // Register temporary handler
      const targetAppServices =
        this.registeredApps.get(requestingApp)?.services;
      if (targetAppServices?.notifications) {
        targetAppServices.notifications.updateHandlers({
          customEvent: responseHandler,
        });
        // Send data request
        crossAppNotifications.sendCustomEvent(
          requestingApp,
          'data-request',
          {
            requestId,
            key,
            requestingApp,
          },
          sourceApp
        );
        // Set timeout
        setTimeout(() => {
          reject(
            new Error(`Data request timeout for ${key} from ${sourceApp}`)
          );
        }, timeout);
      } else {
        reject(new Error(`Notifications not available for ${requestingApp}`));
      }
    });
  }
  broadcastEvent(sourceApp, eventName, eventData, targetApps = 'all') {
    crossAppNotifications.sendCustomEvent(
      sourceApp,
      `cross-app:${eventName}`,
      eventData,
      targetApps
    );
  }
  subscribeToAppEvents(subscribingApp, sourceApp, eventType, callback) {
    const appServices = this.registeredApps.get(subscribingApp)?.services;
    if (appServices?.notifications) {
      return appServices.notifications.updateHandlers({
        customEvent: (data, context) => {
          if (
            context.sourceApp === sourceApp &&
            data.eventName.includes(eventType)
          ) {
            callback(data, context);
          }
        },
      });
    }
    return null;
  }
  processCrossAppEvent(sourceApp, eventType, eventData) {
    switch (eventType) {
      case 'sync-data':
        this.handleDataSync(sourceApp, eventData);
        break;
      case 'share-state':
        this.handleStateShare(sourceApp, eventData);
        break;
      case 'request-sync':
        this.handleSyncRequest(sourceApp, eventData);
        break;
      default:
    }
  }
  handleDataSync(/* sourceApp, eventData */) {
    // Implement data synchronization logic
  }
  handleStateShare(/* sourceApp, eventData */) {
    // Implement state sharing logic
  }
  handleSyncRequest(/* sourceApp, eventData */) {
    // Implement sync request handling
  }
  // Application management
  unregisterApplication(appName) {
    const appConfig = this.registeredApps.get(appName);
    if (appConfig && appConfig.services) {
      // Unregister from all services
      Object.values(appConfig.services).forEach((service) => {
        if (service && service.unregister) {
          service.unregister();
        }
      });
    }
    this.registeredApps.delete(appName);
  }
  getRegisteredApps() {
    return Array.from(this.registeredApps.keys());
  }
  getAppStatus(appName) {
    const appConfig = this.registeredApps.get(appName);
    if (!appConfig) return null;
    return {
      appName,
      domain: appConfig.domain,
      registeredAt: appConfig.registeredAt,
      features: appConfig.features,
      services: Object.keys(appConfig.services),
      isActive: true,
    };
  }
  // Health monitoring
  startHealthMonitoring() {
    // Clear any existing interval to prevent multiple intervals
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }
    this.healthInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute
  }

  stopHealthMonitoring() {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
  }
  performHealthCheck() {
    const health = {
      integration: 'healthy',
      services: {
        auth: this.crossAppService ? 'healthy' : 'unavailable',
        notifications: crossAppNotifications ? 'healthy' : 'unavailable',
        cache: sharedDataCache ? 'healthy' : 'unavailable',
      },
      apps: this.getRegisteredApps().length,
      timestamp: new Date(),
    };
    // Store health status in cache
    if (sharedDataCache) {
      sharedDataCache.set('global:health_status', health, {
        ttl: 120000, // 2 minutes
        persist: false,
      });
    }
  }
  getAppHealthStatus(appName) {
    const appConfig = this.registeredApps.get(appName);
    if (!appConfig) return null;
    return {
      appName,
      status: 'healthy',
      services: Object.keys(appConfig.services),
      uptime: Date.now() - appConfig.registeredAt.getTime(),
      lastActivity: new Date(),
    };
  }
  getIntegrationStats() {
    return {
      totalApps: this.registeredApps.size,
      activeServices: Object.values(this.integrationConfig).filter(Boolean)
        .length,
      authStats: this.crossAppService
        ? {
            isAuthenticated: this.crossAppService.isAuthenticated(),
            currentUser: this.crossAppService.getCurrentUser(),
          }
        : null,
      notificationStats: crossAppNotifications
        ? crossAppNotifications.healthCheck()
        : null,
      cacheStats: sharedDataCache ? sharedDataCache.getGlobalStats() : null,
    };
  }
  // Utility methods
  onAuthChange(appName, callback) {
    this.crossAppService.on('auth-state-changed', callback);
    return {
      unsubscribe: () =>
        this.crossAppService.off('auth-state-changed', callback),
    };
  }
  setupNotificationHandlers(appName, handlers) {
    const appServices = this.registeredApps.get(appName)?.services;
    if (appServices?.notifications) {
      appServices.notifications.updateHandlers(handlers);
    }
  }
}
// Create singleton instance
const crossAppIntegration = new CrossAppIntegration();
export default crossAppIntegration;
