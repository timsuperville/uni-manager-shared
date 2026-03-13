/**
 * Shared Data Cache Layer
 *
 * Centralised in-memory cache with localStorage persistence and cross-tab
 * synchronisation via the `storage` browser event. Designed to be shared
 * across all Uni-Manager applications running on the same origin.
 *
 * Usage (via singleton):
 *   import sharedDataCache from './sharedDataCache.js';
 *   const cache = sharedDataCache.registerApp("church");
 *   cache.set("userProfile", profile, { ttl: 60_000 });
 *
 * Usage (custom instance):
 *   import { SharedDataCache } from './sharedDataCache.js';
 *   const myCache = new SharedDataCache();
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CacheAppConfig {
  appName: string;
  namespace: string;
  syncEnabled: boolean;
  persistEnabled: boolean;
  maxCacheEntries: number;
  defaultTTL: number;
  registeredAt: Date;
  subscriptions?: Map<string, SubscriptionEntry>;
}

interface CacheMetadata {
  key: string;
  createdAt: number;
  lastAccessed: number;
  lastUpdated: number;
  ttl: number;
  accessCount: number;
  tags: string[];
  persist: boolean;
  syncAcrossApps: boolean;
}

interface CacheGetOptions {
  refreshIfStale?: boolean;
  refreshCallback?: ((key: string) => Promise<unknown>) | null;
}

interface CacheSetOptions {
  ttl?: number;
  persist?: boolean;
  syncAcrossApps?: boolean;
  tags?: string[];
}

interface SubscriptionEvent {
  key: string;
  value: unknown;
  operation: "set" | "delete";
  timestamp: number;
  appName: string;
}

interface SubscriptionEntry {
  pattern: string;
  callback: (event: SubscriptionEvent) => void;
  regex: RegExp;
  subscribedAt: number;
}

interface Unsubscribable {
  unsubscribe: () => void;
}

type AppCacheHandle = {
  get: (key: string, options?: CacheGetOptions) => unknown | null;
  set: (key: string, value: unknown, options?: CacheSetOptions) => boolean;
  delete: (key: string) => boolean;
  clear: (pattern?: string) => number;
  mget: (keys: string[]) => Record<string, unknown>;
  mset: (entries: Record<string, unknown>, options?: CacheSetOptions) => Record<string, boolean>;
  subscribe: (pattern: string, callback: (event: SubscriptionEvent) => void) => Unsubscribable | null;
  unsubscribe: (pattern: string) => void;
  invalidate: (pattern: string) => string[];
  stats: () => AppStats;
  unregister: () => void;
};

interface AppStats {
  totalEntries: number;
  totalSize: number;
  expiredEntries: number;
  oldestEntry: (CacheMetadata & { key: string }) | null;
  newestEntry: (CacheMetadata & { key: string }) | null;
}

interface PersistedEntry {
  value: unknown;
  metadata: CacheMetadata & { persistedAt: number };
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class SharedDataCache {
  private readonly cache = new Map<string, unknown>();
  private readonly metadata = new Map<string, CacheMetadata>();
  private readonly subscribers = new Map<string, CacheAppConfig>();
  private readonly pendingOperations = new Map<string, boolean>();
  private readonly syncQueues = new Map<string, unknown[]>();
  private readonly maxCacheSize: number;
  private readonly defaultTTL: number;
  private readonly cleanupInterval: number;
  private cleanupTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly boundStorageHandler: (event: StorageEvent) => void;

  constructor() {
    this.maxCacheSize = 1000;
    this.defaultTTL = 30 * 60 * 1000;
    this.cleanupInterval = 5 * 60 * 1000;
    this.boundStorageHandler = this.handleStorageSync.bind(this);
    this.init();
  }

  private init(): void {
    this.loadPersistedCache();
    this.startCleanupInterval();
    if (typeof window !== "undefined") {
      window.addEventListener("storage", this.boundStorageHandler);
    }
  }

  /** Registers an application and returns a namespaced cache handle. */
  registerApp(appName: string, config: Partial<CacheAppConfig> = {}): AppCacheHandle {
    const appConfig: CacheAppConfig = {
      appName,
      namespace: config.namespace ?? appName,
      syncEnabled: config.syncEnabled !== false,
      persistEnabled: config.persistEnabled !== false,
      maxCacheEntries: config.maxCacheEntries ?? 100,
      defaultTTL: config.defaultTTL ?? this.defaultTTL,
      registeredAt: new Date(),
    };

    this.subscribers.set(appName, appConfig);
    this.syncQueues.set(appName, []);

    return {
      get: (key, options) => this.get(this.getNamespacedKey(appName, key), options),
      set: (key, value, options) => this.set(this.getNamespacedKey(appName, key), value, options),
      delete: (key) => this.delete(this.getNamespacedKey(appName, key)),
      clear: (pattern = "*") => this.clearNamespace(appName, pattern),
      mget: (keys) => this.mget(keys.map((k) => this.getNamespacedKey(appName, k))),
      mset: (entries, options) =>
        this.mset(
          Object.fromEntries(Object.entries(entries).map(([k, v]) => [this.getNamespacedKey(appName, k), v])),
          options,
        ),
      subscribe: (pattern, callback) => this.subscribe(appName, pattern, callback),
      unsubscribe: (pattern) => this.unsubscribe(appName, pattern),
      invalidate: (pattern) => this.invalidatePattern(appName, pattern),
      stats: () => this.getAppStats(appName),
      unregister: () => this.unregisterApp(appName),
    };
  }

  unregisterApp(appName: string): void {
    this.subscribers.delete(appName);
    this.syncQueues.delete(appName);
  }

  // ---------------------------------------------------------------------------
  // Core cache operations
  // ---------------------------------------------------------------------------

  get(key: string, options: CacheGetOptions = {}): unknown | null {
    const { refreshIfStale = true, refreshCallback = null } = options;
    const entry = this.cache.get(key);
    const meta = this.metadata.get(key);

    if (entry === undefined || !meta) return null;

    if (this.isExpired(meta)) {
      if (refreshIfStale && refreshCallback) {
        void this.refreshEntry(key, refreshCallback);
      } else {
        this.delete(key);
        return null;
      }
    }

    meta.lastAccessed = Date.now();
    meta.accessCount++;
    return entry;
  }

  set(key: string, value: unknown, options: CacheSetOptions = {}): boolean {
    const { ttl = this.defaultTTL, persist = true, syncAcrossApps = true, tags = [] } = options;

    if (this.cache.size >= this.maxCacheSize) this.evictLRU();

    this.cache.set(key, value);

    const meta: CacheMetadata = {
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
    this.metadata.set(key, meta);

    if (persist) this.persistEntry(key, value, meta);
    if (syncAcrossApps) this.notifySubscribers(key, value, "set");

    return true;
  }

  delete(key: string): boolean {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    this.metadata.delete(key);
    this.removePersistedEntry(key);
    this.notifySubscribers(key, null, "delete");
    return existed;
  }

  // ---------------------------------------------------------------------------
  // Batch operations
  // ---------------------------------------------------------------------------

  mget(keys: string[]): Record<string, unknown> {
    const results: Record<string, unknown> = {};
    for (const key of keys) {
      const value = this.get(key);
      if (value !== null) results[key] = value;
    }
    return results;
  }

  mset(entries: Record<string, unknown>, options: CacheSetOptions = {}): Record<string, boolean> {
    const results: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(entries)) {
      results[key] = this.set(key, value, options);
    }
    return results;
  }

  // ---------------------------------------------------------------------------
  // Pattern-based operations
  // ---------------------------------------------------------------------------

  clearNamespace(appName: string, pattern = "*"): number {
    const namespace = this.getNamespace(appName);
    const regex = this.patternToRegex(namespace + pattern);
    const toDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (regex.test(key)) toDelete.push(key);
    }
    toDelete.forEach((k) => this.delete(k));
    return toDelete.length;
  }

  invalidatePattern(appName: string, pattern: string): string[] {
    const namespace = this.getNamespace(appName);
    const regex = this.patternToRegex(namespace + pattern);
    const invalidated: string[] = [];
    for (const [key, meta] of this.metadata) {
      if (regex.test(key)) {
        meta.ttl = 0;
        invalidated.push(key);
      }
    }
    return invalidated;
  }

  // ---------------------------------------------------------------------------
  // Subscription system
  // ---------------------------------------------------------------------------

  subscribe(appName: string, pattern: string, callback: (event: SubscriptionEvent) => void): Unsubscribable | null {
    if (!this.subscribers.has(appName)) return null;

    const appConfig = this.subscribers.get(appName)!;
    if (!appConfig.subscriptions) appConfig.subscriptions = new Map();

    appConfig.subscriptions.set(pattern, {
      pattern,
      callback,
      regex: this.patternToRegex(pattern),
      subscribedAt: Date.now(),
    });

    return { unsubscribe: () => this.unsubscribe(appName, pattern) };
  }

  unsubscribe(appName: string, pattern: string): void {
    this.subscribers.get(appName)?.subscriptions?.delete(pattern);
  }

  private notifySubscribers(key: string, value: unknown, operation: "set" | "delete"): void {
    for (const [appName, appConfig] of this.subscribers) {
      if (!appConfig.subscriptions) continue;
      for (const [, subscription] of appConfig.subscriptions) {
        if (subscription.regex.test(key)) {
          try {
            subscription.callback({ key, value, operation, timestamp: Date.now(), appName });
          } catch (_err) {
            // Intentionally silent — one bad subscriber must not break others
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Cache management
  // ---------------------------------------------------------------------------

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, meta] of this.metadata) {
      if (meta.lastAccessed < oldestTime) {
        oldestTime = meta.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) this.delete(oldestKey);
  }

  private startCleanupInterval(): void {
    if (this.cleanupTimer !== null) clearTimeout(this.cleanupTimer);
    this.cleanupTimer = setTimeout(() => {
      this.cleanup();
      this.startCleanupInterval();
    }, this.cleanupInterval);
  }

  cleanup(): void {
    const expired: string[] = [];
    for (const [key, meta] of this.metadata) {
      if (this.isExpired(meta)) expired.push(key);
    }
    expired.forEach((k) => this.delete(k));
  }

  private isExpired(meta: CacheMetadata): boolean {
    return meta.ttl > 0 && Date.now() - meta.createdAt > meta.ttl;
  }

  private async refreshEntry(key: string, refreshCallback: (key: string) => Promise<unknown>): Promise<void> {
    if (this.pendingOperations.has(key)) return;
    this.pendingOperations.set(key, true);
    try {
      const newValue = await refreshCallback(key);
      if (newValue !== undefined) {
        const meta = this.metadata.get(key);
        this.set(key, newValue, { ttl: meta?.ttl });
      }
    } catch (_err) {
      // Intentionally silent — stale data remains until next cleanup tick
    } finally {
      this.pendingOperations.delete(key);
    }
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  private persistEntry(key: string, value: unknown, meta: CacheMetadata): void {
    try {
      if (typeof localStorage === "undefined") return;
      const data: PersistedEntry = { value, metadata: { ...meta, persistedAt: Date.now() } };
      localStorage.setItem(`uni_cache_${key}`, JSON.stringify(data));
    } catch (_err) {
      // Intentionally silent — persistence is best-effort
    }
  }

  private removePersistedEntry(key: string): void {
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(`uni_cache_${key}`);
    } catch (_err) {
      // Intentionally silent
    }
  }

  private loadPersistedCache(): void {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("uni_cache_"));
      for (const persistKey of keys) {
        try {
          const raw = localStorage.getItem(persistKey);
          if (!raw) continue;

          const data = JSON.parse(raw) as PersistedEntry;
          const key = persistKey.replace("uni_cache_", "");

          if (!this.isExpired(data.metadata)) {
            this.cache.set(key, data.value);
            this.metadata.set(key, data.metadata);
          } else {
            localStorage.removeItem(persistKey);
          }
        } catch (_err) {
          localStorage.removeItem(persistKey);
        }
      }
    } catch (_err) {
      // localStorage may be entirely unavailable (SSR, private browsing)
    }
  }

  private handleStorageSync(event: StorageEvent): void {
    if (!event.key?.startsWith("uni_cache_")) return;

    const key = event.key.replace("uni_cache_", "");
    if (event.newValue === null) {
      this.cache.delete(key);
      this.metadata.delete(key);
    } else {
      try {
        const data = JSON.parse(event.newValue) as PersistedEntry;
        this.cache.set(key, data.value);
        this.metadata.set(key, data.metadata);
      } catch (_err) {
        // Intentionally silent — corrupted entry; skip
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  private getNamespacedKey(appName: string, key: string): string {
    return `${this.getNamespace(appName)}${key}`;
  }

  private getNamespace(appName: string): string {
    const config = this.subscribers.get(appName);
    return config ? `${config.namespace}:` : `${appName}:`;
  }

  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = escaped.replace(/\\\*/g, ".*").replace(/\\\?/g, ".");
    return new RegExp(`^${regex}$`);
  }

  getAppStats(appName: string): AppStats {
    const namespace = this.getNamespace(appName);
    const entries: (CacheMetadata & { key: string })[] = [];

    for (const [key, meta] of this.metadata) {
      if (key.startsWith(namespace)) {
        entries.push({ ...meta, key: key.replace(namespace, "") });
      }
    }

    return {
      totalEntries: entries.length,
      totalSize: entries.reduce((size, e) => {
        const value = this.cache.get(namespace + e.key);
        return size + (value ? JSON.stringify(value).length : 0);
      }, 0),
      expiredEntries: entries.filter((e) => this.isExpired(e)).length,
      oldestEntry: entries.reduce<(CacheMetadata & { key: string }) | null>(
        (oldest, e) => (!oldest || e.createdAt < oldest.createdAt ? e : oldest),
        null,
      ),
      newestEntry: entries.reduce<(CacheMetadata & { key: string }) | null>(
        (newest, e) => (!newest || e.createdAt > newest.createdAt ? e : newest),
        null,
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
    };
  }

  private calculateMemoryUsage(): number {
    let size = 0;
    for (const [key, value] of this.cache) {
      size += key.length + JSON.stringify(value).length;
    }
    return size;
  }

  private calculateHitRate(): number {
    let totalAccesses = 0;
    for (const meta of this.metadata.values()) totalAccesses += meta.accessCount;
    return totalAccesses > 0 ? (this.cache.size / totalAccesses) * 100 : 0;
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  destroy(): void {
    if (this.cleanupTimer !== null) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", this.boundStorageHandler);
    }
    this.cache.clear();
    this.metadata.clear();
    this.subscribers.clear();
    this.pendingOperations.clear();
    this.syncQueues.clear();
  }
}

// ---------------------------------------------------------------------------
// Singleton — one shared cache instance across all apps on the same origin
// ---------------------------------------------------------------------------
const sharedDataCache = new SharedDataCache();
export default sharedDataCache;
