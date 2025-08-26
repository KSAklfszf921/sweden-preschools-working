import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types based on the technical guide
interface PreschoolData {
  id: string;
  Namn: string;
  Adress?: string;
  Kommun: string;
  Postnummer?: string;
  Latitud?: number | null;
  Longitud?: number | null;
}

interface GeocodeResult {
  id: string;
  namn: string;
  success: boolean;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  accuracy?: string;
  error?: string;
  updated?: boolean;
}

enum GeocodeErrorType {
  ZERO_RESULTS = 'ZERO_RESULTS',
  OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
  REQUEST_DENIED = 'REQUEST_DENIED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  NETWORK_ERROR = 'NETWORK_ERROR',
  COORDINATES_OUT_OF_BOUNDS = 'COORDINATES_OUT_OF_BOUNDS'
}

interface BatchStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  startTime: Date;
}

// Constants optimized for stability
const OPTIMAL_BATCH_SIZE = 10; // Reduced for testing
const DELAY_BETWEEN_REQUESTS = 300;
const DELAY_BETWEEN_BATCHES = 2000;

// Sweden's geographical boundaries
const SWEDEN_BOUNDS = {
  north: 69.1,    // Treriksröset
  south: 55.0,    // Smygehuk  
  east: 24.2,     // Haparanda (finska gränsen)
  west: 10.0      // Kosteröarna
};

// Utility functions
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidSwedishCoordinate(lat: number, lng: number): boolean {
  return lat >= SWEDEN_BOUNDS.south &&
         lat <= SWEDEN_BOUNDS.north &&
         lng >= SWEDEN_BOUNDS.west &&
         lng <= SWEDEN_BOUNDS.east;
}

function categorizeError(data: any, error?: Error): GeocodeErrorType {
  if (error) return GeocodeErrorType.NETWORK_ERROR;
  if (data.status === 'ZERO_RESULTS') return GeocodeErrorType.ZERO_RESULTS;
  if (data.status === 'OVER_QUERY_LIMIT') return GeocodeErrorType.OVER_QUERY_LIMIT;
  if (data.status === 'REQUEST_DENIED') return GeocodeErrorType.REQUEST_DENIED;
  if (data.status === 'INVALID_REQUEST') return GeocodeErrorType.INVALID_REQUEST;
  return GeocodeErrorType.NETWORK_ERROR;
}

// Smart address strategy with hierarchical fallback
async function buildAddressString(preschool: PreschoolData): Promise<string[]> {
  const addresses: string[] = [];

  // Priority 1: Complete address
  if (preschool.Adress && preschool.Kommun) {
    addresses.push(`${preschool.Adress}, ${preschool.Kommun}, Sverige`);

    // With postal code if available
    if (preschool.Postnummer) {
      addresses.push(`${preschool.Adress}, ${preschool.Postnummer} ${preschool.Kommun}, Sverige`);
    }
  }

  // Priority 2: Name + municipality (for unique preschool names)
  if (preschool.Namn && preschool.Kommun) {
    addresses.push(`${preschool.Namn}, ${preschool.Kommun}, Sverige`);
  }

  // Priority 3: Only municipality (as last resort)
  if (preschool.Kommun) {
    addresses.push(`${preschool.Kommun}, Sverige`);
  }

  return addresses;
}

function constructURL(address: string, googleApiKey: string): string {
  const encodedAddress = encodeURIComponent(address);
  return `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&region=se&language=sv&key=${googleApiKey}`;
}

function processResponse(data: any, address: string): GeocodeResult | null {
  if (data.status !== 'OK' || !data.results?.length) {
    console.log(`❌ Geocoding misslyckades för: ${address} (Status: ${data.status})`);
    return null;
  }

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;

  // Validate coordinates are within Sweden
  if (!isValidSwedishCoordinate(lat, lng)) {
    console.log(`⚠️ Koordinater utanför Sverige: ${lat}, ${lng} för ${address}`);
    return null;
  }

  return {
    id: '',
    namn: '',
    success: true,
    latitude: lat,
    longitude: lng,
    formatted_address: result.formatted_address,
    accuracy: result.geometry.location_type
  };
}

