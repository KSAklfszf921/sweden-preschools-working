import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { Loader2, MapPin } from 'lucide-react';

// DYNAMIC IMPORTS för code splitting
const loadMapboxDependencies = async () => {
  const [mapboxgl, MapboxLanguage] = await Promise.all([
    import('mapbox-gl'),
    import('@mapbox/mapbox-gl-language')
  ]);
  
  // Load CSS dynamically
  await import('mapbox-gl/dist/mapbox-gl.css');
  
  return { mapboxgl: mapboxgl.default, MapboxLanguage: MapboxLanguage.default };
};

const loadClusteringDependencies = async () => {
  const [clustering, cache] = await Promise.all([
    import('@/hooks/useOptimizedClustering'),
    import('@/utils/clusteringCacheManager')
  ]);
  
  return { 
    useOptimizedClustering: clustering.useOptimizedClustering,
    initClusteringCache: cache.initClusteringCache 
  };
};

// Mapbox token
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2tvZ3N0YWRpc2FrIiwiYSI6ImNtY3BhaXRpMjA0ZGcycHBqNHM4dmlwOW0ifQ.KKHGGPnrZVjNjDdITF-_bw';

interface PerformantMap3DProps {
  className?: string;
}

export const PerformantMap3D: React.FC<PerformantMap3DProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoadingMapbox, setIsLoadingMapbox] = useState(true);
  const [mapboxError, setMapboxError] = useState<string | null>(null);

  const {
    filteredPreschools,
    mapCenter,
    mapZoom,
    setMapCenter,
    setMapZoom,
    clusteringEnabled,
    clusteringPerformanceMode
  } = useMapStore();

  // Load Mapbox dynamically
  useEffect(() => {
    let mounted = true;

    const initializeMap = async () => {
      try {
        setIsLoadingMapbox(true);
        
        // Load Mapbox dependencies dynamically
        const { mapboxgl, MapboxLanguage } = await loadMapboxDependencies();
        
        if (!mounted) return;

        // Set access token
        mapboxgl.accessToken = MAPBOX_TOKEN;

        // Create map
        if (mapContainer.current) {
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: mapCenter,
            zoom: mapZoom,
            minZoom: 2,
            maxZoom: 18,
            pitch: 0,
            bearing: 0,
            maxBounds: [
              [7.0, 55.0],  // Southwest Sweden
              [25.0, 70.0]  // Northeast Sweden
            ]
          });

          // Add controls
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
          map.current.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
          }), 'top-right');

          // Add language support
          const language = new MapboxLanguage({ defaultLanguage: 'sv' });
          map.current.addControl(language);

          // Map loaded handler
          map.current.on('style.load', () => {
            if (mounted) {
              console.log('✅ Map loaded successfully');
              setIsMapLoaded(true);
              setIsLoadingMapbox(false);
            }
          });

          // Movement handlers
          map.current.on('moveend', () => {
            if (mounted && map.current) {
              setMapCenter([map.current.getCenter().lng, map.current.getCenter().lat]);
              setMapZoom(map.current.getZoom());
            }
          });
        }

        // Load clustering after map is ready
        if (clusteringEnabled) {
          loadClusteringDependencies().then(({ initClusteringCache }) => {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
            
            if (supabaseUrl && supabaseKey) {
              initClusteringCache(supabaseUrl, supabaseKey);
            }
          });
        }

      } catch (error) {
        console.error('❌ Failed to load Mapbox:', error);
        if (mounted) {
          setMapboxError('Failed to load map. Please refresh the page.');
          setIsLoadingMapbox(false);
        }
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Simple marker rendering for performance
  useEffect(() => {
    if (!map.current || !isMapLoaded || filteredPreschools.length === 0) return;

    console.log(`🎯 Rendering ${filteredPreschools.length} preschools`);

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.mapbox-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add simple markers (no clustering for now - focus on speed)
    let visibleCount = 0;
    const maxMarkers = 1000; // Limit for performance

    filteredPreschools.slice(0, maxMarkers).forEach(preschool => {
      if (preschool.latitud && preschool.longitud) {
        // Simple marker element
        const el = document.createElement('div');
        el.className = 'mapbox-marker';
        el.innerHTML = `
          <div style="
            width: 8px;
            height: 8px;
            background-color: #3B82F6;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          "></div>
        `;

        // Add to map
        new (window as any).mapboxgl.Marker(el)
          .setLngLat([preschool.longitud, preschool.latitud])
          .addTo(map.current);

        visibleCount++;
      }
    });

    console.log(`✅ Rendered ${visibleCount} markers`);
  }, [filteredPreschools, isMapLoaded]);

  if (mapboxError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">{mapboxError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading overlay */}
      {isLoadingMapbox && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading map...</p>
            <p className="text-xs text-gray-500 mt-1">
              {filteredPreschools.length} preschools ready to display
            </p>
          </div>
        </div>
      )}

      {/* Performance indicator */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
        {isMapLoaded ? (
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            {filteredPreschools.length} förskolor
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading...
          </span>
        )}
      </div>
    </div>
  );
};

export default PerformantMap3D;