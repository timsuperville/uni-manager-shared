/**
 * Intelligent Caching System
 * Advanced caching strategies for user preferences, ministry data, seasonal content, and recommendations
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CachePriority = "low" | "normal" | "high" | "critical";
type CacheStrategy = "lru" | "lfu" | "ttl" | "hybrid";

export type CacheType =
  | "userPreferences"
  | "ministryData"
  | "seasonalContent"
  | "recommendations"
  | "activityPatterns"
  | "liturgicalCalendar"
  | "dashboardConfig"
  | "widgets"
  | string;

interface CacheEntryOptions {
  ttl?: number;
  priority?: CachePriority;
  tags?: string[];
  dependencies?: string[];
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  memoryUsage: number;
  averageAccessTime: number;
}

interface CacheEvent {
  event: string;
  key: string;
  data?: unknown;
  timestamp: number;
}

interface SetOptions extends CacheEntryOptions {
  invalidateRelated?: boolean;
}

interface WithCacheLogicConfig {
  cacheType?: CacheType;
  generateKey?: (params: unknown) => string;
  ttl?: number;
  tags?: string[];
  priority?: CachePriority;
}

// ---------------------------------------------------------------------------
// Browser API polyfills for cross-environment compatibility
// ---------------------------------------------------------------------------

const safeConsole =
  typeof console !== "undefined"
    ? console
    : { log: () => undefined, warn: () => undefined, error: () => undefined };

const safePerformance: Pick<Performance, "now"> = (() => {
  if (typeof performance !== "undefined") return performance;
  return { now: () => Date.now() };
})();

const safeSetInterval =
  typeof setInterval !== "undefined"
    ? setInterval
    : () => 0 as unknown as ReturnType<typeof setInterval>;
const safeClearInterval =
  typeof clearInterval !== "undefined" ? clearInterval : () => undefined;

// ---------------------------------------------------------------------------
// Cache configuration constants
// ---------------------------------------------------------------------------

export const CACHE_CONFIG = {
  TIMEOUTS: {
    USER_PREFERENCES: 5 * 60 * 1000,
    MINISTRY_DATA: 15 * 60 * 1000,
    SEASONAL_CONTENT: 60 * 60 * 1000,
    RECOMMENDATIONS: 10 * 60 * 1000,
    ACTIVITY_PATTERNS: 30 * 60 * 1000,
    LITURGICAL_CALENDAR: 24 * 60 * 60 * 1000,
    DASHBOARD_CONFIG: 5 * 60 * 1000,
    WIDGETS: 10 * 60 * 1000,
  },
  SIZES: {
    USER_PREFERENCES: 100,
    MINISTRY_DATA: 500,
    SEASONAL_CONTENT: 50,
    RECOMMENDATIONS: 1000,
    ACTIVITY_PATTERNS: 200,
    LITURGICAL_CALENDAR: 10,
    DASHBOARD_CONFIG: 100,
    WIDGETS: 300,
  },
  STRATEGIES: {
    LRU: "lru" as CacheStrategy,
    LFU: "lfu" as CacheStrategy,
    TTL: "ttl" as CacheStrategy,
    HYBRID: "hybrid" as CacheStrategy,
  },
} as const;

// ---------------------------------------------------------------------------
// CacheEntry
// ---------------------------------------------------------------------------

class CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl: number;
  priority: CachePriority;
  tags: string[];
  dependencies: string[];

  constructor(data: T, options: CacheEntryOptions = {}) {
    this.data = data;
    this.timestamp = Date.now();
    this.accessCount = 1;
    this.lastAccessed = Date.now();
    this.ttl = options.ttl ?? CACHE_CONFIG.TIMEOUTS.USER_PREFERENCES;
    this.priority = options.priority ?? "normal";
    this.tags = options.tags ?? [];
    this.dependencies = options.dependencies ?? [];
  }

  isExpired(): boolean {
    return Date.now() - this.timestamp > this.ttl;
  }

  touch(): void {
    this.lastAccessed = Date.now();
    this.accessCount++;
  }

  getAge(): number {
    return Date.now() - this.timestamp;
  }

  getTimeSinceAccess(): number {
    return Date.now() - this.lastAccessed;
  }
}

// ---------------------------------------------------------------------------
// IntelligentCache
// ---------------------------------------------------------------------------

interface IntelligentCacheOptions {
  maxSize?: number;
  strategy?: CacheStrategy;
}

interface PerformanceMetrics {
  averageAccessTime: number;
  totalAccessTime: number;
  accessCount: number;
  memoryUsage: number;
}

export class IntelligentCache<T = unknown> {
  private maxSize: number;
  private strategy: CacheStrategy;
  private storage: Map<string, CacheEntry<T>>;
  private accessOrder: string[];
  private hitCount: number;
  private missCount: number;
  private evictionCount: number;
  private readonly listeners: Set<(event: CacheEvent) => void>;
  private performanceMetrics: PerformanceMetrics;

  constructor(options: IntelligentCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 100;
    this.strategy = options.strategy ?? CACHE_CONFIG.STRATEGIES.HYBRID;
    this.storage = new Map();
    this.accessOrder = [];
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
    this.listeners = new Set();
    this.performanceMetrics = {
      averageAccessTime: 0,
      totalAccessTime: 0,
      accessCount: 0,
      memoryUsage: 0,
    };
  }

  get(key: string): T | null {
    const startTime = safePerformance.now();
    const entry = this.storage.get(key);

    if (!entry || entry.isExpired()) {
      this.missCount++;
      if (entry) {
        this.storage.delete(key);
        this.removeFromAccessOrder(key);
      }
      this.updatePerformanceMetrics(safePerformance.now() - startTime);
      return null;
    }

    entry.touch();
    this.updateAccessOrder(key);
    this.hitCount++;
    this.updatePerformanceMetrics(safePerformance.now() - startTime);
    return entry.data;
  }

  set(key: string, data: T, options: CacheEntryOptions = {}): void {
    const entry = new CacheEntry<T>(data, options);

    if (this.storage.size >= this.maxSize && !this.storage.has(key)) {
      this.evict();
    }

    this.storage.set(key, entry);
    this.updateAccessOrder(key);
    this.notifyListeners("set", key, data);
    this.updateMemoryUsage();
  }

  private evict(): void {
    let keyToEvict: string | null;

    switch (this.strategy) {
      case CACHE_CONFIG.STRATEGIES.LRU:
        keyToEvict = this.evictLRU();
        break;
      case CACHE_CONFIG.STRATEGIES.LFU:
        keyToEvict = this.evictLFU();
        break;
      case CACHE_CONFIG.STRATEGIES.TTL:
        keyToEvict = this.evictExpired();
        break;
      case CACHE_CONFIG.STRATEGIES.HYBRID:
      default:
        keyToEvict = this.evictHybrid();
        break;
    }

    if (keyToEvict) {
      this.storage.delete(keyToEvict);
      this.removeFromAccessOrder(keyToEvict);
      this.evictionCount++;
      this.notifyListeners("evict", keyToEvict);
    }
  }

  private evictLRU(): string | null {
    return this.accessOrder[0] ?? null;
  }

  private evictLFU(): string | null {
    let minAccessCount = Infinity;
    let keyToEvict: string | null = null;

    for (const [key, entry] of this.storage) {
      if (entry.accessCount < minAccessCount) {
        minAccessCount = entry.accessCount;
        keyToEvict = key;
      }
    }

    return keyToEvict;
  }

  private evictExpired(): string | null {
    for (const [key, entry] of this.storage) {
      if (entry.isExpired()) return key;
    }
    return this.evictLRU();
  }

  private evictHybrid(): string | null {
    const expiredKey = this.evictExpired();
    if (expiredKey && this.storage.get(expiredKey)?.isExpired()) {
      return expiredKey;
    }

    let bestScore = -1;
    let keyToEvict: string | null = null;

    for (const [key, entry] of this.storage) {
      if (
        entry.priority === "critical" &&
        this.storage.size < this.maxSize * 0.95
      ) {
        continue;
      }
      const score = this.calculateEvictionScore(entry);
      if (score > bestScore) {
        bestScore = score;
        keyToEvict = key;
      }
    }

    return keyToEvict ?? this.evictLRU();
  }

  private calculateEvictionScore(entry: CacheEntry<T>): number {
    const ageWeight = 0.3;
    const accessFrequencyWeight = 0.4;
    const timeSinceAccessWeight = 0.2;

    const ageScore = entry.getAge() / entry.ttl;
    const accessFrequencyScore = 1 / (entry.accessCount + 1);
    const timeSinceAccessScore = entry.getTimeSinceAccess() / entry.ttl;

    const priorityMultipliers: Record<CachePriority, number> = {
      critical: 0.1,
      high: 0.3,
      normal: 1.0,
      low: 1.5,
    };
    const priorityScore = priorityMultipliers[entry.priority] ?? 1.0;

    return (
      (ageScore * ageWeight +
        accessFrequencyScore * accessFrequencyWeight +
        timeSinceAccessScore * timeSinceAccessWeight) *
      priorityScore
    );
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  clearByTag(tag: string): void {
    const keysToDelete: string[] = [];
    for (const [key, entry] of this.storage) {
      if (entry.tags.includes(tag)) keysToDelete.push(key);
    }
    keysToDelete.forEach((key) => {
      this.storage.delete(key);
      this.removeFromAccessOrder(key);
      this.notifyListeners("clear", key);
    });
  }

  invalidateDependencies(changedKey: string): void {
    const keysToInvalidate: string[] = [];
    for (const [key, entry] of this.storage) {
      if (entry.dependencies.includes(changedKey)) keysToInvalidate.push(key);
    }
    keysToInvalidate.forEach((key) => {
      this.storage.delete(key);
      this.removeFromAccessOrder(key);
      this.notifyListeners("invalidate", key);
    });
  }

  getStats(): CacheStats {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? this.hitCount / total : 0;
    return {
      size: this.storage.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      evictionCount: this.evictionCount,
      memoryUsage: this.performanceMetrics.memoryUsage,
      averageAccessTime: this.performanceMetrics.averageAccessTime,
    };
  }

  private updatePerformanceMetrics(accessTime: number): void {
    this.performanceMetrics.totalAccessTime += accessTime;
    this.performanceMetrics.accessCount++;
    this.performanceMetrics.averageAccessTime =
      this.performanceMetrics.totalAccessTime /
      this.performanceMetrics.accessCount;
  }

  private updateMemoryUsage(): void {
    let totalSize = 0;
    for (const [key, entry] of this.storage) {
      totalSize += JSON.stringify(entry.data).length + key.length;
    }
    this.performanceMetrics.memoryUsage = totalSize;
  }

  addListener(callback: (event: CacheEvent) => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: (event: CacheEvent) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(event: string, key: string, data?: unknown): void {
    this.listeners.forEach((callback) => {
      try {
        callback({ event, key, data, timestamp: Date.now() });
      } catch (_error) {
        safeConsole.error("Cache listener error:", _error);
      }
    });
  }

  cleanup(): number {
    const keysToDelete: string[] = [];
    for (const [key, entry] of this.storage) {
      if (entry.isExpired()) keysToDelete.push(key);
    }
    keysToDelete.forEach((key) => {
      this.storage.delete(key);
      this.removeFromAccessOrder(key);
      this.notifyListeners("expire", key);
    });
    return keysToDelete.length;
  }

  clear(): void {
    this.storage.clear();
    this.accessOrder = [];
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
    this.performanceMetrics = {
      averageAccessTime: 0,
      totalAccessTime: 0,
      accessCount: 0,
      memoryUsage: 0,
    };
    this.notifyListeners("clearAll", "");
  }
}

// ---------------------------------------------------------------------------
// CacheManager
// ---------------------------------------------------------------------------

const CACHE_DEPENDENCIES: Partial<Record<CacheType, CacheType[]>> = {
  userPreferences: ["dashboardConfig", "widgets", "recommendations"],
  ministryData: ["recommendations", "widgets", "dashboardConfig"],
  seasonalContent: ["recommendations", "widgets"],
  activityPatterns: ["recommendations"],
};

export class CacheManager {
  private readonly caches: Map<CacheType, IntelligentCache>;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.caches = new Map();
    this.initializeCaches();

    this.cleanupInterval = safeSetInterval(() => {
      this.performCleanup();
    }, 60_000);
  }

  private initializeCaches(): void {
    const entries: Array<[CacheType, IntelligentCacheOptions]> = [
      [
        "userPreferences",
        {
          maxSize: CACHE_CONFIG.SIZES.USER_PREFERENCES,
          strategy: CACHE_CONFIG.STRATEGIES.HYBRID,
        },
      ],
      [
        "ministryData",
        {
          maxSize: CACHE_CONFIG.SIZES.MINISTRY_DATA,
          strategy: CACHE_CONFIG.STRATEGIES.LRU,
        },
      ],
      [
        "seasonalContent",
        {
          maxSize: CACHE_CONFIG.SIZES.SEASONAL_CONTENT,
          strategy: CACHE_CONFIG.STRATEGIES.TTL,
        },
      ],
      [
        "recommendations",
        {
          maxSize: CACHE_CONFIG.SIZES.RECOMMENDATIONS,
          strategy: CACHE_CONFIG.STRATEGIES.LFU,
        },
      ],
      [
        "activityPatterns",
        {
          maxSize: CACHE_CONFIG.SIZES.ACTIVITY_PATTERNS,
          strategy: CACHE_CONFIG.STRATEGIES.HYBRID,
        },
      ],
      [
        "liturgicalCalendar",
        {
          maxSize: CACHE_CONFIG.SIZES.LITURGICAL_CALENDAR,
          strategy: CACHE_CONFIG.STRATEGIES.TTL,
        },
      ],
      [
        "dashboardConfig",
        {
          maxSize: CACHE_CONFIG.SIZES.DASHBOARD_CONFIG,
          strategy: CACHE_CONFIG.STRATEGIES.LRU,
        },
      ],
      [
        "widgets",
        {
          maxSize: CACHE_CONFIG.SIZES.WIDGETS,
          strategy: CACHE_CONFIG.STRATEGIES.HYBRID,
        },
      ],
    ];

    for (const [type, opts] of entries) {
      this.caches.set(type, new IntelligentCache(opts));
    }
  }

  getCache(type: CacheType): IntelligentCache | undefined {
    return this.caches.get(type);
  }

  private performCleanup(): void {
    let totalCleaned = 0;
    for (const [, cache] of this.caches) {
      totalCleaned += cache.cleanup();
    }
    if (totalCleaned > 0) {
      safeConsole.log(`Cache cleanup: removed ${totalCleaned} expired entries`);
    }
  }

  getAllStats(): Record<CacheType, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    for (const [type, cache] of this.caches) {
      stats[type] = cache.getStats();
    }
    return stats;
  }

  clearAll(): void {
    for (const [, cache] of this.caches) {
      cache.clear();
    }
  }

  invalidateRelated(changedType: CacheType, changedKey: string): void {
    const relatedCaches = CACHE_DEPENDENCIES[changedType] ?? [];
    for (const cacheType of relatedCaches) {
      this.getCache(cacheType)?.invalidateDependencies(changedKey);
    }
  }

  destroy(): void {
    if (this.cleanupInterval !== null) {
      safeClearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clearAll();
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export function useCacheManager() {
  const [cacheStats, setCacheStats] = useState<Record<CacheType, CacheStats>>(
    {} as Record<CacheType, CacheStats>,
  );
  const statsInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const updateStats = () => setCacheStats(cacheManager.getAllStats());
    updateStats();
    statsInterval.current = safeSetInterval(updateStats, 5_000);

    return () => {
      if (statsInterval.current !== null) {
        safeClearInterval(statsInterval.current);
      }
    };
  }, []);

  const cacheGet = useCallback(
    (cacheType: CacheType, key: string): unknown | null => {
      return cacheManager.getCache(cacheType)?.get(key) ?? null;
    },
    [],
  );

  const cacheSet = useCallback(
    (
      cacheType: CacheType,
      key: string,
      data: unknown,
      options?: SetOptions,
    ): void => {
      const cache = cacheManager.getCache(cacheType);
      if (cache) {
        cache.set(key, data, options);
        if (options?.invalidateRelated) {
          cacheManager.invalidateRelated(cacheType, key);
        }
      }
    },
    [],
  );

  const cacheClearByTag = useCallback(
    (cacheType: CacheType, tag: string): void => {
      cacheManager.getCache(cacheType)?.clearByTag(tag);
    },
    [],
  );

  const cacheInvalidate = useCallback(
    (cacheType: CacheType, key: string): void => {
      cacheManager.getCache(cacheType)?.invalidateDependencies(key);
    },
    [],
  );

  return {
    get: cacheGet,
    set: cacheSet,
    clearByTag: cacheClearByTag,
    invalidate: cacheInvalidate,
    cacheStats,
    cacheManager,
  };
}

// ---------------------------------------------------------------------------
// Higher-order cache logic factory
// ---------------------------------------------------------------------------

export function withCacheLogic<TKey = unknown, TData = unknown>(
  cacheConfig: WithCacheLogicConfig = {},
) {
  const {
    cacheType = "general",
    generateKey,
    ttl = CACHE_CONFIG.TIMEOUTS.USER_PREFERENCES,
    tags = [],
    priority = "normal",
  } = cacheConfig;

  return {
    getCachedData: (keyParams: TKey): TData | null => {
      const key = generateKey
        ? generateKey(keyParams)
        : JSON.stringify(keyParams);
      return (
        (cacheManager.getCache(cacheType)?.get(key) as TData | null) ?? null
      );
    },
    setCachedData: (keyParams: TKey, data: TData): void => {
      const key = generateKey
        ? generateKey(keyParams)
        : JSON.stringify(keyParams);
      cacheManager.getCache(cacheType)?.set(key, data, { ttl, tags, priority });
    },
  };
}
