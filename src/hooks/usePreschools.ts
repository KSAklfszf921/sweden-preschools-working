import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMapStore, type Preschool } from '@/stores/mapStore';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

export const usePreschools = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setPreschools, setLoading } = useMapStore();
  
  // Enable real-time updates
  useRealTimeUpdates();

  const fetchPreschools = async () => {
    try {
      setIsLoading(true);
      setLoading(true);
      setError(null);

      // Fetch ALL preschools including those without coordinates
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
            google_reviews_count
          )
        `);

      if (preschoolsError) throw preschoolsError;

      // Transform and separate preschools with/without coordinates
      const transformedPreschools: Preschool[] = (preschoolsData || []).map(preschool => ({
        id: preschool.id,
        namn: preschool.Namn,
        kommun: preschool.Kommun,
        adress: preschool.Adress || '',
        latitud: preschool.Latitud || 0, // Will be handled in Map3D
        longitud: preschool.Longitud || 0, // Will be handled in Map3D
        antal_barn: preschool["Antal barn"],
        huvudman: preschool.Huvudman,
        personaltäthet: preschool.Personaltäthet,
        andel_med_förskollärarexamen: preschool["Andel med förskollärarexamen"],
        antal_barngrupper: preschool["Antal barngrupper"],
        google_rating: preschool.preschool_google_data?.[0]?.google_rating,
        google_reviews_count: preschool.preschool_google_data?.[0]?.google_reviews_count,
      }));

      // Trigger geocoding for missing coordinates
      const missingCoords = transformedPreschools.filter(p => !p.latitud || !p.longitud);
      if (missingCoords.length > 0) {
        console.log(`Found ${missingCoords.length} preschools without coordinates. Starting geocoding...`);
        // Trigger geocoding in background
        supabase.functions.invoke('geocoding-service', {
          body: { preschools: missingCoords.slice(0, 50) } // Process in batches
        }).catch(console.error);
      }

      setPreschools(transformedPreschools);
      console.log(`Loaded ${transformedPreschools.length} preschools`);

    } catch (err) {
      console.error('Error fetching preschools:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreschools();
  }, []);

  return {
    isLoading,
    error,
    refetch: fetchPreschools
  };
};