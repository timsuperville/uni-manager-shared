/* eslint-env browser */
import { useState, useEffect, useCallback } from "react";
import { getApiClient } from "../api/core/ApiClient";

// ── Types ────────────────────────────────────────────────────────────────────

export interface NotificationPreferences {
  channels?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
    [key: string]: boolean | undefined;
  };
  types?: Record<string, boolean>;
  quietHours?: {
    enabled?: boolean;
    start?: string;
    end?: string;
    timezone?: string;
  };
  delivery?: Record<string, unknown>;
  interface?: Record<string, unknown>;
  advanced?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PreferenceExport {
  preferences: NotificationPreferences;
  metadata: {
    exportedAt: string;
    userId: string | null;
    version: string;
  };
}

export interface PreferencesResponse {
  preferences: NotificationPreferences;
  lastUpdated?: number;
}

export interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  updatePreferences: (
    newPreferences: NotificationPreferences,
  ) => Promise<PreferencesResponse>;
  resetPreferences: () => Promise<PreferencesResponse>;
  exportPreferences: () => Promise<PreferenceExport>;
  importPreferences: (
    importedData: PreferenceExport,
  ) => Promise<PreferencesResponse>;
  refreshPreferences: () => Promise<void>;
}

interface ApiRequestOptions extends RequestInit {}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useNotificationPreferences - Custom hook for notification preference management
 *
 * Features:
 * - Load and save user notification preferences
 * - Default preference templates
 * - Export/import preferences
 * - Real-time preference updates
 * - Validation and error handling
 *
 * Bug fix: all catch blocks previously caught as `_error` but then
 * threw an undefined outer `error` — corrected to use the caught reference.
 */
export const useNotificationPreferences = (
  userId: string | null = null,
): UseNotificationPreferencesReturn => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const buildApiUrl = useCallback((endpoint: string) => {
    return `/api/notifications/preferences${endpoint}`;
  }, []);

  const apiRequest = useCallback(
    async (url: string, options: ApiRequestOptions = {}): Promise<unknown> => {
      const apiClient = getApiClient();
      const method = options.method || "GET";
      const reqOptions = {
        headers: options.headers as Record<string, string>,
      };

      let res;
      if (method === "GET") {
        res = await apiClient.get(url, reqOptions);
      } else if (method === "POST") {
        res = await apiClient.post(
          url,
          options.body ? JSON.parse(options.body as string) : undefined,
          reqOptions,
        );
      } else if (method === "PUT") {
        res = await apiClient.put(
          url,
          options.body ? JSON.parse(options.body as string) : undefined,
          reqOptions,
        );
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }
      return res.data;
    },
    [],
  );

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = buildApiUrl(userId ? `?userId=${userId}` : "");
      const response = (await apiRequest(url)) as PreferencesResponse;
      setPreferences(response.preferences ?? {});
      setLastUpdated(response.lastUpdated ?? Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [userId, buildApiUrl, apiRequest]);

  const updatePreferences = useCallback(
    async (
      newPreferences: NotificationPreferences,
    ): Promise<PreferencesResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const url = buildApiUrl("");
        const response = (await apiRequest(url, {
          method: "PUT",
          body: JSON.stringify({ preferences: newPreferences, userId }),
        })) as PreferencesResponse;
        setPreferences(response.preferences ?? newPreferences);
        setLastUpdated(Date.now());
        return response;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, buildApiUrl, apiRequest],
  );

  const resetPreferences =
    useCallback(async (): Promise<PreferencesResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const url = buildApiUrl("/reset");
        const response = (await apiRequest(url, {
          method: "POST",
          body: JSON.stringify({ userId }),
        })) as PreferencesResponse;
        setPreferences(response.preferences ?? {});
        setLastUpdated(Date.now());
        return response;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    }, [userId, buildApiUrl, apiRequest]);

  const exportPreferences = useCallback(async (): Promise<PreferenceExport> => {
    try {
      const url = buildApiUrl("/export");
      const response = (await apiRequest(url)) as PreferencesResponse;
      return {
        preferences: response.preferences ?? preferences,
        metadata: {
          exportedAt: new Date().toISOString(),
          userId,
          version: "1.0",
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    }
  }, [userId, preferences, buildApiUrl, apiRequest]);

  const importPreferences = useCallback(
    async (importedData: PreferenceExport): Promise<PreferencesResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const url = buildApiUrl("/import");
        const response = (await apiRequest(url, {
          method: "POST",
          body: JSON.stringify({
            preferences: importedData.preferences,
            userId,
          }),
        })) as PreferencesResponse;
        setPreferences(response.preferences ?? importedData.preferences);
        setLastUpdated(Date.now());
        return response;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, buildApiUrl, apiRequest],
  );

  const refreshPreferences = useCallback(() => {
    return loadPreferences();
  }, [loadPreferences]);

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
