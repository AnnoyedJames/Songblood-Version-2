type CacheEntry<T> = {
  data: T
  timestamp: number
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private ttl: number // Time to live in milliseconds

  constructor(ttlSeconds = 60) {
    this.ttl = ttlSeconds * 1000
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if the entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidateAll(): void {
    this.cache.clear()
  }
}

// Create a singleton instance
export const queryCache = new QueryCache()
