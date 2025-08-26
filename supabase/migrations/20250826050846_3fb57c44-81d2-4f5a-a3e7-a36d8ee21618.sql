-- Create table for storing preschool images
CREATE TABLE IF NOT EXISTS public.preschool_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preschool_id UUID NOT NULL REFERENCES public."Förskolor"(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type VARCHAR(50) DEFAULT 'google_places',
  storage_path TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on preschool_images
ALTER TABLE public.preschool_images ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to preschool images
CREATE POLICY "Public can view preschool images" 
ON public.preschool_images 
FOR SELECT 
USING (true);

-- Create index for better performance
CREATE INDEX idx_preschool_images_preschool_id ON public.preschool_images(preschool_id);
CREATE INDEX idx_preschool_images_type ON public.preschool_images(image_type);

-- Create storage bucket for preschool images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('preschool-images', 'preschool-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for preschool images
DO $$
BEGIN
  -- Policy for public read access
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'preschool-images' AND name = 'Public can view preschool images'
  ) THEN
    INSERT INTO storage.policies (bucket_id, name, definition, operation)
    VALUES (
      'preschool-images',
      'Public can view preschool images',
      '(bucket_id = ''preschool-images'')',
      'SELECT'
    );
  END IF;

  -- Policy for service role to manage images
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'preschool-images' AND name = 'Service role can manage preschool images'
  ) THEN
    INSERT INTO storage.policies (bucket_id, name, definition, operation)
    VALUES (
      'preschool-images',
      'Service role can manage preschool images',
      '(bucket_id = ''preschool-images'')',
      'INSERT'
    );
  END IF;
END $$;

-- Update huvudman enum to only include Kommunal and Fristående
-- First, update existing 'Privat' entries to 'Fristående'
UPDATE public."Förskolor" 
SET "Huvudman" = 'Fristående' 
WHERE "Huvudman" IN ('Privat', 'Enskild');

-- Note: We can't easily modify enum types in PostgreSQL, but we can work with the existing values
-- The application will filter to only show Kommunal and Fristående options