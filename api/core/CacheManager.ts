/**
 * Cache Manager
 * 
 * Intelligent caching system for API responses with TTL support,
 * pattern-based invalidation, and memory management.
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  size: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  oldestEntry?: number;
  newestEntry?: number;
}

export interface CacheOptions {
  maxSize?: number; // Maximum cache size in MB
  defaultTTL?: number; // Default TTL in milliseconds
  cleanupInterval?: number; // Cleanup interval in milliseconds
  enableStats?: boolean;
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    cleanups: 0
  };
  
  private options: Required<CacheOptions>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: options.maxSize || 50, // 50MB default
      defaultTTL: options.defaultTTL || 300000, // 5 minutes default
      cleanupInterval: options.cleanupInterval || 60000, // 1 minute default
      enableStats: options.enableStats !== false
    };

    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Get cached value
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.incrementStat('misses');
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.incrementStat('misses');
      return null;
    }

    this.incrementStat('hits');
    return entry.data as T;
  }

  /**
   * Set cached value
   */
  set<T = any>(key: string, data: T, ttl?: number): void {
    const entryTTL = ttl || this.options.defaultTTL;
    const size = this.calculateSize(data);

    // Check if we need to make room
    this.ensureSpace(size);

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: entryTTL,
      key,
      size
    };

    this.cache.set(key, entry);
    this.incrementStat('sets');
  }

  /**
   * Delete cached value
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.incrementStat('deletes');
    }
    return deleted;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear cache (optionally by pattern)
   */
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = this.createPatternRegex(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.incrementStat('deletes');
    });
  }

  /**
   * Generate cache key from endpoint and parameters
   */
  generateKey(endpoint: string, params?: any): string {
    const baseKey = endpoint.replace(/[^a-zA-Z0-9]/g, '_');
    
    if (!params) {
      return baseKey;
    }

    // Sort and stringify parameters for consistent keys
    const sortedParams = this.sortObject(params);
    const paramString = JSON.stringify(sortedParams);
    const paramHash = this.hashString(paramString);

    return `${baseKey}_${paramHash}`;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const timestamps = entries.map(entry => entry.timestamp);

    return {
      totalEntries: this.cache.size,
      totalSize: Math.round(totalSize / (1024 * 1024) * 100) / 100, // Convert to MB
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? Math.round((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100) / 100 
        : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : undefined
    };
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidate(pattern: string): number {
    const regex = this.createPatternRegex(pattern);
    let invalidated = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key) || regex.test(entry.key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Manually trigger cleanup of expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    this.incrementStat('cleanups');
    return cleaned;
  }

  /**
   * Destroy cache manager and cleanup timers
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.cache.clear();
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private calculateSize(data: any): number {
    // Rough size calculation in bytes
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  }

  private ensureSpace(newEntrySize: number): void {
    const maxSizeBytes = this.options.maxSize * 1024 * 1024; // Convert MB to bytes
    
    // Calculate current cache size
    let currentSize = 0;
    for (const entry of this.cache.values()) {
      currentSize += entry.size;
    }

    // If we're over the limit or would go over, remove oldest entries
    while (currentSize + newEntrySize > maxSizeBytes && this.cache.size > 0) {
      const oldestKey = this.findOldestEntry();
      if (oldestKey) {
        const entry = this.cache.get(oldestKey);
        if (entry) {
          currentSize -= entry.size;
          this.cache.delete(oldestKey);
        }
      } else {
        break; // Safety break
      }
    }
  }

  private findOldestEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private createPatternRegex(pattern: string): RegExp {
    // Convert glob-like pattern to regex
    const escapedPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\*/g, '.*') // Convert * to .*
      .replace(/\?/g, '.'); // Convert ? to .

    return new RegExp(`^${escapedPattern}$`, 'i');
  }

  private sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }

    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: any = {};

    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObject(obj[key]);
    }

    return sortedObj;
  }

  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  private incrementStat(stat: keyof typeof this.stats): void {
    if (this.options.enableStats) {
      this.stats[stat]++;
    }
  }
}

export default CacheManager;