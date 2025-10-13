/**
 * Cross-Application Single Sign-On (SSO) Service
 *
 * Manages unified authentication across all 6 applications:
 * - Church Management
 * - Admin Dashboard
 * - Business Management
 * - Home Management
 * - Personal Management
 * - Playback System
 *
 * Features:
 * - Centralized token management with cross-domain support
 * - Seamless app switching without re-authentication
 * - Session synchronization across applications
 * - Security event tracking integration
 * - Real-time authentication state broadcasting
 */

/* global window, localStorage, BroadcastChannel, URL, console, setInterval, clearInterval, URLSearchParams, fetch */

import { AuthService } from './authService.js';
import { tokenStorage } from '../utils/tokenStorage.js';

class CrossApplicationSSOService {
  constructor() {
    this.authService = null;
    this.applications = new Map();
    this.currentApp = null;
    this.ssoSessionId = null;
    this.broadcastChannel = null;
    this.heartbeatInterval = null;
    this.sessionSyncInterval = null;

    // App registry with configurations
    this.appRegistry = {
      church: {
        name: 'Church Management',
        url: import.meta.env.VITE_CHURCH_APP_URL || 'http://localhost:5173',
        features: ['services', 'members', 'events', 'donations'],
        roles: ['church_admin', 'pastor', 'member'],
      },
      admin: {
        name: 'Admin Dashboard',
        url: import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5174',
        features: ['user_management', 'security', 'analytics', 'system_config'],
        roles: ['super_admin', 'admin', 'moderator'],
      },
      business: {
        name: 'Business Management',
        url: import.meta.env.VITE_BUSINESS_APP_URL || 'http://localhost:5176',
        features: ['projects', 'clients', 'billing', 'reports'],
        roles: ['business_admin', 'manager', 'employee'],
      },
      home: {
        name: 'Home Management',
        url: import.meta.env.VITE_HOME_APP_URL || 'http://localhost:5175',
        features: ['tasks', 'calendar', 'notes', 'family'],
        roles: ['home_admin', 'family_member', 'guest'],
      },
      personal: {
        name: 'Personal Management',
        url: import.meta.env.VITE_PERSONAL_APP_URL || 'http://localhost:5177',
        features: ['goals', 'journal', 'habits', 'finances'],
        roles: ['user'],
      },
      playback: {
        name: 'Playback System',
        url: import.meta.env.VITE_PLAYBACK_APP_URL || 'http://localhost:5178',
        features: ['media', 'playlists', 'streaming', 'controls'],
        roles: ['operator', 'viewer'],
      },
    };

    this.initialize();
  }

  /**
   * Initialize SSO service with cross-application communication
   */
  async initialize() {
    try {
      // Initialize the core authentication service
      this.authService = new AuthService({
        apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
        appType: 'sso_unified',
      });

      await this.authService.initialize();

      // Detect current application
      this.detectCurrentApplication();

      // Initialize cross-window communication
      this.initializeBroadcastChannel();

      // Set up session synchronization
      this.initializeSessionSync();

      // Generate or restore SSO session ID
      await this.initializeSSOSession();

      // Start heartbeat for session management
      this.startHeartbeat();

      // console.log('Cross-Application SSO Service initialized successfully');
      return true;
    } catch (_error) {
      // console.error('SSO Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Detect which application is currently running
   */
  detectCurrentApplication() {
    const currentUrl = typeof window !== "undefined" && window.location.origin;

    for (const [appId, appConfig] of Object.entries(this.appRegistry)) {
      if (
        currentUrl === appConfig.url ||
        typeof window !== "undefined" && window.location.hostname === new URL(appConfig.url).hostname
      ) {
        this.currentApp = appId;
        break;
      }
    }

    if (!this.currentApp) {
      // Fallback detection based on path or other indicators
      const path = typeof window !== "undefined" && window.location.pathname;
      if (path.includes('/admin')) this.currentApp = 'admin';
      else if (path.includes('/church')) this.currentApp = 'church';
      else if (path.includes('/business')) this.currentApp = 'business';
      else if (path.includes('/home')) this.currentApp = 'home';
      else if (path.includes('/personal')) this.currentApp = 'personal';
      else if (path.includes('/playback')) this.currentApp = 'playback';
      else this.currentApp = 'admin'; // Default fallback
    }

    // console.log(`Current application detected: ${this.currentApp}`);
  }

  /**
   * Initialize cross-window communication for SSO state synchronization
   */
  initializeBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('uni-manager-sso');

      this.broadcastChannel.addEventListener('message', (event) => {
        this.handleSSOMessage(event.data);
      });
    } else {
      // Fallback to localStorage events for older browsers
      typeof window !== "undefined" && window.addEventListener('storage', (event) => {
        if (event.key === 'uni-manager-sso-event') {
          this.handleSSOMessage(JSON.parse(event.newValue));
        }
      });
    }
  }

