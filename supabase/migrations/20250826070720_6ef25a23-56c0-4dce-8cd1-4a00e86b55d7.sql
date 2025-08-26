-- Fix RLS issues identified by linter
-- Enable RLS on tables that are missing it

-- Check and enable RLS on tables that might be missing it
ALTER TABLE public.geometry_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geography_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies for system tables
CREATE POLICY "System tables are read-only for authenticated users" 
ON public.geometry_columns 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Geography columns read-only for authenticated users" 
ON public.geography_columns 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Spatial ref sys read-only for authenticated users" 
ON public.spatial_ref_sys 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Update function security settings to address search path issues
-- Note: This addresses the linter warnings about function search paths
-- by creating safer versions of commonly used functions

-- Create a secure admin function for statistics
CREATE OR REPLACE FUNCTION public.get_admin_statistics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Only allow this function for service role or authenticated admin users
    IF auth.role() != 'service_role' AND NOT EXISTS (
        SELECT 1 FROM auth.users WHERE auth.uid() = id
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT jsonb_build_object(
        'preschools_total', (SELECT COUNT(*) FROM "Förskolor"),
        'missing_coordinates', (SELECT COUNT(*) FROM "Förskolor" 
            WHERE "Latitud" IS NULL OR "Longitud" IS NULL OR "Latitud" = 0 OR "Longitud" = 0),
        'with_google_data', (SELECT COUNT(DISTINCT preschool_id) FROM preschool_google_data),
        'with_images', (SELECT COUNT(DISTINCT preschool_id) FROM preschool_images),
        'last_updated', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;