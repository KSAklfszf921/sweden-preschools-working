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
    // CRITICAL: Split bundle for performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Large dependencies separated
          'mapbox': ['mapbox-gl', '@mapbox/mapbox-gl-language'],
          'supabase': ['@supabase/supabase-js'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'query-vendor': ['@tanstack/react-query'],
          // Separate heavy UI components
          'heavy-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select', 
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast'
          ]
        },
        // Smaller chunk names for faster loading
        chunkFileNames: '[name]-[hash:6].js',
        entryFileNames: '[name]-[hash:6].js',
        assetFileNames: '[name]-[hash:6].[ext]'
      },
      // Reduce bundle size
      external: id => {
        // Don't bundle Node.js polyfills
        return id === 'buffer' || id === 'process'
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
