import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    const { origin, destination, mode = 'driving', language = 'sv', units = 'metric' } = await req.json();

    if (!origin || !destination) {
      throw new Error('Origin and destination are required');
    }

    // Construct Google Directions API URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
    const params = new URLSearchParams({
      origin: origin,
      destination: destination,
      mode: mode,
      language: language,
      units: units,
      key: googleApiKey
    });

    const directionsUrl = `${baseUrl}?${params.toString()}`;

    // Fetch directions from Google API
    const response = await fetch(directionsUrl);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Directions API error:', data);
      return new Response(JSON.stringify({
        success: false,
        error: `Directions API error: ${data.status}`,
        data: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 but with error flag
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-directions function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});