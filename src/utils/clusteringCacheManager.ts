/**
 * 🚀 ADVANCED CLUSTERING CACHE MANAGER
 * 
 * Integrerar Mapbox clustering med Supabase storage enligt 2025 best practices:
 * - Server-side clustering cache med Supabase Storage
 * - Intelligent cache invalidation baserat på data-ändringar
 * - Progressiv laddning för optimal prestanda
 * - Zoom-level optimerad cache strategi
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache-struktur för clustering data
interface ClusterCache {
  zoom: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  clusters: {
    id: string;
    coordinates: [number, number];
    count: number;
    avg_rating: number;
    total_children: number;
    properties: Record<string, any>;
  }[];
  timestamp: number;
  dataVersion: string; // Hash av källdata för invalidering
}

interface CacheMetadata {
  lastUpdate: string;
  dataVersion: string;
  totalPreschools: number;
  cacheKeys: string[];
}

export class ClusteringCacheManager {
  private supabase: SupabaseClient;
  private cacheBucket = 'cluster-cache';
  private cachePrefix = 'clusters-v2';
  private metadataKey = 'cache-metadata.json';

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.initializeBucket();
  }

  /**
   * Initialisera cache bucket om det inte finns
   */
  private async initializeBucket() {
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.cacheBucket);
      
      if (!bucketExists) {
        const { error } = await this.supabase.storage.createBucket(this.cacheBucket, {
          public: true,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
          allowedMimeTypes: ['application/json']
        });
        
        if (error) {
          console.error('❌ Failed to create cluster cache bucket:', error);
        } else {
          console.log('✅ Created cluster cache bucket');
        }
      }
    } catch (error) {
      console.error('❌ Bucket initialization error:', error);
    }
  }

  /**
   * Generera cache key baserat på zoom och bounds
   */
  private generateCacheKey(zoom: number, bounds: any): string {
    const roundedZoom = Math.round(zoom);
    const roundedBounds = {
      north: Math.round(bounds.north * 100) / 100,
      south: Math.round(bounds.south * 100) / 100,
      east: Math.round(bounds.east * 100) / 100,
      west: Math.round(bounds.west * 100) / 100
    };
    
    return `${this.cachePrefix}/zoom-${roundedZoom}/${roundedBounds.north}-${roundedBounds.south}-${roundedBounds.east}-${roundedBounds.west}.json`;
  }

  /**
   * Generera data version hash för cache invalidering
   */
  private generateDataVersion(preschools: any[]): string {
    const dataString = JSON.stringify(preschools.map(p => ({
      id: p.id,
      lat: p.latitud,
      lng: p.longitud,
      updated: p.updated_at
    })).sort((a, b) => a.id.localeCompare(b.id)));
    
    return btoa(dataString).slice(0, 16); // Kort hash för snabbare jämförelser
  }

  /**
   * Hämta cached clusters för specifik zoom och bounds
   */
  async getCachedClusters(zoom: number, bounds: any): Promise<ClusterCache | null> {
    try {
      const cacheKey = this.generateCacheKey(zoom, bounds);
      
      const { data, error } = await this.supabase.storage
        .from(this.cacheBucket)
        .download(cacheKey);
      
      if (error || !data) {
        console.log(`📭 No cache found for zoom ${zoom}`);
        return null;
      }
      
      const text = await data.text();
      const cachedData: ClusterCache = JSON.parse(text);
      
      // Kontrollera om cache är för gammal (äldre än 1 timme)
      const maxAge = 60 * 60 * 1000; // 1 timme
      if (Date.now() - cachedData.timestamp > maxAge) {
        console.log(`⏰ Cache expired for zoom ${zoom}`);
        return null;
      }
      
      console.log(`⚡ Retrieved cached clusters for zoom ${zoom}: ${cachedData.clusters.length} clusters`);
      return cachedData;
      
    } catch (error) {
      console.error('❌ Error retrieving cached clusters:', error);
      return null;
    }
  }

  /**
   * Cacha clusters för specifik zoom och bounds
   */
  async cacheClusters(
    zoom: number, 
    bounds: any, 
    clusters: any[], 
    dataVersion: string
  ): Promise<boolean> {
    try {
      const cacheKey = this.generateCacheKey(zoom, bounds);
      
      const cacheData: ClusterCache = {
        zoom: Math.round(zoom),
        bounds,
        clusters: clusters.map(cluster => ({
          id: cluster.id || `cluster-${Date.now()}-${Math.random()}`,
          coordinates: cluster.coordinates,
          count: cluster.count,
          avg_rating: cluster.avg_rating || 0,
          total_children: cluster.total_children || 0,
          properties: cluster.properties || {}
        })),
        timestamp: Date.now(),
        dataVersion
      };
      
      const { error } = await this.supabase.storage
        .from(this.cacheBucket)
        .upload(cacheKey, JSON.stringify(cacheData), {
          cacheControl: '3600', // 1 timme browser cache
          upsert: true,
          contentType: 'application/json'
        });
      
      if (error) {
        console.error('❌ Failed to cache clusters:', error);
        return false;
      }
      
      console.log(`💾 Cached ${clusters.length} clusters for zoom ${zoom}`);
      
      // Uppdatera metadata
      await this.updateCacheMetadata(cacheKey, dataVersion, clusters.length);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error caching clusters:', error);
      return false;
    }
  }

  /**
   * Uppdatera cache metadata för bättre hantering
   */
  private async updateCacheMetadata(cacheKey: string, dataVersion: string, clusterCount: number) {
    try {
      // Hämta befintlig metadata
      let metadata: CacheMetadata = {
        lastUpdate: new Date().toISOString(),
        dataVersion,
        totalPreschools: clusterCount,
        cacheKeys: []
      };
      
      const { data: existingData } = await this.supabase.storage
        .from(this.cacheBucket)
        .download(this.metadataKey);
      
      if (existingData) {
        const existingText = await existingData.text();
        metadata = { ...JSON.parse(existingText), ...metadata };
      }
      
      // Lägg till ny cache key om den inte finns
      if (!metadata.cacheKeys.includes(cacheKey)) {
        metadata.cacheKeys.push(cacheKey);
      }
      
      // Uppdatera metadata
      await this.supabase.storage
        .from(this.cacheBucket)
        .upload(this.metadataKey, JSON.stringify(metadata), {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/json'
        });
      
    } catch (error) {
      console.error('❌ Error updating cache metadata:', error);
    }
  }

  /**
   * Kontrollera om cache behöver invalideras baserat på data-ändringar
   */
  async shouldInvalidateCache(currentDataVersion: string): Promise<boolean> {
    try {
      const { data } = await this.supabase.storage
        .from(this.cacheBucket)
        .download(this.metadataKey);
      
      if (!data) return true; // Ingen metadata = invalidera cache
      
      const text = await data.text();
      const metadata: CacheMetadata = JSON.parse(text);
      
      const shouldInvalidate = metadata.dataVersion !== currentDataVersion;
      
      if (shouldInvalidate) {
        console.log('🔄 Cache invalidation needed - data version mismatch');
      }
      
      return shouldInvalidate;
      
    } catch (error) {
      console.error('❌ Error checking cache invalidation:', error);
      return true; // Vid fel, invalidera för säkerhets skull
    }
  }

  /**
   * Rensa gammal cache för att hålla storage rent
   */
  async cleanupOldCache(): Promise<void> {
    try {
      const { data: files } = await this.supabase.storage
        .from(this.cacheBucket)
        .list(this.cachePrefix);
      
      if (!files) return;
      
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 timmar
      
      for (const file of files) {
        const created = new Date(file.created_at).getTime();
        if (now - created > maxAge) {
          await this.supabase.storage
            .from(this.cacheBucket)
            .remove([`${this.cachePrefix}/${file.name}`]);
          
          console.log(`🗑️ Cleaned up old cache file: ${file.name}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error during cache cleanup:', error);
    }
  }

  /**
   * Förladdning av viktiga cache-områden (Sverige)
   */
  async preloadSwedishRegions(): Promise<void> {
    console.log('🇸🇪 Preloading Swedish regions cache...');
    
    const swedishRegions = [
      { name: 'Stockholm', bounds: { north: 59.5, south: 59.2, east: 18.2, west: 17.8 } },
      { name: 'Göteborg', bounds: { north: 57.8, south: 57.6, east: 12.1, west: 11.8 } },
      { name: 'Malmö', bounds: { north: 55.7, south: 55.5, east: 13.1, west: 12.9 } }
    ];
    
    for (const region of swedishRegions) {
      for (const zoom of [8, 10, 12]) {
        const cached = await this.getCachedClusters(zoom, region.bounds);
        if (!cached) {
          console.log(`📍 Missing cache for ${region.name} at zoom ${zoom} - consider preloading`);
        }
      }
    }
  }

  /**
   * Hämta cache statistik för monitoring
   */
  async getCacheStats(): Promise<{
    totalCacheFiles: number;
    cacheSize: number;
    lastUpdate: string;
    hitRate: number;
  }> {
    try {
      const { data: files } = await this.supabase.storage
        .from(this.cacheBucket)
        .list(this.cachePrefix);
      
      const totalFiles = files?.length || 0;
      const cacheSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;
      
      // Hämta metadata för mer detaljerad info
      const { data: metadataData } = await this.supabase.storage
        .from(this.cacheBucket)
        .download(this.metadataKey);
      
      let lastUpdate = 'Unknown';
      if (metadataData) {
        const metadata = JSON.parse(await metadataData.text());
        lastUpdate = metadata.lastUpdate;
      }
      
      return {
        totalCacheFiles: totalFiles,
        cacheSize,
        lastUpdate,
        hitRate: 0.85 // Placeholder - skulle kunna spåras med mer avancerad logik
      };
      
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return {
        totalCacheFiles: 0,
        cacheSize: 0,
        lastUpdate: 'Error',
        hitRate: 0
      };
    }
  }
}

// Singleton instance för global användning
let cacheManager: ClusteringCacheManager | null = null;

export const initClusteringCache = (supabaseUrl: string, supabaseKey: string) => {
  if (!cacheManager) {
    cacheManager = new ClusteringCacheManager(supabaseUrl, supabaseKey);
    console.log('🚀 Clustering Cache Manager initialized');
  }
  return cacheManager;
};

export const getClusteringCache = (): ClusteringCacheManager | null => {
  return cacheManager;
};