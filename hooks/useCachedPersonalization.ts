/**
 * Cache Integration Hooks
 * Seamless integration between intelligent caching and existing personalization system.
 *
 * NOTE: useCachedUserPreferences, useCachedMinistryContext, useCachedSeasonalContext,
 * useCachedActivityContext and useCachedDashboardState each wrap their corresponding
 * context hooks + the IntelligentCache layer. The underlying context hooks are
 * currently lightweight stubs; the cache layer is ready for when they expose richer
 * server-synced data.
 *
 * Bug fixes applied during TS migration:
 *  1. cache.delete() → cache.clearByTag() (IntelligentCache has no .delete())
 *  2. throw error → throw _error (variable was shadowed, original threw ReferenceError)
 */

import { useCallback, useMemo } from "react";
import { useCacheManager } from "../utils/intelligentCache.ts";
import type {
  IntelligentCache,
  CacheEntryOptions,
} from "../utils/intelligentCache.ts";
import { useUserPreferences } from "./useUserPreferences.ts";
import { useMinistryContext } from "./useMinistryContext.ts";
import { useSeasonalContext } from "./useSeasonalContext.ts";
import { useActivityContext } from "./useActivityContext.ts";

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
// Helper: invalidate entries by tag prefix when .delete() is unavailable
// ---------------------------------------------------------------------------

function evictCacheKey(cache: IntelligentCache, cacheKey: string): void {
  // IntelligentCache exposes clearByTag() but not delete(key). We use tag-based
  // eviction — all entries set via setCached* are tagged with the cacheKey.
  cache.clearByTag(cacheKey);
}

// ---------------------------------------------------------------------------
// useCachedUserPreferences
// ---------------------------------------------------------------------------

export const useCachedUserPreferences = (userId: string) => {
  const cacheManager = useCacheManager();
  const originalPrefs = useUserPreferences();

  const cacheKey = `user-preferences-${userId}`;
  const cache = cacheManager.cacheManager.getCache("userPreferences");

  const getCachedPreferences = useCallback((): VersionedRecord | null => {
    return (cache?.get(cacheKey) as VersionedRecord | null) ?? null;
  }, [cache, cacheKey]);

  const setCachedPreferences = useCallback(
    (preferences: VersionedRecord, options: CacheEntryOptions = {}): void => {
      cache?.set(cacheKey, preferences, {
        ttl: 15 * 60 * 1_000,
        priority: "high",
        tags: ["user-data", `user-${userId}`, cacheKey],
        ...options,
      });
    },
    [cache, cacheKey, userId],
  );

  const preferences = useMemo((): VersionedRecord | null => {
    const cached = getCachedPreferences();
    if (
      cached &&
      (cached.version ?? 0) >=
        ((originalPrefs.preferences.version as number) ?? 0)
    ) {
      return cached;
    }
    if (originalPrefs)
      setCachedPreferences(originalPrefs.preferences as VersionedRecord);
    return originalPrefs.preferences as VersionedRecord;
  }, [originalPrefs, getCachedPreferences, setCachedPreferences]);

  const updatePreferences = useCallback(
    async (updates: Record<string, unknown>): Promise<VersionedRecord> => {
      try {
        // updatePreferences is not yet exposed by the stub — call when available
        const newPreferences: VersionedRecord = {
          ...preferences,
          ...updates,
          version: Date.now(),
          lastUpdated: new Date().toISOString(),
        };
        setCachedPreferences(newPreferences);
        cacheManager.cacheManager.invalidateRelated(
          "userPreferences",
          cacheKey,
        );
        return newPreferences;
      } catch (_error) {
        if (cache) evictCacheKey(cache, cacheKey); // Bug fix: was cache.delete() + throw error
        throw _error;
      }
    },
    [preferences, setCachedPreferences, cacheManager, cache, cacheKey],
  );

  return {
    ...preferences,
    updatePreferences,
    clearCache: () => {
      if (cache) evictCacheKey(cache, cacheKey);
    },
  };
};

// ---------------------------------------------------------------------------
// useCachedMinistryContext
// ---------------------------------------------------------------------------

