/**
 * Cross-Application SSO Provider Component
 *
 * Enhances the existing AuthContext with SSO capabilities
 * Provides unified authentication state management across all 6 applications
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { CrossApplicationSSOService } from "../services/crossApplicationSSOService.js";
import { useAuth } from "./AuthContext.jsx";

const SSOContext = createContext(null);

export const useSSO = () => {
  const context = useContext(SSOContext);
  if (!context) {
    throw new Error("useSSO must be used within an SSOProvider");
  }
  return context;
};

export const SSOProvider = ({ children }) => {
  const auth = useAuth();
  const [ssoService, setSSOService] = useState(null);
  const [availableApps, setAvailableApps] = useState([]);
  const [currentApp, setCurrentApp] = useState(null);
  const [ssoLoading, setSSOLoading] = useState(true);
  const [ssoError, setSSOError] = useState(null);

  // Initialize SSO service
  useEffect(() => {
    const initializeSSO = async () => {
      try {
        setSSOLoading(true);
        const service = new CrossApplicationSSOService();
        await service.initialize();

        setSSOService(service);
        setCurrentApp(service.currentApp);

        // Load available apps for current user
        if (auth.isAuthenticated) {
          const apps = await service.getAvailableApps();
          setAvailableApps(apps);
        }

        setSSOError(null);
      } catch (error) {
        console.error("SSO initialization failed:", error);
        setSSOError(error.message);
      } finally {
        setSSOLoading(false);
      }
    };

    initializeSSO();

    // Cleanup on unmount
    return () => {
      if (ssoService) {
        ssoService.destroy();
      }
    };
  }, []);

  // Update available apps when authentication state changes
  useEffect(() => {
    const updateAvailableApps = async () => {
      if (ssoService && auth.isAuthenticated) {
        try {
          const apps = await ssoService.getAvailableApps();
          setAvailableApps(apps);
        } catch (error) {
          console.error("Failed to update available apps:", error);
        }
      } else {
        setAvailableApps([]);
      }
    };

    updateAvailableApps();
  }, [ssoService, auth.isAuthenticated]);

  /**
   * Switch to a different application with SSO
   */
  const switchToApp = useCallback(
    async (appId, path = "/") => {
      if (!ssoService) {
        throw new Error("SSO service not initialized");
      }

      try {
        await ssoService.switchToApp(appId, path);
      } catch (error) {
        setSSOError(error.message);
        throw error;
      }
    },
    [ssoService]
  );

  /**
   * Enhanced login with SSO capabilities
   */
  const loginWithSSO = useCallback(
    async (credentials) => {
      if (!ssoService) {
        throw new Error("SSO service not initialized");
      }

      try {
        setSSOError(null);
        const result = await ssoService.login(credentials);

        // Update available apps after successful login
        if (result.success) {
          const apps = await ssoService.getAvailableApps();
          setAvailableApps(apps);
        }

        return result;
      } catch (error) {
        setSSOError(error.message);
        throw error;
      }
    },
    [ssoService]
  );

  /**
   * Enhanced logout with SSO capabilities
   */
  const logoutWithSSO = useCallback(async () => {
    if (!ssoService) {
      throw new Error("SSO service not initialized");
    }

    try {
      setSSOError(null);
      const result = await ssoService.logout();
      setAvailableApps([]);
      return result;
    } catch (error) {
      setSSOError(error.message);
      throw error;
    }
  }, [ssoService]);

  /**
   * Check if user has permission to access an app
   */
  const hasAppPermission = useCallback(
    (appId) => {
      if (!ssoService || !auth.user) return false;
      return ssoService.hasAppPermission(auth.user, appId);
    },
    [ssoService, auth.user]
  );

  /**
   * Get app information by ID
   */
  const getAppInfo = useCallback(
    (appId) => {
      if (!ssoService) return null;
      return ssoService.appRegistry[appId] || null;
    },
    [ssoService]
  );

  /**
   * Handle SSO URL parameters (for app switching)
   */
  useEffect(() => {
    const handleSSOParams = async () => {
      if (!ssoService) return;

      const urlParams = new URLSearchParams(window.location.search);
      const ssoSession = urlParams.get("sso_session");
      const sourceApp = urlParams.get("source_app");

      if (ssoSession && sourceApp) {
        try {
          // Verify SSO session and authenticate user
          const isAuth = await ssoService.isAuthenticated();
          if (isAuth) {
            console.log(
              `SSO switch from ${sourceApp} to ${currentApp} successful`
            );

            // Clean up URL parameters
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        } catch (error) {
          console.error("SSO parameter handling failed:", error);
          setSSOError("SSO session verification failed");
        }
      }
    };

    if (ssoService && currentApp) {
      handleSSOParams();
    }
  }, [ssoService, currentApp]);

  const ssoContextValue = {
    // SSO service instance
    ssoService,

    // Current app info
    currentApp,
    availableApps,

    // Loading and error states
    ssoLoading,
    ssoError,

    // SSO operations
    switchToApp,
    loginWithSSO,
    logoutWithSSO,

    // Utility functions
    hasAppPermission,
    getAppInfo,

    // Enhanced authentication state
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,

    // Clear SSO error
    clearSSOError: () => setSSOError(null),
  };

  return (
    <SSOContext.Provider value={ssoContextValue}>
      {children}
    </SSOContext.Provider>
  );
};

export default SSOProvider;
