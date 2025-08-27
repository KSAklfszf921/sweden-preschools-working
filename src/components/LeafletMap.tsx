import React, { useEffect, useRef, useState } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { Loader2, MapPin } from 'lucide-react';
import { OptimizedMapClustering } from './OptimizedMapClustering';
import { performanceOptimizer, createOptimizedHandler } from '@/utils/performanceOptimizer';
import { dataTransformers } from '@/utils/dataCache';

// LEAFLET MAP - BEHÅLLER ALL FUNKTIONALITET men byter ut Mapbox mot Leaflet för prestanda
// Exakt samma interface som MinimalMap men med Leaflet som framgångsrika projekten

interface LeafletMapProps {
  className?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [currentZoom, setCurrentZoom] = useState(6);
  const [markers, setMarkers] = useState<any[]>([]);

  const { filteredPreschools, layerVisibility } = useMapStore();

  // Load Leaflet dynamiskt - som framgångsrika projekten
  const loadLeaflet = async () => {
    if (isLoading || isLeafletLoaded) return;
    
    setIsLoading(true);
    
    try {
      // Load Leaflet CSS - mycket lättare än Mapbox
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      cssLink.crossOrigin = '';
      document.head.appendChild(cssLink);

      // Load Leaflet JS - bara ~40kb istället för 2MB Mapbox!
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => {
        // @ts-ignore
        const L = window.L;

        if (mapContainer.current) {
          // Leaflet Map med samma center och zoom som Mapbox-versionen
          const map = L.map(mapContainer.current, {
            center: [62.4, 15.2],
            zoom: 5.5,
            minZoom: 4,
            maxZoom: 16,
            // PRESTANDA SETTINGS från framgångsrika projekten
            preferCanvas: true,
            renderer: L.canvas(),
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: false,
            keyboard: true,
            dragging: true,
          });

          // OpenStreetMap tiles - gratis och snabbt
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 16,
            // Performance optimizations
            updateWhenZooming: false,
            updateWhenIdle: true,
            keepBuffer: 2
          }).addTo(map);

          // Samma zoom control styling som Mapbox
          const zoomControl = L.control.zoom({ position: 'topright' });
          map.addControl(zoomControl);

          map.on('load moveend zoomend', () => {
            updateMapState(map);
          });

          setIsLeafletLoaded(true);
          setIsLoading(false);
          setMapInstance(map);
          
          // Initialize map state tracking
          updateMapState(map);
          
          // Add markers/clusters based on layer visibility - SAMMA LOGIK
          if (layerVisibility.optimizedClusters) {
            // Let OptimizedMapClustering handle the markers
          } else {
            addLeafletMarkers(map);
          }
        }
      };
      
      script.onerror = () => {
        setIsLoading(false);
        console.error('Failed to load Leaflet');
      };
      
      document.body.appendChild(script);

    } catch (error) {
      setIsLoading(false);
      console.error('Error loading Leaflet:', error);
    }
  };

  // Update map state tracking - SAMMA SOM MAPBOX VERSION
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
    }, { throttle: 100, key: 'leaflet-bounds-update' });

    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);
    
    // Initial state
    updateBounds();
  };

  // Add Leaflet markers med samma prestanda-optimering som Mapbox
  const addLeafletMarkers = (map: any) => {
    // @ts-ignore
    const L = window.L;
    
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    setMarkers([]);

    // Use samma lightweight data transform
    const lightweightData = filteredPreschools.map(dataTransformers.toLightweight);
    
    // Performance-optimized marker addition med samma batching
    performanceOptimizer.batchProcess(
      lightweightData.slice(0, 1000), // Samma limit som Mapbox version
      (preschool) => {
        if (!preschool.latitud || !preschool.longitud) return null;

        // Leaflet CircleMarker - lättare än DOM markers
        const marker = L.circleMarker([preschool.latitud, preschool.longitud], {
          radius: 4,
          fillColor: preschool.google_rating ? '#10b981' : '#3b82f6',
          color: 'white',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });

        // Samma popup content som Mapbox version
        const popupContent = `
          <div style="
            width: 8px;
            height: 8px;
            background: ${preschool.google_rating ? '#10b981' : '#3b82f6'};
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            transition: transform 0.15s ease;
          ">
            <div style="padding: 8px; font-family: system-ui; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
                ${preschool.namn}
              </h3>
              <p style="margin: 4px 0; color: #666; font-size: 14px;">
                <strong>Kommun:</strong> ${preschool.kommun}
              </p>
              ${preschool.google_rating ? `
                <p style="margin: 4px 0; color: #059669; font-size: 14px;">
                  <strong>Betyg:</strong> ⭐ ${preschool.google_rating}
                </p>
              ` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: true,
          autoPan: true,
          keepInView: true
        });

        marker.addTo(map);
        return marker;
      },
      50, // Samma batch size
      10  // Samma delay
    ).then((newMarkers) => {
      const validMarkers = newMarkers.filter(Boolean);
      setMarkers(validMarkers);
      console.log(`🍃 Leaflet: Added ${validMarkers.length} optimized markers`);
    });
  };

  // Update markers när data ändras - SAMMA LOGIK
  useEffect(() => {
    if (mapInstance && isLeafletLoaded) {
      addLeafletMarkers(mapInstance);
    }
  }, [filteredPreschools, mapInstance, isLeafletLoaded]);

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* SAMMA Load trigger som MinimalMap */}
      {!isLeafletLoaded && !isLoading && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center cursor-pointer hover:from-blue-100 hover:to-indigo-200 transition-all"
          onClick={loadLeaflet}
        >
          <div className="text-center p-8 max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Utforska Sveriges Förskolor
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Leaflet-karta med {filteredPreschools.length.toLocaleString()} förskolor
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl">
              <MapPin className="w-5 h-5 mr-2" />
              Visa Karta (Ultra-snabb!)
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Leaflet - bara ~40kb istället för 2MB Mapbox
            </p>
          </div>
        </div>
      )}

      {/* SAMMA Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Laddar Leaflet-karta...
            </h4>
            <p className="text-gray-600">Ultra-snabb laddning från framgångsrika projekt</p>
            <div className="mt-4 w-48 mx-auto bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full animate-pulse" style={{width: '80%'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* SAMMA Optimized Clustering Component support */}
      {isLeafletLoaded && mapInstance && mapBounds && layerVisibility.optimizedClusters && (
        <OptimizedMapClustering 
          map={mapInstance}
          zoom={currentZoom}
          bounds={mapBounds}
        />
      )}

      {/* SAMMA Status med Leaflet-info */}
      {isLeafletLoaded && (
        <div className="absolute bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            {layerVisibility.optimizedClusters ? 'Smart kluster' : 'Leaflet karta'} • {filteredPreschools.length} förskolor
          </span>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;