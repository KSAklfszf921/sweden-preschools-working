-- Fix security definer function by setting search_path
CREATE OR REPLACE FUNCTION public.update_google_data_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$;

-- Enable RLS on the Förskolor table (main preschool table)
ALTER TABLE public."Förskolor" ENABLE ROW LEVEL SECURITY;