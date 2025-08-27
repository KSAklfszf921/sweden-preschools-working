import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedPopup } from '@/components/enhanced/EnhancedPopup';
import { useMapViewportSync } from '@/hooks/useMapViewportSync';
import { useOptimizedClustering } from '@/hooks/useOptimizedClustering';
import { initClusteringCache } from '@/utils/clusteringCacheManager';
import { Loader2, TrendingUp, Database, Clock, MapPin } from 'lucide-react';

// Mapbox token
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2tvZ3N0YWRpc2FrIiwiYSI6ImNtY3BhaXRpMjA0ZGcycHBqNHM4dmlwOW0ifQ.KKHGGPnrZVjNjDdITF-_bw';
mapboxgl.accessToken = MAPBOX_TOKEN;

interface Map3DProps {
  className?: string;
}

export const Map3D: React.FC<Map3DProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPreschool, setPopupPreschool] = useState<Preschool | null>(null);
  const [showClusteringStats, setShowClusteringStats] = useState(false);

  const {
    filteredPreschools,
    selectedPreschool,
    setSelectedPreschool,
    mapCenter,
    mapZoom,
    setMapCenter,
    setMapZoom,
    lastUpdated,
    updateVisiblePreschoolsFromViewport,
    layerVisibility,
    clusteringEnabled,
    clusteringPerformanceMode
  } = useMapStore();

  // Enable viewport synchronization for dynamic list updates  
  useMapViewportSync(map.current);

  // Initialize clustering cache with Supabase
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      initClusteringCache(supabaseUrl, supabaseKey);
      console.log('🚀 Clustering cache initialized with Supabase');
    } else {
      console.warn('⚠️ Supabase credentials missing - clustering cache disabled');
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('🗺️ Initializing Mapbox GL JS map with optimized clustering...');

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [15.2, 62.4], // Optimized center for Sweden's geographic center
      zoom: 4.9, // Perfect zoom to show all of Sweden with clusters visible
      minZoom: 2, // Allow zooming out to see all of Sweden clearly
      maxZoom: 18,
      pitch: 0,
      bearing: 0,
      maxBounds: [
        [7.0, 55.0], // Southwest coordinates (expanded)
        [25.0, 70.0]  // Northeast coordinates  
      ] // Restrict to Sweden and nearby areas
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add geolocate control for user positioning
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });
    map.current.addControl(geolocateControl, 'top-right');
    
    // Listen to geolocate events to sync with store
    geolocateControl.on('geolocate', (e) => {
      const { longitude, latitude } = e.coords;
      console.log(`User location detected: [${longitude}, ${latitude}]`);
      setMapCenter([longitude, latitude]);
      setMapZoom(13);
    });

    // Enhanced move handler that updates both map state and visible preschools list
    let moveTimeout: NodeJS.Timeout;
    map.current.on('moveend', () => {
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        if (!map.current) return;
        const center = map.current.getCenter();
        const zoom = map.current.getZoom();
        setMapCenter([center.lng, center.lat]);
        setMapZoom(zoom);
        
        // Update visible preschools based on current viewport
        const bounds = map.current.getBounds();
        updateVisiblePreschoolsFromViewport({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        });
        
        console.log(`🗺️ Map moved - updated visible preschools for viewport`);
      }, 300); // Increased debounce for better performance
    });

    map.current.on('style.load', () => {
      if (!map.current) return;
      console.log('🗺️ Mapbox style loaded, map is ready');
      setIsMapLoaded(true);
      
      // Initial viewport update after map loads
      setTimeout(() => {
        if (map.current) {
          const bounds = map.current.getBounds();
          updateVisiblePreschoolsFromViewport({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          });
          console.log('🎯 Initial viewport preschools updated');
        }
      }, 1000);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Handle preschool click from clustering
  const handlePreschoolClick = useCallback((preschool: Preschool) => {
    setSelectedPreschool(preschool);
    setPopupPreschool(preschool);
    setShowPopup(true);
    console.log(`🏫 Selected preschool: ${preschool.namn}`);
  }, [setSelectedPreschool]);

  // Handle cluster click from clustering
  const handleClusterClick = useCallback((clusterId: number, coordinates: [number, number]) => {
    console.log(`🔍 Cluster clicked: ${clusterId} at [${coordinates.join(', ')}]`);
    // Additional cluster click logic can be added here
  }, []);

  // Use optimized clustering hook with conditional enabling
  const { state: clusteringState, methods: clusteringMethods, config: clusteringConfig } = useOptimizedClustering({
    map: map.current,
    config: {
      enableCache: clusteringPerformanceMode === 'optimized',
      clusterRadius: clusteringPerformanceMode === 'optimized' ? 50 : 45,
      clusterMaxZoom: 12,
      maxZoom: 12,
      minZoom: 4
    },
    onClusterClick: handleClusterClick,
    onPreschoolClick: handlePreschoolClick
  });

  // Only use optimized clustering if enabled in store
  const shouldShowOptimizedClustering = clusteringEnabled && 
                                        layerVisibility.optimizedClusters && 
                                        clusteringPerformanceMode === 'optimized';

  return (
    <div className={`relative ${className || 'w-full h-screen'}`}>
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading overlay */}
      <AnimatePresence>
        {(!isMapLoaded || (shouldShowOptimizedClustering && clusteringState.isLoading)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-lg flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-xl p-6 shadow-2xl flex items-center gap-4 max-w-md">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  {!isMapLoaded ? 'Laddar karta...' : 'Optimerar clustering...'}
                </p>
                <p className="text-sm text-gray-600">
                  {filteredPreschools.length} förskolor redo för visning
                </p>
                {shouldShowOptimizedClustering && clusteringState.isLoading && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                    <Database className="w-3 h-3" />
                    Hämtar från cache...
                  </div>
                )}
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
            className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg z-40"
          >
            <div className="flex items-center gap-2">
              <strong className="font-bold">Clustering Error:</strong>
              <span className="block sm:inline">{clusteringState.error}</span>
              <button
                onClick={clusteringMethods.forceReload}
                className="ml-auto text-sm underline hover:no-underline"
              >
                Försök igen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optimized clustering stats (development mode) */}
      {shouldShowOptimizedClustering && process.env.NODE_ENV === 'development' && (
        <AnimatePresence>
          {showClusteringStats && (
            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              className="absolute top-4 left-4 bg-white rounded-xl shadow-2xl p-4 z-40 min-w-[320px]"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Optimized Clustering
                </h3>
                <button
                  onClick={() => setShowClusteringStats(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      Kluster
                    </span>
                    <span className="font-semibold">{clusteringState.clustersCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      Cache Hit
                    </span>
                    <span className="font-semibold">
                      {(clusteringState.cacheHitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    Uppdaterad
                  </span>
                  <span className="font-semibold text-xs">
                    {new Date(clusteringState.lastUpdate).toLocaleTimeString('sv-SE')}
                  </span>
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2"><strong>Konfiguration:</strong></p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Radius: {clusteringConfig.clusterRadius}px</div>
                    <div>Max Zoom: {clusteringConfig.maxZoom}</div>
                    <div>Min Zoom: {clusteringConfig.minZoom}</div>
                    <div>Cache: {clusteringConfig.enableCache ? '✅' : '❌'}</div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={clusteringMethods.refreshCache}
                    className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors"
                  >
                    Uppdatera Cache
                  </button>
                  <button
                    onClick={clusteringMethods.forceReload}
                    className="flex-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 transition-colors"
                  >
                    Ladda Om
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Stats toggle button (development only) */}
      {shouldShowOptimizedClustering && process.env.NODE_ENV === 'development' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: isMapLoaded ? 1 : 0 }}
          onClick={() => setShowClusteringStats(!showClusteringStats)}
          className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 z-30 hover:bg-gray-50"
          title="Visa clustering statistik"
        >
          <TrendingUp className="w-5 h-5 text-gray-600" />
        </motion.button>
      )}

      {/* Performance indicator */}
      <div className="absolute bottom-4 right-4 z-30">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: isMapLoaded ? 1 : 0 }}
          className="bg-black/70 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2"
        >
          {shouldShowOptimizedClustering ? (
            clusteringState.isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Optimerar...
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                {clusteringState.clustersCount} optimerade kluster
              </>
            )
          ) : (
            <>
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              {filteredPreschools.length} förskolor
            </>
          )}
        </motion.div>
      </div>

      {/* Enhanced popup for selected preschools */}
      <AnimatePresence>
        {showPopup && popupPreschool && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:max-w-md z-40"
          >
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {popupPreschool.namn}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {popupPreschool.adress}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-700">
                        <strong>{popupPreschool.kommun}</strong>
                      </span>
                      <span className="text-gray-500">
                        {popupPreschool.huvudman}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPopup(false);
                      setPopupPreschool(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 ml-3"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Additional preschool details */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                  {popupPreschool.google_rating && (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium">{popupPreschool.google_rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">Google</span>
                    </div>
                  )}
                  {popupPreschool.antal_barn && (
                    <div className="text-sm text-gray-600">
                      <strong>{popupPreschool.antal_barn}</strong> barn
                    </div>
                  )}
                  {popupPreschool.personaltäthet && (
                    <div className="text-sm text-gray-600">
                      <strong>{popupPreschool.personaltäthet.toFixed(1)}</strong> pers/täthet
                    </div>
                  )}
                  {popupPreschool.andel_med_förskollärarexamen && (
                    <div className="text-sm text-gray-600">
                      <strong>{popupPreschool.andel_med_förskollärarexamen.toFixed(0)}%</strong> examen
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Map3D;