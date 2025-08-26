-- Add missing columns to preschool_google_data table for reviews and street view
ALTER TABLE preschool_google_data 
ADD COLUMN IF NOT EXISTS reviews JSONB,
ADD COLUMN IF NOT EXISTS street_view_pano_id TEXT,
ADD COLUMN IF NOT EXISTS street_view_static_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_preschool_google_data_preschool_id ON preschool_google_data(preschool_id);
CREATE INDEX IF NOT EXISTS idx_preschool_google_data_last_updated ON preschool_google_data(last_updated);

-- Update the google-places-enricher function to handle new columns properly
-- Create function to clean up and standardize google data storage
CREATE OR REPLACE FUNCTION public.upsert_google_data(
  p_preschool_id UUID,
  p_google_place_id TEXT,
  p_google_rating NUMERIC,
  p_google_reviews_count INTEGER,
  p_contact_phone TEXT,
  p_website_url TEXT,
  p_formatted_address TEXT,
  p_opening_hours JSONB,
  p_google_photos TEXT[],
  p_reviews JSONB,
  p_street_view_pano_id TEXT,
  p_street_view_static_url TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO preschool_google_data (
    preschool_id,
    google_place_id,
    google_rating,
    google_reviews_count,
    contact_phone,
    website_url,
    formatted_address,
    opening_hours,
    google_photos,
    reviews,
    street_view_pano_id,
    street_view_static_url,
    last_updated
  ) VALUES (
    p_preschool_id,
    p_google_place_id,
    p_google_rating,
    p_google_reviews_count,
    p_contact_phone,
    p_website_url,
    p_formatted_address,
    p_opening_hours,
    p_google_photos,
    p_reviews,
    p_street_view_pano_id,
    p_street_view_static_url,
    NOW()
  )
  ON CONFLICT (preschool_id) 
  DO UPDATE SET
    google_place_id = EXCLUDED.google_place_id,
    google_rating = EXCLUDED.google_rating,
    google_reviews_count = EXCLUDED.google_reviews_count,
    contact_phone = EXCLUDED.contact_phone,
    website_url = EXCLUDED.website_url,
    formatted_address = EXCLUDED.formatted_address,
    opening_hours = EXCLUDED.opening_hours,
    google_photos = EXCLUDED.google_photos,
    reviews = EXCLUDED.reviews,
    street_view_pano_id = EXCLUDED.street_view_pano_id,
    street_view_static_url = EXCLUDED.street_view_static_url,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;