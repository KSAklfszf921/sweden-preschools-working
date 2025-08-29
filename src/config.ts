// Environment configuration with fallbacks to prevent crashes
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://zfeqsdtddvelapbrwlol.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

// Add warnings for missing keys but don't crash the app
if (!SUPABASE_ANON_KEY) {
  console.warn("Supabase key saknas - vissa funktioner kan vara begränsade i denna build.");
}

if (!GOOGLE_MAPS_API_KEY) {
  console.warn("Google Maps API key saknas - kartan kanske inte fungerar korrekt i denna build.");
}

export const config = {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  },
  googleMaps: {
    apiKey: GOOGLE_MAPS_API_KEY,
  },
};