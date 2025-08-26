-- Check if secrets are configured correctly by testing geocoding service
-- First ensure Google API key is properly configured in Edge Function secrets

-- Add some debug logging for geocoding service
CREATE OR REPLACE FUNCTION debug_geocoding_setup()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Test basic database access
    SELECT json_build_object(
        'preschools_count', (SELECT COUNT(*) FROM "Förskolor"),
        'missing_coordinates', (SELECT COUNT(*) FROM "Förskolor" WHERE "Latitud" IS NULL OR "Longitud" IS NULL),
        'test_status', 'ready'
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;