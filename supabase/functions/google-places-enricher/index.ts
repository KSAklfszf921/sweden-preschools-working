import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google Places API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { preschoolId, lat, lng, address, name } = await req.json();

    console.log(`Enriching preschool ${preschoolId} - ${name} at ${address}`);

    // 1. Search for the preschool using Google Places Nearby Search
    const nearbySearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=200&type=school&keyword=förskola+${encodeURIComponent(name)}&key=${googleApiKey}`;
    
    const nearbyResponse = await fetch(nearbySearchUrl);
    const nearbyData = await nearbyResponse.json();

    let placeDetails = null;
    let placeId = null;

    if (nearbyData.results && nearbyData.results.length > 0) {
      // Find the best match based on name similarity
      const bestMatch = nearbyData.results.find((place: any) => 
        place.name.toLowerCase().includes(name.toLowerCase().substring(0, 10))
      ) || nearbyData.results[0];

      placeId = bestMatch.place_id;

      // 2. Get detailed place information
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,rating,user_ratings_total,photos,reviews,formatted_address,website,formatted_phone_number,opening_hours&key=${googleApiKey}`;
      
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (detailsData.result) {
        placeDetails = detailsData.result;
      }
    }

    // 3. Get Street View data
    let streetViewPanoId = null;
    try {
      const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${googleApiKey}`;
      const streetViewResponse = await fetch(streetViewUrl);
      const streetViewData = await streetViewResponse.json();
      
      if (streetViewData.status === 'OK') {
        streetViewPanoId = streetViewData.pano_id;
      }
    } catch (error) {
      console.log('Street View data not available:', error);
    }

    // 4. Store enhanced data in database
    const enhancedData = {
      preschool_id: preschoolId,
      google_place_id: placeId,
      google_rating: placeDetails?.rating || null,
      google_reviews_count: placeDetails?.user_ratings_total || 0,
      contact_phone: placeDetails?.formatted_phone_number || null,
      website_url: placeDetails?.website || null,
      opening_hours: placeDetails?.opening_hours ? JSON.stringify(placeDetails.opening_hours) : null,
      google_photos: placeDetails?.photos ? placeDetails.photos.map((photo: any) => photo.photo_reference) : [],
      street_view_pano_id: streetViewPanoId,
      reviews: placeDetails?.reviews ? JSON.stringify(placeDetails.reviews.slice(0, 5)) : null, // Store up to 5 reviews
      last_updated: new Date().toISOString()
    };

    const { error } = await supabase
      .from('preschool_google_data')
      .upsert(enhancedData, {
        onConflict: 'preschool_id'
      });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // 5. Download and store images in background
    if (placeDetails?.photos && placeDetails.photos.length > 0) {
      // Use EdgeRuntime.waitUntil for background image processing
      EdgeRuntime.waitUntil(processImages(preschoolId, placeDetails.photos, googleApiKey, supabase));
    }

    console.log(`Successfully enriched preschool ${preschoolId} with Google data`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        place_id: placeId,
        rating: placeDetails?.rating,
        reviews_count: placeDetails?.user_ratings_total,
        phone: placeDetails?.formatted_phone_number,
        website: placeDetails?.website,
        photos_count: placeDetails?.photos?.length || 0,
        has_street_view: !!streetViewPanoId
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error enriching preschool:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Background function to process and store images
async function processImages(preschoolId: string, photos: any[], googleApiKey: string, supabase: any) {
  try {
    for (let i = 0; i < Math.min(photos.length, 3); i++) { // Process max 3 images
      const photo = photos[i];
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${googleApiKey}`;
      
      // Download image
      const imageResponse = await fetch(photoUrl);
      if (!imageResponse.ok) continue;
      
      const imageBlob = await imageResponse.blob();
      const fileName = `${preschoolId}_google_${i}.jpg`;
      const filePath = `preschool-images/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('preschool-images')
        .upload(filePath, imageBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (!uploadError) {
        // Store image metadata
        await supabase
          .from('preschool_images')
          .insert({
            preschool_id: preschoolId,
            image_url: photoUrl,
            image_type: 'google_photo',
            storage_path: filePath
          });
      }
    }
  } catch (error) {
    console.error('Error processing images:', error);
  }
}