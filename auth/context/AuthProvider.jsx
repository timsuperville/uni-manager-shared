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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
          setIsAuthenticated(!!currentUser);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }

        setIsInitialized(true);
      } catch (err) {
        setError(err.message);
        setUser(null);
        setIsAuthenticated(false);
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
      setIsAuthenticated(!!authData.user);

      return authData;
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
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

      const authData = await authService.login({ email, password, ...options });
      setUser(authData.user);
      setIsAuthenticated(!!authData.user);

      return authData;
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
      // console.error('Email login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Alias for backward compatibility
  const login = loginWithEmail;

  // User registration
  const register = useCallback(async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const authData = await authService.signup(userData);
      if (authData.user) {
        setUser(authData.user);
        setIsAuthenticated(true);
      }

      return authData;
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
      // console.error('Registration failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Alias for backward compatibility (SignupForm uses 'signup')
  const signup = register;

  // Logout
  const logout = useCallback(async () => {
    try {
      setError(null);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
      // console.error('Logout failed:', err);
    }
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const authData = await authService.refreshToken();
      setUser(authData.user);
      setIsAuthenticated(!!authData.user);
      return authData;
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
      // console.error('Token refresh failed:', err);
      await logout();
      throw err;
    }
  }, [logout]);

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
    isAuthenticated,
    loading,
    error,
    isInitialized,

    // Actions
    login,
    loginWithOAuth,
    handleOAuthCallback,
    loginWithEmail,
    register,
    signup, // Add signup alias
    logout,
    refreshToken,
    clearError,

    // Utilities
    getSupportedProviders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
