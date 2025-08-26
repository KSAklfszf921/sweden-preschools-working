-- Create bulk update function for coordinates
CREATE OR REPLACE FUNCTION bulk_update_coordinates(updates jsonb[])
RETURNS void AS $$
DECLARE
    update_record jsonb;
BEGIN
    FOREACH update_record IN ARRAY updates
    LOOP
        UPDATE "Förskolor"
        SET
            "Latitud" = (update_record->>'latitude')::float,
            "Longitud" = (update_record->>'longitude')::float
        WHERE id = (update_record->>'id')::uuid;
    END LOOP;
END;
$$ LANGUAGE plpgsql;