// Robust geocoding with retry logic
async function geocodeWithRetry(address: string, googleApiKey: string, maxRetries: number = 3): Promise<GeocodeResult | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(constructURL(address, googleApiKey));
      const data = await response.json();

      // Handle API limits
      if (data.status === 'OVER_QUERY_LIMIT') {
        console.log(`⚠️ API limit reached, waiting ${1000 * (attempt + 1)}ms...`);
        await delay(1000 * (attempt + 1)); // Exponential backoff
        continue;
      }

      return processResponse(data, address);

    } catch (error) {
      if (attempt < maxRetries) {
        console.log(`🔄 Retry ${attempt + 1}/${maxRetries} after error:`, error);
        await delay(2000);
      }
    }
  }

  return null;
}

// Geocode a single preschool with fallback addresses
async function geocodePreschool(preschool: PreschoolData, googleApiKey: string): Promise<GeocodeResult> {
  const addresses = await buildAddressString(preschool);
  
  for (const address of addresses) {
    console.log(`🔍 Trying address: ${address} for ${preschool.Namn}`);
    
    const result = await geocodeWithRetry(address, googleApiKey);
    if (result) {
      return {
        ...result,
        id: preschool.id,
        namn: preschool.Namn
      };
    }
  }

  return {
    id: preschool.id,
    namn: preschool.Namn,
    success: false,
    error: 'No valid coordinates found for any address variation'
  };
}

function logBatchProgress(stats: BatchStats) {
  const elapsed = Date.now() - stats.startTime.getTime();
  const rate = stats.processed / (elapsed / 1000); // per second
  const eta = (stats.total - stats.processed) / rate;

  console.log(`
📊 BATCH PROGRESS:
  🎯 Processed: ${stats.processed}/${stats.total} (${(stats.processed/stats.total*100).toFixed(1)}%)
  ✅ Successful: ${stats.successful} (${(stats.successful/stats.processed*100).toFixed(1)}%)
  ❌ Failed: ${stats.failed}
  ⏱️ Rate: ${rate.toFixed(1)}/sec
  🕐 ETA: ${Math.round(eta)} seconds
  `);
}

