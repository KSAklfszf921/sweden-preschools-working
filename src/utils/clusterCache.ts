// Cluster cache for immediate display while detailed data loads in background
export interface ClusterCacheItem {
  center: [number, number];
  count: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  averageRating?: number;
  totalChildren?: number;
  timestamp: number;
}

export interface ClusterCache {
  zoom: number;
  clusters: ClusterCacheItem[];
  timestamp: number;
}

class ClusterCacheManager {
  private cache: Map<string, ClusterCache> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_KEY = 'preschool_cluster_cache';

  constructor() {
    this.loadFromStorage();
  }

  // Generate cache key based on zoom level
  private getCacheKey(zoom: number): string {
    const roundedZoom = Math.round(zoom * 2) / 2; // Round to nearest 0.5
    return `zoom_${roundedZoom}`;
  }

  // Save cluster state for a specific zoom level
  saveClusterState(zoom: number, clusters: ClusterCacheItem[]): void {
    const key = this.getCacheKey(zoom);
    const cacheItem: ClusterCache = {
      zoom,
      clusters,
      timestamp: Date.now()
    };
    
    this.cache.set(key, cacheItem);
    this.saveToStorage();
    console.log(`💾 Saved cluster cache for zoom ${zoom} with ${clusters.length} clusters`);
  }

  // Get cached cluster state
  getClusterState(zoom: number): ClusterCache | null {
    const key = this.getCacheKey(zoom);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`📦 Using cached clusters for zoom ${zoom}: ${cached.clusters.length} clusters`);
    return cached;
  }

  // Generate quick cluster approximation for Sweden
  generateSwedishClusterApproximation(): ClusterCacheItem[] {
    // Pre-calculated cluster approximations for major Swedish regions
    return [
      // Stockholm region
      {
        center: [18.0686, 59.3293],
        count: 850,
        bounds: { north: 59.5, south: 59.1, east: 18.3, west: 17.8 },
        averageRating: 4.2,
        totalChildren: 12500,
        timestamp: Date.now()
      },
      // Gothenburg region
      {
        center: [11.9746, 57.7089],
        count: 420,
        bounds: { north: 57.9, south: 57.5, east: 12.2, west: 11.7 },
        averageRating: 4.1,
        totalChildren: 6800,
        timestamp: Date.now()
      },
      // Malmö region
      {
        center: [13.0034, 55.6050],
        count: 280,
        bounds: { north: 55.8, south: 55.4, east: 13.3, west: 12.7 },
        averageRating: 4.0,
        totalChildren: 4200,
        timestamp: Date.now()
      },
      // Uppsala region
      {
        center: [17.6389, 59.8585],
        count: 180,
        bounds: { north: 60.0, south: 59.7, east: 17.9, west: 17.4 },
        averageRating: 4.3,
        totalChildren: 2800,
        timestamp: Date.now()
      },
      // Linköping region
      {
        center: [15.6214, 58.4108],
        count: 140,
        bounds: { north: 58.6, south: 58.2, east: 15.9, west: 15.3 },
        averageRating: 4.2,
        totalChildren: 2100,
        timestamp: Date.now()
      },
      // Örebro region
      {
        center: [15.2066, 59.2741],
        count: 120,
        bounds: { north: 59.4, south: 59.1, east: 15.5, west: 14.9 },
        averageRating: 4.1,
        totalChildren: 1900,
        timestamp: Date.now()
      },
      // Umeå region (northern Sweden)
      {
        center: [20.2630, 63.8258],
        count: 85,
        bounds: { north: 64.0, south: 63.6, east: 20.5, west: 20.0 },
        averageRating: 4.0,
        totalChildren: 1400,
        timestamp: Date.now()
      },
      // Smaller regional clusters
      {
        center: [16.5, 60.6], // Gävle area
        count: 95,
        bounds: { north: 60.8, south: 60.4, east: 16.8, west: 16.2 },
        averageRating: 4.1,
        totalChildren: 1500,
        timestamp: Date.now()
      },
      {
        center: [14.8, 56.9], // Växjö/Småland
        count: 165,
        bounds: { north: 57.2, south: 56.6, east: 15.2, west: 14.4 },
        averageRating: 4.0,
        totalChildren: 2600,
        timestamp: Date.now()
      },
      {
        center: [13.5, 59.4], // Karlstad/Värmland
        count: 110,
        bounds: { north: 59.7, south: 59.1, east: 13.8, west: 13.2 },
        averageRating: 4.1,
        totalChildren: 1800,
        timestamp: Date.now()
      },
      // Northern clusters
      {
        center: [17.3, 62.4], // Sundsvall
        count: 75,
        bounds: { north: 62.6, south: 62.2, east: 17.6, west: 17.0 },
        averageRating: 4.0,
        totalChildren: 1200,
        timestamp: Date.now()
      },
      {
        center: [22.15, 65.58], // Luleå
        count: 65,
        bounds: { north: 65.8, south: 65.3, east: 22.5, west: 21.8 },
        averageRating: 4.2,
        totalChildren: 1000,
        timestamp: Date.now()
      }
    ];
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cluster cache to storage:', error);
    }
  }

  // Load from localStorage
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.cache = new Map(parsed);
        console.log(`📂 Loaded cluster cache with ${this.cache.size} entries`);
      }
    } catch (error) {
      console.warn('Failed to load cluster cache from storage:', error);
    }
  }

  // Clear all cache
  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ Cleared all cluster cache');
  }

  // Get cache statistics
  getCacheStats(): { entries: number; totalClusters: number; oldestEntry: number } {
    let totalClusters = 0;
    let oldestEntry = Date.now();

    this.cache.forEach((cache) => {
      totalClusters += cache.clusters.length;
      if (cache.timestamp < oldestEntry) {
        oldestEntry = cache.timestamp;
      }
    });

    return {
      entries: this.cache.size,
      totalClusters,
      oldestEntry
    };
  }
}

// Export singleton instance
export const clusterCache = new ClusterCacheManager();