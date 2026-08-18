/**
 * Cache Integration Hooks
 * Seamless integration between intelligent caching and existing personalization system.
 *
 * NOTE: useCachedUserPreferences, useCachedMinistryContext, useCachedSeasonalContext,
 * useCachedActivityContext and useCachedDashboardState each wrap their corresponding
 * context hooks. Migrated from IntelligentCache to TanStack Query (ECO-R-10).
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserPreferences } from './useUserPreferences';
import { useMinistryContext } from './useMinistryContext';
import { useSeasonalContext } from './useSeasonalContext';
import { useActivityContext } from './useActivityContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VersionedRecord {
  version?: number;
  lastUpdated?: number | string;
  [key: string]: unknown;
}

interface ActivityRecord {
  lastActivity?: number;
  recentActivities?: Array<{ type: string; [key: string]: unknown }>;
  suggestedActions?: Array<{
    title: string;
    description: string;
    priority?: string;
    action: { type: string; target: string };
  }>;
  [key: string]: unknown;
}

interface MinistryRecord {
  lastUpdated?: number | string;
  activeMinistries?: Array<{
    slug: string;
    name: string;
    [key: string]: unknown;
  }>;
  suggestedMinistries?: Array<{
    name: string;
    slug: string;
    categories: string[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface SeasonalRecord {
  currentSeason?: string;
  upcomingEvents?: Array<{
    id: string;
    name: string;
    date: string;
    description: string;
  }>;
  [key: string]: unknown;
}

interface DashboardConfig {
  layout: string;
  widgets: WidgetConfig[];
  theme: string;
  personalizations: PersonalizationItem[];
  recommendations: RecommendationItem[];
  generatedAt: number;
  version: string;
  [key: string]: unknown;
}

interface WidgetConfig {
  id: string;
  priority: string;
  category: string;
}

interface PersonalizationItem {
  type: string;
  value: string;
  message: string;
}

interface RecommendationItem {
  type: string;
  title: string;
  description: string;
  priority: string;
  action: { type: string; target: string };
}

// ---------------------------------------------------------------------------
// useCachedUserPreferences
// ---------------------------------------------------------------------------

export const useCachedUserPreferences = (userId: string) => {
  const queryClient = useQueryClient();
  const originalPrefs = useUserPreferences();
  const cacheKey = ['user-preferences', userId];

  const { data: preferences } = useQuery<VersionedRecord>({
    queryKey: cacheKey,
    queryFn: async () => {
      return (originalPrefs.preferences as VersionedRecord) ?? {};
    },
    initialData: (originalPrefs.preferences as VersionedRecord) || undefined,
    staleTime: 15 * 60 * 1000 // 15 mins TTL
  });

  const { mutateAsync: updatePreferences } = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const newPreferences: VersionedRecord = {
        ...(preferences ?? {}),
        ...updates,
        version: Date.now(),
        lastUpdated: new Date().toISOString()
      };
      return newPreferences;
    },
    onSuccess: newPreferences => {
      queryClient.setQueryData(cacheKey, newPreferences);
      queryClient.invalidateQueries({ queryKey: ['dashboard-state', userId] });
    }
  });

  return {
    ...(preferences ?? {}),
    updatePreferences,
    clearCache: () => queryClient.removeQueries({ queryKey: cacheKey })
  };
};

// ---------------------------------------------------------------------------
// useCachedMinistryContext
// ---------------------------------------------------------------------------

export const useCachedMinistryContext = (churchId: string) => {
  const queryClient = useQueryClient();
  const originalContext = useMinistryContext();
  const cacheKey = ['ministry-context', churchId];

  const { data: context } = useQuery<MinistryRecord>({
    queryKey: cacheKey,
    queryFn: async () => {
      return (originalContext.ministry as MinistryRecord) ?? {};
    },
    initialData: (originalContext.ministry as MinistryRecord) || undefined,
    staleTime: 30 * 60 * 1000 // 30 mins TTL
  });

  return {
    ...(context ?? {}),
    clearCache: () => queryClient.removeQueries({ queryKey: cacheKey }),
    refreshCache: () => queryClient.invalidateQueries({ queryKey: cacheKey })
  };
};

// ---------------------------------------------------------------------------
// useCachedSeasonalContext
// ---------------------------------------------------------------------------

export const useCachedSeasonalContext = () => {
  const queryClient = useQueryClient();
  const originalContext = useSeasonalContext();
  const cacheKey = ['seasonal-context'];

  const { data: context } = useQuery<SeasonalRecord>({
    queryKey: cacheKey,
    queryFn: async () => {
      return (originalContext.season as SeasonalRecord) ?? {};
    },
    initialData: (originalContext.season as SeasonalRecord) || undefined,
    staleTime: 6 * 60 * 60 * 1000 // 6 hours TTL
  });

  return {
    ...(context ?? {}),
    clearCache: () => queryClient.removeQueries({ queryKey: cacheKey }),
    refreshCache: () => queryClient.invalidateQueries({ queryKey: cacheKey })
  };
};

// ---------------------------------------------------------------------------
// useCachedActivityContext
// ---------------------------------------------------------------------------

export const useCachedActivityContext = (userId: string) => {
  const queryClient = useQueryClient();
  const originalContext = useActivityContext();
  const cacheKey = ['activity-context', userId];

  const { data: context } = useQuery<ActivityRecord>({
    queryKey: cacheKey,
    queryFn: async () => {
      return (originalContext.activity as ActivityRecord) ?? {};
    },
    initialData: (originalContext.activity as ActivityRecord) || undefined,
    staleTime: 10 * 60 * 1000 // 10 mins TTL
  });

  const { mutateAsync: trackActivity } = useMutation({
    mutationFn: async (activity: { type: string; [key: string]: unknown }) => {
      const updatedContext: ActivityRecord = {
        ...(context ?? {}),
        lastActivity: Date.now(),
        recentActivities: [
          activity,
          ...(context?.recentActivities ?? []).slice(0, 49)
        ]
      };
      return updatedContext;
    },
    onSuccess: updatedContext => {
      queryClient.setQueryData(cacheKey, updatedContext);
      queryClient.invalidateQueries({ queryKey: ['dashboard-state', userId] });
    }
  });

  return {
    ...(context ?? {}),
    trackActivity,
    clearCache: () => queryClient.removeQueries({ queryKey: cacheKey })
  };
};

// ---------------------------------------------------------------------------
// useCachedDashboardState
// ---------------------------------------------------------------------------

export const useCachedDashboardState = (userId: string, churchId: string) => {
  const preferences = useCachedUserPreferences(userId);
  const ministryContext = useCachedMinistryContext(churchId);
  const seasonalContext = useCachedSeasonalContext();
  const activityContext = useCachedActivityContext(userId);
  const queryClient = useQueryClient();

  const dashboardCacheKey = ['dashboard-state', userId, churchId];

  const { data: dashboardConfig, isLoading } = useQuery<DashboardConfig>({
    queryKey: dashboardCacheKey,
    queryFn: async () => {
      const prefs = preferences as VersionedRecord;
      const minCtx = ministryContext as MinistryRecord | null;
      const seaCtx = seasonalContext as SeasonalRecord | null;
      const actCtx = activityContext as ActivityRecord | null;

      return {
        layout: (prefs.layout as string) ?? 'default',
        widgets: generateWidgetConfiguration(prefs, minCtx, seaCtx, actCtx),
        theme: (prefs.theme as string) ?? 'light',
        personalizations: generatePersonalizations(actCtx, seaCtx),
        recommendations: generateRecommendations(actCtx, minCtx, seaCtx),
        generatedAt: Date.now(),
        version: `${String(prefs.version ?? 0)}-${Date.now()}`
      };
    },
    enabled:
      !!preferences &&
      !!ministryContext &&
      !!seasonalContext &&
      !!activityContext,
    staleTime: 5 * 60 * 1000 // 5 mins TTL
  });

  const { mutateAsync: updateDashboardConfig } = useMutation({
    mutationFn: async (updates: { preferences?: Record<string, unknown> }) => {
      if (updates.preferences) {
        await preferences.updatePreferences(updates.preferences);
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardCacheKey });
    }
  });

  const clearAllCaches = useCallback(() => {
    preferences.clearCache();
    ministryContext.clearCache();
    seasonalContext.clearCache();
    activityContext.clearCache();
    queryClient.removeQueries({ queryKey: dashboardCacheKey });
  }, [
    preferences,
    ministryContext,
    seasonalContext,
    activityContext,
    queryClient,
    dashboardCacheKey
  ]);

  return {
    preferences,
    ministryContext,
    seasonalContext,
    activityContext,
    dashboardConfig: dashboardConfig ?? null,
    updateDashboardConfig,
    clearAllCaches,
    isLoading: isLoading || !dashboardConfig
  };
};

export default useCachedDashboardState;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function generateWidgetConfiguration(
  preferences: VersionedRecord,
  ministryContext: MinistryRecord | null,
  seasonalContext: SeasonalRecord | null,
  activityContext: ActivityRecord | null
): WidgetConfig[] {
  const baseWidgets: WidgetConfig[] = [
    { id: 'welcome', priority: 'high', category: 'user' },
    { id: 'quickActions', priority: 'high', category: 'actions' },
    { id: 'upcomingEvents', priority: 'normal', category: 'events' },
    { id: 'prayer-requests', priority: 'normal', category: 'ministry' }
  ];

  if (seasonalContext?.currentSeason) {
    baseWidgets.push({
      id: `${seasonalContext.currentSeason}-content`,
      priority: 'normal',
      category: 'seasonal'
    });
  }

  if ((ministryContext?.activeMinistries?.length ?? 0) > 0) {
    ministryContext!.activeMinistries!.forEach(ministry => {
      baseWidgets.push({
        id: `${ministry.slug}-ministry`,
        priority: 'low',
        category: 'ministry'
      });
    });
  }

  if ((activityContext?.recentActivities?.length ?? 0) > 0) {
    const activityTypes = [
      ...new Set(activityContext!.recentActivities!.map(a => a.type))
    ];
    activityTypes.forEach(type => {
      baseWidgets.push({
        id: `${type}-recommendations`,
        priority: 'low',
        category: 'recommendations'
      });
    });
  }

  const hiddenWidgets =
    (preferences.hiddenWidgets as string[] | undefined) ?? [];
  const widgetOrder =
    (preferences.widgetOrder as Record<string, number> | undefined) ?? {};

  return baseWidgets
    .filter(widget => !hiddenWidgets.includes(widget.id))
    .sort((a, b) => (widgetOrder[a.id] ?? 999) - (widgetOrder[b.id] ?? 999));
}

function generatePersonalizations(
  activityContext: ActivityRecord | null,
  seasonalContext: SeasonalRecord | null
): PersonalizationItem[] {
  const personalizations: PersonalizationItem[] = [];

  if ((activityContext?.recentActivities?.length ?? 0) > 0) {
    const countByType = activityContext!.recentActivities!.reduce<
      Record<string, number>
    >((acc, activity) => {
      acc[activity.type] = (acc[activity.type] ?? 0) + 1;
      return acc;
    }, {});
    const topActivity = Object.keys(countByType).sort(
      (a, b) => (countByType[b] ?? 0) - (countByType[a] ?? 0)
    )[0];
    if (topActivity) {
      personalizations.push({
        type: 'activity-focus',
        value: topActivity,
        message: `Based on your recent ${topActivity} activity`
      });
    }
  }

  if (seasonalContext?.currentSeason) {
    personalizations.push({
      type: 'seasonal-content',
      value: seasonalContext.currentSeason,
      message: `${seasonalContext.currentSeason} content and resources`
    });
  }

  return personalizations;
}

function generateRecommendations(
  activityContext: ActivityRecord | null,
  ministryContext: MinistryRecord | null,
  seasonalContext: SeasonalRecord | null
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];

  if ((ministryContext?.suggestedMinistries?.length ?? 0) > 0) {
    recommendations.push(
      ...ministryContext!.suggestedMinistries!.map(ministry => ({
        type: 'ministry',
        title: `Join ${ministry.name}`,
        description: `Based on your interests in ${ministry.categories.join(', ')}`,
        priority: 'medium',
        action: { type: 'navigate', target: `/ministries/${ministry.slug}` }
      }))
    );
  }

  if ((seasonalContext?.upcomingEvents?.length ?? 0) > 0) {
    recommendations.push(
      ...seasonalContext!.upcomingEvents!.slice(0, 2).map(event => ({
        type: 'event',
        title: event.name,
        description: `${event.date} - ${event.description}`,
        priority: 'high',
        action: { type: 'navigate', target: `/events/${event.id}` }
      }))
    );
  }

  if ((activityContext?.suggestedActions?.length ?? 0) > 0) {
    recommendations.push(
      ...activityContext!.suggestedActions!.slice(0, 3).map(action => ({
        type: 'action',
        title: action.title,
        description: action.description,
        priority: action.priority ?? 'low',
        action: action.action
      }))
    );
  }

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return recommendations.sort(
    (a, b) =>
      (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
  );
}
