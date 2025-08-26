-- Fix trigger functions to use correct column names (uppercase)

-- Update the update_geo_point function to use correct column casing
CREATE OR REPLACE FUNCTION public.update_geo_point()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update geo_point when coordinates change
    IF NEW."Latitud" IS NOT NULL AND NEW."Longitud" IS NOT NULL THEN
        NEW.geo_point = ST_SetSRID(ST_MakePoint(NEW."Longitud", NEW."Latitud"), 4326);
    END IF;
    RETURN NEW;
END;
$$;

-- Update the validate_forskola_data function to use correct column casing
CREATE OR REPLACE FUNCTION public.validate_forskola_data()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validate coordinates are within Sweden if provided
    IF NEW."Latitud" IS NOT NULL AND NEW."Longitud" IS NOT NULL THEN
        IF NEW."Latitud" < 55.0 OR NEW."Latitud" > 69.5 OR NEW."Longitud" < 10.0 OR NEW."Longitud" > 25.0 THEN
            RAISE EXCEPTION 'Coordinates must be within Sweden bounds';
        END IF;
    END IF;
    
    -- Validate positive values for numeric fields
    IF NEW."Antal barn" IS NOT NULL AND NEW."Antal barn" < 0 THEN
        RAISE EXCEPTION 'Antal barn cannot be negative';
    END IF;
    
    IF NEW."Antal barngrupper" IS NOT NULL AND NEW."Antal barngrupper" < 0 THEN
        RAISE EXCEPTION 'Antal barngrupper cannot be negative';
    END IF;
    
    RETURN NEW;
END;
$$;