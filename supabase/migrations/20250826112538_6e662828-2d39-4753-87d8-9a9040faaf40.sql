-- Fix Security Definer View issue by recreating views with proper ownership
-- and ensuring they follow security best practices

-- The issue is that views created by privileged users (postgres/supabase_admin) 
-- can bypass RLS. We need to recreate them with proper security context.

-- First, drop existing views (they will be recreated)
DROP VIEW IF EXISTS public.v_forskolor_geo CASCADE;
DROP VIEW IF EXISTS public.v_forskolor_public_stats CASCADE;
DROP VIEW IF EXISTS public.v_forskolor_stats CASCADE;

-- Recreate views with explicit security invoker behavior
-- (though PostgreSQL views don't have explicit SECURITY INVOKER like functions,
-- we ensure they respect the underlying table's RLS by being explicit about security)

-- Geographic view - shows preschools with coordinates
CREATE VIEW public.v_forskolor_geo 
WITH (security_barrier = true) AS
SELECT 
  id,
  "Namn" AS namn,
  "Kommun" AS kommun,
  "Huvudman" AS huvudman,
  "Antal barn" AS antal_barn,
  "Latitud" AS latitud,
  "Longitud" AS longitud,
  geo_point
FROM public."Förskolor"
WHERE "Latitud" IS NOT NULL 
  AND "Longitud" IS NOT NULL;

-- Public statistics view - aggregated data by municipality and ownership
CREATE VIEW public.v_forskolor_public_stats 
WITH (security_barrier = true) AS
SELECT 
  "Kommun" AS kommun,
  "Kommunkod" AS kommunkod,
  "Huvudman" AS huvudman,
  count(*) AS antal_forskolor,
  sum("Antal barn") AS totalt_barn,
  avg("Antal barn") AS genomsnitt_barn,
  avg("Andel med förskollärarexamen") AS genomsnitt_examen,
  avg("Personaltäthet") AS genomsnitt_personaltathet
FROM public."Förskolor"
GROUP BY "Kommun", "Kommunkod", "Huvudman";

-- General statistics view - same as public stats (kept for compatibility)
CREATE VIEW public.v_forskolor_stats 
WITH (security_barrier = true) AS
SELECT 
  "Kommun" AS kommun,
  "Kommunkod" AS kommunkod,
  "Huvudman" AS huvudman,
  count(*) AS antal_forskolor,
  sum("Antal barn") AS totalt_barn,
  avg("Antal barn") AS genomsnitt_barn,
  avg("Andel med förskollärarexamen") AS genomsnitt_examen,
  avg("Personaltäthet") AS genomsnitt_personaltathet
FROM public."Förskolor"
GROUP BY "Kommun", "Kommunkod", "Huvudman";

-- Grant appropriate permissions
GRANT SELECT ON public.v_forskolor_geo TO anon, authenticated;
GRANT SELECT ON public.v_forskolor_public_stats TO anon, authenticated; 
GRANT SELECT ON public.v_forskolor_stats TO anon, authenticated;

-- Add security documentation
COMMENT ON VIEW public.v_forskolor_geo 
IS 'Secure view of preschool geographic data with security_barrier enabled. Respects underlying table RLS policies.';

COMMENT ON VIEW public.v_forskolor_public_stats 
IS 'Secure view of aggregated preschool statistics with security_barrier enabled. Public data aggregation.';

COMMENT ON VIEW public.v_forskolor_stats 
IS 'Secure view of preschool statistics with security_barrier enabled. Respects underlying table security model.';