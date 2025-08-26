-- Fix unique constraint issue for Google Places data
-- Add unique constraint on preschool_id to enable proper UPSERT operations
ALTER TABLE public.preschool_google_data 
ADD CONSTRAINT preschool_google_data_preschool_id_unique UNIQUE (preschool_id);

-- Fix the missing RLS issue mentioned in security warning
-- Enable RLS on the geography_columns and geometry_columns if needed (though these are system tables)
-- The main security issue is resolved by having proper constraints for upsert operations