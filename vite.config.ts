import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
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
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    // WORKING bundle optimization
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Mapbox gets its own chunk
          if (id.includes('mapbox-gl')) {
            return 'mapbox';
          }
          // Supabase chunk
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          // React vendor chunk
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          // UI libraries
          if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('framer-motion')) {
            return 'ui-vendor';
          }
          // Query vendor
          if (id.includes('@tanstack')) {
            return 'query-vendor';
          }
          // Node modules default
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    cssCodeSplit: true,
    assetsInlineLimit: 4096
  },
  // Optimize dependencies for faster loading
  optimizeDeps: {
    include: ['mapbox-gl', '@supabase/supabase-js', 'react', 'react-dom'],
  },
}));
