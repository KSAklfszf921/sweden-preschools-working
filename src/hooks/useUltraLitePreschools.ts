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

        // Enkel Supabase-förfrågan utan tunga optimeringar
        const { data, error: supabaseError } = await supabase
          .from('forskoleregister')
          .select('*')
          .limit(1000); // Begränsa för prestanda

        if (supabaseError) {
          throw new Error(`Database error: ${supabaseError.message}`);
        }

        if (!data) {
          throw new Error('Inga förskolor hittades');
        }

        // Enkel data-transformation utan tunga optimeringar
        const preschools: Preschool[] = data.map(item => ({
          id: item.id || String(Math.random()),
          namn: item.Namn || 'Okänt namn',
          kommun: item.Kommun || 'Okänd kommun',
          adress: item.Adress || 'Okänd adress',
          latitud: item.Latitud ? parseFloat(item.Latitud) : null,
          longitud: item.Longitud ? parseFloat(item.Longitud) : null,
          antal_barn: item.Antal_barn ? parseInt(item.Antal_barn) : null,
          huvudman: item.Huvudman || 'Okänd huvudman',
          personaltäthet: item.Personaltäthet ? parseFloat(item.Personaltäthet) : null,
          google_rating: item.google_rating ? parseFloat(item.google_rating) : null,
          updated_at: item.updated_at || new Date().toISOString(),
          typ: item.Typ || 'förskola',
          status: item.Status || 'aktiv',
          telefon: item.Telefon || null,
          email: item.Email || null,
          hemsida: item.Hemsida || null,
          oppet_tider: item.Oppet_tider || null,
          aldersgrupp: item.Aldersgrupp || null,
          sprak: item.Sprak || null,
          mat_allergi: item.Mat_allergi || null,
          utomhusaktiviteter: item.Utomhusaktiviteter || null,
          avgift: item.Avgift || null,
          foraldrakooperativ: item.Foraldrakooperativ || false
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