-- Simple RLS fix for deployment security
-- Enable RLS on the main preschool table that currently has it disabled
ALTER TABLE IF EXISTS public."Förskolor" ENABLE ROW LEVEL SECURITY;

-- No need to modify C functions, just ensure proper RLS policies exist
-- Keep existing policies but make them more restrictive for modifications