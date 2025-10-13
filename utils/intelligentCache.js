/**
 * Intelligent Caching System
 * Advanced caching strategies for user preferences, ministry data, seasonal content, and recommendations
 */

// Browser API polyfills for cross-environment compatibility
/* eslint-disable no-undef */
const safeConsole =
  typeof console !== 'undefined'
    ? console
    : {
        log: () => {},
        warn: () => {},
        error: () => {},
      };

const safePerformance = (() => {
  if (typeof performance !== 'undefined') return performance;
  // Fallback for environments without performance API
  return {
    now: () => Date.now(),
  };
})();

const safeSetInterval =
  typeof setInterval !== 'undefined' ? setInterval : () => {};
const safeClearInterval =
  typeof clearInterval !== 'undefined' ? clearInterval : () => {};
/* eslint-enable no-undef */

import { useState, useEffect, useCallback, useRef } from 'react';

// Cache configuration constants
export const CACHE_CONFIG = {
  // Cache timeouts (in milliseconds)
  TIMEOUTS: {
    USER_PREFERENCES: 5 * 60 * 1000, // 5 minutes
    MINISTRY_DATA: 15 * 60 * 1000, // 15 minutes
    SEASONAL_CONTENT: 60 * 60 * 1000, // 1 hour
    RECOMMENDATIONS: 10 * 60 * 1000, // 10 minutes
    ACTIVITY_PATTERNS: 30 * 60 * 1000, // 30 minutes
    LITURGICAL_CALENDAR: 24 * 60 * 60 * 1000, // 24 hours
    DASHBOARD_CONFIG: 5 * 60 * 1000, // 5 minutes
    WIDGETS: 10 * 60 * 1000, // 10 minutes
  },

  // Cache sizes (maximum number of entries)
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

  // Cache strategies
  STRATEGIES: {
    LRU: 'lru', // Least Recently Used
    LFU: 'lfu', // Least Frequently Used
    TTL: 'ttl', // Time To Live
    HYBRID: 'hybrid', // Combination of strategies
  },
};

// Cache entry structure
class CacheEntry {
  constructor(data, options = {}) {
    this.data = data;
    this.timestamp = Date.now();
    this.accessCount = 1;
    this.lastAccessed = Date.now();
    this.ttl = options.ttl || CACHE_CONFIG.TIMEOUTS.USER_PREFERENCES;
    this.priority = options.priority || 'normal'; // low, normal, high, critical
    this.tags = options.tags || [];
    this.dependencies = options.dependencies || [];
  }

  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }

  touch() {
    this.lastAccessed = Date.now();
    this.accessCount++;
  }

  getAge() {
    return Date.now() - this.timestamp;
  }

  getTimeSinceAccess() {
    return Date.now() - this.lastAccessed;
  }
}

/**
 * Advanced cache implementation with multiple eviction strategies
 */
class IntelligentCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.strategy = options.strategy || CACHE_CONFIG.STRATEGIES.HYBRID;
    this.storage = new Map();
    this.accessOrder = [];
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
    this.listeners = new Set();

    // Performance monitoring
    this.performanceMetrics = {
      averageAccessTime: 0,
      totalAccessTime: 0,
      accessCount: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Get data from cache with intelligent access tracking
   */
  get(key) {
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

  /**
   * Set data in cache with intelligent eviction
   */
  set(key, data, options = {}) {
    const entry = new CacheEntry(data, options);

    // Check if we need to evict entries
    if (this.storage.size >= this.maxSize && !this.storage.has(key)) {
      this.evict();
    }

    this.storage.set(key, entry);
    this.updateAccessOrder(key);
    this.notifyListeners('set', key, data);
    this.updateMemoryUsage();
  }

  /**
   * Intelligent eviction based on strategy
   */
  evict() {
    let keyToEvict;

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
      this.notifyListeners('evict', keyToEvict);
    }
  }

  /**
   * Least Recently Used eviction
   */
  evictLRU() {
    if (this.accessOrder.length === 0) return null;
    return this.accessOrder[0];
  }

  /**
   * Least Frequently Used eviction
   */
  evictLFU() {
    let minAccessCount = Infinity;
    let keyToEvict = null;

    for (const [key, entry] of this.storage) {
      if (entry.accessCount < minAccessCount) {
        minAccessCount = entry.accessCount;
        keyToEvict = key;
      }
    }

    return keyToEvict;
  }

  /**
   * Evict expired entries first
   */
  evictExpired() {
    for (const [key, entry] of this.storage) {
      if (entry.isExpired()) {
        return key;
      }
    }

    // If no expired entries, fall back to LRU
    return this.evictLRU();
  }

  /**
   * Hybrid eviction strategy combining multiple factors
   */
  evictHybrid() {
    // First, try to evict expired entries
    const expiredKey = this.evictExpired();
    if (expiredKey && this.storage.get(expiredKey)?.isExpired()) {
      return expiredKey;
    }

    // Score-based eviction considering multiple factors
    let bestScore = -1;
    let keyToEvict = null;

    for (const [key, entry] of this.storage) {
      // Skip critical priority entries unless absolutely necessary
      if (
        entry.priority === 'critical' &&
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

    return keyToEvict || this.evictLRU();
  }

  /**
   * Calculate eviction score based on multiple factors
   */
  calculateEvictionScore(entry) {
    const ageWeight = 0.3;
    const accessFrequencyWeight = 0.4;
    const timeSinceAccessWeight = 0.2;

    // Higher score = more likely to be evicted
    const ageScore = entry.getAge() / entry.ttl;
    const accessFrequencyScore = 1 / (entry.accessCount + 1);
    const timeSinceAccessScore = entry.getTimeSinceAccess() / entry.ttl;

    const priorityMultipliers = {
      critical: 0.1,
      high: 0.3,
      normal: 1.0,
      low: 1.5,
    };
    const priorityScore = priorityMultipliers[entry.priority] || 1.0;

    return (
      (ageScore * ageWeight +
        accessFrequencyScore * accessFrequencyWeight +
        timeSinceAccessScore * timeSinceAccessWeight) *
      priorityScore
    );
  }

  /**
   * Update access order for LRU tracking
   */
  updateAccessOrder(key) {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   */
  removeFromAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Clear cache entries by tag
   */
  clearByTag(tag) {
    const keysToDelete = [];

    for (const [key, entry] of this.storage) {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.storage.delete(key);
      this.removeFromAccessOrder(key);
      this.notifyListeners('clear', key);
    });
  }

  /**
   * Invalidate cache entries based on dependencies
   */
  invalidateDependencies(changedKey) {
    const keysToInvalidate = [];

    for (const [key, entry] of this.storage) {
      if (entry.dependencies.includes(changedKey)) {
        keysToInvalidate.push(key);
      }
    }

    keysToInvalidate.forEach((key) => {
      this.storage.delete(key);
      this.removeFromAccessOrder(key);
      this.notifyListeners('invalidate', key);
    });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate =
      this.hitCount + this.missCount > 0
        ? this.hitCount / (this.hitCount + this.missCount)
        : 0;

    return {
      size: this.storage.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: hitRate,
      evictionCount: this.evictionCount,
      memoryUsage: this.performanceMetrics.memoryUsage,
      averageAccessTime: this.performanceMetrics.averageAccessTime,
    };
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(accessTime) {
    this.performanceMetrics.totalAccessTime += accessTime;
    this.performanceMetrics.accessCount++;
    this.performanceMetrics.averageAccessTime =
      this.performanceMetrics.totalAccessTime /
      this.performanceMetrics.accessCount;
  }

  /**
   * Update memory usage estimation
   */
  updateMemoryUsage() {
    // Rough estimation of memory usage
    let totalSize = 0;
    for (const [key, entry] of this.storage) {
      totalSize += JSON.stringify(entry.data).length + key.length;
    }
    this.performanceMetrics.memoryUsage = totalSize;
  }

  /**
   * Add cache event listener
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove cache event listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify listeners of cache events
   */
  notifyListeners(event, key, data) {
    this.listeners.forEach((callback) => {
      try {
        callback({ event, key, data, timestamp: Date.now() });
      } catch (_error) {
        safeConsole.error('Cache listener error:', error);
      }
    });
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const keysToDelete = [];

    for (const [key, entry] of this.storage) {
      if (entry.isExpired()) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.storage.delete(key);
      this.removeFromAccessOrder(key);
      this.notifyListeners('expire', key);
    });

    return keysToDelete.length;
  }

  /**
   * Clear all cache entries
   */
  clear() {
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
    this.notifyListeners('clearAll');
  }
}

/**
 * Global cache manager for different cache types
 */
class CacheManager {
  constructor() {
    this.caches = new Map();
    this.initializeCaches();

    // Cleanup interval
    this.cleanupInterval = safeSetInterval(() => {
      this.performCleanup();
    }, 60000); // Cleanup every minute
  }

  /**
   * Initialize specialized caches
   */
  initializeCaches() {
    this.caches.set(
      'userPreferences',
      new IntelligentCache({
        maxSize: CACHE_CONFIG.SIZES.USER_PREFERENCES,
        strategy: CACHE_CONFIG.STRATEGIES.HYBRID,
      }),
    );

    this.caches.set(
      'ministryData',
      new IntelligentCache({
        maxSize: CACHE_CONFIG.SIZES.MINISTRY_DATA,
        strategy: CACHE_CONFIG.STRATEGIES.LRU,
      }),
    );

    this.caches.set(
      'seasonalContent',
      new IntelligentCache({
        maxSize: CACHE_CONFIG.SIZES.SEASONAL_CONTENT,
        strategy: CACHE_CONFIG.STRATEGIES.TTL,
      }),
    );

    this.caches.set(
      'recommendations',
      new IntelligentCache({
        maxSize: CACHE_CONFIG.SIZES.RECOMMENDATIONS,
        strategy: CACHE_CONFIG.STRATEGIES.LFU,
      }),
    );

    this.caches.set(
      'activityPatterns',
      new IntelligentCache({
        maxSize: CACHE_CONFIG.SIZES.ACTIVITY_PATTERNS,
        strategy: CACHE_CONFIG.STRATEGIES.HYBRID,
      }),
    );

    this.caches.set(
      'liturgicalCalendar',
      new IntelligentCache({
        maxSize: CACHE_CONFIG.SIZES.LITURGICAL_CALENDAR,
        strategy: CACHE_CONFIG.STRATEGIES.TTL,
      }),
    );

    this.caches.set(
      'dashboardConfig',
      new IntelligentCache({
        maxSize: CACHE_CONFIG.SIZES.DASHBOARD_CONFIG,
        strategy: CACHE_CONFIG.STRATEGIES.LRU,
      }),
    );

    this.caches.set(
      'widgets',
      new IntelligentCache({
        maxSize: CACHE_CONFIG.SIZES.WIDGETS,
        strategy: CACHE_CONFIG.STRATEGIES.HYBRID,
      }),
    );
  }

  /**
   * Get cache by type
   */
  getCache(type) {
    return this.caches.get(type);
  }

  /**
   * Perform cleanup on all caches
   */
  performCleanup() {
    let totalCleaned = 0;

    for (const [, cache] of this.caches) {
      const cleaned = cache.cleanup();
      totalCleaned += cleaned;
    }

    if (totalCleaned > 0) {
      safeConsole.log(`Cache cleanup: removed ${totalCleaned} expired entries`);
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getAllStats() {
    const stats = {};

    for (const [type, cache] of this.caches) {
      stats[type] = cache.getStats();
    }

    return stats;
  }

  /**
   * Clear all caches
   */
  clearAll() {
    for (const [, cache] of this.caches) {
      cache.clear();
    }
  }

  /**
   * Invalidate related caches
   */
  invalidateRelated(changedType, changedKey) {
    // Define cache dependencies
    const dependencies = {
      userPreferences: ['dashboardConfig', 'widgets', 'recommendations'],
      ministryData: ['recommendations', 'widgets', 'dashboardConfig'],
      seasonalContent: ['recommendations', 'widgets'],
      activityPatterns: ['recommendations'],
    };

    const relatedCaches = dependencies[changedType] || [];

    relatedCaches.forEach((cacheType) => {
      const cache = this.getCache(cacheType);
      if (cache) {
        cache.invalidateDependencies(changedKey);
      }
    });
  }

  /**
   * Destroy cache manager
   */
  destroy() {
    if (this.cleanupInterval) {
      safeClearInterval(this.cleanupInterval);
    }
    this.clearAll();
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

/**
 * React hook for intelligent caching
 */
export function useIntelligentCache() {
  const [cacheStats, setCacheStats] = useState({});
  const statsInterval = useRef(null);

  // Update cache statistics periodically
  useEffect(() => {
    const updateStats = () => {
      setCacheStats(cacheManager.getAllStats());
    };

    updateStats();
    statsInterval.current = safeSetInterval(updateStats, 5000);

    return () => {
      if (statsInterval.current) {
        safeClearInterval(statsInterval.current);
      }
    };
  }, []);

  // Cache operations
  const cacheOperations = {
    get: useCallback((cacheType, key) => {
      const cache = cacheManager.getCache(cacheType);
      return cache ? cache.get(key) : null;
    }, []),

    set: useCallback((cacheType, key, data, options) => {
      const cache = cacheManager.getCache(cacheType);
      if (cache) {
        cache.set(key, data, options);
        // Invalidate related caches if specified
        if (options?.invalidateRelated) {
          cacheManager.invalidateRelated(cacheType, key);
        }
      }
    }, []),

    clearByTag: useCallback((cacheType, tag) => {
      const cache = cacheManager.getCache(cacheType);
      if (cache) {
        cache.clearByTag(tag);
      }
    }, []),

    invalidate: useCallback((cacheType, key) => {
      const cache = cacheManager.getCache(cacheType);
      if (cache) {
        cache.invalidateDependencies(key);
      }
    }, []),
  };

  return {
    ...cacheOperations,
    cacheStats,
    cacheManager,
  };
}

/**
 * Higher-order function for caching API responses
 */
export function withCacheLogic(cacheConfig = {}) {
  const {
    cacheType = 'general',
    generateKey,
    ttl = CACHE_CONFIG.TIMEOUTS.USER_PREFERENCES,
    tags = [],
    priority = 'normal',
  } = cacheConfig;

  return {
    getCachedData: (keyParams) => {
      const key = generateKey
        ? generateKey(keyParams)
        : JSON.stringify(keyParams);
      const cache = cacheManager.getCache(cacheType);
      return cache ? cache.get(key) : null;
    },

    setCachedData: (keyParams, data) => {
      const key = generateKey
        ? generateKey(keyParams)
        : JSON.stringify(keyParams);
      const cache = cacheManager.getCache(cacheType);
      if (cache) {
        cache.set(key, data, { ttl, tags, priority });
      }
    },
  };
}

export { IntelligentCache, CacheManager };
