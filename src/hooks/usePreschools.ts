import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMapStore, type Preschool } from '@/stores/mapStore';

export const usePreschools = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setPreschools, setLoading } = useMapStore();

  const fetchPreschools = async () => {
    try {
      setIsLoading(true);
      setLoading(true);
      setError(null);

      // Fetch preschools with their Google data
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
        `)
        .not('Latitud', 'is', null)
        .not('Longitud', 'is', null);

      if (preschoolsError) throw preschoolsError;

      // Transform data to match store interface
      const transformedPreschools: Preschool[] = (preschoolsData || []).map(preschool => ({
        id: preschool.id,
        namn: preschool.Namn,
        kommun: preschool.Kommun,
        adress: preschool.Adress || '',
        latitud: preschool.Latitud,
        longitud: preschool.Longitud,
        antal_barn: preschool["Antal barn"],
        huvudman: preschool.Huvudman,
        personaltäthet: preschool.Personaltäthet,
        andel_med_förskollärarexamen: preschool["Andel med förskollärarexamen"],
        antal_barngrupper: preschool["Antal barngrupper"],
        google_rating: preschool.preschool_google_data?.[0]?.google_rating,
        google_reviews_count: preschool.preschool_google_data?.[0]?.google_reviews_count,
      }));

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