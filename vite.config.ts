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
    // ULTRA-AGGRESSIVE bundle optimization - tvinga code splitting
    rollupOptions: {
      external: [],
      output: {
        // Tvinga många små chunks istället för en stor
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          // ULTRA-AGGRESSIV kod-splitting för minimal initial bundle
          
          // Core React - bara det som behövs för initial render
          if (id.includes('react/') && !id.includes('react-dom')) {
            return 'react-core';
          }
          if (id.includes('react-dom')) {
            return 'react-dom';
          }
          
          // Router - läses efter initial load
          if (id.includes('react-router')) {
            return 'router';
          }
          
          // Supabase - laddas när data behövs
          if (id.includes('@supabase')) {
            return 'database';
          }
          
          // Heavy UI framework - delas upp maximalt
          if (id.includes('@radix-ui/react-dialog')) {
            return 'radix-dialogs';
          }
          if (id.includes('@radix-ui/react-select') || id.includes('@radix-ui/react-dropdown')) {
            return 'radix-selects';
          }
          if (id.includes('@radix-ui/react-toast') || id.includes('@radix-ui/react-alert')) {
            return 'radix-feedback';
          }
          if (id.includes('@radix-ui')) {
            return 'radix-base';
          }
          
          // Animations - bara när UI interageras med
          if (id.includes('framer-motion')) {
            return 'animations';
          }
          
          // State management - laddas med komponenter
          if (id.includes('zustand')) {
            return 'state';
          }
          if (id.includes('@tanstack')) {
            return 'queries';
          }
          
          // Icons - laddas separat
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          
          // Charts - bara för statistik-delen
          if (id.includes('recharts') || id.includes('d3')) {
            return 'charts';
          }
          
          // Form handling - bara när forms används
          if (id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'forms';
          }
          
          // Heavy utilities
          if (id.includes('date-fns')) {
            return 'date-utils';
          }
          if (id.includes('fuse.js') || id.includes('@turf')) {
            return 'search-geo';
          }
          
          // Våra egna komponenter - kategoriserade
          if (id.includes('/components/enhanced/')) {
            return 'enhanced-components';
          }
          if (id.includes('/components/ui/')) {
            return 'ui-components';
          }
          if (id.includes('/utils/') || id.includes('/hooks/')) {
            return 'app-logic';
          }
          if (id.includes('/stores/')) {
            return 'stores';
          }
          
          // Resten av node_modules - mycket finfördelat
          if (id.includes('node_modules')) {
            const chunkName = id.split('node_modules/')[1].split('/')[0];
            
            // Grupper mycket små bibliotek
            const tinyLibs = ['clsx', 'tailwind-merge', 'class-variance-authority'];
            if (tinyLibs.some(lib => chunkName.includes(lib))) {
              return 'tiny-utils';
            }
            
            // Varje större library får eget chunk
            return `lib-${chunkName.replace(/[^a-zA-Z0-9]/g, '-')}`;
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
