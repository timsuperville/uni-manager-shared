/**
 * Seasonal Context Hook
 * Manages seasonal context and data
 */

import { useState, useCallback } from 'react';

export interface SeasonData {
  id?: string;
  name?: string;
  currentSeason?: string;
  [key: string]: unknown;
}

export interface UseSeasonalContextResult {
  season: SeasonData | null;
  loading: boolean;
  updateSeason: (seasonData: SeasonData) => void;
  resetSeason: () => void;
}

export function useSeasonalContext(): UseSeasonalContextResult {
  const [season, setSeason] = useState<SeasonData | null>(null);
  const [loading, setLoading] = useState(false);

  const updateSeason = useCallback((seasonData: SeasonData): void => {
    setSeason(seasonData);
  }, []);

  const resetSeason = useCallback((): void => {
    setSeason(null);
    setLoading(false);
  }, []);

  return { season, loading, updateSeason, resetSeason };
}

export default useSeasonalContext;
