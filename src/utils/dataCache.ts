// SMART CACHING SYSTEM
// Inspired by sveriges-forskolor and svenska-forskolor-karta optimizations

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class DataCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxCacheSize = 100;

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = ttl || this.defaultTTL;
    
    // Clean up expired items if cache is getting full
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiry
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      items: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
export const dataCache = new DataCache();

// Cache key generators
export const cacheKeys = {
  preschools: (filters?: any) => {
    if (!filters || Object.keys(filters).length === 0) {
      return 'preschools:all';
    }
    return `preschools:filtered:${JSON.stringify(filters)}`;
  },
  
  commune: (kommun: string) => `commune:${kommun}`,
  
  coordinates: (preschoolId: string) => `coordinates:${preschoolId}`,
  
  statistics: (type: string) => `statistics:${type}`,
  
  clustering: (zoom: number, bounds: any) => 
    `clusters:z${zoom}:${bounds.north}-${bounds.south}-${bounds.east}-${bounds.west}`,
    
  search: (query: string) => `search:${query.toLowerCase()}`,
};

// Memory-efficient data transformers
export const dataTransformers = {
  // Lightweight preschool object for map markers
  toLightweight: (preschool: any) => ({
    id: preschool.id,
    namn: preschool.namn,
    kommun: preschool.kommun,
    latitud: preschool.latitud,
    longitud: preschool.longitud,
    google_rating: preschool.google_rating
  }),

  // Full data for detailed views
  toFull: (preschool: any) => preschool,

  // Statistics summary
  toStatsSummary: (preschools: any[]) => ({
    total: preschools.length,
    withCoordinates: preschools.filter(p => p.latitud && p.longitud).length,
    withRatings: preschools.filter(p => p.google_rating).length,
    avgRating: preschools.filter(p => p.google_rating).reduce((acc, p) => acc + p.google_rating, 0) / preschools.filter(p => p.google_rating).length || 0
  })
};