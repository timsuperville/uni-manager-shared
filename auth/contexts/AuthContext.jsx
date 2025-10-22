/**
 * Enhanced AuthContext with Session Management
 * Integrates with SessionManager for automatic token refresh and cross-tab sync
 * Includes WebAuthn, OAuth2, MFA, and advanced session tracking
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { SessionManager } from '../services/SessionManager';
import sessionManagementService from '../services/sessionManagementService';
import mfaService from '../services/mfaService';
import oauthService from '../services/oauthService';
// webauthnService should be imported per app - this is handled in the app-specific providers
import securityService from '../services/securityService';

// Auth action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SESSION_WARNING: 'SESSION_WARNING',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  CROSS_TAB_LOGIN: 'CROSS_TAB_LOGIN',
  CROSS_TAB_LOGOUT: 'CROSS_TAB_LOGOUT',
  // MFA actions
  MFA_REQUIRED: 'MFA_REQUIRED',
  MFA_SETUP_REQUIRED: 'MFA_SETUP_REQUIRED',
  MFA_VERIFICATION_SUCCESS: 'MFA_VERIFICATION_SUCCESS',
  MFA_VERIFICATION_FAILURE: 'MFA_VERIFICATION_FAILURE',
  MFA_STATUS_UPDATED: 'MFA_STATUS_UPDATED',
  // Enhanced session management actions
  SESSION_CREATED: 'SESSION_CREATED',
  SESSION_UPDATED: 'SESSION_UPDATED',
  SESSION_INVALIDATED: 'SESSION_INVALIDATED',
  DEVICE_FINGERPRINT_UPDATED: 'DEVICE_FINGERPRINT_UPDATED',
  // WebAuthn actions
  WEBAUTHN_AVAILABLE: 'WEBAUTHN_AVAILABLE',
  WEBAUTHN_CREDENTIALS_UPDATED: 'WEBAUTHN_CREDENTIALS_UPDATED',
  // OAuth actions
  OAUTH_PROVIDERS_LOADED: 'OAUTH_PROVIDERS_LOADED',
  OAUTH_STATE_UPDATED: 'OAUTH_STATE_UPDATED',
  // Security actions
  SECURITY_ALERT_ADDED: 'SECURITY_ALERT_ADDED',
  SECURITY_ALERTS_CLEARED: 'SECURITY_ALERTS_CLEARED',
  SECURITY_STATUS_UPDATED: 'SECURITY_STATUS_UPDATED',
  RATE_LIMIT_STATUS_UPDATED: 'RATE_LIMIT_STATUS_UPDATED',
  // Analytics actions
  SESSION_ANALYTICS_UPDATED: 'SESSION_ANALYTICS_UPDATED',
  AUTH_HISTORY_UPDATED: 'AUTH_HISTORY_UPDATED',
};

// Initial auth state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sessionWarning: false,
  timeUntilExpiry: 0,
  // MFA state
  mfaRequired: false,
  mfaSetupRequired: false,
  mfaStatus: null,
  pendingLoginCredentials: null,
  // Enhanced session management state
  currentSession: null,
  sessionStatus: 'inactive',
  deviceFingerprint: null,
  sessionAnalytics: null,
  // WebAuthn state
  webauthnAvailable: false,
  webauthnCredentials: [],
  // OAuth state
  oauthProviders: [],
  oauthState: null,
  // Security state
  securityAlerts: [],
  securityStatus: 'normal',
  rateLimitStatus: null,
  // Analytics state
  authHistory: [],
};

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessionWarning: false,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        error: state.error, // Preserve error if logout was due to error
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.loading,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload.error,
        isLoading: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SESSION_WARNING:
      return {
        ...state,
        sessionWarning: true,
        timeUntilExpiry: action.payload.timeRemaining,
      };

    case AUTH_ACTIONS.SESSION_EXPIRED:
      return {
        ...initialState,
        error: 'Your session has expired. Please log in again.',
      };

    case AUTH_ACTIONS.TOKEN_REFRESHED:
      return {
        ...state,
        token: action.payload.token,
        sessionWarning: false,
      };

    case AUTH_ACTIONS.CROSS_TAB_LOGIN:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        sessionWarning: false,
      };

    case AUTH_ACTIONS.CROSS_TAB_LOGOUT:
      return {
        ...initialState,
      };

    case AUTH_ACTIONS.MFA_REQUIRED:
      return {
        ...state,
        mfaRequired: true,
        pendingLoginCredentials: action.payload.credentials,
        error: null,
      };

    case AUTH_ACTIONS.MFA_SETUP_REQUIRED:
      return {
        ...state,
        mfaSetupRequired: true,
        error: null,
      };

    case AUTH_ACTIONS.MFA_VERIFICATION_SUCCESS:
      return {
        ...state,
        mfaRequired: false,
        mfaSetupRequired: false,
        pendingLoginCredentials: null,
        error: null,
      };

    case AUTH_ACTIONS.MFA_VERIFICATION_FAILURE:
      return {
        ...state,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.MFA_STATUS_UPDATED:
      return {
        ...state,
        mfaStatus: action.payload.status,
      };

    // Enhanced session management cases
    case AUTH_ACTIONS.SESSION_CREATED:
      return {
        ...state,
        currentSession: action.payload.session,
        sessionStatus: 'active',
        deviceFingerprint: action.payload.deviceFingerprint,
      };

    case AUTH_ACTIONS.SESSION_UPDATED:
      return {
        ...state,
        currentSession: { ...state.currentSession, ...action.payload },
        sessionStatus: 'active',
      };

    case AUTH_ACTIONS.SESSION_INVALIDATED:
      return {
        ...state,
        currentSession: null,
        sessionStatus: 'inactive',
      };

    case AUTH_ACTIONS.DEVICE_FINGERPRINT_UPDATED:
      return {
        ...state,
        deviceFingerprint: action.payload.fingerprint,
      };

    // WebAuthn cases
    case AUTH_ACTIONS.WEBAUTHN_AVAILABLE:
      return {
        ...state,
        webauthnAvailable: action.payload.available,
      };

    case AUTH_ACTIONS.WEBAUTHN_CREDENTIALS_UPDATED:
      return {
        ...state,
        webauthnCredentials: action.payload.credentials,
      };

    // OAuth cases
    case AUTH_ACTIONS.OAUTH_PROVIDERS_LOADED:
      return {
        ...state,
        oauthProviders: action.payload.providers,
      };

    case AUTH_ACTIONS.OAUTH_STATE_UPDATED:
      return {
        ...state,
        oauthState: action.payload.state,
      };

    // Security cases
    case AUTH_ACTIONS.SECURITY_ALERT_ADDED:
      return {
        ...state,
        securityAlerts: [...state.securityAlerts, action.payload.alert].slice(
          -5
        ), // Keep last 5 alerts
      };

    case AUTH_ACTIONS.SECURITY_ALERTS_CLEARED:
      return {
        ...state,
        securityAlerts: [],
      };

    case AUTH_ACTIONS.SECURITY_STATUS_UPDATED:
      return {
        ...state,
        securityStatus: action.payload.status,
      };

    case AUTH_ACTIONS.RATE_LIMIT_STATUS_UPDATED:
      return {
        ...state,
        rateLimitStatus: action.payload.status,
      };

    // Analytics cases
    case AUTH_ACTIONS.SESSION_ANALYTICS_UPDATED:
      return {
        ...state,
        sessionAnalytics: action.payload.analytics,
      };

    case AUTH_ACTIONS.AUTH_HISTORY_UPDATED:
      return {
        ...state,
        authHistory: action.payload.history.slice(-10), // Keep last 10 entries
      };

    default:
      return state;
  }
}

// Create AuthContext
const AuthContext = createContext(null);

// AuthProvider component
export function AuthProvider({
  children,
  apiBaseUrl = '/api',
  refreshTokenEndpoint = '/auth/refresh',
}) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const sessionManager = useRef(null);
  const refreshInProgress = useRef(false);

  // Initialize session manager
  useEffect(() => {
    sessionManager.current = new SessionManager({
      autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
      warningThreshold: 2 * 60 * 1000, // 2 minutes
    });

    // Set up session event listeners
    const unsubscribe = sessionManager.current.addListener((event, data) => {
      switch (event) {
        case 'session_start':
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user: data.user, token: data.token },
          });
          break;

        case 'session_end':
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
          break;

        case 'session_warning':
          dispatch({
            type: AUTH_ACTIONS.SESSION_WARNING,
            payload: { timeRemaining: data.timeRemaining },
          });
          break;

        case 'session_expired':
          dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED });
          break;

        case 'auto_refresh_needed':
          handleAutoRefresh();
          break;

        case 'token_refreshed':
          dispatch({
            type: AUTH_ACTIONS.TOKEN_REFRESHED,
            payload: { token: data.token },
          });
          break;

        case 'cross_tab_login':
          const user = sessionManager.current.getUser();
          dispatch({
            type: AUTH_ACTIONS.CROSS_TAB_LOGIN,
            payload: { user },
          });
          break;

        case 'cross_tab_logout':
          dispatch({ type: AUTH_ACTIONS.CROSS_TAB_LOGOUT });
          break;

        case 'cross_tab_warning':
          dispatch({
            type: AUTH_ACTIONS.SESSION_WARNING,
            payload: {
              timeRemaining: sessionManager.current.getTimeUntilExpiry(),
            },
          });
          break;
      }
    });

    // Check for existing session on mount
    if (sessionManager.current.isAuthenticated()) {
      const user = sessionManager.current.getUser();
      const token = sessionManager.current.getToken();

      if (user && token) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token },
        });
      }
    }

    // Cleanup on unmount
    return () => {
      unsubscribe();
      if (sessionManager.current) {
        sessionManager.current.destroy();
      }
    };
  }, []);

  // Auto refresh handler
  const handleAutoRefresh = useCallback(async () => {
    if (refreshInProgress.current) return;

    refreshInProgress.current = true;

    try {
      await refreshToken();
    } catch (error) {
      console.error('Auto refresh failed:', error);
      dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED });
    } finally {
      refreshInProgress.current = false;
    }
  }, []);

  // Login function
  const login = useCallback(
    async (credentials, rememberMe = false) => {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      try {
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }

        // Check if MFA is required
        if (data.mfaRequired) {
          dispatch({
            type: AUTH_ACTIONS.MFA_REQUIRED,
            payload: { credentials: { ...credentials, rememberMe } },
          });
          return {
            success: false,
            mfaRequired: true,
            message: 'MFA verification required',
          };
        }

        // Check if MFA setup is required
        if (data.mfaSetupRequired) {
          dispatch({
            type: AUTH_ACTIONS.MFA_SETUP_REQUIRED,
          });
          // For now, allow login and prompt for MFA setup later
          sessionManager.current.setSession({
            token: data.token,
            refreshToken: data.refreshToken,
            user: data.user,
            expiresIn: data.expiresIn || 3600,
            rememberMe,
          });

          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user: data.user, token: data.token },
          });

          return {
            success: true,
            user: data.user,
            mfaSetupRequired: true,
            message:
              'Login successful. Please set up MFA for enhanced security.',
          };
        }

        // Standard successful login
        sessionManager.current.setSession({
          token: data.token,
          refreshToken: data.refreshToken,
          user: data.user,
          expiresIn: data.expiresIn || 3600,
          rememberMe,
        });

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: data.user, token: data.token },
        });

        return { success: true, user: data.user };
      } catch (error) {
        const errorMessage = error.message || 'Login failed';
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: { error: errorMessage },
        });
        return { success: false, error: errorMessage };
      }
    },
    [apiBaseUrl]
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint if available
      if (state.token) {
        await fetch(`${apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${state.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.warn('Logout endpoint failed:', error);
    } finally {
      // Always clear local session
      sessionManager.current.clearSession();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, [apiBaseUrl, state.token]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    const refreshTokenValue = sessionManager.current.getRefreshToken();

    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${apiBaseUrl}${refreshTokenEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Update session with new token
      sessionManager.current.updateSession({
        token: data.token,
        refreshToken: data.refreshToken || refreshTokenValue,
        expiresIn: data.expiresIn || 3600,
      });

      dispatch({
        type: AUTH_ACTIONS.TOKEN_REFRESHED,
        payload: { token: data.token },
      });

      return { success: true, token: data.token };
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Don't clear session here, let session manager handle expiry
      throw error;
    }
  }, [apiBaseUrl, refreshTokenEndpoint]);

  // Get auth header for API requests
  const getAuthHeader = useCallback(() => {
    const token = sessionManager.current?.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Make authenticated API request
  const apiRequest = useCallback(
    async (url, options = {}) => {
      const token = sessionManager.current?.getToken();

      if (!token) {
        throw new Error('No authentication token available');
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      };

      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        // If token is expired or invalid, try to refresh
        if (response.status === 401 && !refreshInProgress.current) {
          try {
            await refreshToken();

            // Retry with new token
            const newToken = sessionManager.current.getToken();
            return fetch(url, {
              ...options,
              headers: {
                ...headers,
                Authorization: `Bearer ${newToken}`,
              },
            });
          } catch (refreshError) {
            // Refresh failed, logout user
            dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED });
            throw new Error('Session expired. Please log in again.');
          }
        }

        return response;
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },
    [refreshToken]
  );

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Extend session (dismiss warning)
  const extendSession = useCallback(async () => {
    try {
      await refreshToken();
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  }, [refreshToken]);

  // Get session status
  const getSessionStatus = useCallback(() => {
    return (
      sessionManager.current?.getSessionStatus() || {
        isAuthenticated: false,
        user: null,
        timeUntilExpiry: 0,
        isExpiringSoon: false,
        rememberMe: false,
      }
    );
  }, []);

  // MFA verification for login
  const verifyMFALogin = useCallback(
    async (token, deviceFingerprint = null, trustDevice = false) => {
      if (!state.pendingLoginCredentials) {
        throw new Error('No pending login credentials');
      }

      try {
        const response = await fetch(`${apiBaseUrl}/mfa/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            deviceFingerprint,
            trustDevice,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          dispatch({
            type: AUTH_ACTIONS.MFA_VERIFICATION_FAILURE,
            payload: { error: data.message || 'MFA verification failed' },
          });
          return {
            success: false,
            error: data.message || 'MFA verification failed',
          };
        }

        // MFA verified, complete login
        sessionManager.current.setSession({
          token: data.token,
          refreshToken: data.refreshToken,
          user: data.user,
          expiresIn: data.expiresIn || 3600,
          rememberMe: state.pendingLoginCredentials.rememberMe,
        });

        dispatch({
          type: AUTH_ACTIONS.MFA_VERIFICATION_SUCCESS,
        });

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: data.user, token: data.token },
        });

        return {
          success: true,
          user: data.user,
          usedBackupCode: data.usedBackupCode,
        };
      } catch (error) {
        const errorMessage = error.message || 'MFA verification failed';
        dispatch({
          type: AUTH_ACTIONS.MFA_VERIFICATION_FAILURE,
          payload: { error: errorMessage },
        });
        return { success: false, error: errorMessage };
      }
    },
    [apiBaseUrl, state.pendingLoginCredentials]
  );

  // Get MFA status
  const getMFAStatus = useCallback(async () => {
    try {
      const response = await apiRequest(`${apiBaseUrl}/mfa/status`);
      const data = await response.json();

      if (response.ok) {
        dispatch({
          type: AUTH_ACTIONS.MFA_STATUS_UPDATED,
          payload: { status: data.data },
        });
        return { success: true, status: data.data };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to get MFA status',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get MFA status',
      };
    }
  }, [apiBaseUrl, apiRequest]);

  // Setup MFA
  const setupMFA = useCallback(async () => {
    try {
      const response = await apiRequest(`${apiBaseUrl}/mfa/setup`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          secret: data.data.secret,
          qrCode: data.data.qrCode,
          backupCodes: data.data.backupCodes,
        };
      } else {
        return { success: false, error: data.message || 'MFA setup failed' };
      }
    } catch (error) {
      return { success: false, error: error.message || 'MFA setup failed' };
    }
  }, [apiBaseUrl, apiRequest]);

  // Verify and enable MFA
  const verifyAndEnableMFA = useCallback(
    async (token) => {
      try {
        const response = await apiRequest(`${apiBaseUrl}/mfa/verify-setup`, {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (response.ok) {
          dispatch({
            type: AUTH_ACTIONS.MFA_STATUS_UPDATED,
            payload: { status: { enabled: true, setupCompleted: true } },
          });
          return { success: true, backupCodes: data.data.backupCodes };
        } else {
          return {
            success: false,
            error: data.message || 'MFA verification failed',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error.message || 'MFA verification failed',
        };
      }
    },
    [apiBaseUrl, apiRequest]
  );

  // Disable MFA
  const disableMFA = useCallback(
    async (token) => {
      try {
        const response = await apiRequest(`${apiBaseUrl}/mfa/disable`, {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (response.ok) {
          dispatch({
            type: AUTH_ACTIONS.MFA_STATUS_UPDATED,
            payload: { status: { enabled: false, setupCompleted: false } },
          });
          return { success: true };
        } else {
          return {
            success: false,
            error: data.message || 'Failed to disable MFA',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error.message || 'Failed to disable MFA',
        };
      }
    },
    [apiBaseUrl, apiRequest]
  );

  // Regenerate backup codes
  const regenerateBackupCodes = useCallback(
    async (token) => {
      try {
        const response = await apiRequest(
          `${apiBaseUrl}/mfa/regenerate-codes`,
          {
            method: 'POST',
            body: JSON.stringify({ token }),
          }
        );
        const data = await response.json();

        if (response.ok) {
          return { success: true, backupCodes: data.data.backupCodes };
        } else {
          return {
            success: false,
            error: data.message || 'Failed to regenerate backup codes',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error.message || 'Failed to regenerate backup codes',
        };
      }
    },
    [apiBaseUrl, apiRequest]
  );

  // Get trusted devices
  const getTrustedDevices = useCallback(async () => {
    try {
      const response = await apiRequest(`${apiBaseUrl}/mfa/trusted-devices`);
      const data = await response.json();

      if (response.ok) {
        return { success: true, devices: data.data.devices };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to get trusted devices',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get trusted devices',
      };
    }
  }, [apiBaseUrl, apiRequest]);

  // Revoke trusted device
  const revokeTrustedDevice = useCallback(
    async (fingerprint) => {
      try {
        const response = await apiRequest(
          `${apiBaseUrl}/mfa/trusted-devices/${fingerprint}`,
          {
            method: 'DELETE',
          }
        );
        const data = await response.json();

        if (response.ok) {
          return { success: true };
        } else {
          return {
            success: false,
            error: data.message || 'Failed to revoke device',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error.message || 'Failed to revoke device',
        };
      }
    },
    [apiBaseUrl, apiRequest]
  );

  // Enhanced Authentication Methods

  // Initialize enhanced features
  const initializeEnhancedFeatures = useCallback(async () => {
    try {
      // TODO: WebAuthn support needs to be implemented per app
      // Check WebAuthn availability  
      // const webauthnSupported = await webauthnService.isSupported();
      // dispatch({
      //   type: AUTH_ACTIONS.WEBAUTHN_AVAILABLE,
      //   payload: { available: webauthnSupported },
      // });

      // Load OAuth providers
      const providers = await oauthService.getProviders();
      dispatch({
        type: AUTH_ACTIONS.OAUTH_PROVIDERS_LOADED,
        payload: { providers },
      });

      // Initialize session management
      if (state.user?.id) {
        const sessionResult = await sessionManagementService.createSession({
          userId: state.user.id,
          authMethod: 'session_restore',
        });

        if (sessionResult.success) {
          dispatch({
            type: AUTH_ACTIONS.SESSION_CREATED,
            payload: {
              session: sessionResult,
              deviceFingerprint: sessionResult.deviceFingerprint,
            },
          });
        }
      }
    } catch (error) {
      console.error('Enhanced features initialization error:', error);
    }
  }, [state.user]);

  // Enhanced login with session tracking
  const enhancedLogin = useCallback(
    async (credentials, options = {}) => {
      const { method = 'password', rememberMe = false } = options;

      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      try {
        // Check rate limiting
        const rateLimitResult = securityService.checkRateLimit('login', {
          identifier: credentials.email || credentials.username,
        });

        if (rateLimitResult.blocked) {
          dispatch({
            type: AUTH_ACTIONS.RATE_LIMIT_STATUS_UPDATED,
            payload: { status: rateLimitResult },
          });

          throw new Error(
            `Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.resetTime / 1000)} seconds.`
          );
        }

        // Use existing login for now
        const result = await login(credentials, rememberMe);

        if (result.success && result.user) {
          // Create session tracking
          const sessionResult = await sessionManagementService.createSession({
            userId: result.user.id,
            authMethod: method,
            rememberMe,
            ipAddress: await getClientIP(),
            userAgent: typeof navigator !== "undefined" && navigator.userAgent,
          });

          if (sessionResult.success) {
            dispatch({
              type: AUTH_ACTIONS.SESSION_CREATED,
              payload: {
                session: sessionResult,
                deviceFingerprint: sessionResult.deviceFingerprint,
              },
            });
          }

          // Update auth history
          dispatch({
            type: AUTH_ACTIONS.AUTH_HISTORY_UPDATED,
            payload: {
              history: [
                ...state.authHistory,
                {
                  timestamp: Date.now(),
                  method,
                  success: true,
                },
              ],
            },
          });
        }

        return result;
      } catch (error) {
        // Record failed attempt
        securityService.recordAttempt('login', {
          identifier: credentials.email || credentials.username,
          success: false,
        });

        // Update auth history
        dispatch({
          type: AUTH_ACTIONS.AUTH_HISTORY_UPDATED,
          payload: {
            history: [
              ...state.authHistory,
              {
                timestamp: Date.now(),
                method,
                success: false,
                error: error.message,
              },
            ],
          },
        });

        return { success: false, error: error.message };
      }
    },
    [login, state.authHistory]
  );

  // WebAuthn credential registration
  const registerWebAuthnCredential = useCallback(
    async (options = {}) => {
      try {
        // TODO: WebAuthn service needs to be provided per app
        throw new Error('WebAuthn registration not configured for this app');
        
        // const result = await webauthnService.registerCredential({
        //   userId: state.user?.id,
        //   userName: state.user?.email,
        //   displayName: state.user?.name,
        //   ...options,
        // });

        // if (result.success) {
        //   // Update credentials list
        //   const credentials = await webauthnService.getCredentials(
        //     state.user.id
        //   );
        //   dispatch({
        //     type: AUTH_ACTIONS.WEBAUTHN_CREDENTIALS_UPDATED,
        //     payload: { credentials },
        //   });

        //   return { success: true, credentialId: result.credentialId };
        // } catch (error) {
        //   return { success: false, error: error.message };
        // }
        
        // TODO: WebAuthn service needs to be provided per app
        throw new Error('WebAuthn registration not configured for this app');
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [state.user]
  );

  // OAuth authentication
  const authenticateWithOAuth = useCallback(async (provider, options = {}) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const result = await oauthService.authenticate(provider, options);

      if (result.success) {
        // Create session for OAuth user
        const sessionResult = await sessionManagementService.createSession({
          userId: result.user.id,
          authMethod: `oauth_${provider}`,
          ipAddress: await getClientIP(),
          userAgent: typeof navigator !== "undefined" && navigator.userAgent,
        });

        if (sessionResult.success) {
          dispatch({
            type: AUTH_ACTIONS.SESSION_CREATED,
            payload: {
              session: sessionResult,
              deviceFingerprint: sessionResult.deviceFingerprint,
            },
          });
        }

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: result.user, token: result.token },
        });

        return { success: true, user: result.user };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: { error: result.error },
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message },
      });
      return { success: false, error: error.message };
    }
  }, []);

  // Enhanced logout with session cleanup
  const enhancedLogout = useCallback(
    async (options = {}) => {
      const { logoutAllSessions = false } = options;

      try {
        // Invalidate current session
        if (state.currentSession?.sessionId) {
          sessionManagementService.invalidateSession(
            state.currentSession.sessionId,
            'user_logout'
          );
        }

        // Logout from all sessions if requested
        if (logoutAllSessions && state.user?.id) {
          sessionManagementService.invalidateUserSessions(state.user.id);
        }

        // Use existing logout
        await logout();

        dispatch({ type: AUTH_ACTIONS.SESSION_INVALIDATED });

        return { success: true };
      } catch (error) {
        console.error('Enhanced logout error:', error);
        return { success: false, error: error.message };
      }
    },
    [logout, state.currentSession, state.user]
  );

  // Clear security alerts
  const clearSecurityAlerts = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.SECURITY_ALERTS_CLEARED });
  }, []);

  // Get session analytics
  const refreshSessionAnalytics = useCallback(async () => {
    if (state.user?.id) {
      const analytics = sessionManagementService.getSessionAnalytics(
        state.user.id
      );
      dispatch({
        type: AUTH_ACTIONS.SESSION_ANALYTICS_UPDATED,
        payload: { analytics },
      });
    }
  }, [state.user]);

  // Utility function to get client IP (simplified)
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return '127.0.0.1'; // Fallback
    }
  };

  // Initialize enhanced features on mount
  useEffect(() => {
    initializeEnhancedFeatures();
  }, [initializeEnhancedFeatures]);

  // Monitor security status
  useEffect(() => {
    if (state.currentSession?.sessionId) {
      const interval = setInterval(async () => {
        const securityResult = securityService.checkSecurityStatus(
          state.currentSession.sessionId
        );

        if (securityResult.status !== state.securityStatus) {
          dispatch({
            type: AUTH_ACTIONS.SECURITY_STATUS_UPDATED,
            payload: { status: securityResult.status },
          });
        }

        if (securityResult.alerts?.length > 0) {
          securityResult.alerts.forEach((alert) => {
            dispatch({
              type: AUTH_ACTIONS.SECURITY_ALERT_ADDED,
              payload: { alert },
            });
          });
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [state.currentSession, state.securityStatus]);

  // Refresh analytics periodically
  useEffect(() => {
    if (state.isAuthenticated) {
      refreshSessionAnalytics();

      const interval = setInterval(refreshSessionAnalytics, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated, refreshSessionAnalytics]);

  // Context value
  const value = {
    // State
    ...state,

    // Basic Actions
    login,
    logout,
    refreshToken,
    clearError,
    extendSession,

    // Enhanced Actions
    enhancedLogin,
    enhancedLogout,
    registerWebAuthnCredential,
    authenticateWithOAuth,
    clearSecurityAlerts,
    refreshSessionAnalytics,
    initializeEnhancedFeatures,

    // MFA Actions
    verifyMFALogin,
    getMFAStatus,
    setupMFA,
    verifyAndEnableMFA,
    disableMFA,
    regenerateBackupCodes,
    getTrustedDevices,
    revokeTrustedDevice,

    // Utilities
    getAuthHeader,
    apiRequest,
    getSessionStatus,

    // Session info
    isTokenExpiringSoon: sessionManager.current?.isTokenExpiringSoon() || false,
    timeUntilExpiry: sessionManager.current?.getTimeUntilExpiry() || 0,

    // Enhanced session info
    hasActiveSession: state.sessionStatus === 'active',
    sessionAnalytics: state.sessionAnalytics,
    securityAlerts: state.securityAlerts,
    webauthnAvailable: state.webauthnAvailable,
    oauthProviders: state.oauthProviders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// Higher-order component for protected routes
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return <div>Please log in to access this page.</div>;
    }

    return <Component {...props} />;
  };
}

export { AUTH_ACTIONS };

AUTH_ACTIONS.propTypes = {
  // TODO: Define specific prop types
};
