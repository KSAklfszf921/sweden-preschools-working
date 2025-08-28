import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMapStore, type Preschool } from '@/stores/mapStore';

// ULTRA-LITE VERSION - bara det absolut nödvändiga för att ladda förskolor
export const useUltraLitePreschools = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setPreschools, setLoading } = useMapStore();

  useEffect(() => {
    const loadPreschools = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        setError(null);

        console.log('🚀 UltraLite: Loading preschools with minimal overhead...');

        // Använd den befintliga vyn för att få förskoledata
        const { data, error: supabaseError } = await supabase
          .from('v_forskolor_geo')
          .select('*')
          .limit(1000); // Begränsa för prestanda

        if (supabaseError) {
          throw new Error(`Database error: ${supabaseError.message}`);
        }

        if (!data) {
          throw new Error('Inga förskolor hittades');
        }

        // Enkel data-transformation från v_forskolor_geo vyn
        const preschools: Preschool[] = data.map(item => ({
          id: String(item.id || Math.random()),
          namn: item.namn || 'Okänt namn',
          kommun: item.kommun || 'Okänd kommun', 
          adress: 'Okänd adress', // Inte tillgänglig i denna vy
          latitud: item.latitud || null,
          longitud: item.longitud || null,
          antal_barn: item.antal_barn || null,
          huvudman: item.huvudman || 'Okänd huvudman',
          personaltäthet: null, // Inte tillgänglig i denna vy
          andel_med_förskollärarexamen: null, // Inte tillgänglig i denna vy
          antal_barngrupper: 0, // Inte tillgänglig i denna vy
          google_rating: null, // Inte tillgänglig i denna vy
          updated_at: new Date().toISOString()
        }));

        console.log(`✅ UltraLite: Loaded ${preschools.length} preschools successfully`);

        // Sätt data i store
        setPreschools(preschools);
        setIsLoading(false);
        setLoading(false);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Okänt fel vid laddning';
        console.error('❌ UltraLite: Error loading preschools:', errorMessage);
        setError(errorMessage);
        setIsLoading(false);
        setLoading(false);
      }
    };

    loadPreschools();
  }, [setPreschools, setLoading]);

  return {
    isLoading,
    error
  };
};