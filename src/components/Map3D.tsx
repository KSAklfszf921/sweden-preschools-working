import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedPopup } from '@/components/enhanced/EnhancedPopup';
import { ApiManager } from '@/services/apiManager';

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
    preschools,
    lastUpdated,
    updateVisiblePreschoolsFromViewport
  } = useMapStore();
  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map focused on all of Sweden with better cluster visibility
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [15.0, 62.0], // Centered on Sweden
      zoom: 5.2, // Increased zoom to better show clusters
      pitch: 0,
      bearing: 0,
      maxBounds: [
        [8.0, 55.0], // Southwest coordinates
        [25.0, 70.0]  // Northeast coordinates  
      ] // Restrict to Sweden and nearby areas
    });

    map.current.on('style.load', () => {
      if (!map.current) return;
      console.log('🗺️ Mapbox style loaded, map is ready');
      setIsLoading(false);
      
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
    console.log(`📍 Valid preschools for map: ${valid.length}/${filteredPreschools.length}`);
    if (valid.length > 0) {
      console.log(`✅ First preschool: ${valid[0].namn} at [${valid[0].longitud}, ${valid[0].latitud}]`);
    }
    return valid;
  }, [filteredPreschools]);

  // Memoize GeoJSON data
  const geojsonData = useMemo(() => {
    const geoData = {
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
    };
    console.log(`🌍 Generated GeoJSON with ${geoData.features.length} features`);
    return geoData;
  }, [validPreschools]);

  // Update map data when preschools change - CRITICAL for showing data
  useEffect(() => {
    console.log(`🔄 Map useEffect triggered - valid preschools: ${validPreschools.length}`);
    
    if (!map.current) {
      console.log('❌ No map instance available');
      return;
    }
    
    // If style is not loaded yet, wait for it
    if (!map.current.isStyleLoaded()) {
      console.log('⏳ Waiting for map style to load...');
      const waitForStyle = () => {
        if (map.current?.isStyleLoaded()) {
          console.log('✅ Style loaded, adding preschools');
          addPreschoolsToMap();
        } else {
          setTimeout(waitForStyle, 100);
        }
      };
      waitForStyle();
      return;
    }
    
    // Style is loaded, add preschools immediately
    addPreschoolsToMap();
    
    function addPreschoolsToMap() {
      if (!map.current) return;
    
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

    if (validPreschools.length === 0) {
      console.log('No valid preschools to display on map');
      return;
    }
    console.log(`🗺️ Adding ${validPreschools.length} preschools to map with clustering`);

    // Add source with optimized clustering for Sweden view
    map.current.addSource('preschools', {
      type: 'geojson',
      data: geojsonData,
      cluster: true,
      clusterMaxZoom: 12, // Better clustering for country view
      clusterRadius: 35,  // Optimized radius for Sweden scale
      clusterProperties: {
        // Add cluster properties for better visibility
        'avg_rating': ['+', ['get', 'google_rating']],
        'preschool_count': ['+', ['case', ['!=', ['get', 'google_rating'], null], 1, 0]]
      }
    });

    // Add dynamic cluster circles that scale with zoom and data
    map.current.addLayer({
      id: 'preschools-clusters',
      type: 'circle',
      source: 'preschools',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#10b981', // Green for small clusters (1-10)
          10,
          '#f59e0b', // Amber for medium clusters (10-50)
          50,
          '#ef4444'  // Red for large clusters (50+)
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          18,  // Small clusters - made bigger for visibility
          10, 22,  // Medium clusters 
          50, 28   // Large clusters
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.85
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

    // Add dynamic individual markers that adapt to zoom level
    map.current.addLayer({
      id: 'preschools-unclustered',
      type: 'circle',
      source: 'preschools',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'case',
          ['>', ['get', 'google_rating'], 4.0], '#10b981', // High rating - green
          ['>', ['get', 'google_rating'], 3.0], '#f59e0b', // Medium rating - amber
          ['==', ['get', 'google_rating'], 0], '#6b7280',  // No rating - gray
          '#ef4444'  // Low rating - red
        ],
        'circle-radius': [
          'interpolate',
          ['exponential', 1.5],
          ['zoom'],
          10, 6,   // At zoom 10, radius 6
          15, 10   // At zoom 15, radius 10
        ],
        'circle-stroke-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 1,   // At zoom 10, stroke 1
          15, 2    // At zoom 15, stroke 2
        ],
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    });

    // Enhanced click handler for markers with automatic enrichment
    map.current.on('click', 'preschools-unclustered', async (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        const preschoolId = feature.properties?.id;
        const preschool = filteredPreschools.find(p => p.id === preschoolId);
        if (preschool) {
          setPopupPreschool(preschool);
          setShowPopup(true);
          
          // Enrich preschool data in background if not already done
          if (preschool.latitud && preschool.longitud && !preschool.google_rating) {
            console.log(`🔄 Auto-enriching preschool: ${preschool.namn}`);
            ApiManager.enrichPreschool(
              preschool.id,
              preschool.latitud,
              preschool.longitud,
              preschool.adress || '',
              preschool.namn,
              1 // High priority for user-clicked items
            );
          }
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
    }
  }, [filteredPreschools, geojsonData, lastUpdated]);

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