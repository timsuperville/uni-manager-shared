/**
 * Seasonal Context Hook
 * Manages seasonal context and data
 */

import { useState, useCallback } from 'react';

export function useSeasonalContext() {
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateSeason = useCallback((seasonData) => {
    setSeason(seasonData);
  }, []);

  const resetSeason = useCallback(() => {
    setSeason(null);
    setLoading(false);
  }, []);

  return {
    season,
    loading,
    updateSeason,
    resetSeason
  };
}

export default useSeasonalContext;