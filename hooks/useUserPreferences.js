/**
 * User Preferences Hook
 * Manages user preferences and settings
 */

import { useState, useCallback } from "react";

export function useUserPreferences() {
  const [preferences, setPreferences] = useState({});
  const [loading] = useState(false); // Remove setLoading since it's not used

  const updatePreference = useCallback((key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const getPreference = useCallback(
    (key, defaultValue = null) => {
      return preferences[key] !== undefined ? preferences[key] : defaultValue;
    },
    [preferences],
  );

  const resetPreferences = useCallback(() => {
    setPreferences({});
  }, []);

  return {
    preferences,
    loading,
    updatePreference,
    getPreference,
    resetPreferences,
  };
}

export default useUserPreferences;