export const useCachedMinistryContext = (churchId: string) => {
  const cacheManager = useCacheManager();
  const originalContext = useMinistryContext();

  const cacheKey = `ministry-context-${churchId}`;
  const cache = cacheManager.cacheManager.getCache("ministryData");

  const getCachedContext = useCallback((): MinistryRecord | null => {
    return (cache?.get(cacheKey) as MinistryRecord | null) ?? null;
  }, [cache, cacheKey]);

  const setCachedContext = useCallback(
    (context: MinistryRecord, options: CacheEntryOptions = {}): void => {
      cache?.set(cacheKey, context, {
        ttl: 30 * 60 * 1_000,
        priority: "normal",
        tags: ["ministry-data", `church-${churchId}`, cacheKey],
        ...options,
      });
    },
    [cache, cacheKey, churchId],
  );

  const context = useMemo((): MinistryRecord | null => {
    const cached = getCachedContext();
    const origUpdated =
      (originalContext.ministry?.["lastUpdated"] as number) ?? 0;
    if (cached && (cached.lastUpdated ?? 0) >= origUpdated) return cached;
    if (originalContext.ministry)
      setCachedContext(originalContext.ministry as MinistryRecord);
    return originalContext.ministry as MinistryRecord | null;
  }, [originalContext, getCachedContext, setCachedContext]);

  return {
    ...context,
    clearCache: () => {
      if (cache) evictCacheKey(cache, cacheKey);
    },
    refreshCache: () => {
      if (cache) evictCacheKey(cache, cacheKey);
      if (originalContext.ministry)
        setCachedContext(originalContext.ministry as MinistryRecord);
    },
  };
};

// ---------------------------------------------------------------------------
// useCachedSeasonalContext
// ---------------------------------------------------------------------------

export const useCachedSeasonalContext = () => {
  const cacheManager = useCacheManager();
  const originalContext = useSeasonalContext();

  const cacheKey = `seasonal-context-${new Date().toDateString()}`;
  const cache = cacheManager.cacheManager.getCache("seasonalContent");

  const getCachedContext = useCallback((): SeasonalRecord | null => {
    return (cache?.get(cacheKey) as SeasonalRecord | null) ?? null;
  }, [cache, cacheKey]);

  const setCachedContext = useCallback(
    (context: SeasonalRecord, options: CacheEntryOptions = {}): void => {
      cache?.set(cacheKey, context, {
        ttl: 6 * 60 * 60 * 1_000,
        priority: "normal",
        tags: ["seasonal-data", cacheKey],
        ...options,
      });
    },
    [cache, cacheKey],
  );

  const context = useMemo((): SeasonalRecord | null => {
    const cached = getCachedContext();
    if (cached) return cached;
    if (originalContext.season)
      setCachedContext(originalContext.season as SeasonalRecord);
    return originalContext.season as SeasonalRecord | null;
  }, [originalContext, getCachedContext, setCachedContext]);

  return {
    ...context,
    clearCache: () => {
      if (cache) evictCacheKey(cache, cacheKey);
    },
    refreshCache: () => {
      if (cache) evictCacheKey(cache, cacheKey);
      if (originalContext.season)
        setCachedContext(originalContext.season as SeasonalRecord);
    },
  };
};

// ---------------------------------------------------------------------------
// useCachedActivityContext
// ---------------------------------------------------------------------------

export const useCachedActivityContext = (userId: string) => {
  const cacheManager = useCacheManager();
  const originalContext = useActivityContext();

  const cacheKey = `activity-context-${userId}`;
  const cache = cacheManager.cacheManager.getCache("recommendations");

  const getCachedContext = useCallback((): ActivityRecord | null => {
    return (cache?.get(cacheKey) as ActivityRecord | null) ?? null;
  }, [cache, cacheKey]);

  const setCachedContext = useCallback(
    (context: ActivityRecord, options: CacheEntryOptions = {}): void => {
      cache?.set(cacheKey, context, {
        ttl: 10 * 60 * 1_000,
        priority: "high",
        tags: ["activity-data", `user-${userId}`, cacheKey],
        ...options,
      });
    },
    [cache, cacheKey, userId],
  );

  const context = useMemo((): ActivityRecord | null => {
    const cached = getCachedContext();
    const origActivity =
      (originalContext.activity?.["lastActivity"] as number) ?? 0;
    if (cached && (cached.lastActivity ?? 0) >= origActivity) return cached;
    if (originalContext.activity)
      setCachedContext(originalContext.activity as ActivityRecord);
    return originalContext.activity as ActivityRecord | null;
  }, [originalContext, getCachedContext, setCachedContext]);

  const trackActivity = useCallback(
    async (activity: {
      type: string;
      [key: string]: unknown;
    }): Promise<ActivityRecord> => {
      try {
        const updatedContext: ActivityRecord = {
          ...context,
          lastActivity: Date.now(),
          recentActivities: [
            activity,
            ...(context?.recentActivities ?? []).slice(0, 49),
          ],
        };
        setCachedContext(updatedContext);
        cacheManager.cacheManager.invalidateRelated(
          "recommendations",
          cacheKey,
        );
        return updatedContext;
      } catch (_error) {
        if (cache) evictCacheKey(cache, cacheKey); // Bug fix: was cache.delete() + throw error
        throw _error;
      }
    },
    [context, setCachedContext, cacheManager, cache, cacheKey],
  );

  return {
    ...context,
    trackActivity,
    clearCache: () => {
      if (cache) evictCacheKey(cache, cacheKey);
    },
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
  const cacheManager = useCacheManager();

  const dashboardCacheKey = `dashboard-state-${userId}-${churchId}`;
  const dashboardCache = cacheManager.cacheManager.getCache("dashboardConfig");

  const dashboardConfig = useMemo((): DashboardConfig | null => {
    if (
      !preferences ||
      !ministryContext ||
      !seasonalContext ||
      !activityContext
    ) {
      return null;
    }

    const cached =
      (dashboardCache?.get(dashboardCacheKey) as DashboardConfig | null) ??
      null;
    if (cached && cached.generatedAt > Date.now() - 5 * 60 * 1_000)
      return cached;

    const config: DashboardConfig = {
      layout: (preferences.layout as string) ?? "default",
      widgets: generateWidgetConfiguration(
        preferences,
        ministryContext,
        seasonalContext,
        activityContext,
      ),
      theme: (preferences.theme as string) ?? "light",
      personalizations: generatePersonalizations(
        activityContext,
        seasonalContext,
      ),
      recommendations: generateRecommendations(
        activityContext,
        ministryContext,
        seasonalContext,
      ),
      generatedAt: Date.now(),
      version: `${String(preferences.version ?? 0)}-${Date.now()}`,
    };

    dashboardCache?.set(dashboardCacheKey, config, {
      ttl: 5 * 60 * 1_000,
      priority: "high",
      tags: [
        "dashboard-config",
        `user-${userId}`,
        `church-${churchId}`,
        dashboardCacheKey,
      ],
    });

    return config;
  }, [
    preferences,
    ministryContext,
    seasonalContext,
    activityContext,
    dashboardCache,
    dashboardCacheKey,
    userId,
    churchId,
  ]);

  const updateDashboardConfig = useCallback(
    async (updates: {
      preferences?: Record<string, unknown>;
    }): Promise<boolean> => {
      try {
        if (updates.preferences) {
          await preferences.updatePreferences(updates.preferences);
        }
        if (dashboardCache) evictCacheKey(dashboardCache, dashboardCacheKey);
        cacheManager.cacheManager.invalidateRelated(
          "dashboardConfig",
          dashboardCacheKey,
        );
        return true;
      } catch {
        return false;
      }
    },
    [preferences, dashboardCache, dashboardCacheKey, cacheManager],
  );

  const clearAllCaches = useCallback((): void => {
    preferences.clearCache();
    ministryContext.clearCache();
    seasonalContext.clearCache();
    activityContext.clearCache();
    if (dashboardCache) evictCacheKey(dashboardCache, dashboardCacheKey);
  }, [
    preferences,
    ministryContext,
    seasonalContext,
    activityContext,
    dashboardCache,
    dashboardCacheKey,
  ]);

  return {
    preferences,
    ministryContext,
    seasonalContext,
    activityContext,
    dashboardConfig,
    updateDashboardConfig,
    clearAllCaches,
    isLoading: !dashboardConfig,
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
  activityContext: ActivityRecord | null,
): WidgetConfig[] {
  const baseWidgets: WidgetConfig[] = [
    { id: "welcome", priority: "high", category: "user" },
    { id: "quickActions", priority: "high", category: "actions" },
    { id: "upcomingEvents", priority: "normal", category: "events" },
    { id: "prayer-requests", priority: "normal", category: "ministry" },
  ];

  if (seasonalContext?.currentSeason) {
    baseWidgets.push({
      id: `${seasonalContext.currentSeason}-content`,
      priority: "normal",
      category: "seasonal",
    });
  }

  if ((ministryContext?.activeMinistries?.length ?? 0) > 0) {
    ministryContext!.activeMinistries!.forEach((ministry) => {
      baseWidgets.push({
        id: `${ministry.slug}-ministry`,
        priority: "low",
        category: "ministry",
      });
    });
  }

  if ((activityContext?.recentActivities?.length ?? 0) > 0) {
    const activityTypes = [
      ...new Set(activityContext!.recentActivities!.map((a) => a.type)),
    ];
    activityTypes.forEach((type) => {
      baseWidgets.push({
        id: `${type}-recommendations`,
        priority: "low",
        category: "recommendations",
      });
    });
  }

  const hiddenWidgets =
    (preferences.hiddenWidgets as string[] | undefined) ?? [];
  const widgetOrder =
    (preferences.widgetOrder as Record<string, number> | undefined) ?? {};

  return baseWidgets
    .filter((widget) => !hiddenWidgets.includes(widget.id))
    .sort((a, b) => (widgetOrder[a.id] ?? 999) - (widgetOrder[b.id] ?? 999));
}

function generatePersonalizations(
  activityContext: ActivityRecord | null,
  seasonalContext: SeasonalRecord | null,
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
      (a, b) => countByType[b] - countByType[a],
    )[0];
    personalizations.push({
      type: "activity-focus",
      value: topActivity,
      message: `Based on your recent ${topActivity} activity`,
    });
  }

  if (seasonalContext?.currentSeason) {
    personalizations.push({
      type: "seasonal-content",
      value: seasonalContext.currentSeason,
      message: `${seasonalContext.currentSeason} content and resources`,
    });
  }

  return personalizations;
}

function generateRecommendations(
  activityContext: ActivityRecord | null,
  ministryContext: MinistryRecord | null,
  seasonalContext: SeasonalRecord | null,
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];

  if ((ministryContext?.suggestedMinistries?.length ?? 0) > 0) {
    recommendations.push(
      ...ministryContext!.suggestedMinistries!.map((ministry) => ({
        type: "ministry",
        title: `Join ${ministry.name}`,
        description: `Based on your interests in ${ministry.categories.join(", ")}`,
        priority: "medium",
        action: { type: "navigate", target: `/ministries/${ministry.slug}` },
      })),
    );
  }

  if ((seasonalContext?.upcomingEvents?.length ?? 0) > 0) {
    recommendations.push(
      ...seasonalContext!.upcomingEvents!.slice(0, 2).map((event) => ({
        type: "event",
        title: event.name,
        description: `${event.date} - ${event.description}`,
        priority: "high",
        action: { type: "navigate", target: `/events/${event.id}` },
      })),
    );
  }

  if ((activityContext?.suggestedActions?.length ?? 0) > 0) {
    recommendations.push(
      ...activityContext!.suggestedActions!.slice(0, 3).map((action) => ({
        type: "action",
        title: action.title,
        description: action.description,
        priority: action.priority ?? "low",
        action: action.action,
      })),
    );
  }

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return recommendations.sort(
    (a, b) =>
      (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3),
  );
}
