import React, { useEffect, useRef, useState } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { Loader2 } from 'lucide-react';

// ULTRA FAST MAP - NO HEAVY DEPENDENCIES
// Laddar Mapbox endast när användaren interagerar

interface UltraFastMapProps {
  className?: string;
}

export const UltraFastMap: React.FC<UltraFastMapProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { filteredPreschools } = useMapStore();

  // Load Mapbox ONLY when user interacts
  const loadMap = async () => {
    if (isLoading || map.current) return;
    
    setIsLoading(true);
    try {
      // Dynamic import - loads only when needed
      const mapboxgl = await import('mapbox-gl');
      await import('mapbox-gl/dist/mapbox-gl.css');
      
      const MapboxGL = mapboxgl.default;
      MapboxGL.accessToken = 'pk.eyJ1Ijoic2tvZ3N0YWRpc2FrIiwiYSI6ImNtY3BhaXRpMjA0ZGcycHBqNHM4dmlwOW0ifQ.KKHGGPnrZVjNjDdITF-_bw';

      if (!mapContainer.current) return;

      // ULTRA FAST MAP SETUP
      map.current = new MapboxGL.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11', // Lighter style = faster
        center: [15.2, 62.4],
        zoom: 5,
        minZoom: 4,
        maxZoom: 16,
        // PERFORMANCE OPTIMIZATIONS
        attributionControl: false,
        logoPosition: 'bottom-right',
        dragRotate: false, // Disable rotation for performance
        pitchWithRotate: false,
        touchZoomRotate: false,
        preserveDrawingBuffer: false,
        // REDUCE RENDERING
        maxTileCacheSize: 50,
        transformRequest: (url) => ({
          url: url,
          headers: {},
          credentials: 'same-origin'
        })
      });

      // MINIMAL CONTROLS
      const nav = new MapboxGL.NavigationControl({ 
        showCompass: false,
        showZoom: true,
        visualizePitch: false
      });
      map.current.addControl(nav, 'top-right');

      map.current.on('load', () => {
        setIsReady(true);
        setIsLoading(false);
        console.log('🚀 Ultra fast map loaded!');
        
        // Add preschools AFTER map loads
        addSimpleMarkers();
      });

      // ERROR HANDLING
      map.current.on('error', (e: any) => {
        console.error('Map error:', e);
        setError('Kartfel - prova uppdatera sidan');
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Failed to load map:', error);
      setError('Kunde inte ladda karta');
      setIsLoading(false);
    }
  };

  // SIMPLE FAST MARKERS - NO CLUSTERING YET
  const addSimpleMarkers = () => {
    if (!map.current || !isReady) return;

    // Clear existing
    const existingMarkers = document.querySelectorAll('.simple-marker');
    existingMarkers.forEach(m => m.remove());

    // Add max 500 markers for performance
    const maxMarkers = 500;
    let added = 0;

    filteredPreschools.forEach(preschool => {
      if (added >= maxMarkers) return;
      if (!preschool.latitud || !preschool.longitud) return;

      // ULTRA SIMPLE MARKER
      const el = document.createElement('div');
      el.className = 'simple-marker';
      el.innerHTML = `
        <div style="
          width: 6px;
          height: 6px;
          background: #2563eb;
          border: 1px solid white;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.1s;
        " onmouseover="this.style.transform='scale(1.5)'" 
           onmouseout="this.style.transform='scale(1)'"
           title="${preschool.namn}"></div>
      `;

      // Add to map with minimal overhead
      new (window as any).mapboxgl.Marker(el, { anchor: 'center' })
        .setLngLat([preschool.longitud, preschool.latitud])
        .addTo(map.current);

      added++;
    });

    console.log(`✅ Added ${added} ultra-fast markers`);
  };

  // Re-add markers when data changes
  useEffect(() => {
    if (isReady) {
      addSimpleMarkers();
    }
  }, [filteredPreschools, isReady]);

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full cursor-pointer"
        onClick={!isReady && !isLoading ? loadMap : undefined}
      />

      {/* Click to load overlay */}
      {!isReady && !isLoading && !error && (
        <div 
          className="absolute inset-0 bg-blue-50 flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={loadMap}
        >
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Visa Interaktiv Karta
            </h3>
            <p className="text-gray-600 mb-4">
              Klicka för att ladda kartan med {filteredPreschools.length} förskolor
            </p>
            <div className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Ladda Karta →
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Laddar snabb karta...</p>
            <p className="text-xs text-gray-500 mt-1">Detta tar bara några sekunder</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Uppdatera sidan
            </button>
          </div>
        </div>
      )}

      {/* Status indicator */}
      {isReady && (
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            Snabb karta aktiv
          </span>
        </div>
      )}
    </div>
  );
};

export default UltraFastMap;