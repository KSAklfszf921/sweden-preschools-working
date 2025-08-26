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
      throw new Error('Google API key not configured');
    }

    const { lat, lng, heading = 0, pitch = 0, fov = 90, size = '640x640', preschoolId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get Street View metadata first to check availability
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${googleApiKey}`;
    const metadataResponse = await fetch(metadataUrl);
    const metadataData = await metadataResponse.json();
    
    let panoId = null;
    if (metadataData.status === 'OK') {
      panoId = metadataData.pano_id;
    }

    // Generate Street View Static API URL
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${googleApiKey}`;

    // Generate Street View panorama URL for interactive viewing
    const panoramaUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=${fov}`;

    const staticUrl = streetViewUrl;

    // Store the street view URL in the database if preschool_id is provided
    if (preschoolId) {
      const { error: updateError } = await supabase
        .from('preschool_google_data')
        .update({
          street_view_static_url: staticUrl,
          street_view_pano_id: panoId || null,
          last_updated: new Date().toISOString()
        })
        .eq('preschool_id', preschoolId);

      if (updateError) {
        console.error('Error updating street view data:', updateError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        static_url: staticUrl,
        panorama_url: panoramaUrl,
        pano_id: panoId,
        embed_url: `https://www.google.com/maps/embed/v1/streetview?key=${googleApiKey}&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=${fov}`
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating Street View:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});