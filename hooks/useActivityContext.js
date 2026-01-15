/**
 * Activity Context Hook
 * Manages activity context and data
 */

import { useState, useCallback } from "react";

export function useActivityContext() {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateActivity = useCallback((activityData) => {
    setActivity(activityData);
  }, []);

  const resetActivity = useCallback(() => {
    setActivity(null);
    setLoading(false);
  }, []);

  return {
    activity,
    loading,
    updateActivity,
    resetActivity,
  };
}

export default useActivityContext;
