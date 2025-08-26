import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { action, preschoolId, lat, lng, address } = await req.json();

    console.log(`Processing ${action} request for preschool ${preschoolId}`);

    switch (action) {
      case 'searchPlace': {
        // Search for the preschool using Google Places Text Search
        const searchQuery = `förskola ${address}`;
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&location=${lat},${lng}&radius=200&key=${googleApiKey}`;
        
        const searchResponse = await fetch(textSearchUrl);
        const searchData = await searchResponse.json();

        if (searchData.results && searchData.results.length > 0) {
          const place = searchData.results[0];
          
          // Get detailed place information
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=place_id,rating,user_ratings_total,photos,reviews,formatted_address,website,formatted_phone_number&key=${googleApiKey}`;
          
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();

          if (detailsData.result) {
            const result = detailsData.result;
            
            // Extract photo references
            const photoReferences = result.photos ? result.photos.map((photo: any) => photo.photo_reference) : [];

            // Store in database
            const { error } = await supabase
              .from('preschool_google_data')
              .upsert({
                preschool_id: preschoolId,
                google_place_id: result.place_id,
                google_rating: result.rating || null,
                google_reviews_count: result.user_ratings_total || 0,
                google_photos: photoReferences,
                last_updated: new Date().toISOString()
              }, {
                onConflict: 'preschool_id'
              });

            if (error) {
              console.error('Database error:', error);
              throw error;
            }

            return new Response(JSON.stringify({
              success: true,
              data: {
                place_id: result.place_id,
                rating: result.rating,
                reviews_count: result.user_ratings_total,
                photos: photoReferences,
                reviews: result.reviews || [],
                website: result.website,
                phone: result.formatted_phone_number,
                address: result.formatted_address
              }
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        return new Response(JSON.stringify({
          success: false,
          message: 'No place found'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'getPhoto': {
        const { photoReference, maxWidth = 400 } = await req.json();
        
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${googleApiKey}`;
        
        return new Response(JSON.stringify({
          success: true,
          data: { photoUrl }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'getNearbyPlaces': {
        // Get nearby places like parks, schools, transport
        const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=park|school|transit_station&key=${googleApiKey}`;
        
        const nearbyResponse = await fetch(nearbyUrl);
        const nearbyData = await nearbyResponse.json();

        return new Response(JSON.stringify({
          success: true,
          data: nearbyData.results || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});