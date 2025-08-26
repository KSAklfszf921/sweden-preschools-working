import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EnrichmentProgress {
  total: number;
  processed: number;
  errors: number;
  isRunning: boolean;
}

export const useGoogleDataEnrichment = () => {
  const [progress, setProgress] = useState<EnrichmentProgress>({
    total: 0,
    processed: 0,
    errors: 0,
    isRunning: false
  });

  const enrichMissingData = useCallback(async () => {
    if (progress.isRunning) return;

    console.log('🚀 Starting optimized Google data enrichment...');
    setProgress(prev => ({ ...prev, isRunning: true, processed: 0, errors: 0 }));

    try {
      // Get existing Google data IDs to exclude
      const { data: existingGoogleData } = await supabase
        .from('preschool_google_data')
        .select('preschool_id, last_updated');

      const existingIds = existingGoogleData?.map(item => item.preschool_id) || [];
      
      // Get preschools needing enrichment
      const { data: preschoolsToEnrich, error } = await supabase
        .from('Förskolor')
        .select(`
          id,
          "Namn",
          "Adress",
          "Latitud",
          "Longitud"
        `)
        .not('Latitud', 'is', null)
        .not('Longitud', 'is', null)
        .not('id', 'in', existingIds.length > 0 ? existingIds : ['00000000-0000-0000-0000-000000000000'])
        .order('"Antal barn"', { ascending: false })
        .limit(100); // Larger batches for better coverage

      if (error) {
        console.error('Error fetching preschools:', error);
        return;
      }

      if (!preschoolsToEnrich || preschoolsToEnrich.length === 0) {
        console.log('✅ No preschools need enrichment');
        return;
      }

      console.log(`📊 Found ${preschoolsToEnrich.length} preschools to enrich`);
      setProgress(prev => ({ ...prev, total: preschoolsToEnrich.length }));

      // Enhanced batch processing with retries and parallel execution
      const batchSize = 10; // Larger batches for efficiency
      const maxRetries = 3;
      
      for (let i = 0; i < preschoolsToEnrich.length; i += batchSize) {
        const batch = preschoolsToEnrich.slice(i, i + batchSize);
        
        console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(preschoolsToEnrich.length / batchSize)}`);
        
        // Process batch in parallel with retries
        const batchPromises = batch.map(async (preschool) => {
          let retries = 0;
          while (retries < maxRetries) {
            try {
              const { error: enrichError } = await supabase.functions.invoke('google-places-enricher', {
                body: {
                  preschoolId: preschool.id,
                  lat: preschool.Latitud,
                  lng: preschool.Longitud,
                  address: preschool.Adress,
                  name: preschool.Namn
                }
              });

              if (enrichError) {
                throw enrichError;
              }
              
              setProgress(prev => ({ ...prev, processed: prev.processed + 1 }));
              return { success: true, preschool: preschool.id };
            } catch (error) {
              retries++;
              if (retries >= maxRetries) {
                console.error(`❌ Failed to enrich ${preschool.id} after ${maxRetries} retries:`, error);
                setProgress(prev => ({ 
                  ...prev, 
                  processed: prev.processed + 1,
                  errors: prev.errors + 1 
                }));
                return { success: false, preschool: preschool.id, error };
              }
              // Wait before retry with exponential backoff
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
            }
          }
        });

        await Promise.allSettled(batchPromises);

        // Rate limiting between batches
        if (i + batchSize < preschoolsToEnrich.length) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Shorter wait for efficiency
        }
      }

      console.log(`✅ Google data enrichment completed. Processed: ${progress.processed}, Errors: ${progress.errors}`);
    } catch (error) {
      console.error('❌ Error in enrichment process:', error);
    } finally {
      setProgress(prev => ({ ...prev, isRunning: false }));
    }
  }, [progress]);

  const getEnrichmentStats = useCallback(async () => {
    try {
      const { data: totalPreschools } = await supabase
        .from('Förskolor')
        .select('id', { count: 'exact' })
        .not('Latitud', 'is', null);

      const { data: enrichedPreschools } = await supabase
        .from('preschool_google_data')
        .select('id', { count: 'exact' });

      return {
        total: totalPreschools?.length || 0,
        enriched: enrichedPreschools?.length || 0,
        percentage: totalPreschools?.length ? 
          Math.round((enrichedPreschools?.length || 0) / totalPreschools.length * 100) : 0
      };
    } catch (error) {
      console.error('Error getting enrichment stats:', error);
      return { total: 0, enriched: 0, percentage: 0 };
    }
  }, []);

  return {
    progress,
    enrichMissingData,
    getEnrichmentStats
  };
};