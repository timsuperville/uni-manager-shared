// Shared Authentication Service for all Uni-Manager Applications
// Handles cross-application authentication state and user management

/* global window, localStorage, console, setTimeout */

// Simple browser-compatible EventEmitter
class SimpleEventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach((listener) => listener(...args));
    }
  }

  off(event, listener) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((l) => l !== listener);
    }
  }
}

class SharedAuthService extends SimpleEventEmitter {
  constructor() {
    super();
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.applications = new Set(); // Track which apps are using this service
    this.boundStorageHandler = this.handleStorageChange.bind(this); // Store bound function for cleanup
    this.init();
  }

  init() {
    // Load existing auth state from localStorage
    this.loadStoredAuth();

    // Listen for storage events to sync across tabs
    typeof window !== "undefined" && window.addEventListener('storage', this.boundStorageHandler);

    // Validate token on initialization
    this.validateToken();
  }

  // Register an application with the shared auth service
  registerApplication(appName) {
    this.applications.add(appName);

    // Emit registration event
    this.emit('app-registered', { appName, totalApps: this.applications.size });

    return {
      unregister: () => this.unregisterApplication(appName),
    };
  }

  unregisterApplication(appName) {
    this.applications.delete(appName);

    this.emit('app-unregistered', {
      appName,
      totalApps: this.applications.size,
    });
  }

  // Authentication methods
  async login(credentials, appContext = 'unknown') {
    try {
      // Mock authentication - replace with real API call
      const response = await this.mockAuthenticate(credentials);

      if (response.success) {
        this.setAuthState(
          response.user,
          response.accessToken,
          response.refreshToken
        );

        // Notify all registered applications
        this.emit('auth-login', {
          user: this.currentUser,
          source: appContext,
          timestamp: new Date(),
        });

        return { success: true, user: this.currentUser };
      } else {
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (_error) {
      // console.error('Shared Auth Login Error:', error);
      this.emit('auth-error', { error, source: appContext });
      throw error;
    }
  }

  async logout(appContext = 'unknown') {
    try {
      // Clear auth state
      this.clearAuthState();

      // Notify all registered applications
      this.emit('auth-logout', {
        source: appContext,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (_error) {
      // console.error('Shared Auth Logout Error:', error);
      this.emit('auth-error', { error, source: appContext });
      throw error;
    }
  }

  async refreshAuthToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      // Mock token refresh - replace with real API call
      const response = await this.mockRefreshToken(this.refreshToken);

      if (response.success) {
        this.setAuthState(
          this.currentUser,
          response.accessToken,
          response.refreshToken
        );

        // Notify all applications of token refresh
        this.emit('auth-token-refreshed', {
          user: this.currentUser,
          timestamp: new Date(),
        });

        return response.accessToken;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (_error) {
      // console.error('Token refresh error:', error);
      this.emit('auth-token-refresh-failed', { error });
      this.logout('token-refresh-failure');
      throw error;
    }
  }

  // Auth state management
  setAuthState(user, accessToken, refreshToken = null) {
    this.currentUser = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    // Store in localStorage for persistence
    this.storeAuth();

    // Emit state change
    this.emit('auth-state-changed', {
      user: this.currentUser,
      isAuthenticated: this.isAuthenticated(),
      timestamp: new Date(),
    });
  }

  clearAuthState() {
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;

    // Clear localStorage
    typeof localStorage !== "undefined" && localStorage.removeItem('uni_manager_auth');

    // Emit state change
    this.emit('auth-state-changed', {
      user: null,
      isAuthenticated: false,
      timestamp: new Date(),
    });
  }

  // Getters
  isAuthenticated() {
    return !!(this.currentUser && this.accessToken);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getAccessToken() {
    return this.accessToken;
  }

  getAuthHeaders() {
    return this.accessToken
      ? {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        }
      : {
          'Content-Type': 'application/json',
        };
  }

  // Storage management
  storeAuth() {
    const authData = {
      user: this.currentUser,
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      timestamp: new Date().toISOString(),
    };

    typeof localStorage !== "undefined" && localStorage.setItem('uni_manager_auth', JSON.stringify(authData));
  }

  loadStoredAuth() {
    try {
      const stored = typeof localStorage !== "undefined" && localStorage.getItem('uni_manager_auth');
      if (stored) {
        const authData = JSON.parse(stored);

        // Check if token is not too old (24 hours)
        const tokenAge = Date.now() - new Date(authData.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (tokenAge < maxAge) {
          this.currentUser = authData.user;
          this.accessToken = authData.accessToken;
          this.refreshToken = authData.refreshToken;
        } else {
          this.clearAuthState();
        }
      }
    } catch (_error) {
      // console.error('Error loading stored auth:', error);
      this.clearAuthState();
    }
  }

  handleStorageChange(event) {
    if (event.key === 'uni_manager_auth') {
      if (event.newValue === null) {
        // Auth was cleared in another tab
        this.clearAuthState();
      } else {
        // Auth was updated in another tab
        this.loadStoredAuth();
        this.emit('auth-synced-from-storage', {
          user: this.currentUser,
          isAuthenticated: this.isAuthenticated(),
        });
      }
    }
  }

  async validateToken() {
    if (!this.accessToken) return false;

    try {
      // Mock token validation - replace with real API call
      const isValid = await this.mockValidateToken(this.accessToken);

      if (!isValid) {
        if (this.refreshToken) {
          await this.refreshAuthToken();
        } else {
          this.clearAuthState();
        }
      }

      return this.isAuthenticated();
    } catch (_error) {
      // console.error('Token validation error:', error);
      this.clearAuthState();
      return false;
    }
  }

  // Mock authentication methods - replace with real API calls
  async mockAuthenticate(credentials) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock successful authentication
    if (credentials.email && credentials.password) {
      return {
        success: true,
        user: {
          id: 'user-123',
          email: credentials.email,
          firstName: 'John',
          lastName: 'Doe',
          roles: ['user'],
          applications: [
            'church',
            'admin',
            'business',
            'personal',
            'playback',
            'home',
          ],
          preferences: {},
        },
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      };
    } else {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }
  }

  async mockRefreshToken() {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      success: true,
      accessToken: 'refreshed-access-token-' + Date.now(),
      refreshToken: 'refreshed-refresh-token-' + Date.now(),
    };
  }

  async mockValidateToken(token) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Mock validation - in real implementation, call backend
    return (
      (token && token.startsWith('mock-access-token')) ||
      token.startsWith('refreshed-access-token')
    );
  }

  // Cleanup method to prevent memory leaks
  cleanup() {
    // Remove event listener to prevent memory leaks
    if (typeof window !== 'undefined' && this.boundStorageHandler) {
      typeof window !== "undefined" && window.removeEventListener('storage', this.boundStorageHandler);
    }

    // Clear all event listeners
    this.events = {};

    // Clear sensitive data
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.applications.clear();
  }
}

// Create singleton instance
const sharedAuthService = new SharedAuthService();

export default sharedAuthService;
