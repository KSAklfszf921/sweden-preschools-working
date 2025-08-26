import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { batchSize = 10, dryRun = false } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')!
    
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get preschools missing coordinates
    const { data: preschools, error } = await supabase
      .from('Förskolor')
      .select('id, "Namn", "Adress", "Kommun", "Latitud", "Longitud"')
      .or('Latitud.is.null,Longitud.is.null,Latitud.eq.0,Longitud.eq.0')
      .limit(batchSize)

    if (error) {
      throw error
    }

    if (!preschools || preschools.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No preschools with missing coordinates found',
          processed: 0,
          success: 0,
          errors: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${preschools.length} preschools...`)
    
    let successCount = 0
    let errorCount = 0
    const results = []

    for (const preschool of preschools) {
      try {
        // Create search query
        const address = `${preschool.Adress}, ${preschool.Kommun}, Sweden`
        const encodedAddress = encodeURIComponent(address)
        
        // Call Google Geocoding API
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${googleApiKey}&language=sv&region=se`
        
        console.log(`Geocoding: ${preschool.Namn} - ${address}`)
        
        const response = await fetch(geocodeUrl)
        const data = await response.json()
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location
          const lat = location.lat
          const lng = location.lng
          
          console.log(`Found coordinates: ${lat}, ${lng}`)
          
          if (!dryRun) {
            // Update the preschool with coordinates
            const { error: updateError } = await supabase
              .from('Förskolor')
              .update({
                'Latitud': lat,
                'Longitud': lng
              })
              .eq('id', preschool.id)
            
            if (updateError) {
              throw updateError
            }
          }
          
          successCount++
          results.push({
            id: preschool.id,
            name: preschool.Namn,
            address: address,
            coordinates: { lat, lng },
            status: 'success',
            updated: !dryRun
          })
          
        } else {
          console.log(`Geocoding failed for ${preschool.Namn}: ${data.status}`)
          errorCount++
          results.push({
            id: preschool.id,
            name: preschool.Namn,
            address: address,
            status: 'failed',
            error: data.status,
            updated: false
          })
        }
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`Error processing ${preschool.Namn}:`, error)
        errorCount++
        results.push({
          id: preschool.id,
          name: preschool.Namn,
          status: 'error',
          error: error.message,
          updated: false
        })
      }
    }

    const response = {
      message: `Processed ${preschools.length} preschools`,
      processed: preschools.length,
      success: successCount,
      errors: errorCount,
      dryRun,
      results
    }

    console.log('Geocoding batch complete:', response)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in fix-missing-geocoding:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process geocoding',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})