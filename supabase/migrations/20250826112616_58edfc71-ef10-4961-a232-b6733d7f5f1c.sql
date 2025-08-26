-- Enable Row Level Security on spatial_ref_sys table
-- This is a PostGIS system table that stores spatial reference system information
-- It should be readable by all users but not modifiable

ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Add policy to allow public read access to spatial reference systems
-- This table contains standard spatial reference system definitions that are publicly available
CREATE POLICY "Public read access to spatial reference systems" 
ON public.spatial_ref_sys 
FOR SELECT 
USING (true);

-- Add comment to document the security model
COMMENT ON TABLE public.spatial_ref_sys IS 'PostGIS spatial reference systems table - public read access enabled for GIS functionality';