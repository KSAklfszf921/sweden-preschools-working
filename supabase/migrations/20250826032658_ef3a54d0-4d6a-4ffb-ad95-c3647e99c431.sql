-- Create Google Places data table with enhanced fields
CREATE TABLE IF NOT EXISTS preschool_google_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preschool_id UUID REFERENCES "Förskolor"(id),
  google_place_id TEXT,
  google_rating NUMERIC,
  google_reviews_count INTEGER DEFAULT 0,
  contact_phone TEXT,
  website_url TEXT,
  opening_hours JSONB,
  google_photos TEXT[], -- Array of photo references
  street_view_pano_id TEXT,
  reviews JSONB[], -- Array of review objects
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(preschool_id)
);

-- Create images storage table
CREATE TABLE IF NOT EXISTS preschool_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preschool_id UUID REFERENCES "Förskolor"(id),
  image_url TEXT NOT NULL,
  image_type TEXT CHECK (image_type IN ('google_photo', 'street_view', 'user_upload')),
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_preschool_google_data_preschool_id ON preschool_google_data(preschool_id);
CREATE INDEX IF NOT EXISTS idx_preschool_images_preschool_id ON preschool_images(preschool_id);
CREATE INDEX IF NOT EXISTS idx_preschool_google_data_place_id ON preschool_google_data(google_place_id);

-- Enable RLS
ALTER TABLE preschool_google_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE preschool_images ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public can view Google data" ON preschool_google_data
  FOR SELECT USING (true);

CREATE POLICY "Public can view preschool images" ON preschool_images
  FOR SELECT USING (true);

-- Create storage bucket for preschool images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('preschool-images', 'preschool-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Public can view preschool images"
ON storage.objects FOR SELECT
USING (bucket_id = 'preschool-images');

-- Allow system to insert images
CREATE POLICY "System can upload preschool images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'preschool-images');