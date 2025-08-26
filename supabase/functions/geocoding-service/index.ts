import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Preschool {
  id: string;
  Namn: string;
  Adress: string;
  Kommun: string;
  Latitud?: number;
  Longitud?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preschools } = await req.json();
    
    if (!preschools || !Array.isArray(preschools)) {
      return new Response(
        JSON.stringify({ error: 'Invalid preschools data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const googleApiKey = Deno.env.get('GOOGLE_GEOCODING_API_KEY') || Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      console.error('Missing GOOGLE_GEOCODING_API_KEY or GOOGLE_PLACES_API_KEY');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing Google API key. Please configure GOOGLE_GEOCODING_API_KEY secret.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = [];
    const batchSize = 20; // Process in smaller batches to avoid rate limits

    for (let i = 0; i < preschools.length; i += batchSize) {
      const batch = preschools.slice(i, i + batchSize);
      
      for (const preschool of batch) {
        try {
          // Skip if already has valid coordinates
          if (preschool.Latitud && preschool.Longitud && 
              preschool.Latitud !== 0 && preschool.Longitud !== 0) {
            console.log(`⏭️ Skipping ${preschool.Namn} - already has coordinates`);
            continue;
          }

          // Construct address for geocoding - more specific Swedish format
          const address = `${preschool.Adress}, ${preschool.Kommun}, Sverige`;
          const encodedAddress = encodeURIComponent(address);
          
          console.log(`🔍 Geocoding: ${preschool.Namn} at ${address}`);
          
          // Call Google Geocoding API with proper parameters
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${googleApiKey}&region=se&language=sv&components=country:SE`;
          
          const response = await fetch(geocodeUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log(`📍 API Response for ${preschool.Namn}:`, data.status, data.results?.length || 0, 'results');

          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            const lat = parseFloat(location.lat);
            const lng = parseFloat(location.lng);

            // Validate coordinates are within Sweden bounds
            if (lat >= 55.0 && lat <= 69.1 && lng >= 10.9 && lng <= 24.2) {
              // Update database with correct column names (capital L)
              const { error: updateError } = await supabase
                .from('Förskolor')
                .update({
                  Latitud: lat,
                  Longitud: lng
                })
                .eq('id', preschool.id);

              if (!updateError) {
                results.push({
                  id: preschool.id,
                  namn: preschool.Namn,
                  success: true,
                  coordinates: { lat, lng },
                  address: data.results[0].formatted_address
                });
                console.log(`✅ Successfully geocoded: ${preschool.Namn} -> ${lat}, ${lng}`);
              } else {
                console.error(`❌ DB Update failed for ${preschool.Namn}:`, updateError);
                results.push({
                  id: preschool.id,
                  namn: preschool.Namn,
                  success: false,
                  error: `Database update failed: ${updateError.message || 'Unknown error'}`
                });
              }
            } else {
              console.warn(`⚠️ Coordinates outside Sweden bounds for ${preschool.Namn}: ${lat}, ${lng}`);
              results.push({
                id: preschool.id,
                namn: preschool.Namn,
                success: false,
                error: `Invalid coordinates (outside Sweden): ${lat}, ${lng}`
              });
            }
          } else if (data.status === 'ZERO_RESULTS') {
            console.warn(`⚠️ No geocoding results found for ${preschool.Namn}: ${address}`);
            results.push({
              id: preschool.id,
              namn: preschool.Namn,
              success: false,
              error: 'No geocoding results found for this address'
            });
          } else {
            console.warn(`⚠️ Geocoding failed for ${preschool.Namn}: ${data.status}`);
            results.push({
              id: preschool.id,
              namn: preschool.Namn,
              success: false,
              error: `Geocoding API error: ${data.status} - ${data.error_message || 'Unknown error'}`
            });
          }

          // Rate limiting - wait between requests to respect Google's limits
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`❌ Exception processing ${preschool.Namn}:`, error);
          results.push({
            id: preschool.id,
            namn: preschool.Namn,
            success: false,
            error: `Processing error: ${error.message}`
          });
        }
      }

      // Wait between batches to be respectful to Google's API
      if (i + batchSize < preschools.length) {
        console.log(`⏸️ Waiting between batches... (${i + batchSize}/${preschools.length})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    const successfulCount = results.filter(r => r.success).length;
    console.log(`🎯 Geocoding completed: ${successfulCount}/${results.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        successful: successfulCount,
        results,
        message: `Geocoding completed: ${successfulCount} successful out of ${results.length} processed`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Geocoding service error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});