// Shared Data Cache Layer for Uni-Manager Applications
// Provides centralized caching and state synchronization across all apps
/* global console, localStorage, setTimeout, clearTimeout, clearInterval, window */
class SharedDataCache {
  constructor() {
    this.cache = new Map();
    this.metadata = new Map();
    this.subscribers = new Map();
    this.pendingOperations = new Map();
    this.syncQueues = new Map();
    this.maxCacheSize = 1000;
    this.defaultTTL = 30 * 60 * 1000; // 30 minutes
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
    this.boundStorageHandler = null; // Store bound function for cleanup
    this.cleanupIntervalId = null; // Store interval ID for cleanup
    this.init();
  }
  init() {
    // Load persisted cache from localStorage
    this.loadPersistedCache();
    // Start cleanup interval
    this.startCleanupInterval();
    // Listen for storage events to sync across tabs
    if (typeof window !== "undefined") {
      this.boundStorageHandler = this.handleStorageSync.bind(this);
      window.addEventListener("storage", this.boundStorageHandler);
    }
  }
  // Register an application with the cache system
  registerApp(appName, config = {}) {
    const appConfig = {
      appName,
      namespace: config.namespace || appName,
      syncEnabled: config.syncEnabled !== false,
      persistEnabled: config.persistEnabled !== false,
      maxCacheEntries: config.maxCacheEntries || 100,
      defaultTTL: config.defaultTTL || this.defaultTTL,
      registeredAt: new Date(),
    };
    this.subscribers.set(appName, appConfig);
    this.syncQueues.set(appName, []);
    return {
      // Cache operations
      get: (key, options) =>
        this.get(this.getNamespacedKey(appName, key), options),
      set: (key, value, options) =>
        this.set(this.getNamespacedKey(appName, key), value, options),
      delete: (key) => this.delete(this.getNamespacedKey(appName, key)),
      clear: (pattern) => this.clearNamespace(appName, pattern),
      // Batch operations
      mget: (keys) =>
        this.mget(keys.map((k) => this.getNamespacedKey(appName, k))),
      mset: (entries, options) =>
        this.mset(
          Object.fromEntries(
            Object.entries(entries).map(([k, v]) => [
              this.getNamespacedKey(appName, k),
              v,
            ])
          ),
          options
        ),
      // Subscription and sync
      subscribe: (pattern, callback) =>
        this.subscribe(appName, pattern, callback),
      unsubscribe: (pattern) => this.unsubscribe(appName, pattern),
      // Cache management
      invalidate: (pattern) => this.invalidatePattern(appName, pattern),
      stats: () => this.getAppStats(appName),
      // Utility
      unregister: () => this.unregisterApp(appName),
    };
  }
  unregisterApp(appName) {
    this.subscribers.delete(appName);
    this.syncQueues.delete(appName);
  }
  // Core cache operations
  get(key, options = {}) {
    const { refreshIfStale = true, refreshCallback = null } = options;
    const entry = this.cache.get(key);
    const meta = this.metadata.get(key);
    if (!entry || !meta) {
      return null;
    }
    // Check if expired
    if (this.isExpired(meta)) {
      if (refreshIfStale && refreshCallback) {
        // Async refresh
        this.refreshEntry(key, refreshCallback);
      } else {
        // Remove expired entry
        this.delete(key);
        return null;
      }
    }
    // Update access time
    meta.lastAccessed = Date.now();
    meta.accessCount++;
    // Cache hit recorded
    return entry;
  }
  set(key, value, options = {}) {
    const {
      ttl = this.defaultTTL,
      persist = true,
      syncAcrossApps = true,
      tags = [],
    } = options;
    // Check cache size limits
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }
    // Store the value
    this.cache.set(key, value);
    // Store metadata
    const metadata = {
      key,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      lastUpdated: Date.now(),
      ttl,
      accessCount: 1,
      tags,
      persist,
      syncAcrossApps,
    };
    this.metadata.set(key, metadata);
    // Persist to localStorage if enabled
    if (persist) {
      this.persistEntry(key, value, metadata);
    }
    // Notify subscribers
    if (syncAcrossApps) {
      this.notifySubscribers(key, value, "set");
    }
    return true;
  }
  delete(key) {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    this.metadata.delete(key);
    // Remove from localStorage
    this.removePersistedEntry(key);
    // Notify subscribers
    this.notifySubscribers(key, null, "delete");
    return existed;
  }
  // Batch operations
  mget(keys) {
    const results = {};
    for (const key of keys) {
      const value = this.get(key);
      if (value !== null) {
        results[key] = value;
      }
    }
    return results;
  }
  mset(entries, options = {}) {
    const results = {};
    for (const [key, value] of Object.entries(entries)) {
      results[key] = this.set(key, value, options);
    }
    return results;
  }
  // Pattern-based operations
  clearNamespace(appName, pattern = "*") {
    const namespace = this.getNamespace(appName);
    const regex = this.patternToRegex(namespace + pattern);
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.delete(key));
    return keysToDelete.length;
  }
  invalidatePattern(appName, pattern) {
    const namespace = this.getNamespace(appName);
    const regex = this.patternToRegex(namespace + pattern);
    const invalidatedKeys = [];
    for (const [key, meta] of this.metadata) {
      if (regex.test(key)) {
        meta.ttl = 0; // Mark as expired
        invalidatedKeys.push(key);
      }
    }
    return invalidatedKeys;
  }
  // Subscription system
  subscribe(appName, pattern, callback) {
    if (!this.subscribers.has(appName)) {
      console.warn(`App ${appName} not registered with cache`);
      return null;
    }
    const appConfig = this.subscribers.get(appName);
    if (!appConfig.subscriptions) {
      appConfig.subscriptions = new Map();
    }
    appConfig.subscriptions.set(pattern, {
      pattern,
      callback,
      regex: this.patternToRegex(pattern),
      subscribedAt: Date.now(),
    });
    return {
      unsubscribe: () => this.unsubscribe(appName, pattern),
    };
  }
  unsubscribe(appName, pattern) {
    const appConfig = this.subscribers.get(appName);
    if (appConfig && appConfig.subscriptions) {
      appConfig.subscriptions.delete(pattern);
    }
  }
  notifySubscribers(key, value, operation) {
    for (const [appName, appConfig] of this.subscribers) {
      if (appConfig.subscriptions) {
        for (const [, subscription] of appConfig.subscriptions) {
          if (subscription.regex.test(key)) {
            try {
              subscription.callback({
                key,
                value,
                operation,
                timestamp: Date.now(),
                appName,
              });
            } catch (error) {
              console.error(
                `Error in subscription callback for ${appName}:`,
                error
              );
            }
          }
        }
      }
    }
  }
  // Cache management
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    for (const [key, meta] of this.metadata) {
      if (meta.lastAccessed < oldestTime) {
        oldestTime = meta.lastAccessed;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }
  startCleanupInterval() {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
    }
    this.cleanupTimer = setTimeout(() => {
      this.cleanup();
      this.startCleanupInterval();
    }, this.cleanupInterval);
  }
  cleanup() {
    const expiredKeys = [];
    for (const [key, meta] of this.metadata) {
      if (this.isExpired(meta)) {
        expiredKeys.push(key);
      }
    }
    expiredKeys.forEach((key) => this.delete(key));
    // Cleaned expired entries
  }
  isExpired(meta) {
    return meta.ttl > 0 && Date.now() - meta.createdAt > meta.ttl;
  }
  async refreshEntry(key, refreshCallback) {
    if (this.pendingOperations.has(key)) {
      return; // Already refreshing
    }
    this.pendingOperations.set(key, true);
    try {
      const newValue = await refreshCallback(key);
      if (newValue !== undefined) {
        const meta = this.metadata.get(key);
        this.set(key, newValue, { ttl: meta?.ttl });
      }
    } catch (error) {
      console.error(`Error refreshing cache entry ${key}:`, error);
    } finally {
      this.pendingOperations.delete(key);
    }
  }
  // Persistence
  persistEntry(key, value, metadata) {
    try {
      const persistKey = `uni_cache_${key}`;
      const persistData = {
        value,
        metadata: {
          ...metadata,
          persistedAt: Date.now(),
        },
      };
      localStorage.setItem(persistKey, JSON.stringify(persistData));
    } catch (error) {
      console.error("Error persisting cache entry:", error);
    }
  }
  removePersistedEntry(key) {
    try {
      const persistKey = `uni_cache_${key}`;
      localStorage.removeItem(persistKey);
    } catch (error) {
      console.error("Error removing persisted cache entry:", error);
    }
  }
  loadPersistedCache() {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("uni_cache_")
      );
      for (const persistKey of keys) {
        try {
          const persistData = JSON.parse(localStorage.getItem(persistKey));
          const key = persistKey.replace("uni_cache_", "");
          // Check if still valid
          if (!this.isExpired(persistData.metadata)) {
            this.cache.set(key, persistData.value);
            this.metadata.set(key, {
              ...persistData.metadata,
              loadedFromPersistence: true,
            });
          } else {
            // Remove expired persisted entry
            localStorage.removeItem(persistKey);
          }
        } catch (error) {
          console.error(
            `Error loading persisted cache entry ${persistKey}:`,
            error
          );
          localStorage.removeItem(persistKey);
        }
      }
    } catch (error) {
      console.error("Error loading persisted cache:", error);
    }
  }
  handleStorageSync(event) {
    if (event.key && event.key.startsWith("uni_cache_")) {
      const key = event.key.replace("uni_cache_", "");
      if (event.newValue === null) {
        // Entry was deleted in another tab
        this.cache.delete(key);
        this.metadata.delete(key);
      } else {
        try {
          const persistData = JSON.parse(event.newValue);
          this.cache.set(key, persistData.value);
          this.metadata.set(key, persistData.metadata);
        } catch (error) {
          console.error("Error syncing cache from storage:", error);
        }
      }
    }
  }
  // Utility methods
  getNamespacedKey(appName, key) {
    return `${this.getNamespace(appName)}${key}`;
  }
  getNamespace(appName) {
    const config = this.subscribers.get(appName);
    return config ? `${config.namespace}:` : `${appName}:`;
  }
  patternToRegex(pattern) {
    // Convert glob-like pattern to regex
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = escaped.replace(/\\\*/g, ".*").replace(/\\\?/g, ".");
    return new RegExp(`^${regex}$`);
  }
  // Statistics and diagnostics
  getAppStats(appName) {
    const namespace = this.getNamespace(appName);
    const entries = [];
    for (const [key, meta] of this.metadata) {
      if (key.startsWith(namespace)) {
        entries.push({
          key: key.replace(namespace, ""),
          ...meta,
        });
      }
    }
    return {
      totalEntries: entries.length,
      totalSize: entries.reduce((size, entry) => {
        const value = this.cache.get(namespace + entry.key);
        return size + (value ? JSON.stringify(value).length : 0);
      }, 0),
      expiredEntries: entries.filter((e) => this.isExpired(e)).length,
      oldestEntry: entries.reduce(
        (oldest, entry) =>
          !oldest || entry.createdAt < oldest.createdAt ? entry : oldest,
        null
      ),
      newestEntry: entries.reduce(
        (newest, entry) =>
          !newest || entry.createdAt > newest.createdAt ? entry : newest,
        null
      ),
    };
  }
  getGlobalStats() {
    return {
      totalEntries: this.cache.size,
      totalMemoryUsage: this.calculateMemoryUsage(),
      registeredApps: this.subscribers.size,
      pendingOperations: this.pendingOperations.size,
      cacheHitRate: this.calculateHitRate(),
      uptime: Date.now() - (this.startTime || Date.now()),
    };
  }
  calculateMemoryUsage() {
    let size = 0;
    for (const [key, value] of this.cache) {
      size += key.length + JSON.stringify(value).length;
    }
    return size;
  }
  calculateHitRate() {
    // This would require tracking hits and misses
    // For now, return estimated based on access counts
    let totalAccesses = 0;
    for (const meta of this.metadata.values()) {
      totalAccesses += meta.accessCount;
    }
    return totalAccesses > 0 ? (this.cache.size / totalAccesses) * 100 : 0;
  }

  // Cleanup method to prevent memory leaks
  destroy() {
    // Clear cleanup interval if it exists
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }

    // Remove storage event listener
    if (typeof window !== "undefined" && this.boundStorageHandler) {
      window.removeEventListener("storage", this.boundStorageHandler);
      this.boundStorageHandler = null;
    }

    // Clear all timeouts in pending operations
    for (const timeout of this.pendingOperations.values()) {
      clearTimeout(timeout);
    }

    // Clear all data structures
    this.cache.clear();
    this.metadata.clear();
    this.subscribers.clear();
    this.pendingOperations.clear();
    this.syncQueues.clear();
  }
}
// Create singleton instance
const sharedDataCache = new SharedDataCache();
export default sharedDataCache;
