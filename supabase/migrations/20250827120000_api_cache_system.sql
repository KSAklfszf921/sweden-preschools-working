-- Create API cache table for centralized external API management
CREATE TABLE IF NOT EXISTS api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  api_type TEXT NOT NULL CHECK (api_type IN ('google_places', 'google_maps', 'mapbox', 'street_view')),
  endpoint TEXT NOT NULL,
  params JSONB NOT NULL,
  response_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accessed_count INTEGER DEFAULT 1,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_type ON api_cache(api_type);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_cache_priority ON api_cache(priority DESC);

-- Update preschool_images table to support more image types and metadata
ALTER TABLE preschool_images 
  DROP CONSTRAINT IF EXISTS preschool_images_image_type_check;

ALTER TABLE preschool_images 
  ADD CONSTRAINT preschool_images_image_type_check 
  CHECK (image_type IN ('google_places', 'street_view', 'user_upload', 'enhanced'));

-- Add new columns for enhanced image management
ALTER TABLE preschool_images 
  ADD COLUMN IF NOT EXISTS original_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_reference TEXT,
  ADD COLUMN IF NOT EXISTS width INTEGER,
  ADD COLUMN IF NOT EXISTS height INTEGER,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create unique constraint to prevent duplicate images
ALTER TABLE preschool_images 
  ADD CONSTRAINT IF NOT EXISTS unique_preschool_storage_path 
  UNIQUE (preschool_id, storage_path);

-- Enable RLS on api_cache
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for API cache (system access only for writes, public read for performance data)
CREATE POLICY "System can manage API cache" ON api_cache
  FOR ALL USING (true);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to update cache access statistics
CREATE OR REPLACE FUNCTION update_cache_access(cache_key_param TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE api_cache 
  SET accessed_count = accessed_count + 1,
      last_accessed = now()
  WHERE cache_key = cache_key_param;
END;
$$;

-- Create a view for cache statistics
CREATE OR REPLACE VIEW api_cache_stats AS
SELECT 
  api_type,
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE expires_at > now()) as active_entries,
  AVG(accessed_count) as avg_access_count,
  MAX(accessed_count) as max_access_count,
  AVG(EXTRACT(EPOCH FROM (expires_at - created_at))) as avg_cache_duration
FROM api_cache
GROUP BY api_type;