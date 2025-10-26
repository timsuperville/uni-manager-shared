/**
 * SSO (Single Sign-On) Context
 * ============================
 *
 * Manages cross-application single sign-on functionality, allowing users to:
 * - Switch between applications without re-authenticating
 * - Maintain session state across app boundaries
 * - Manage app permissions and access control
 *
 * This context handles the complexity of managing multiple app instances
 * and their authentication states within a unified authentication system.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

/**
 * SSOContext - React context for SSO functionality
 */
export const SSOContext = createContext(null);

/**
 * Initial state for SSO context
 */
const initialState = {
  currentApp: null,
  availableApps: [],
  appSessions: {}, // Map of app -> session info
  ssoLoading: true,
  ssoError: null,
  userAppPermissions: {}, // Map of app -> permission level
};

/**
 * SSO reducer for managing state transitions
 */
const ssoReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_APP':
      return {
        ...state,
        currentApp: action.payload,
      };

    case 'SET_AVAILABLE_APPS':
      return {
        ...state,
        availableApps: action.payload,
      };

    case 'SET_APP_SESSION':
      return {
        ...state,
        appSessions: {
          ...state.appSessions,
          [action.payload.appId]: action.payload.session,
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        ssoLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        ssoError: action.payload,
      };

    case 'SET_USER_PERMISSIONS':
      return {
        ...state,
        userAppPermissions: action.payload,
      };

    case 'RESET_SSO':
      return initialState;

    default:
      return state;
  }
};

/**
 * SSOProvider Component
 *
 * Wraps the application and provides SSO context to all child components.
 * Manages the state and logic for cross-app single sign-on.
 */
export const SSOProvider = ({ children, config = {} }) => {
  const [state, dispatch] = useReducer(ssoReducer, initialState);

  /**
   * Initialize SSO state from configuration
   */
  useEffect(() => {
    const initializeSSO = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // Initialize available apps from config
        const apps = config.availableApps || [
          { id: 'church', name: 'Church', icon: '⛪' },
          { id: 'admin', name: 'Administration', icon: '🔧' },
          { id: 'business', name: 'Business', icon: '💼' },
          { id: 'home', name: 'Home Services', icon: '🏠' },
          { id: 'personal', name: 'Personal', icon: '👤' },
          { id: 'playback', name: 'Playback', icon: '▶️' },
        ];

        dispatch({ type: 'SET_AVAILABLE_APPS', payload: apps });

        // Set initial app from config or browser
        const initialApp = config.initialApp || 'church';
        dispatch({ type: 'SET_CURRENT_APP', payload: initialApp });

        // Set user permissions
        const permissions = config.userPermissions || {};
        dispatch({ type: 'SET_USER_PERMISSIONS', payload: permissions });

        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('SSO initialization failed:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeSSO();
  }, [config]);

  /**
   * Switch to a different application
   */
  const switchToApp = useCallback(async (appId) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });

      // Validate app exists
      if (!state.availableApps.find((app) => app.id === appId)) {
        throw new Error(`Unknown app: ${appId}`);
      }

      // Check permissions
      if (!hasAppPermission(appId)) {
        throw new Error(`No permission to access app: ${appId}`);
      }

      // Switch app (in real app, this would trigger navigation)
      dispatch({ type: 'SET_CURRENT_APP', payload: appId });

      // Store session info
      const session = {
        appId,
        timestamp: new Date().toISOString(),
        status: 'active',
      };
      dispatch({
        type: 'SET_APP_SESSION',
        payload: { appId, session },
      });
    } catch (error) {
      console.error('App switch failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [state.availableApps]);

  /**
   * Check if user has permission to access an app
   */
  const hasAppPermission = useCallback((appId) => {
    const permission = state.userAppPermissions[appId];
    return permission ? permission > 0 : true; // Default allow if no permission set
  }, [state.userAppPermissions]);

  /**
   * Get information about an app
   */
  const getAppInfo = useCallback((appId) => {
    return state.availableApps.find((app) => app.id === appId) || null;
  }, [state.availableApps]);

  /**
   * Get session info for an app
   */
  const getAppSession = useCallback((appId) => {
    return state.appSessions[appId] || null;
  }, [state.appSessions]);

  /**
   * Reset SSO state
   */
  const resetSSO = useCallback(() => {
    dispatch({ type: 'RESET_SSO' });
  }, []);

  const value = {
    // State
    currentApp: state.currentApp,
    availableApps: state.availableApps,
    appSessions: state.appSessions,
    ssoLoading: state.ssoLoading,
    ssoError: state.ssoError,
    userAppPermissions: state.userAppPermissions,

    // Actions
    switchToApp,
    hasAppPermission,
    getAppInfo,
    getAppSession,
    resetSSO,
  };

  return (
    <SSOContext.Provider value={value}>
      {children}
    </SSOContext.Provider>
  );
};

/**
 * useSSO Hook
 *
 * Custom hook to access SSO context in functional components
 *
 * Usage:
 * ```jsx
 * function MyComponent() {
 *   const { currentApp, switchToApp } = useSSO();
 *   return <div>{currentApp}</div>;
 * }
 * ```
 */
export const useSSO = () => {
  const context = useContext(SSOContext);

  if (!context) {
    throw new Error('useSSO must be used within an SSOProvider');
  }

  return context;
};

/**
 * Higher-order component for wrapping components with SSO context
 */
export const withSSO = (Component) => {
  return function WithSSOComponent(props) {
    const ssoContext = useSSO();
    return <Component {...props} sso={ssoContext} />;
  };
};

export default SSOContext;
