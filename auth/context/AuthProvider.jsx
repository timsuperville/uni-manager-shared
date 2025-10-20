import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { authService } from '../services/authService.js';
import { getSupportedProvidersForApp } from '../config/oauthProviders.js';
import { getCurrentAppConfig } from '../config/appConfigs.js';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize authentication service
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        const initialized = await authService.initialize();
        if (initialized) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
        }

        setIsInitialized(true);
      } catch (err) {
        setError(err.message);
        // console.error('Auth initialization failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // OAuth login handler
  const loginWithOAuth = useCallback(async (providerId, options = {}) => {
    try {
      setError(null);
      setLoading(true);

      const appConfig = getCurrentAppConfig();
      const supportedProviders = getSupportedProvidersForApp(appConfig.name);

      if (!supportedProviders.includes(providerId)) {
        throw new Error(
          `OAuth provider ${providerId} is not supported for ${appConfig.name}`
        );
      }

      await authService.startOAuthFlow(providerId, options);
    } catch (err) {
      setError(err.message);
      // console.error('OAuth login failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async (urlParams) => {
    try {
      setError(null);
      setLoading(true);

      const authData = await authService.handleOAuthCallback(urlParams);
      setUser(authData.user);

      return authData;
    } catch (err) {
      setError(err.message);
      // console.error('OAuth callback failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Email/password login
  const loginWithEmail = useCallback(async (email, password, options = {}) => {
    try {
      setError(null);
      setLoading(true);

      const authData = await authService.login(email, password, options);
      setUser(authData.user);

      return authData;
    } catch (err) {
      setError(err.message);
      // console.error('Email login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // User registration
  const register = useCallback(async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const authData = await authService.register(userData);
      if (authData.user) {
        setUser(authData.user);
      }

      return authData;
    } catch (err) {
      setError(err.message);
      // console.error('Registration failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setError(null);
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError(err.message);
      // console.error('Logout failed:', err);
    }
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const authData = await authService.refreshToken();
      setUser(authData.user);
      return authData;
    } catch (err) {
      setError(err.message);
      // console.error('Token refresh failed:', err);
      await logout();
      throw err;
    }
  }, [logout]);

  // Check authentication status
  const isAuthenticated = useCallback(() => {
    return authService.isAuthenticated();
  }, []);

  // Get supported OAuth providers for current app
  const getSupportedProviders = useCallback(() => {
    const appConfig = getCurrentAppConfig();
    return getSupportedProvidersForApp(appConfig.name);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    // State
    user,
    loading,
    error,
    isInitialized,

    // Actions
    loginWithOAuth,
    handleOAuthCallback,
    loginWithEmail,
    register,
    logout,
    refreshToken,
    clearError,

    // Utilities
    isAuthenticated,
    getSupportedProviders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
