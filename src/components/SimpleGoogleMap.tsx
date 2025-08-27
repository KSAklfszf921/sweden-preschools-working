import React, { useEffect, useRef, useState } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { Loader2, MapPin } from 'lucide-react';

interface SimpleGoogleMapProps {
  className?: string;
}

// SUPER SIMPLE GOOGLE MAPS - EXACT COPY OF FAST REFERENCE PROJECT APPROACH
export const SimpleGoogleMap: React.FC<SimpleGoogleMapProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  const { filteredPreschools } = useMapStore();

  // Load Google Maps exactly like reference project
  const loadGoogleMaps = async () => {
    if (isLoading || isGoogleLoaded) return;
    
    setIsLoading(true);
    
    try {
      // Same API key as in CLAUDE.md - already configured
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB2kcdubteFtMpEIMYVJKgoaoLUndG1dI8&libraries=geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (mapContainer.current) {
          // Simple Google Map - EXACTLY like reference project
          const map = new google.maps.Map(mapContainer.current, {
            center: { lat: 62.4, lng: 15.2 }, // Center of Sweden
            zoom: 6,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            // PERFORMANCE OPTIMIZATIONS - copied from reference
            gestureHandling: 'greedy',
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            // Fast styling
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });

          setMapInstance(map);
          setIsGoogleLoaded(true);
          setIsLoading(false);
          
          // Add simple markers immediately
          addSimpleMarkers(map);
        }
      };
      
      script.onerror = () => {
        setIsLoading(false);
        console.error('Failed to load Google Maps');
      };
      
      document.head.appendChild(script);

    } catch (error) {
      setIsLoading(false);
      console.error('Error loading Google Maps:', error);
    }
  };

  // Super simple marker addition - NO CLUSTERING COMPLEXITY
  const addSimpleMarkers = (map: google.maps.Map) => {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    const newMarkers: google.maps.Marker[] = [];
    
    // Add simple markers for all preschools with coordinates
    filteredPreschools
      .filter(p => p.latitud && p.longitud && p.latitud !== 0 && p.longitud !== 0)
      .slice(0, 500) // Limit for performance like reference project
      .forEach((preschool) => {
        const marker = new google.maps.Marker({
          position: { lat: preschool.latitud, lng: preschool.longitud },
          map: map,
          title: preschool.namn,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 4,
            fillColor: preschool.google_rating ? '#10b981' : '#3b82f6',
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 1,
          }
        });

        // Simple info window - EXACTLY like reference
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
                ${preschool.namn}
              </h3>
              <p style="margin: 4px 0; color: #666; font-size: 14px;">
                <strong>Kommun:</strong> ${preschool.kommun}<br>
                <strong>Adress:</strong> ${preschool.adress}
              </p>
              ${preschool.google_rating ? `
                <p style="margin: 4px 0; font-size: 14px;">
                  <strong>Betyg:</strong> ⭐ ${preschool.google_rating} 
                  ${preschool.google_reviews_count ? `(${preschool.google_reviews_count} recensioner)` : ''}
                </p>
              ` : ''}
              ${preschool.antal_barn ? `
                <p style="margin: 4px 0; font-size: 14px;">
                  <strong>Antal barn:</strong> ${preschool.antal_barn}
                </p>
              ` : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
        
        newMarkers.push(marker);
      });
    
    setMarkers(newMarkers);
    console.log(`✅ Added ${newMarkers.length} simple Google Maps markers`);
  };

  // Update markers when data changes
  useEffect(() => {
    if (mapInstance && isGoogleLoaded) {
      addSimpleMarkers(mapInstance);
    }
  }, [filteredPreschools, mapInstance, isGoogleLoaded]);

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Load trigger */}
      {!isGoogleLoaded && !isLoading && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center cursor-pointer hover:from-blue-100 hover:to-indigo-200 transition-all"
          onClick={loadGoogleMaps}
        >
          <div className="text-center p-8 max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Snabb Google Maps-karta
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Enkel och snabb karta med {filteredPreschools.length.toLocaleString()} förskolor
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
              <MapPin className="w-5 h-5 mr-2" />
              Visa Karta (Snabb!)
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Optimerad för prestanda - laddar på sekunder
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
              Laddar Google Maps...
            </h4>
            <p className="text-gray-600">Mycket snabbare än Mapbox!</p>
          </div>
        </div>
      )}

      {/* Status */}
      {isGoogleLoaded && (
        <div className="absolute bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Google Maps • {markers.length} förskolor visas
          </span>
        </div>
      )}
    </div>
  );
};

export default SimpleGoogleMap;