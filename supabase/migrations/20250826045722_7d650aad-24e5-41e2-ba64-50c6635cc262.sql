-- Fix missing contact_phone column and enhance Google data storage
ALTER TABLE public.preschool_google_data 
ADD COLUMN contact_phone TEXT,
ADD COLUMN website_url TEXT,
ADD COLUMN opening_hours JSONB,
ADD COLUMN price_level INTEGER,
ADD COLUMN types TEXT[],
ADD COLUMN formatted_address TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_preschool_google_data_preschool_id 
ON public.preschool_google_data(preschool_id);

-- Create index for last_updated to optimize cache queries
CREATE INDEX IF NOT EXISTS idx_preschool_google_data_last_updated 
ON public.preschool_google_data(last_updated);

-- Add constraint to ensure data freshness (optional)
-- We can periodically clean old data or mark it for refresh