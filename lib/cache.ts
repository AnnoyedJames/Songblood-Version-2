/**
 * Simple in-memory cache with TTL support
 */

type CacheItem<T> = {
  value: T
  expiresAt: number
}

class QueryCache {
  private cache: Map<string, CacheItem<any>> = new Map()
  private defaultTtl = 60 // Default TTL in seconds

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key)

    // Return undefined if item doesn't exist
    if (!item) return undefined

    // Check if item has expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return item.value as T
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional, defaults to 60)
   */
  set<T>(key: string, value: T, ttl: number = this.defaultTtl): void {
    const expiresAt = Date.now() + ttl * 1000
    this.cache.set(key, { value, expiresAt })
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate a cache key or keys matching a prefix
   * @param keyOrPrefix Cache key or prefix to invalidate
   */
  invalidate(keyOrPrefix: string): void {
    if (this.cache.has(keyOrPrefix)) {
      // If exact key exists, delete it
      this.cache.delete(keyOrPrefix)
    } else {
      // Otherwise, delete all keys that start with the prefix
      for (const key of this.cache.keys()) {
        if (key.startsWith(keyOrPrefix)) {
          this.cache.delete(key)
        }
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get the number of items in the cache
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Clean expired items from the cache
   */
  cleanExpired(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Set the default TTL for cache items
   * @param seconds Default TTL in seconds
   */
  setDefaultTtl(seconds: number): void {
    this.defaultTtl = seconds
  }
}

// Create a singleton instance
export const queryCache = new QueryCache()

// Clean expired items every minute
setInterval(() => {
  queryCache.cleanExpired()
}, 60000)
