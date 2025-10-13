/* eslint-env browser */
import { useState, useEffect, useCallback } from 'react';

/**
 * useNotificationPreferences - Custom hook for notification preference management
 *
 * Features:
 * - Load and save user notification preferences
 * - Default preference templates
 * - Export/import preferences
 * - Real-time preference updates
 * - Validation and error handling
 */
export const useNotificationPreferences = (userId = null) => {
  // State management
  const [preferences, setPreferences] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Build API URL
  const buildApiUrl = useCallback((endpoint) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}/api/notifications/preferences${endpoint}`;
  }, []);

  // API request wrapper
  const apiRequest = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof localStorage !== "undefined" && localStorage.getItem('authToken')}`,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (_error) {
      // eslint-disable-next-line no-console
      // console.error('API request error:', error);
      throw error;
    }
  }, []);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = buildApiUrl(userId ? `?userId=${userId}` : '');
      const response = await apiRequest(url);

      setPreferences(response.preferences || {});
      setLastUpdated(response.lastUpdated || Date.now());
    } catch (_error) {
      setError(error.message);
      // eslint-disable-next-line no-console
      // console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, buildApiUrl, apiRequest]);

  // Update preferences
  const updatePreferences = useCallback(
    async (newPreferences) => {
      setIsLoading(true);
      setError(null);

      try {
        const url = buildApiUrl('');
        const response = await apiRequest(url, {
          method: 'PUT',
          body: JSON.stringify({
            preferences: newPreferences,
            userId,
          }),
        });

        setPreferences(response.preferences || newPreferences);
        setLastUpdated(Date.now());

        return response;
      } catch (_error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, buildApiUrl, apiRequest]
  );

  // Reset preferences to default
  const resetPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = buildApiUrl('/reset');
      const response = await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });

      setPreferences(response.preferences || {});
      setLastUpdated(Date.now());

      return response;
    } catch (_error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, buildApiUrl, apiRequest]);

  // Export preferences
  const exportPreferences = useCallback(async () => {
    try {
      const url = buildApiUrl('/export');
      const response = await apiRequest(url);

      return {
        preferences: response.preferences || preferences,
        metadata: {
          exportedAt: new Date().toISOString(),
          userId,
          version: '1.0',
        },
      };
    } catch (_error) {
      setError(error.message);
      throw error;
    }
  }, [userId, preferences, buildApiUrl, apiRequest]);

  // Import preferences
  const importPreferences = useCallback(
    async (importedData) => {
      setIsLoading(true);
      setError(null);

      try {
        const url = buildApiUrl('/import');
        const response = await apiRequest(url, {
          method: 'POST',
          body: JSON.stringify({
            preferences: importedData.preferences,
            userId,
          }),
        });

        setPreferences(response.preferences || importedData.preferences);
        setLastUpdated(Date.now());

        return response;
      } catch (_error) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, buildApiUrl, apiRequest]
  );

  // Refresh preferences
  const refreshPreferences = useCallback(() => {
    return loadPreferences();
  }, [loadPreferences]);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    isLoading,
    error,
    lastUpdated,
    updatePreferences,
    resetPreferences,
    exportPreferences,
    importPreferences,
    refreshPreferences,
  };
};

export default useNotificationPreferences;
