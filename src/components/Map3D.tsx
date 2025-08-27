import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedPopup } from '@/components/enhanced/EnhancedPopup';

// Mapbox token - will be set via proxy in production
// For development, we'll use a fallback but prefer proxy
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2tvZ3N0YWRpc2FrIiwiYSI6ImNtY3BhaXRpMjA0ZGcycHBqNHM4dmlwOW0ifQ.KKHGGPnrZVjNjDdITF-_bw';
mapboxgl.accessToken = MAPBOX_TOKEN;
interface Map3DProps {
  className?: string;
}

export const Map3D: React.FC<Map3DProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPreschool, setPopupPreschool] = useState<Preschool | null>(null);
  const {
    filteredPreschools,
    selectedPreschool,
    setSelectedPreschool,
    mapCenter,
    mapZoom,
    setMapCenter,
    setMapZoom,
    preschools
  } = useMapStore();
  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with simpler style for better performance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [15.5, 62.0],
      zoom: 6,
      pitch: 0, // Reduced pitch for better performance
      bearing: 0
    });

    map.current.on('style.load', () => {
      if (!map.current) return;
      setIsLoading(false);
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

    // Simple debounced move handler for better performance
    let moveTimeout: NodeJS.Timeout;
    map.current.on('moveend', () => {
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        if (!map.current) return;
        const center = map.current.getCenter();
        const zoom = map.current.getZoom();
        setMapCenter([center.lng, center.lat]);
        setMapZoom(zoom);
      }, 100);
    });
    return () => {
      map.current?.remove();
    };
  }, []);

  // Memoize valid preschools to avoid recalculation
  const validPreschools = useMemo(() => {
    const valid = filteredPreschools.filter(p => 
      p.latitud !== null && 
      p.longitud !== null && 
      typeof p.latitud === 'number' && 
      typeof p.longitud === 'number' &&
      p.latitud >= 55.0 && p.latitud <= 69.1 && 
      p.longitud >= 10.9 && p.longitud <= 24.2
    );
    console.log(`Valid preschools for map: ${valid.length}/${filteredPreschools.length}`);
    return valid;
  }, [filteredPreschools]);

  // Memoize GeoJSON data
  const geojsonData = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: validPreschools.map(preschool => ({
      type: 'Feature' as const,
      properties: {
        id: preschool.id,
        namn: preschool.namn,
        kommun: preschool.kommun,
        huvudman: preschool.huvudman,
        google_rating: preschool.google_rating || 0
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [preschool.longitud, preschool.latitud]
      }
    }))
  }), [validPreschools]);

  // Update map data when preschools change
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    
    // Remove existing layers
    const layersToRemove = ['preschools-clusters', 'preschools-cluster-count', 'preschools-unclustered'];
    layersToRemove.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
    });
    if (map.current?.getSource('preschools')) {
      map.current.removeSource('preschools');
    }

    if (validPreschools.length === 0) return;
    console.log(`Adding ${validPreschools.length} preschools to map`);

    // Add source with clustering
    map.current.addSource('preschools', {
      type: 'geojson',
      data: geojsonData,
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 50
    });

    // Add cluster circles
    map.current.addLayer({
      id: 'preschools-clusters',
      type: 'circle',
      source: 'preschools',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#2563eb',
        'circle-radius': 20,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      }
    });

    // Add cluster labels
    map.current.addLayer({
      id: 'preschools-cluster-count',
      type: 'symbol',
      source: 'preschools',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 14
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Add individual markers
    map.current.addLayer({
      id: 'preschools-unclustered',
      type: 'circle',
      source: 'preschools',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#10b981',
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      }
    });

    // Simple click handler for markers
    map.current.on('click', 'preschools-unclustered', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        const preschoolId = feature.properties?.id;
        const preschool = filteredPreschools.find(p => p.id === preschoolId);
        if (preschool) {
          setPopupPreschool(preschool);
          setShowPopup(true);
        }
      }
    });

    // Cluster click handler
    map.current.on('click', 'preschools-clusters', (e) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['preschools-clusters']
      });
      const clusterId = features[0].properties!.cluster_id;
      const source = map.current!.getSource('preschools') as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.current!.easeTo({
          center: (features[0].geometry as any).coordinates,
          zoom: zoom
        });
      });
    });
  }, [filteredPreschools]);

  // Handle map center and zoom changes from store
  useEffect(() => {
    if (!map.current) return;
    
    const currentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();
    
    // Only update if there's a significant difference to avoid infinite loops
    const centerArray = Array.isArray(mapCenter) ? mapCenter : [mapCenter.lng || mapCenter.lon, mapCenter.lat];
    const [targetLng, targetLat] = centerArray;
    
    const centerDiff = Math.abs(currentCenter.lng - targetLng) + Math.abs(currentCenter.lat - targetLat);
    const zoomDiff = Math.abs(currentZoom - mapZoom);
    
    if (centerDiff > 0.01 || zoomDiff > 0.5) {
      console.log(`Flying to: [${targetLng}, ${targetLat}] zoom: ${mapZoom}`);
      map.current.flyTo({
        center: [targetLng, targetLat],
        zoom: mapZoom,
        duration: 1000
      });
    }
  }, [mapCenter, mapZoom]);

  // Simple selected preschool centering
  useEffect(() => {
    if (selectedPreschool && map.current && selectedPreschool.latitud && selectedPreschool.longitud) {
      map.current.flyTo({
        center: [selectedPreschool.longitud, selectedPreschool.latitud],
        zoom: 14,
        duration: 1000
      });
    }
  }, [selectedPreschool]);

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {showPopup && popupPreschool && (
          <EnhancedPopup 
            preschool={popupPreschool} 
            onClose={() => {
              setShowPopup(false);
              setPopupPreschool(null);
            }} 
            onViewDetails={() => {
              setSelectedPreschool(popupPreschool);
              setShowPopup(false);
              setPopupPreschool(null);
            }} 
          />
        )}
      </AnimatePresence>
      
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
      
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm flex items-center justify-center rounded-lg"
        >
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-foreground font-medium">Laddar karta över Sverige...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};