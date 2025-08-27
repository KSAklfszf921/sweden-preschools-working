import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Dedicated image downloader and storage service
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const requestData = await req.json();
    const { 
      images, 
      preschool_id, 
      image_type = 'google_places',
      max_size = 1200,
      quality = 85 
    } = requestData;

    console.log(`🖼️  Image Downloader: Processing ${images.length} images for preschool ${preschool_id}`);

    const results = [];

    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      const { url, reference, width, height } = imageData;

      try {
        // Download the image
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Failed to download image ${i}: ${response.status}`);
          continue;
        }

        const imageBlob = await response.blob();
        const fileExtension = getFileExtension(response.headers.get('content-type') || 'image/jpeg');
        
        // Generate unique filename
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `${preschool_id}_${image_type}_${i}_${timestamp}${fileExtension}`;
        const filePath = `preschool-images/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('preschool-images')
          .upload(filePath, imageBlob, {
            contentType: response.headers.get('content-type') || 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for image ${i}:`, uploadError);
          continue;
        }

        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('preschool-images')
          .getPublicUrl(filePath);

        // Store image metadata
        const { error: metadataError } = await supabase
          .from('preschool_images')
          .upsert({
            preschool_id,
            image_url: publicUrlData.publicUrl,
            image_type,
            storage_path: filePath,
            original_url: url,
            photo_reference: reference || null,
            width: width || null,
            height: height || null,
            file_size: imageBlob.size,
            uploaded_at: new Date().toISOString()
          }, {
            onConflict: 'preschool_id,storage_path'
          });

        if (metadataError) {
          console.error(`Metadata error for image ${i}:`, metadataError);
        }

        results.push({
          index: i,
          success: true,
          storage_path: filePath,
          public_url: publicUrlData.publicUrl,
          file_size: imageBlob.size
        });

        console.log(`✅ Successfully processed image ${i} for preschool ${preschool_id}`);

      } catch (error) {
        console.error(`Error processing image ${i}:`, error);
        results.push({
          index: i,
          success: false,
          error: error.message
        });
      }

      // Small delay between downloads to be respectful
      if (i < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`🎯 Image Downloader: Completed ${successCount}/${images.length} images for preschool ${preschool_id}`);

    return new Response(JSON.stringify({
      success: true,
      preschool_id,
      processed_count: results.length,
      success_count: successCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Image Downloader Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function getFileExtension(contentType: string): string {
  switch (contentType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '.jpg';
  }
}