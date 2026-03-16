/**
 * Activity Context Hook
 * Manages activity context and data
 */

import { useState, useCallback } from "react";

export interface ActivityData {
  id?: string;
  type?: string;
  lastActivity?: number;
  [key: string]: unknown;
}

export interface UseActivityContextResult {
  activity: ActivityData | null;
  loading: boolean;
  updateActivity: (activityData: ActivityData) => void;
  resetActivity: () => void;
}

export function useActivityContext(): UseActivityContextResult {
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(false);

  const updateActivity = useCallback((activityData: ActivityData): void => {
    setActivity(activityData);
  }, []);

  const resetActivity = useCallback((): void => {
    setActivity(null);
    setLoading(false);
  }, []);

  return { activity, loading, updateActivity, resetActivity };
}

export default useActivityContext;
