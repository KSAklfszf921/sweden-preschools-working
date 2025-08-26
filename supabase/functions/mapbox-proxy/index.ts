import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, params } = await req.json();
    
    const mapboxToken = Deno.env.get('MAPBOX_TOKEN');
    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct Mapbox API URL
    const urlParams = new URLSearchParams({ ...params, access_token: mapboxToken });
    const mapboxUrl = `https://api.mapbox.com${endpoint}?${urlParams}`;

    // Forward request to Mapbox
    const response = await fetch(mapboxUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      }
    });

  } catch (error) {
    console.error('Mapbox proxy error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});