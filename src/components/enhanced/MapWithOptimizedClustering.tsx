/**
 * 🚀 MAP WITH OPTIMIZED CLUSTERING COMPONENT
 * 
 * Komplett exempel på hur man använder den optimerade clustering-lösningen
 * med Mapbox + Supabase integration för maximal prestanda.
 */

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useOptimizedClustering } from '@/hooks/useOptimizedClustering';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { initClusteringCache } from '@/utils/clusteringCacheManager';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, MapPin, TrendingUp, Database, Clock } from 'lucide-react';

// Mapbox token
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2tvZ3N0YWRpc2FrIiwiYSI6ImNtY3BhaXRpMjA0ZGcycHBqNHM4dmlwOW0ifQ.KKHGGPnrZVjNjDdITF-_bw';
mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapWithOptimizedClusteringProps {
  className?: string;
  enableCache?: boolean;
  onPreschoolSelect?: (preschool: Preschool) => void;
}

export const MapWithOptimizedClustering: React.FC<MapWithOptimizedClusteringProps> = ({
  className = 'w-full h-screen',
  enableCache = true,
  onPreschoolSelect
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedPreschool, setSelectedPreschool] = useState<Preschool | null>(null);
  const [showStats, setShowStats] = useState(false);

  const { filteredPreschools } = useMapStore();

  // Initialisera cache manager
  useEffect(() => {
    if (enableCache) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      
      if (supabaseUrl && supabaseKey) {
        initClusteringCache(supabaseUrl, supabaseKey);
        console.log('🚀 Clustering cache initialized');
      } else {
        console.warn('⚠️ Supabase credentials missing - clustering cache disabled');
      }
    }
  }, [enableCache]);

  // Sätt upp Mapbox karta
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('🗺️ Initializing Mapbox GL JS map with optimized clustering...');

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [15.2, 62.4], // Centrerat över Sverige
      zoom: 4.9,
      minZoom: 2,
      maxZoom: 18,
      pitch: 0,
      bearing: 0,
      maxBounds: [
        [7.0, 55.0],  // Southwest
        [25.0, 70.0]  // Northeast
      ]
    });

    // Lägg till navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Lägg till geolocate control
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });
    map.current.addControl(geolocateControl, 'top-right');

    // Map loaded handler
    map.current.on('style.load', () => {
      console.log('✅ Map style loaded - ready for clustering');
      setIsMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Använd optimerad clustering hook
  const { state: clusteringState, methods: clusteringMethods, config } = useOptimizedClustering({
    map: map.current,
    config: {
      enableCache,
      clusterRadius: 50,
      clusterMaxZoom: 12,
      maxZoom: 12,
      minZoom: 4
    },
    onClusterClick: (clusterId, coordinates) => {
      console.log(`🔍 Cluster clicked: ${clusterId} at [${coordinates.join(', ')}]`);
    },
    onPreschoolClick: (preschool) => {
      console.log(`🏫 Preschool clicked: ${preschool.namn}`);
      setSelectedPreschool(preschool);
      onPreschoolSelect?.(preschool);
    }
  });

  // Stats toggle
  const toggleStats = () => setShowStats(!showStats);

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div ref={mapContainer} className=\"w-full h-full\" />

      {/* Loading overlay */}
      <AnimatePresence>
        {(!isMapLoaded || clusteringState.isLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className=\"absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50\"
          >
            <div className=\"bg-white rounded-lg p-6 shadow-xl flex items-center gap-3\">
              <Loader2 className=\"w-6 h-6 animate-spin text-blue-600\" />
              <div>
                <p className=\"font-semibold text-gray-900\">
                  {!isMapLoaded ? 'Laddar karta...' : 'Optimerar clustering...'}
                </p>
                <p className=\"text-sm text-gray-600\">
                  {filteredPreschools.length} förskolor redo att visas
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error notification */}
      <AnimatePresence>
        {clusteringState.error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className=\"absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-40\"
          >
            <strong className=\"font-bold\">Clustering Error: </strong>
            <span className=\"block sm:inline\">{clusteringState.error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clustering stats panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className=\"absolute top-4 left-4 bg-white rounded-lg shadow-xl p-4 z-40 min-w-[300px]\"
          >
            <div className=\"flex items-center justify-between mb-3\">
              <h3 className=\"font-semibold text-gray-900 flex items-center gap-2\">
                <TrendingUp className=\"w-5 h-5 text-blue-600\" />
                Clustering Stats
              </h3>
              <button
                onClick={toggleStats}
                className=\"text-gray-500 hover:text-gray-700\"
              >
                ✕
              </button>
            </div>
            
            <div className=\"space-y-3 text-sm\">
              <div className=\"flex items-center justify-between\">
                <span className=\"flex items-center gap-2\">
                  <MapPin className=\"w-4 h-4 text-green-600\" />
                  Aktiva Kluster
                </span>
                <span className=\"font-semibold\">{clusteringState.clustersCount}</span>
              </div>
              
              <div className=\"flex items-center justify-between\">
                <span className=\"flex items-center gap-2\">
                  <Database className=\"w-4 h-4 text-blue-600\" />
                  Cache Hit Rate
                </span>
                <span className=\"font-semibold\">
                  {(clusteringState.cacheHitRate * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className=\"flex items-center justify-between\">
                <span className=\"flex items-center gap-2\">
                  <Clock className=\"w-4 h-4 text-orange-600\" />
                  Senast Uppdaterad
                </span>
                <span className=\"font-semibold text-xs\">
                  {new Date(clusteringState.lastUpdate).toLocaleTimeString('sv-SE')}
                </span>
              </div>
              
              <hr className=\"my-2\" />
              
              <div className=\"text-xs text-gray-600\">
                <p><strong>Konfiguration:</strong></p>
                <ul className=\"mt-1 space-y-1\">
                  <li>• Cluster Radius: {config.clusterRadius}px</li>
                  <li>• Max Zoom: {config.maxZoom}</li>
                  <li>• Min Zoom: {config.minZoom}</li>
                  <li>• Cache: {config.enableCache ? '✅ Aktiverad' : '❌ Inaktiverad'}</li>
                </ul>
              </div>
              
              <div className=\"flex gap-2 pt-2\">
                <button
                  onClick={clusteringMethods.refreshCache}
                  className=\"flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200\"
                >
                  Uppdatera Cache
                </button>
                <button
                  onClick={clusteringMethods.forceReload}
                  className=\"flex-1 px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200\"
                >
                  Reload All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats toggle button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: isMapLoaded ? 1 : 0 }}
        onClick={toggleStats}
        className=\"absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 z-30 hover:bg-gray-50\"
        title=\"Visa clustering statistik\"
      >
        <TrendingUp className=\"w-5 h-5 text-gray-600\" />
      </motion.button>

      {/* Selected preschool popup */}
      <AnimatePresence>
        {selectedPreschool && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className=\"absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-xl p-4 z-40\"
          >
            <div className=\"flex items-start justify-between\">
              <div className=\"flex-1\">
                <h3 className=\"font-semibold text-gray-900 mb-1\">
                  {selectedPreschool.namn}
                </h3>
                <p className=\"text-sm text-gray-600 mb-2\">
                  {selectedPreschool.kommun} • {selectedPreschool.huvudman}
                </p>
                {selectedPreschool.google_rating > 0 && (
                  <div className=\"flex items-center gap-1 text-sm\">
                    <span className=\"text-yellow-500\">★</span>
                    <span className=\"font-medium\">{selectedPreschool.google_rating.toFixed(1)}</span>
                    <span className=\"text-gray-500\">Google rating</span>
                  </div>
                )}
                {selectedPreschool.antal_barn && (
                  <p className=\"text-sm text-gray-600 mt-1\">
                    {selectedPreschool.antal_barn} barn
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedPreschool(null)}
                className=\"text-gray-400 hover:text-gray-600 ml-2\"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance indicator */}
      <div className=\"absolute bottom-4 right-4 z-30\">
        <div className=\"bg-black/70 text-white px-3 py-1 rounded-full text-xs\">
          {clusteringState.isLoading ? (
            <span className=\"flex items-center gap-1\">
              <Loader2 className=\"w-3 h-3 animate-spin\" />
              Optimerar...
            </span>
          ) : (
            <span className=\"flex items-center gap-1\">
              <div className=\"w-2 h-2 bg-green-400 rounded-full\"></div>
              {clusteringState.clustersCount} kluster
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapWithOptimizedClustering;