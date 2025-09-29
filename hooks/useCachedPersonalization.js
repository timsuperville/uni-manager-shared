/**
 * Cache Integration Hooks
 * Seamless integration between intelligent caching and existing personalization system
 */

import { useCallback, useMemo } from "react";
import { useCacheManager } from "../utils/intelligentCache";
import { useUserPreferences } from "./useUserPreferences";
import { useMinistryContext } from "./useMinistryContext";
import { useSeasonalContext } from "./useSeasonalContext";
import { useActivityContext } from "./useActivityContext";

// Enhanced User Preferences with Intelligent Caching
export const useCachedUserPreferences = (userId) => {
  const cacheManager = useCacheManager();
  const originalPrefs = useUserPreferences(userId);

  const cacheKey = `user-preferences-${userId}`;
  const cache = cacheManager.getCache("userPreferences");

  // Get cached preferences
  const getCachedPreferences = useCallback(() => {
    return cache.get(cacheKey);
  }, [cache, cacheKey]);

  // Set cached preferences
  const setCachedPreferences = useCallback(
    (preferences, options = {}) => {
      cache.set(cacheKey, preferences, {
        ttl: 15 * 60 * 1000, // 15 minutes
        priority: "high",
        tags: ["user-data", `user-${userId}`],
        ...options,
      });
    },
    [cache, cacheKey, userId],
  );

  // Enhanced preferences with cache integration
  const preferences = useMemo(() => {
    const cached = getCachedPreferences();
    if (cached && cached.version >= (originalPrefs?.version || 0)) {
      return cached;
    }

    if (originalPrefs) {
      setCachedPreferences(originalPrefs);
    }

    return originalPrefs;
  }, [originalPrefs, getCachedPreferences, setCachedPreferences]);

  // Enhanced update function with cache invalidation
  const updatePreferences = useCallback(
    async (updates) => {
      try {
        // Update original preferences
        await originalPrefs.updatePreferences(updates);

        // Update cache with new version
        const newPreferences = {
          ...preferences,
          ...updates,
          version: Date.now(),
          lastUpdated: new Date().toISOString(),
        };

        setCachedPreferences(newPreferences);

        // Invalidate related caches
        cacheManager.invalidateRelated("userPreferences", cacheKey);

        return newPreferences;
      } catch (error) {
        // Remove invalid cache entry
        cache.delete(cacheKey);
        throw error;
      }
    },
    [
      originalPrefs,
      preferences,
      setCachedPreferences,
      cacheManager,
      cache,
      cacheKey,
    ],
  );

  return {
    ...preferences,
    updatePreferences,
    clearCache: () => cache.delete(cacheKey),
  };
};

// Enhanced Ministry Context with Intelligent Caching
export const useCachedMinistryContext = (churchId) => {
  const cacheManager = useCacheManager();
  const originalContext = useMinistryContext(churchId);

  const cacheKey = `ministry-context-${churchId}`;
  const cache = cacheManager.getCache("ministryData");

  // Get cached ministry context
  const getCachedContext = useCallback(() => {
    return cache.get(cacheKey);
  }, [cache, cacheKey]);

  // Set cached ministry context
  const setCachedContext = useCallback(
    (context, options = {}) => {
      cache.set(cacheKey, context, {
        ttl: 30 * 60 * 1000, // 30 minutes
        priority: "normal",
        tags: ["ministry-data", `church-${churchId}`],
        ...options,
      });
    },
    [cache, cacheKey, churchId],
  );

  // Enhanced context with cache integration
  const context = useMemo(() => {
    const cached = getCachedContext();
    if (cached && cached.lastUpdated >= (originalContext?.lastUpdated || 0)) {
      return cached;
    }

    if (originalContext) {
      setCachedContext(originalContext);
    }

    return originalContext;
  }, [originalContext, getCachedContext, setCachedContext]);

  return {
    ...context,
    clearCache: () => cache.delete(cacheKey),
    refreshCache: () => {
      cache.delete(cacheKey);
      if (originalContext) {
        setCachedContext(originalContext);
      }
    },
  };
};

// Enhanced Seasonal Context with Intelligent Caching
export const useCachedSeasonalContext = () => {
  const cacheManager = useCacheManager();
  const originalContext = useSeasonalContext();

  const cacheKey = `seasonal-context-${new Date().toDateString()}`;
  const cache = cacheManager.getCache("seasonalData");

  // Get cached seasonal context
  const getCachedContext = useCallback(() => {
    return cache.get(cacheKey);
  }, [cache, cacheKey]);

  // Set cached seasonal context
  const setCachedContext = useCallback(
    (context, options = {}) => {
      cache.set(cacheKey, context, {
        ttl: 6 * 60 * 60 * 1000, // 6 hours (seasonal data changes less frequently)
        priority: "normal",
        tags: ["seasonal-data"],
        ...options,
      });
    },
    [cache, cacheKey],
  );

  // Enhanced context with cache integration
  const context = useMemo(() => {
    const cached = getCachedContext();
    if (cached) {
      return cached;
    }

    if (originalContext) {
      setCachedContext(originalContext);
    }

    return originalContext;
  }, [originalContext, getCachedContext, setCachedContext]);

  return {
    ...context,
    clearCache: () => cache.delete(cacheKey),
    refreshCache: () => {
      cache.delete(cacheKey);
      if (originalContext) {
        setCachedContext(originalContext);
      }
    },
  };
};

// Enhanced Activity Context with Intelligent Caching
export const useCachedActivityContext = (userId) => {
  const cacheManager = useCacheManager();
  const originalContext = useActivityContext(userId);

  const cacheKey = `activity-context-${userId}`;
  const cache = cacheManager.getCache("recommendations");

  // Get cached activity context
  const getCachedContext = useCallback(() => {
    return cache.get(cacheKey);
  }, [cache, cacheKey]);

  // Set cached activity context
  const setCachedContext = useCallback(
    (context, options = {}) => {
      cache.set(cacheKey, context, {
        ttl: 10 * 60 * 1000, // 10 minutes (activity data changes frequently)
        priority: "high",
        tags: ["activity-data", `user-${userId}`],
        ...options,
      });
    },
    [cache, cacheKey, userId],
  );

  // Enhanced context with cache integration
  const context = useMemo(() => {
    const cached = getCachedContext();
    if (cached && cached.lastActivity >= (originalContext?.lastActivity || 0)) {
      return cached;
    }

    if (originalContext) {
      setCachedContext(originalContext);
    }

    return originalContext;
  }, [originalContext, getCachedContext, setCachedContext]);

  // Enhanced tracking with cache updates
  const trackActivity = useCallback(
    async (activity) => {
      try {
        // Track original activity
        await originalContext.trackActivity(activity);

        // Update cache with new activity
        const updatedContext = {
          ...context,
          lastActivity: Date.now(),
          recentActivities: [
            activity,
            ...(context?.recentActivities || []).slice(0, 49), // Keep last 50
          ],
        };

        setCachedContext(updatedContext);

        // Invalidate related caches for recommendations
        cacheManager.invalidateRelated("recommendations", cacheKey);

        return updatedContext;
      } catch (error) {
        // Remove invalid cache entry
        cache.delete(cacheKey);
        throw error;
      }
    },
    [originalContext, context, setCachedContext, cacheManager, cache, cacheKey],
  );

  return {
    ...context,
    trackActivity,
    clearCache: () => cache.delete(cacheKey),
  };
};

// Unified Dashboard State with Intelligent Caching
export const useCachedDashboardState = (userId, churchId) => {
  const preferences = useCachedUserPreferences(userId);
  const ministryContext = useCachedMinistryContext(churchId);
  const seasonalContext = useCachedSeasonalContext();
  const activityContext = useCachedActivityContext(userId);
  const cacheManager = useCacheManager();

  // Combined dashboard state cache key
  const dashboardCacheKey = `dashboard-state-${userId}-${churchId}`;
  const dashboardCache = cacheManager.getCache("dashboardConfig");

  // Generate dashboard configuration
  const dashboardConfig = useMemo(() => {
    if (
      !preferences ||
      !ministryContext ||
      !seasonalContext ||
      !activityContext
    ) {
      return null;
    }

    // Check for cached dashboard config
    const cached = dashboardCache.get(dashboardCacheKey);
    if (cached && cached.generatedAt > Date.now() - 5 * 60 * 1000) {
      // 5 minutes
      return cached;
    }

    // Generate new dashboard configuration
    const config = {
      layout: preferences.layout || "default",
      widgets: generateWidgetConfiguration(
        preferences,
        ministryContext,
        seasonalContext,
        activityContext,
      ),
      theme: preferences.theme || "light",
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
      version: `${preferences.version}-${Date.now()}`,
    };

    // Cache the generated configuration
    dashboardCache.set(dashboardCacheKey, config, {
      ttl: 5 * 60 * 1000, // 5 minutes
      priority: "high",
      tags: ["dashboard-config", `user-${userId}`, `church-${churchId}`],
    });

    return config;
  }, [
    preferences,
    ministryContext,
    seasonalContext,
    activityContext,
    dashboardCache,
    dashboardCacheKey,
  ]);

  // Update dashboard configuration
  const updateDashboardConfig = useCallback(
    async (updates) => {
      try {
        // Update related preferences
        if (updates.preferences) {
          await preferences.updatePreferences(updates.preferences);
        }

        // Invalidate dashboard cache to force regeneration
        dashboardCache.delete(dashboardCacheKey);

        // Invalidate related caches
        cacheManager.invalidateRelated("dashboardConfig", dashboardCacheKey);

        return true;
      } catch (error) {
        // Failed to update dashboard config - silently handle
        return false;
      }
    },
    [preferences, dashboardCache, dashboardCacheKey, cacheManager],
  );

  // Clear all related caches
  const clearAllCaches = useCallback(() => {
    preferences.clearCache();
    ministryContext.clearCache();
    seasonalContext.clearCache();
    activityContext.clearCache();
    dashboardCache.delete(dashboardCacheKey);
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

// Helper function to generate widget configuration
const generateWidgetConfiguration = (
  preferences,
  ministryContext,
  seasonalContext,
  activityContext,
) => {
  const baseWidgets = [
    { id: "welcome", priority: "high", category: "user" },
    { id: "quickActions", priority: "high", category: "actions" },
    { id: "upcomingEvents", priority: "normal", category: "events" },
    { id: "prayer-requests", priority: "normal", category: "ministry" },
  ];

  // Add seasonal widgets
  if (seasonalContext?.currentSeason) {
    baseWidgets.push({
      id: `${seasonalContext.currentSeason}-content`,
      priority: "normal",
      category: "seasonal",
    });
  }

  // Add ministry-specific widgets
  if (ministryContext?.activeMinistries?.length > 0) {
    ministryContext.activeMinistries.forEach((ministry) => {
      baseWidgets.push({
        id: `${ministry.slug}-ministry`,
        priority: "low",
        category: "ministry",
      });
    });
  }

  // Add activity-based widgets
  if (activityContext?.recentActivities?.length > 0) {
    const activityTypes = [
      ...new Set(activityContext.recentActivities.map((a) => a.type)),
    ];
    activityTypes.forEach((type) => {
      baseWidgets.push({
        id: `${type}-recommendations`,
        priority: "low",
        category: "recommendations",
      });
    });
  }

  // Apply user preferences for widget order and visibility
  return baseWidgets
    .filter((widget) => !preferences.hiddenWidgets?.includes(widget.id))
    .sort((a, b) => {
      const aOrder = preferences.widgetOrder?.[a.id] || 999;
      const bOrder = preferences.widgetOrder?.[b.id] || 999;
      return aOrder - bOrder;
    });
};

// Helper function to generate personalizations
const generatePersonalizations = (activityContext, seasonalContext) => {
  const personalizations = [];

  // Activity-based personalizations
  if (activityContext?.recentActivities?.length > 0) {
    const mostCommonActivity = activityContext.recentActivities.reduce(
      (acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      },
      {},
    );

    const topActivity = Object.keys(mostCommonActivity).sort(
      (a, b) => mostCommonActivity[b] - mostCommonActivity[a],
    )[0];

    personalizations.push({
      type: "activity-focus",
      value: topActivity,
      message: `Based on your recent ${topActivity} activity`,
    });
  }

  // Seasonal personalizations
  if (seasonalContext?.currentSeason) {
    personalizations.push({
      type: "seasonal-content",
      value: seasonalContext.currentSeason,
      message: `${seasonalContext.currentSeason} content and resources`,
    });
  }

  return personalizations;
};

// Helper function to generate recommendations
const generateRecommendations = (
  activityContext,
  ministryContext,
  seasonalContext,
) => {
  const recommendations = [];

  // Ministry-based recommendations
  if (ministryContext?.suggestedMinistries?.length > 0) {
    recommendations.push(
      ...ministryContext.suggestedMinistries.map((ministry) => ({
        type: "ministry",
        title: `Join ${ministry.name}`,
        description: `Based on your interests in ${ministry.categories.join(", ")}`,
        priority: "medium",
        action: { type: "navigate", target: `/ministries/${ministry.slug}` },
      })),
    );
  }

  // Seasonal recommendations
  if (seasonalContext?.upcomingEvents?.length > 0) {
    recommendations.push(
      ...seasonalContext.upcomingEvents.slice(0, 2).map((event) => ({
        type: "event",
        title: event.name,
        description: `${event.date} - ${event.description}`,
        priority: "high",
        action: { type: "navigate", target: `/events/${event.id}` },
      })),
    );
  }

  // Activity-based recommendations
  if (activityContext?.suggestedActions?.length > 0) {
    recommendations.push(
      ...activityContext.suggestedActions.slice(0, 3).map((action) => ({
        type: "action",
        title: action.title,
        description: action.description,
        priority: action.priority || "low",
        action: action.action,
      })),
    );
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

export default useCachedDashboardState;
