import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Central API manager to handle all external API calls and caching
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const requestData = await req.json();
    const { type, endpoint, params, cache_duration = 3600, priority = 0 } = requestData;

    console.log(`API Manager: Processing ${type} request to ${endpoint}`);

    // Check cache first
    const cacheKey = `${type}_${endpoint}_${JSON.stringify(params)}`;
    const { data: cachedData } = await supabase
      .from('api_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log(`📦 Cache hit for ${cacheKey}`);
      return new Response(JSON.stringify({
        success: true,
        data: cachedData.response_data,
        cached: true,
        timestamp: cachedData.created_at
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route to appropriate API handler
    let apiResponse;
    switch (type) {
      case 'google_places':
        apiResponse = await handleGooglePlaces(endpoint, params);
        break;
      case 'google_maps':
        apiResponse = await handleGoogleMaps(endpoint, params);
        break;
      case 'mapbox':
        apiResponse = await handleMapbox(endpoint, params);
        break;
      case 'street_view':
        apiResponse = await handleStreetView(endpoint, params);
        break;
      default:
        throw new Error(`Unknown API type: ${type}`);
    }

    // Store in cache with expiration
    const expiresAt = new Date(Date.now() + cache_duration * 1000).toISOString();
    await supabase
      .from('api_cache')
      .upsert({
        cache_key: cacheKey,
        api_type: type,
        endpoint,
        params: JSON.stringify(params),
        response_data: apiResponse,
        expires_at: expiresAt,
        priority,
        created_at: new Date().toISOString()
      });

    console.log(`✅ API Manager: Cached response for ${cacheKey} until ${expiresAt}`);

    return new Response(JSON.stringify({
      success: true,
      data: apiResponse,
      cached: false,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API Manager Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Google Places API handler
async function handleGooglePlaces(endpoint: string, params: any) {
  const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!googleApiKey) {
    throw new Error('Google Places API key not configured');
  }

  const queryString = new URLSearchParams(params).toString();
  const url = `https://maps.googleapis.com/maps/api/place/${endpoint}?${queryString}&key=${googleApiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }
  
  return await response.json();
}

// Google Maps API handler
async function handleGoogleMaps(endpoint: string, params: any) {
  const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!googleApiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const queryString = new URLSearchParams(params).toString();
  const url = `https://maps.googleapis.com/maps/api/${endpoint}?${queryString}&key=${googleApiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Maps API error: ${response.status}`);
  }
  
  return await response.json();
}

// Mapbox API handler
async function handleMapbox(endpoint: string, params: any) {
  const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
  if (!mapboxToken) {
    throw new Error('Mapbox access token not configured');
  }

  const queryString = new URLSearchParams({...params, access_token: mapboxToken}).toString();
  const url = `https://api.mapbox.com/${endpoint}?${queryString}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox API error: ${response.status}`);
  }
  
  return await response.json();
}

// Street View API handler
async function handleStreetView(endpoint: string, params: any) {
  const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!googleApiKey) {
    throw new Error('Google API key not configured');
  }

  const queryString = new URLSearchParams(params).toString();
  const url = `https://maps.googleapis.com/maps/api/streetview/${endpoint}?${queryString}&key=${googleApiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Street View API error: ${response.status}`);
  }
  
  return await response.json();
}