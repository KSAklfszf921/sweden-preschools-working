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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get database statistics
    const [
      preschoolCount,
      googleDataCount,
      imagesCount,
      favoritesCount,
      searchHistoryCount,
      missingCoordinates,
      withGoogleData,
      withImages
    ] = await Promise.all([
      // Total preschools
      supabase.from('Förskolor').select('id', { count: 'exact', head: true }),
      
      // Google data entries
      supabase.from('preschool_google_data').select('id', { count: 'exact', head: true }),
      
      // Images count
      supabase.from('preschool_images').select('id', { count: 'exact', head: true }),
      
      // User favorites
      supabase.from('user_favorites').select('id', { count: 'exact', head: true }),
      
      // Search history
      supabase.from('user_search_history').select('id', { count: 'exact', head: true }),
      
      // Missing coordinates
      supabase.from('Förskolor')
        .select('id', { count: 'exact', head: true })
        .or('Latitud.is.null,Longitud.is.null,Latitud.eq.0,Longitud.eq.0'),
      
      // With Google data
      supabase.from('Förskolor')
        .select(`
          id,
          preschool_google_data!inner(id)
        `, { count: 'exact', head: true }),
      
      // With images
      supabase.from('Förskolor')
        .select(`
          id,
          preschool_images!inner(id)
        `, { count: 'exact', head: true })
    ])

    // Get storage statistics
    const { data: storageData } = await supabase.storage.listBuckets()
    
    let totalStorageSize = 0
    const bucketStats = []
    
    if (storageData) {
      for (const bucket of storageData) {
        try {
          const { data: files } = await supabase.storage.from(bucket.name).list()
          if (files) {
            const bucketSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
            totalStorageSize += bucketSize
            bucketStats.push({
              name: bucket.name,
              fileCount: files.length,
              size: bucketSize,
              sizeFormatted: formatBytes(bucketSize)
            })
          }
        } catch (error) {
          console.log(`Could not get stats for bucket ${bucket.name}:`, error)
          bucketStats.push({
            name: bucket.name,
            fileCount: 0,
            size: 0,
            sizeFormatted: '0 B'
          })
        }
      }
    }

    // Get recent activity (app logs)
    const { data: recentLogs } = await supabase
      .from('app_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    const stats = {
      database: {
        totalPreschools: preschoolCount.count || 0,
        missingCoordinates: missingCoordinates.count || 0,
        withGoogleData: withGoogleData.count || 0,
        withImages: withImages.count || 0,
        googleDataEntries: googleDataCount.count || 0,
        imagesCount: imagesCount.count || 0,
        userFavorites: favoritesCount.count || 0,
        searchHistory: searchHistoryCount.count || 0,
        coordinatesCoverage: preschoolCount.count ? 
          Math.round(((preschoolCount.count - (missingCoordinates.count || 0)) / preschoolCount.count) * 100) : 0,
        googleDataCoverage: preschoolCount.count ? 
          Math.round(((withGoogleData.count || 0) / preschoolCount.count) * 100) : 0,
        imagesCoverage: preschoolCount.count ? 
          Math.round(((withImages.count || 0) / preschoolCount.count) * 100) : 0
      },
      storage: {
        totalSize: totalStorageSize,
        totalSizeFormatted: formatBytes(totalStorageSize),
        buckets: bucketStats
      },
      activity: {
        recentLogs: recentLogs || []
      },
      systemHealth: {
        databaseOnline: true,
        lastUpdated: new Date().toISOString()
      }
    }

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error getting admin stats:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get admin statistics',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}