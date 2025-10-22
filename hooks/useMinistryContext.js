/**
 * Ministry Context Hook
 * Manages ministry-related context and data
 */

import { useState, useCallback } from 'react';

export function useMinistryContext() {
  const [ministry, setMinistry] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateMinistry = useCallback((ministryData) => {
    setMinistry(ministryData);
  }, []);

  const resetMinistry = useCallback(() => {
    setMinistry(null);
    setLoading(false);
  }, []);

  return {
    ministry,
    loading,
    updateMinistry,
    resetMinistry
  };
}

export default useMinistryContext;