import React, { useEffect, useRef, useState } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { Loader2, MapPin } from 'lucide-react';
import { OptimizedMapClustering } from './OptimizedMapClustering';
import { performanceOptimizer, createOptimizedHandler } from '@/utils/performanceOptimizer';
import { dataTransformers } from '@/utils/dataCache';

// MINIMAL MAP - ZERO EXTERNAL DEPENDENCIES INITIALLY
// Only loads what's needed when needed

interface MinimalMapProps {
  className?: string;
}

export const MinimalMap: React.FC<MinimalMapProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isMapboxLoaded, setIsMapboxLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [currentZoom, setCurrentZoom] = useState(5);

  const { filteredPreschools, layerVisibility } = useMapStore();

  // Load Mapbox GL JS dynamically
  const loadMapbox = async () => {
    if (isLoading || isMapboxLoaded) return;
    
    setIsLoading(true);
    
    try {
      // Load CSS first
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://api.mapbox.com/mapbox-gl-js/v3.14.0/mapbox-gl.css';
      document.head.appendChild(cssLink);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.14.0/mapbox-gl.js';
      script.onload = () => {
        // @ts-ignore
        const mapboxgl = window.mapboxgl;
        mapboxgl.accessToken = 'pk.eyJ1Ijoic2tvZ3N0YWRpc2FrIiwiYSI6ImNtY3BhaXRpMjA0ZGcycHBqNHM4dmlwOW0ifQ.KKHGGPnrZVjNjDdITF-_bw';

        if (mapContainer.current) {
          const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [15.2, 62.4],
            zoom: 5,
            minZoom: 4,
            maxZoom: 16,
            // PERFORMANCE SETTINGS
            dragRotate: false,
            pitchWithRotate: false,
            touchZoomRotate: false,
            attributionControl: false,
            logoPosition: 'bottom-right'
          });

          // Add simple controls
          map.addControl(new mapboxgl.NavigationControl({
            showCompass: false,
            showZoom: true
          }), 'top-right');

          map.on('load', () => {
            setIsMapboxLoaded(true);
            setIsLoading(false);
            setMapInstance(map);
            
            // Initialize map state tracking
            updateMapState(map);
            
            // Add optimized markers/clusters
            if (layerVisibility.optimizedClusters) {
              // Let OptimizedMapClustering handle the markers
            } else {
              addMarkers(map);
            }
          });

          map.on('error', () => {
            setIsLoading(false);
            console.error('Map failed to load');
          });
        }
      };
      
      script.onerror = () => {
        setIsLoading(false);
        console.error('Failed to load Mapbox GL JS');
      };
      
      document.body.appendChild(script);

    } catch (error) {
      setIsLoading(false);
      console.error('Error loading Mapbox:', error);
    }
  };

  // Update map state tracking
  const updateMapState = (map: any) => {
    const updateBounds = createOptimizedHandler(() => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      
      setMapBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
      setCurrentZoom(zoom);
    }, { throttle: 100, key: 'map-bounds-update' });

    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);
    
    // Initial state
    updateBounds();
  };

  // Add simple markers (optimized with performance patterns)
  const addMarkers = (map: any) => {
    // @ts-ignore
    const mapboxgl = window.mapboxgl;
    
    // Clear existing markers
    document.querySelectorAll('.minimal-marker').forEach(m => m.remove());

    // Use lightweight preschool data for better performance
    const lightweightData = filteredPreschools.map(dataTransformers.toLightweight);
    
    // Performance-optimized marker addition
    performanceOptimizer.batchProcess(
      lightweightData.slice(0, 1000), // Limit markers for performance
      (preschool) => {
        if (!preschool.latitud || !preschool.longitud) return null;

        const el = document.createElement('div');
        el.className = 'minimal-marker';
        el.innerHTML = `
          <div style="
            width: 8px;
            height: 8px;
            background: ${preschool.google_rating ? '#10b981' : '#3b82f6'};
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            transition: transform 0.15s ease;
          " 
          onmouseover="this.style.transform='scale(1.3)'" 
          onmouseout="this.style.transform='scale(1)'"
          title="${preschool.namn}${preschool.google_rating ? ` (⭐ ${preschool.google_rating})` : ''}"></div>
        `;

        return new mapboxgl.Marker(el)
          .setLngLat([preschool.longitud, preschool.latitud])
          .addTo(map);
      },
      50, // Process 50 markers per batch
      10  // 10ms delay between batches
    ).then((markers) => {
      const validMarkers = markers.filter(Boolean);
      console.log(`🎯 Added ${validMarkers.length} optimized markers to minimal map`);
    });
  };

  // Update markers when data changes
  useEffect(() => {
    if (mapInstance && isMapboxLoaded) {
      addMarkers(mapInstance);
    }
  }, [filteredPreschools, mapInstance, isMapboxLoaded]);

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Load trigger */}
      {!isMapboxLoaded && !isLoading && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center cursor-pointer hover:from-blue-100 hover:to-indigo-200 transition-all"
          onClick={loadMapbox}
        >
          <div className="text-center p-8 max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Utforska Sveriges Förskolor
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Interaktiv karta med {filteredPreschools.length.toLocaleString()} förskolor
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
              <MapPin className="w-5 h-5 mr-2" />
              Visa Karta
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Klicka för att ladda den interaktiva kartan
            </p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Laddar karta...
            </h4>
            <p className="text-gray-600">Detta tar bara några sekunder</p>
            <div className="mt-4 w-48 mx-auto bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* Optimized Clustering Component */}
      {isMapboxLoaded && mapInstance && mapBounds && layerVisibility.optimizedClusters && (
        <OptimizedMapClustering 
          map={mapInstance}
          zoom={currentZoom}
          bounds={mapBounds}
        />
      )}

      {/* Status */}
      {isMapboxLoaded && (
        <div className="absolute bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            {layerVisibility.optimizedClusters ? 'Smart kluster' : 'Snabb karta'} • {filteredPreschools.length} förskolor
          </span>
        </div>
      )}
    </div>
  );
};

export default MinimalMap;