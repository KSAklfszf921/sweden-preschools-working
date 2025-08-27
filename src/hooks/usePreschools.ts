import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMapStore, type Preschool } from '@/stores/mapStore';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { useBackgroundGoogleEnrichment } from './useBackgroundGoogleEnrichment';
import { useOptimizedPreschools } from './useOptimizedPreschools';
import { dataCache, cacheKeys } from '@/utils/dataCache';
import { performanceOptimizer } from '@/utils/performanceOptimizer';

export const usePreschools = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setPreschools, setLoading } = useMapStore();
  const { startBackgroundEnrichment } = useBackgroundGoogleEnrichment();
  
  // Use optimized preschool loading with smart caching - but don't double-load
  // const optimizedHook = useOptimizedPreschools({
  //   enableCaching: true,
  //   batchSize: 500,
  //   maxRetries: 3,
  //   prefetchNearby: true
  // });
  
  // Enable real-time updates
  useRealTimeUpdates();

  const fetchPreschools = async () => {
    try {
      setIsLoading(true);
      setLoading(true);
      setError(null);

      // 🚀 Smart caching check first
      const cacheKey = cacheKeys.preschools();
      const cachedData = dataCache.get<Preschool[]>(cacheKey);
      
      if (cachedData) {
        console.log('🚀 Loading preschools from cache - performance optimized!');
        setPreschools(cachedData);
        setIsLoading(false);
        setLoading(false);
        return;
      }

      // Fetch ALL preschools with correct column casing
      const { data: preschoolsData, error: preschoolsError } = await supabase
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
        `);

      if (preschoolsError) throw preschoolsError;

      // 🚀 Transform preschools with batch processing for better performance
      const transformedPreschools: Preschool[] = await performanceOptimizer.batchProcess(
        preschoolsData || [],
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
        500, // Process 500 at a time
        10   // 10ms delay between batches
      );

      // Find preschools that actually need geocoding (NULL or 0 coordinates)
      const missingCoords = transformedPreschools.filter(p => 
        p.latitud === null || p.longitud === null || p.latitud === 0 || p.longitud === 0
      );
      
      if (missingCoords.length > 0) {
        console.log(`Found ${missingCoords.length} preschools needing geocoding. Triggering background processing...`);
        
        // Prepare data for geocoding service with proper format
        const preschoolsForGeocoding = missingCoords.map(p => ({
          id: p.id,
          Namn: p.namn,
          Adress: p.adress,
          Kommun: p.kommun,
          Latitud: p.latitud,
          Longitud: p.longitud
        }));
        
        // Trigger geocoding in background with smaller batches
        supabase.functions.invoke('geocoding-service', {
          body: { preschools: preschoolsForGeocoding.slice(0, 25) } // Smaller batches for reliability
        }).then(response => {
          console.log('Geocoding service response:', response);
        }).catch(error => {
          console.error('Geocoding service error:', error);
        });
      }

      // 🚀 Cache the processed data for next time
      dataCache.set(cacheKey, transformedPreschools, 10 * 60 * 1000); // 10 minutes cache

      // Set preschools in store - this will trigger map updates immediately
      console.log(`🗺️ Setting ${transformedPreschools.length} preschools in store for map display`);
      setPreschools(transformedPreschools);
      console.log(`✅ Successfully loaded and displayed ${transformedPreschools.length} preschools on map with smart caching!`);

      // Start discrete background Google data enrichment
      startBackgroundEnrichment();

    } catch (err) {
      console.error('Error fetching preschools:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Start fetching data immediately, not waiting for component mount completion
    console.log('🚀 Starting immediate preschool data fetch during loading animation...');
    fetchPreschools();
  }, []);

  return {
    isLoading,
    error,
    refetch: fetchPreschools
  };
};