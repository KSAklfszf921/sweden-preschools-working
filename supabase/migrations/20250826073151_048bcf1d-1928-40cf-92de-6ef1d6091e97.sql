-- Fix the bulk_update_coordinates function to use correct field names
CREATE OR REPLACE FUNCTION public.bulk_update_coordinates(updates jsonb[])
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    update_record jsonb;
BEGIN
    FOREACH update_record IN ARRAY updates
    LOOP
        UPDATE public."Förskolor"
        SET "Latitud" = (update_record->>'latitude')::float8,
            "Longitud" = (update_record->>'longitude')::float8
        WHERE id = (update_record->>'id')::uuid;
    END LOOP;
END;
$$;