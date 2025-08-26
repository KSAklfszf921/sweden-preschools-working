-- Fix RLS and security issues for deployment

-- Enable RLS on tables that don't have it
ALTER TABLE IF EXISTS public."Förskolor" ENABLE ROW LEVEL SECURITY;

-- Update security definer functions to use proper search path
CREATE OR REPLACE FUNCTION public.bytea(geometry)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT COST 50
 SET search_path = public, pg_temp
AS '$libdir/postgis-3', $function$LWGEOM_to_bytea$function$;

-- Create secure policies for preschool data access
DROP POLICY IF EXISTS "Public can view preschool location data" ON public."Förskolor";

CREATE POLICY "Public read access to preschool data" ON public."Förskolor"
FOR SELECT
USING (true);

-- Ensure anonymous users can only read preschool data, not modify
CREATE POLICY "Prevent anonymous modifications" ON public."Förskolor"
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Prevent anonymous updates" ON public."Förskolor"  
FOR UPDATE
USING (false);

CREATE POLICY "Prevent anonymous deletes" ON public."Förskolar"
FOR DELETE
USING (false);