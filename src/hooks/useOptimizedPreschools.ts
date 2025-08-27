// OPTIMIZED PRESCHOOL DATA LOADING HOOK
// Smart backend patterns from svenska-forskolor-karta

import { useState, useEffect, useCallback } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { dataCache, cacheKeys, dataTransformers } from '@/utils/dataCache';
import { performanceOptimizer } from '@/utils/performanceOptimizer';
import type { Preschool } from '@/stores/mapStore';

interface UseOptimizedPreschoolsOptions {
  enableCaching?: boolean;
  batchSize?: number;
  maxRetries?: number;
  prefetchNearby?: boolean;
}

export const useOptimizedPreschools = (options: UseOptimizedPreschoolsOptions = {}) => {
  const {
    enableCaching = true,
    batchSize = 1000,
    maxRetries = 3,
    prefetchNearby = true
  } = options;

  const { setPreschools, setLoading } = useMapStore();
  const [error, setError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState({
    loaded: 0,
    total: 0,
    fromCache: false
  });

  // Smart data loading with retry logic
  const loadPreschoolData = useCallback(async (retryCount = 0): Promise<Preschool[]> => {
    try {
      // Check cache first
      if (enableCaching) {
        const cached = dataCache.get<Preschool[]>(cacheKeys.preschools());
        if (cached) {
          console.log('🚀 Loading preschools from cache');
          setLoadingStats({
            loaded: cached.length,
            total: cached.length,
            fromCache: true
          });
          return cached;
        }
      }

      setLoading(true);
      setError(null);

      // Use deduped request to prevent multiple simultaneous calls
      const data = await performanceOptimizer.dedupedRequest(
        'load-preschools',
        async () => {
          const { supabase } = await import('@/integrations/supabase/client');

          // Optimized query - use the correct table and column names
          const { data, error, count } = await supabase
            .from('Förskolor')
            .select(`
              id,
              "Namn",
              "Kommun", 
              "Adress",
              "Latitud",
              "Longitud",
              "Antal barn",
              "Huvudman",
              "Personaltäthet",
              "Andel med förskollärarexamen",
              "Antal barngrupper",
              preschool_google_data (
                google_rating,
                google_reviews_count,
                reviews,
                contact_phone,
                website_url,
                opening_hours
              )
            `, { count: 'exact' })
            .order('"Namn"');

          if (error) throw error;

          setLoadingStats({
            loaded: data?.length || 0,
            total: count || 0,
            fromCache: false
          });

          return data || [];
        }
      );

      // Process data in batches for better performance - transform to correct format
      const processedData = await performanceOptimizer.batchProcess(
        data,
        (preschool: any) => ({
          id: preschool.id,
          namn: preschool.Namn,
          kommun: preschool.Kommun,
          adress: preschool.Adress || '',
          // Keep NULL coordinates as null instead of converting to 0
          latitud: preschool.Latitud !== null ? preschool.Latitud : null,
          longitud: preschool.Longitud !== null ? preschool.Longitud : null,
          antal_barn: preschool["Antal barn"],
          huvudman: preschool.Huvudman,
          personaltäthet: preschool.Personaltäthet,
          andel_med_förskollärarexamen: preschool["Andel med förskollärarexamen"],
          antal_barngrupper: preschool["Antal barngrupper"],
          google_rating: preschool.preschool_google_data?.[0]?.google_rating,
          google_reviews_count: preschool.preschool_google_data?.[0]?.google_reviews_count,
          google_reviews: preschool.preschool_google_data?.[0]?.reviews,
          contact_phone: preschool.preschool_google_data?.[0]?.contact_phone,
          website_url: preschool.preschool_google_data?.[0]?.website_url,
          opening_hours: preschool.preschool_google_data?.[0]?.opening_hours,
        }),
        batchSize,
        5 // Small delay to prevent UI blocking
      );

      // Cache the processed data
      if (enableCaching) {
        dataCache.set(
          cacheKeys.preschools(), 
          processedData, 
          10 * 60 * 1000 // 10 minutes cache
        );
      }

      console.log(`✅ Loaded ${processedData.length} preschools with smart optimizations`);
      return processedData;

    } catch (error: any) {
      console.error('Error loading preschools:', error);
      
      // Retry logic
      if (retryCount < maxRetries) {
        console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return loadPreschoolData(retryCount + 1);
      }
      
      setError(error.message || 'Kunde inte ladda förskolornas data');
      
      // Try to return cached data as fallback
      if (enableCaching) {
        const cached = dataCache.get<Preschool[]>(cacheKeys.preschools());
        if (cached) {
          console.warn('Using stale cache data as fallback');
          return cached;
        }
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enableCaching, batchSize, maxRetries, setLoading, setPreschools]);

  // Prefetch nearby data based on user location
  const prefetchNearbyData = useCallback(async (userLocation: { lat: number; lng: number }) => {
    if (!prefetchNearby) return;

    try {
      const nearbyKey = `nearby-${userLocation.lat.toFixed(3)}-${userLocation.lng.toFixed(3)}`;
      const cached = dataCache.get(nearbyKey);
      
      if (!cached) {
        // Preload nearby preschools in background
        performanceOptimizer.preloadCriticalData(async () => {
          const { supabase } = await import('@/integrations/supabase/client');

          // Simple bounding box for nearby search
          const radius = 0.1; // ~10km
          const { data } = await supabase
            .from('Förskolor')
            .select(`
              id, 
              "Namn", 
              "Kommun", 
              "Latitud", 
              "Longitud",
              preschool_google_data (google_rating)
            `)
            .gte('"Latitud"', userLocation.lat - radius)
            .lte('"Latitud"', userLocation.lat + radius)
            .gte('"Longitud"', userLocation.lng - radius)
            .lte('"Longitud"', userLocation.lng + radius)
            .not('"Latitud"', 'is', null)
            .not('"Longitud"', 'is', null);

          if (data) {
            dataCache.set(nearbyKey, data, 5 * 60 * 1000); // 5 minutes
            console.log(`🎯 Prefetched ${data.length} nearby preschools`);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to prefetch nearby data:', error);
    }
  }, [prefetchNearby]);

  // Main data loading effect
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadPreschoolData();
        setPreschools(data);
      } catch (error) {
        console.error('Failed to load preschool data:', error);
      }
    };

    loadData();
  }, [loadPreschoolData, setPreschools]);

  // Get statistics summary
  const getStatsSummary = useCallback(() => {
    const preschools = dataCache.get<Preschool[]>(cacheKeys.preschools()) || [];
    return dataTransformers.toStatsSummary(preschools);
  }, []);

  // Refresh data manually
  const refreshData = useCallback(async () => {
    dataCache.invalidate(cacheKeys.preschools());
    const data = await loadPreschoolData();
    setPreschools(data);
  }, [loadPreschoolData, setPreschools]);

  return {
    error,
    loadingStats,
    refreshData,
    prefetchNearbyData,
    getStatsSummary,
    isLoading: loadingStats.loaded === 0 && !error
  };
};