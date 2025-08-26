import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build for production deployment
    target: 'es2015',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mapbox: ['mapbox-gl'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    // Increase chunk size warning limit for map components
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies for faster loading
  optimizeDeps: {
    include: ['mapbox-gl', '@supabase/supabase-js', 'react', 'react-dom'],
  },
}));