// Update coordinates in database using bulk update function
async function updateCoordinatesInDatabase(results: GeocodeResult[], supabase: any) {
  const successfulResults = results.filter(r => r.success && r.latitude && r.longitude);

  if (successfulResults.length === 0) {
    console.log('💾 No successful results to update in database');
    return [];
  }

  console.log(`💾 Updating ${successfulResults.length} preschools in database...`);

  try {
    // Use direct table updates instead of RPC function that may not exist
    let errors = [];
    for (const result of successfulResults) {
      const { error } = await supabase
        .from('Förskolor')
        .update({
          Latitud: result.latitude,
          Longitud: result.longitude
        })
        .eq('id', result.id);
        
      if (error) {
        console.error(`Failed to update preschool ${result.id}:`, error);
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Database update failed for ${errors.length} items: ${errors[0].message}`);
    }

    console.log(`✅ Successfully updated ${successfulResults.length} coordinates`);
    
    // Mark results as updated
    return results.map(result => ({
      ...result,
      updated: result.success && result.latitude && result.longitude
    }));

  } catch (error) {
    console.error('❌ Database update error:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Geocoding service started');
    
    // Validate environment variables first
    const googleApiKey = Deno.env.get('GOOGLE_GEOCODING_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zfeqsdtddvelapbrwlol.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔍 Environment check:', {
      googleApiKey: googleApiKey ? '✅ Present' : '❌ Missing',
      supabaseUrl: supabaseUrl ? '✅ Present' : '❌ Missing',
      supabaseKey: supabaseKey ? '✅ Present' : '❌ Missing'
    });

    if (!googleApiKey) {
      console.error('❌ Missing GOOGLE_GEOCODING_API_KEY in Edge Function secrets');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'GOOGLE_GEOCODING_API_KEY not configured in Supabase Edge Function secrets',
          details: 'Go to Supabase Dashboard → Settings → Edge Functions → Secrets and add GOOGLE_GEOCODING_API_KEY'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseKey) {
      console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in Edge Function secrets');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'SUPABASE_SERVICE_ROLE_KEY not configured in Supabase Edge Function secrets',
          details: 'Go to Supabase Dashboard → Settings → Edge Functions → Secrets and add SUPABASE_SERVICE_ROLE_KEY'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { preschools } = await req.json();
    
    if (!preschools || !Array.isArray(preschools)) {
      console.error('❌ Invalid preschools data:', typeof preschools);
      return new Response(
        JSON.stringify({ error: 'Invalid preschools data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');

    console.log(`🚀 Starting geocoding process for ${preschools.length} preschools`);
    
    const stats: BatchStats = {
      total: preschools.length,
      processed: 0,
      successful: 0,
      failed: 0,
      startTime: new Date()
    };

    const allResults: GeocodeResult[] = [];
    const batchSize = Math.min(OPTIMAL_BATCH_SIZE, preschools.length);

    // Process in optimal batches
    for (let i = 0; i < preschools.length; i += batchSize) {
      const batch = preschools.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(preschools.length / batchSize);
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches}: ${batch.length} preschools`);

      for (const preschool of batch) {
        // Skip if already has valid coordinates
        if (preschool.Latitud && preschool.Longitud && 
            preschool.Latitud !== 0 && preschool.Longitud !== 0) {
          console.log(`⏭️ Skipping ${preschool.Namn} - already has coordinates`);
          allResults.push({
            id: preschool.id,
            namn: preschool.Namn,
            success: true,
            latitude: preschool.Latitud,
            longitude: preschool.Longitud,
            error: 'Already has coordinates'
          });
          stats.processed++;
          stats.successful++;
          continue;
        }

        try {
          const result = await geocodePreschool(preschool, googleApiKey);
          allResults.push(result);
          
          stats.processed++;
          if (result.success) {
            stats.successful++;
            console.log(`✅ Successfully geocoded: ${result.namn} -> ${result.latitude}, ${result.longitude}`);
          } else {
            stats.failed++;
            console.log(`❌ Failed to geocode: ${result.namn} - ${result.error}`);
          }

          // Rate limiting between requests
          if (stats.processed < stats.total) {
            await delay(DELAY_BETWEEN_REQUESTS);
          }

        } catch (error) {
          console.error(`❌ Exception processing ${preschool.Namn}:`, error);
          allResults.push({
            id: preschool.id,
            namn: preschool.Namn,
            success: false,
            error: `Processing error: ${error.message}`
          });
          stats.processed++;
          stats.failed++;
        }
      }

      // Log progress
      logBatchProgress(stats);

      // Wait between batches
      if (i + batchSize < preschools.length) {
        console.log(`⏸️ Waiting ${DELAY_BETWEEN_BATCHES}ms between batches...`);
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    // Update database with results
    const updatedResults = await updateCoordinatesInDatabase(allResults, supabase);

    const finalStats = {
      total: stats.total,
      processed: stats.processed,
      successful: stats.successful,
      failed: stats.failed,
      updated: updatedResults.filter(r => r.updated).length
    };

    console.log(`🎯 Geocoding completed: ${finalStats.successful}/${finalStats.total} successful, ${finalStats.updated} updated in database`);

    return new Response(
      JSON.stringify({
        success: true,
        ...finalStats,
        results: updatedResults,
        message: `Geocoding completed: ${finalStats.successful} successful out of ${finalStats.total} processed, ${finalStats.updated} updated in database`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('🚨 Geocoding service error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Critical error in geocoding service'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});