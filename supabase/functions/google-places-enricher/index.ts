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

    const requestData = await req.json();
    const { preschoolId, lat, lng, address, name } = requestData;

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

    // 2. Get detailed place information with extended fields
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,rating,user_ratings_total,photos,reviews,formatted_address,website,formatted_phone_number,opening_hours,types,price_level,business_status,editorial_summary&key=${googleApiKey}`;
      
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

    // 5. Download and store images in background with priority
    if (placeDetails?.photos && placeDetails.photos.length > 0) {
      EdgeRuntime.waitUntil(
        processImages(preschoolId, placeDetails.photos, googleApiKey, supabase, {
          priority: requestData.priority || 0,
          maxImages: 5 // Store more images
        })
      );
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

// Enhanced background function to process and store images
async function processImages(
  preschoolId: string, 
  photos: any[], 
  googleApiKey: string, 
  supabase: any,
  options: { priority?: number; maxImages?: number } = {}
) {
  const { maxImages = 5 } = options;
  console.log(`📸 Processing ${Math.min(photos.length, maxImages)} images for preschool ${preschoolId}`);
  
  try {
    const imagePromises = [];
    
    for (let i = 0; i < Math.min(photos.length, maxImages); i++) {
      const photo = photos[i];
      
      imagePromises.push(
        (async () => {
          try {
            // Try different image sizes for optimization
            const sizes = [800, 600, 400];
            let imageBlob = null;
            let maxWidth = 800;
            
            for (const size of sizes) {
              const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${size}&photo_reference=${photo.photo_reference}&key=${googleApiKey}`;
              const imageResponse = await fetch(photoUrl);
              
              if (imageResponse.ok) {
                imageBlob = await imageResponse.blob();
                maxWidth = size;
                break;
              }
            }
            
            if (!imageBlob) {
              console.log(`⚠️ Failed to download image ${i} for preschool ${preschoolId}`);
              return;
            }
            
            const fileName = `${preschoolId}_google_${i}_${maxWidth}.jpg`;
            const filePath = `preschool-images/${fileName}`;
            
            // Upload to Supabase Storage with retry logic
            let uploadSuccess = false;
            let retries = 3;
            
            while (!uploadSuccess && retries > 0) {
              const { error: uploadError } = await supabase.storage
                .from('preschool-images')
                .upload(filePath, imageBlob, {
                  contentType: 'image/jpeg',
                  upsert: true
                });

              if (!uploadError) {
                uploadSuccess = true;
                
                // Get the public URL for the stored image
                const { data: publicUrlData } = supabase.storage
                  .from('preschool-images')
                  .getPublicUrl(filePath);

                // Store image metadata
                await supabase
                  .from('preschool_images')
                  .upsert({
                    preschool_id: preschoolId,
                    image_url: publicUrlData.publicUrl,
                    image_type: 'google_places',
                    storage_path: filePath,
                    width: maxWidth,
                    height: Math.round(maxWidth * 0.75) // Estimate aspect ratio
                  }, {
                    onConflict: 'preschool_id,storage_path'
                  });
                
                console.log(`✅ Uploaded image ${i} for preschool ${preschoolId} (${maxWidth}px)`);
              } else {
                console.error(`❌ Upload error for image ${i}:`, uploadError);
                retries--;
                if (retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
                }
              }
            }
          } catch (error) {
            console.error(`💥 Error processing image ${i} for preschool ${preschoolId}:`, error);
          }
        })()
      );
      
      // Small delay between image processing
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Wait for all images to be processed
    await Promise.allSettled(imagePromises);
    console.log(`🎯 Completed image processing for preschool ${preschoolId}`);
    
  } catch (error) {
    console.error(`🚨 Error in processImages for preschool ${preschoolId}:`, error);
  }
}