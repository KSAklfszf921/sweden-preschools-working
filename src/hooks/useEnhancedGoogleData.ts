import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GoogleData {
  google_place_id?: string;
  google_rating?: number;
  google_reviews_count?: number;
  contact_phone?: string;
  website_url?: string;
  opening_hours?: any;
  reviews?: any;
  street_view_pano_id?: string;
  formatted_address?: string;
  last_updated?: string;
}

interface EnhancedStats {
  totalPreschools: number;
  enrichedPreschools: number;
  coveragePercentage: number;
  recentlyUpdated: number;
  needingUpdate: number;
}

export const useEnhancedGoogleData = () => {
  const [stats, setStats] = useState<EnhancedStats>({
    totalPreschools: 0,
    enrichedPreschools: 0,
    coveragePercentage: 0,
    recentlyUpdated: 0,
    needingUpdate: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [cache, setCache] = useState<Map<string, GoogleData>>(new Map());

  const getGoogleData = useCallback(async (preschoolId: string): Promise<GoogleData | null> => {
    // Check cache first
    if (cache.has(preschoolId)) {
      return cache.get(preschoolId) || null;
    }

    try {
      const { data, error } = await supabase
        .from('preschool_google_data')
        .select('*')
        .eq('preschool_id', preschoolId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching Google data:', error);
        return null;
      }

      // Cache the result
      if (data) {
        cache.set(preschoolId, data);
        setCache(new Map(cache));
      }

      return data;
    } catch (error) {
      console.error('Error in getGoogleData:', error);
      return null;
    }
  }, [cache]);

  const preloadGoogleData = useCallback(async (preschoolIds: string[]) => {
    try {
      const uncachedIds = preschoolIds.filter(id => !cache.has(id));
      
      if (uncachedIds.length === 0) return;

      const { data, error } = await supabase
        .from('preschool_google_data')
        .select('*')
        .in('preschool_id', uncachedIds);

      if (error) {
        console.error('Error preloading Google data:', error);
        return;
      }

      // Update cache
      const newCache = new Map(cache);
      data?.forEach(item => {
        newCache.set(item.preschool_id, item);
      });
      
      setCache(newCache);
    } catch (error) {
      console.error('Error in preloadGoogleData:', error);
    }
  }, [cache]);

  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get total preschools count
      const { count: totalCount } = await supabase
        .from('Förskolor')
        .select('*', { count: 'exact', head: true })
        .not('Latitud', 'is', null);

      // Get enriched preschools count
      const { count: enrichedCount } = await supabase
        .from('preschool_google_data')
        .select('*', { count: 'exact', head: true });

      // Get recently updated (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentCount } = await supabase
        .from('preschool_google_data')
        .select('*', { count: 'exact', head: true })
        .gte('last_updated', sevenDaysAgo.toISOString());

      // Get needing update (older than 30 days or missing)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: needingUpdateCount } = await supabase
        .from('preschool_google_data')
        .select('*', { count: 'exact', head: true })
        .lt('last_updated', thirtyDaysAgo.toISOString());

      const total = totalCount || 0;
      const enriched = enrichedCount || 0;
      const coverage = total > 0 ? Math.round((enriched / total) * 100) : 0;

      setStats({
        totalPreschools: total,
        enrichedPreschools: enriched,
        coveragePercentage: coverage,
        recentlyUpdated: recentCount || 0,
        needingUpdate: (needingUpdateCount || 0) + (total - enriched)
      });
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerEnrichment = useCallback(async (preschoolIds?: string[]) => {
    try {
      if (preschoolIds && preschoolIds.length > 0) {
        // Enrich specific preschools
        for (const preschoolId of preschoolIds.slice(0, 10)) { // Limit to 10 at a time
          const { data: preschool } = await supabase
            .from('Förskolor')
            .select('id, "Namn", "Adress", "Latitud", "Longitud"')
            .eq('id', preschoolId)
            .single();

          if (preschool) {
            await supabase.functions.invoke('google-places-enricher', {
              body: {
                preschoolId: preschool.id,
                lat: preschool.Latitud,
                lng: preschool.Longitud,
                address: preschool.Adress,
                name: preschool.Namn
              }
            });
          }
        }
      } else {
        // Trigger general enrichment
        await supabase.functions.invoke('google-places-enricher', {
          body: { batch: true }
        });
      }

      // Clear cache and refresh stats
      setCache(new Map());
      await refreshStats();
    } catch (error) {
      console.error('Error triggering enrichment:', error);
    }
  }, [refreshStats]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    isLoading,
    getGoogleData,
    preloadGoogleData,
    refreshStats,
    triggerEnrichment,
    clearCache
  };
};