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
    // AGGRESSIVE bundle optimization for better performance
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Critical performance optimization: split heavy libraries
          // Mapbox GL JS v2.15 - lightweight version from successful projects
          if (id.includes('mapbox-gl')) {
            return 'mapbox-simple';
          }
          
          // Supabase - database client
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          
          // React core - essential but can be cached
          if (id.includes('react/') || id.includes('react-dom/')) {
            return 'react-core';
          }
          
          // React ecosystem
          if (id.includes('react-') || id.includes('framer-motion')) {
            return 'react-ecosystem';
          }
          
          // UI components - split into smaller chunks
          if (id.includes('@radix-ui')) {
            return 'radix-ui';
          }
          
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          
          // Animation libraries
          if (id.includes('motion') || id.includes('animation')) {
            return 'animations';
          }
          
          // Query/state management
          if (id.includes('@tanstack') || id.includes('zustand')) {
            return 'state-mgmt';
          }
          
          // Charts and data visualization
          if (id.includes('chart') || id.includes('d3')) {
            return 'charts';
          }
          
          // Performance utilities (our custom code)
          if (id.includes('/utils/') || id.includes('/hooks/')) {
            return 'app-utils';
          }
          
          // Large vendor libraries
          if (id.includes('node_modules') && id.includes('.js')) {
            const chunkName = id.split('node_modules/')[1].split('/')[0];
            
            // Group small libraries together
            const smallLibs = ['clsx', 'tailwind-merge', 'class-variance-authority', 'cmdk'];
            if (smallLibs.some(lib => chunkName.includes(lib))) {
              return 'utils-vendor';
            }
            
            return `vendor-${chunkName}`;
          }
        }
      }
    },
    cssCodeSplit: true,
    assetsInlineLimit: 4096
  },
  // Optimize dependencies for faster loading - REMOVED MAPBOX
  optimizeDeps: {
    include: ['@supabase/supabase-js', 'react', 'react-dom'],
  },
}));
