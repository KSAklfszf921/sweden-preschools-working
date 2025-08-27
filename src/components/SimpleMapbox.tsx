import React, { useEffect, useRef, useState } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { Loader2, MapPin } from 'lucide-react';

interface SimpleMapboxProps {
  className?: string;
}

// ENKEL MAPBOX IMPLEMENTATION - KOPIERAD FRÅN FRAMGÅNGSRIKA PROJEKTEN
export const SimpleMapbox: React.FC<SimpleMapboxProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isMapboxLoaded, setIsMapboxLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

  const { filteredPreschools } = useMapStore();

  // Load Mapbox GL JS - EXAKT som i framgångsrika projekten
  const loadMapbox = async () => {
    if (isLoading || isMapboxLoaded) return;
    
    setIsLoading(true);
    
    try {
      // Load CSS - lightweight
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      document.head.appendChild(cssLink);

      // Load JS - stable version som i framgångsrika projekten
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => {
        // @ts-ignore
        const mapboxgl = window.mapboxgl;
        mapboxgl.accessToken = 'pk.eyJ1Ijoic2tvZ3N0YWRpc2FrIiwiYSI6ImNtY3BhaXRpMjA0ZGcycHBqNHM4dmlwOW0ifQ.KKHGGPnrZVjNjDdITF-_bw';

        if (mapContainer.current) {
          // ENKEL MAP-KONFIGURATION - FOKUS PÅ PRESTANDA
          const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v10', // Lättare stil
            center: [15.2, 62.4],
            zoom: 5.5,
            minZoom: 4,
            maxZoom: 16,
            // PRESTANDA-OPTIMERINGAR från framgångsrika projekten
            dragRotate: false,
            pitchWithRotate: false,
            touchZoomRotate: false,
            renderWorldCopies: false, // Mindre rendering
            preserveDrawingBuffer: false, // Mindre memory
            antialias: false, // Snabbare
          });

          // Minimala kontroller
          map.addControl(new mapboxgl.NavigationControl({
            showCompass: false,
            showZoom: true
          }), 'top-right');

          map.on('load', () => {
            setIsMapboxLoaded(true);
            setIsLoading(false);
            setMapInstance(map);
            
            // Lägg till enkla markers direkt
            addSimpleMarkers(map);
          });

          map.on('error', (e) => {
            console.error('Map error:', e);
            setIsLoading(false);
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

  // ENKEL MARKER IMPLEMENTATION - ingen komplex clustering
  const addSimpleMarkers = (map: any) => {
    // @ts-ignore
    const mapboxgl = window.mapboxgl;
    
    // Ta bara förskolor med koordinater - max 500 för prestanda
    const validPreschools = filteredPreschools
      .filter(p => p.latitud && p.longitud && p.latitud !== 0 && p.longitud !== 0)
      .slice(0, 500);

    console.log(`Adding ${validPreschools.length} simple markers`);

    // Lägg till enkla markers
    validPreschools.forEach((preschool) => {
      // Enkel marker-stil från framgångsrika projekten
      const el = document.createElement('div');
      el.className = 'simple-mapbox-marker';
      el.style.cssText = `
        width: 10px;
        height: 10px;
        background-color: ${preschool.google_rating ? '#10b981' : '#3b82f6'};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: transform 0.2s ease;
      `;
      
      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Enkel popup från framgångsrika projekten
      const popup = new mapboxgl.Popup({ 
        offset: 15,
        closeButton: true,
        closeOnClick: false 
      }).setHTML(`
        <div style="padding: 8px; max-width: 250px; font-family: system-ui;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #333;">
            ${preschool.namn}
          </h3>
          <div style="font-size: 14px; line-height: 1.4; color: #666;">
            <p style="margin: 4px 0;"><strong>Kommun:</strong> ${preschool.kommun}</p>
            ${preschool.adress ? `<p style="margin: 4px 0;"><strong>Adress:</strong> ${preschool.adress}</p>` : ''}
            ${preschool.google_rating ? `
              <p style="margin: 4px 0; color: #059669;">
                <strong>Betyg:</strong> ⭐ ${preschool.google_rating}
                ${preschool.google_reviews_count ? ` (${preschool.google_reviews_count} recensioner)` : ''}
              </p>
            ` : ''}
            ${preschool.antal_barn ? `<p style="margin: 4px 0;"><strong>Antal barn:</strong> ${preschool.antal_barn}</p>` : ''}
          </div>
        </div>
      `);

      // Skapa marker med popup
      new mapboxgl.Marker(el)
        .setLngLat([preschool.longitud, preschool.latitud])
        .setPopup(popup)
        .addTo(map);
    });
  };

  // Update markers when data changes
  useEffect(() => {
    if (mapInstance && isMapboxLoaded) {
      // Ta bort gamla markers
      document.querySelectorAll('.simple-mapbox-marker').forEach(m => m.remove());
      addSimpleMarkers(mapInstance);
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
              Enkel Mapbox-karta
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Snabb och enkel karta med {filteredPreschools.length.toLocaleString()} förskolor
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
              <MapPin className="w-5 h-5 mr-2" />
              Visa Karta (Enkel Mapbox)
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Baserad på framgångsrika projekt
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
              Laddar enkel Mapbox...
            </h4>
            <p className="text-gray-600">Baserat på framgångsrika projekt</p>
          </div>
        </div>
      )}

      {/* Status */}
      {isMapboxLoaded && (
        <div className="absolute bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Enkel Mapbox • {filteredPreschools.filter(p => p.latitud && p.longitud).length} förskolor
          </span>
        </div>
      )}
    </div>
  );
};

export default SimpleMapbox;