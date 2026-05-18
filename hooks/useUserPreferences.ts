/**
 * User Preferences Hook
 * Manages user preferences and settings
 */

import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PreferenceValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | Record<string, unknown>;

export interface UserPreferences {
  [key: string]: PreferenceValue;
}

export interface UseUserPreferencesResult {
  preferences: UserPreferences;
  loading: boolean;
  updatePreference: (key: string, value: PreferenceValue) => void;
  getPreference: (
    key: string,
    defaultValue?: PreferenceValue
  ) => PreferenceValue;
  resetPreferences: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUserPreferences(): UseUserPreferencesResult {
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading] = useState(false);

  const updatePreference = useCallback(
    (key: string, value: PreferenceValue): void => {
      setPreferences(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const getPreference = useCallback(
    (key: string, defaultValue: PreferenceValue = null): PreferenceValue => {
      return preferences[key] !== undefined
        ? preferences[key]
        : (defaultValue ?? null);
    },
    [preferences]
  );

  const resetPreferences = useCallback((): void => {
    setPreferences({});
  }, []);

  return {
    preferences,
    loading,
    updatePreference,
    getPreference,
    resetPreferences
  };
}

export default useUserPreferences;
