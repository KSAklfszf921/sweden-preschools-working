-- Fix Security Definer View issue by enabling RLS and creating proper policies
-- This addresses the security linter error about views with elevated privileges

-- Enable RLS on all custom views to ensure they follow proper security model
ALTER TABLE public.v_forskolor_geo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v_forskolor_public_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v_forskolor_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for v_forskolor_geo (geographic data view)
-- This view shows preschool locations, should be publicly readable like the main table
CREATE POLICY "Public can view geographic data" 
ON public.v_forskolor_geo 
FOR SELECT 
USING (true);

-- Create policies for v_forskolor_public_stats (public statistics view)
-- This view shows aggregated statistics, should be publicly readable
CREATE POLICY "Public can view public statistics" 
ON public.v_forskolor_public_stats 
FOR SELECT 
USING (true);

-- Create policies for v_forskolor_stats (general statistics view)
-- This view shows aggregated statistics, should be publicly readable
CREATE POLICY "Public can view statistics" 
ON public.v_forskolor_stats 
FOR SELECT 
USING (true);

-- Add comments to document the security model
COMMENT ON POLICY "Public can view geographic data" ON public.v_forskolor_geo 
IS 'Allows public access to preschool geographic data aggregated view, following same security model as main table';

COMMENT ON POLICY "Public can view public statistics" ON public.v_forskolor_public_stats 
IS 'Allows public access to aggregated preschool statistics, ensuring data transparency';

COMMENT ON POLICY "Public can view statistics" ON public.v_forskolor_stats 
IS 'Allows public access to general preschool statistics for public use';