  /**
   * Handle SSO messages from other application instances
   */
  async handleSSOMessage(message) {
    const { type, data, sessionId } = message;

    // Ignore messages from the same session
    if (sessionId === this.ssoSessionId) return;

    switch (type) {
      case 'LOGIN_SUCCESS':
        await this.handleRemoteLogin(data);
        break;
      case 'LOGOUT':
        await this.handleRemoteLogout(data);
        break;
      case 'SESSION_REFRESH':
        await this.handleSessionRefresh(data);
        break;
      case 'APP_SWITCH':
        await this.handleAppSwitch(data);
        break;
      case 'SESSION_HEARTBEAT':
        await this.handleSessionHeartbeat(data);
        break;
      default:
        // console.log('Unknown SSO message type:', type);
    }
  }

  /**
   * Broadcast SSO message to other application instances
   */
  broadcastSSOMessage(type, data) {
    const message = {
      type,
      data,
      sessionId: this.ssoSessionId,
      timestamp: Date.now(),
      sourceApp: this.currentApp,
    };

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
    } else {
      // Fallback to localStorage
      typeof localStorage !== "undefined" && localStorage.setItem('uni-manager-sso-event', JSON.stringify(message));
      typeof localStorage !== "undefined" && localStorage.removeItem('uni-manager-sso-event');
    }
  }

  /**
   * Initialize SSO session with unique identifier
   */
  async initializeSSOSession() {
    this.ssoSessionId = await tokenStorage.get('sso_session_id');

    if (!this.ssoSessionId) {
      this.ssoSessionId = this.generateSSOSessionId();
      await tokenStorage.set('sso_session_id', this.ssoSessionId);
    }
  }

  /**
   * Generate unique SSO session identifier
   */
  generateSSOSessionId() {
    return `sso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Unified login across all applications
   */
  async login(credentials) {
    try {
      // Track security event
      await this.trackSecurityEvent('sso_login_attempt', {
        app: this.currentApp,
        username: credentials.username || credentials.email,
        timestamp: Date.now(),
      });

      // Perform authentication through core service
      const result = await this.authService.login(credentials);

      if (result.success) {
        // Store SSO session data
        await this.storeSSOSessionData(result);

        // Track successful login
        await this.trackSecurityEvent('sso_login_success', {
          app: this.currentApp,
          userId: result.user.id,
          timestamp: Date.now(),
        });

        // Broadcast login success to other apps
        this.broadcastSSOMessage('LOGIN_SUCCESS', {
          user: result.user,
          token: result.token,
          permissions: result.permissions,
          timestamp: Date.now(),
        });

        return result;
      }

      throw new Error(result.message || 'Login failed');
    } catch (_error) {
      // Track failed login
      await this.trackSecurityEvent('sso_login_failure', {
        app: this.currentApp,
        username: credentials.username || credentials.email,
        error: error.message,
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  /**
   * Unified logout across all applications
   */
  async logout() {
    try {
      const user = await this.getCurrentUser();

      // Track logout event
      await this.trackSecurityEvent('sso_logout', {
        app: this.currentApp,
        userId: user?.id,
        timestamp: Date.now(),
      });

      // Perform logout through core service
      await this.authService.logout();

      // Clear SSO session data
      await this.clearSSOSessionData();

      // Broadcast logout to other apps
      this.broadcastSSOMessage('LOGOUT', {
        userId: user?.id,
        timestamp: Date.now(),
      });

      return { success: true };
    } catch (_error) {
      // console.error('SSO logout failed:', error);
      throw error;
    }
  }

  /**
   * Seamless app switching with maintained authentication
   */
  async switchToApp(targetApp, path = '/') {
    try {
      if (!this.appRegistry[targetApp]) {
        throw new Error(`Unknown application: ${targetApp}`);
      }

      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to switch apps');
      }

      // Check if user has permission for target app
      if (!this.hasAppPermission(user, targetApp)) {
        throw new Error(`User does not have permission to access ${targetApp}`);
      }

      // Track app switch
      await this.trackSecurityEvent('sso_app_switch', {
        sourceApp: this.currentApp,
        targetApp,
        userId: user.id,
        timestamp: Date.now(),
      });

      // Broadcast app switch intent
      this.broadcastSSOMessage('APP_SWITCH', {
        sourceApp: this.currentApp,
        targetApp,
        userId: user.id,
        timestamp: Date.now(),
      });

      // Build target URL with SSO parameters
      const targetUrl = this.buildSSOUrl(targetApp, path);

      // Navigate to target application
      typeof window !== "undefined" && window.location.href = targetUrl;
    } catch (_error) {
      // console.error('App switch failed:', error);
      throw error;
    }
  }

  /**
   * Check if user has permission to access application
   */
  hasAppPermission(user, appId) {
    const appConfig = this.appRegistry[appId];
    if (!appConfig || !user.roles) return false;

    // Check if user has any role that grants access to the app
    return user.roles.some(
      (role) => appConfig.roles.includes(role) || role === 'super_admin' // Super admin has access to all apps
    );
  }

  /**
   * Build SSO URL with authentication parameters
   */
  buildSSOUrl(targetApp, path) {
    const appConfig = this.appRegistry[targetApp];
    const baseUrl = appConfig.url;

    const params = new URLSearchParams({
      sso_session: this.ssoSessionId,
      source_app: this.currentApp,
      timestamp: Date.now().toString(),
    });

    return `${baseUrl}${path}?${params.toString()}`;
  }

  /**
   * Handle login from another application instance
   */
  async handleRemoteLogin(data) {
    try {
      // Update local authentication state
      await this.authService.setCurrentUser(data.user);
      await tokenStorage.set('accessToken', data.token);

      // console.log('Remote login synchronized successfully');
    } catch (_error) {
      // console.error('Remote login synchronization failed:', error);
    }
  }

  /**
   * Handle logout from another application instance
   */
  async handleRemoteLogout(_data) {
    try {
      // Clear local authentication state
      await this.authService.setCurrentUser(null);
      await this.clearSSOSessionData();

      // console.log('Remote logout synchronized successfully');
    } catch (_error) {
      // console.error('Remote logout synchronization failed:', error);
    }
  }

  /**
   * Store SSO session data
   */
  async storeSSOSessionData(authResult) {
    const sessionData = {
      user: authResult.user,
      token: authResult.token,
      permissions: authResult.permissions,
      apps: {
        [this.currentApp]: {
          lastAccess: Date.now(),
          active: true,
        },
      },
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    await tokenStorage.set('sso_session_data', sessionData);
  }

  /**
   * Clear SSO session data
   */
  async clearSSOSessionData() {
    await tokenStorage.remove('sso_session_data');
    await tokenStorage.remove('sso_session_id');
    this.ssoSessionId = null;
  }

  /**
   * Get current user from SSO session
   */
  async getCurrentUser() {
    try {
      const sessionData = await tokenStorage.get('sso_session_data');
      return sessionData?.user || null;
    } catch (_error) {
      // console.error('Failed to get current user from SSO:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated across SSO
   */
  async isAuthenticated() {
    try {
      const sessionData = await tokenStorage.get('sso_session_data');
      const token = sessionData?.token;

      if (!token) return false;

      // Verify token validity through core auth service
      return await this.authService.isAuthenticated();
    } catch (_error) {
      // console.error('SSO authentication check failed:', error);
      return false;
    }
  }

  /**
   * Initialize session synchronization
   */
  initializeSessionSync() {
    this.sessionSyncInterval = setInterval(async () => {
      await this.syncSessionState();
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Synchronize session state across applications
   */
  async syncSessionState() {
    try {
      const sessionData = await tokenStorage.get('sso_session_data');
      if (!sessionData) return;

      // Update last activity for current app
      sessionData.apps = sessionData.apps || {};
      sessionData.apps[this.currentApp] = {
        lastAccess: Date.now(),
        active: true,
      };
      sessionData.lastActivity = Date.now();

      await tokenStorage.set('sso_session_data', sessionData);

      // Broadcast session heartbeat
      this.broadcastSSOMessage('SESSION_HEARTBEAT', {
        sessionId: this.ssoSessionId,
        app: this.currentApp,
        timestamp: Date.now(),
      });
    } catch (_error) {
      // console.error('Session sync failed:', error);
    }
  }

  /**
   * Start heartbeat for session management
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      const isAuth = await this.isAuthenticated();
      if (!isAuth) {
        await this.handleSessionExpiry();
      }
    }, 60000); // Check every minute
  }

  /**
   * Handle session expiry
   */
  async handleSessionExpiry() {
    try {
      await this.clearSSOSessionData();

      // Broadcast session expiry
      this.broadcastSSOMessage('SESSION_EXPIRED', {
        timestamp: Date.now(),
      });

      // Redirect to login if needed
      if (typeof window !== "undefined" && window.location.pathname !== '/login') {
        typeof window !== "undefined" && window.location.href = '/login?reason=session_expired';
      }
    } catch (_error) {
      // console.error('Session expiry handling failed:', error);
    }
  }

  /**
   * Track security events for SSO operations
   */
  async trackSecurityEvent(eventType, data) {
    try {
      const response = await fetch(
        '/api/shared/security-analytics/auth-events',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await tokenStorage.get('accessToken')}`,
          },
          body: JSON.stringify({
            type: eventType,
            data,
            app: this.currentApp,
            sessionId: this.ssoSessionId,
            timestamp: Date.now(),
          }),
        }
      );

      if (!response.ok) {
        // console.warn('Failed to track security event:', eventType);
      }
    } catch (_error) {
      // console.error('Security event tracking failed:', error);
    }
  }

  /**
   * Get available applications for current user
   */
  async getAvailableApps() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    return Object.entries(this.appRegistry)
      .filter(([appId, _appConfig]) => this.hasAppPermission(user, appId))
      .map(([appId, appConfig]) => ({
        id: appId,
        name: appConfig.name,
        url: appConfig.url,
        features: appConfig.features,
        active: appId === this.currentApp,
      }));
  }

  /**
   * Handle application switch request
   */
  async handleAppSwitch(data) {
    // console.log('App switch detected:', data);
  }

  /**
   * Handle session heartbeat from other apps
   */
  async handleSessionHeartbeat(data) {
    // Update session data with heartbeat info
    try {
      const sessionData = await tokenStorage.get('sso_session_data');
      if (sessionData && data.sessionId === this.ssoSessionId) {
        sessionData.lastActivity = data.timestamp;
        await tokenStorage.set('sso_session_data', sessionData);
      }
    } catch (_error) {
      // console.error('Heartbeat handling failed:', error);
    }
  }

  /**
   * Handle session refresh
   */
  async handleSessionRefresh(data) {
    try {
      if (data.token) {
        await tokenStorage.set('accessToken', data.token);
      }
      // console.log('Session refreshed from SSO');
    } catch (_error) {
      // console.error('Session refresh failed:', error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.sessionSyncInterval) {
      clearInterval(this.sessionSyncInterval);
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  }
}

export { CrossApplicationSSOService };
export default CrossApplicationSSOService;
