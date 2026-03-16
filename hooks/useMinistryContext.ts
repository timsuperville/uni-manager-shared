/**
 * Ministry Context Hook
 * Manages ministry-related context and data
 */

import { useState, useCallback } from "react";

export interface MinistryData {
  id?: string;
  name?: string;
  slug?: string;
  [key: string]: unknown;
}

export interface UseMinistryContextResult {
  ministry: MinistryData | null;
  loading: boolean;
  updateMinistry: (ministryData: MinistryData) => void;
  resetMinistry: () => void;
}

export function useMinistryContext(): UseMinistryContextResult {
  const [ministry, setMinistry] = useState<MinistryData | null>(null);
  const [loading, setLoading] = useState(false);

  const updateMinistry = useCallback((ministryData: MinistryData): void => {
    setMinistry(ministryData);
  }, []);

  const resetMinistry = useCallback((): void => {
    setMinistry(null);
    setLoading(false);
  }, []);

  return { ministry, loading, updateMinistry, resetMinistry };
}

export default useMinistryContext;
