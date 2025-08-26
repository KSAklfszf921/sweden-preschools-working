import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Preschool {
  id: string;
  namn: string;
  adress: string;
  kommun: string;
  latitud?: number;
  longitud?: number;
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

    const googleApiKey = Deno.env.get('GOOGLE_GEOCODING_API_KEY');
    if (!googleApiKey) {
      console.error('Missing GOOGLE_GEOCODING_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
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
          // Skip if already has coordinates
          if (preschool.latitud && preschool.longitud) {
            continue;
          }

          // Construct address for geocoding
          const address = `${preschool.adress}, ${preschool.kommun}, Sweden`;
          const encodedAddress = encodeURIComponent(address);
          
          // Call Google Geocoding API
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${googleApiKey}&region=se&language=sv`;
          
          const response = await fetch(geocodeUrl);
          const data = await response.json();

          if (data.status === 'OK' && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            const lat = location.lat;
            const lng = location.lng;

            // Validate coordinates are within Sweden bounds
            if (lat >= 55.0 && lat <= 69.1 && lng >= 10.9 && lng <= 24.2) {
              // Update database
              const { error: updateError } = await supabase
                .from('Förskolor')
                .update({
                  'Latitud': lat,
                  'Longitud': lng
                })
                .eq('id', preschool.id);

              if (!updateError) {
                results.push({
                  id: preschool.id,
                  namn: preschool.namn,
                  success: true,
                  coordinates: { lat, lng }
                });
                console.log(`✅ Geocoded: ${preschool.namn} -> ${lat}, ${lng}`);
              } else {
                console.error(`❌ DB Update failed for ${preschool.namn}:`, updateError);
                results.push({
                  id: preschool.id,
                  namn: preschool.namn,
                  success: false,
                  error: 'Database update failed'
                });
              }
            } else {
              console.warn(`⚠️ Invalid coordinates for ${preschool.namn}: ${lat}, ${lng}`);
              results.push({
                id: preschool.id,
                namn: preschool.namn,
                success: false,
                error: 'Coordinates outside Sweden'
              });
            }
          } else {
            console.warn(`⚠️ Geocoding failed for ${preschool.namn}: ${data.status}`);
            results.push({
              id: preschool.id,
              namn: preschool.namn,
              success: false,
              error: `Geocoding failed: ${data.status}`
            });
          }

          // Rate limiting - wait 100ms between requests
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`❌ Error processing ${preschool.namn}:`, error);
          results.push({
            id: preschool.id,
            namn: preschool.namn,
            success: false,
            error: error.message
          });
        }
      }

      // Wait between batches
      if (i + batchSize < preschools.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`🎯 Geocoding completed: ${results.filter(r => r.success).length}/${results.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        successful: results.filter(r => r.success).length,
        results
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