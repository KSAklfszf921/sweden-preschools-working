import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapStore } from '@/stores/mapStore';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2tvZ3N0YWRpc2FrIiwiYSI6ImNtY3BhaXRpMjA0ZGcycHBqNHM4dmlwOW0ifQ.KKHGGPnrZVjNjDdITF-_bw';

interface Map3DProps {
  className?: string;
}

export const Map3D: React.FC<Map3DProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    filteredPreschools,
    selectedPreschool,
    setSelectedPreschool,
    mapCenter,
    mapZoom,
    setMapCenter,
    setMapZoom,
    showClusters
  } = useMapStore();

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with 3D terrain
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: mapCenter,
      zoom: mapZoom,
      pitch: 45,
      bearing: 0,
      antialias: true,
      projection: 'globe' as any
    });

    // Add 3D terrain
    map.current.on('style.load', () => {
      if (!map.current) return;

      // Add terrain source
      map.current.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      });

      // Add terrain layer
      map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

      // Add sky layer for atmosphere
      map.current.addLayer({
        'id': 'sky',
        'type': 'sky',
        'paint': {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });

      setIsLoading(false);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl({
      visualizePitch: true
    }), 'top-right');

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    // Handle map movement
    map.current.on('moveend', () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      setMapCenter([center.lng, center.lat]);
      setMapZoom(zoom);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update preschool markers when filtered data changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Remove existing preschool layers and sources
    if (map.current.getLayer('preschools-clusters')) {
      map.current.removeLayer('preschools-clusters');
    }
    if (map.current.getLayer('preschools-cluster-count')) {
      map.current.removeLayer('preschools-cluster-count');
    }
    if (map.current.getLayer('preschools-unclustered')) {
      map.current.removeLayer('preschools-unclustered');
    }
    if (map.current.getSource('preschools')) {
      map.current.removeSource('preschools');
    }

    // Create GeoJSON data from filtered preschools
    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: filteredPreschools.map(preschool => ({
        type: 'Feature' as const,
        properties: {
          id: preschool.id,
          namn: preschool.namn,
          kommun: preschool.kommun,
          adress: preschool.adress,
          antal_barn: preschool.antal_barn,
          huvudman: preschool.huvudman,
          personaltäthet: preschool.personaltäthet,
          andel_med_förskollärarexamen: preschool.andel_med_förskollärarexamen,
          antal_barngrupper: preschool.antal_barngrupper,
          google_rating: preschool.google_rating || 0
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [preschool.longitud, preschool.latitud]
        }
      }))
    };

    // Add preschools source
    map.current.addSource('preschools', {
      type: 'geojson',
      data: geojsonData,
      cluster: showClusters,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Add cluster circles
    if (showClusters) {
      map.current.addLayer({
        id: 'preschools-clusters',
        type: 'circle',
        source: 'preschools',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Add cluster count labels
      map.current.addLayer({
        id: 'preschools-cluster-count',
        type: 'symbol',
        source: 'preschools',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });
    }

    // Add unclustered preschool points
    map.current.addLayer({
      id: 'preschools-unclustered',
      type: 'circle',
      source: 'preschools',
      filter: showClusters ? ['!', ['has', 'point_count']] : ['all'],
      paint: {
        'circle-color': [
          'case',
          ['>', ['get', 'google_rating'], 0],
          [
            'interpolate',
            ['linear'],
            ['get', 'google_rating'],
            0, '#ef4444',
            3, '#f59e0b',
            4, '#22c55e',
            5, '#16a34a'
          ],
          '#6366f1'
        ],
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, 4,
          10, 8,
          15, 12
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      }
    });

    // Add click handlers
    map.current.on('click', 'preschools-clusters', (e) => {
      if (!map.current) return;
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ['preschools-clusters']
      });
      const clusterId = features[0].properties?.cluster_id;
      
      if (clusterId !== undefined) {
        (map.current.getSource('preschools') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || !map.current) return;
          map.current.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom
          });
        });
      }
    });

    map.current.on('click', 'preschools-unclustered', (e) => {
      const feature = e.features?.[0];
      if (feature?.properties) {
        const preschool = filteredPreschools.find(p => p.id === feature.properties?.id);
        if (preschool) {
          setSelectedPreschool(preschool);
          
          // Fly to the selected preschool
          map.current?.flyTo({
            center: [preschool.longitud, preschool.latitud],
            zoom: 15,
            pitch: 60,
            duration: 2000
          });
        }
      }
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'preschools-clusters', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'preschools-clusters', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
    map.current.on('mouseenter', 'preschools-unclustered', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'preschools-unclustered', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

  }, [filteredPreschools, showClusters, setSelectedPreschool]);

  return (
    <div className={`relative ${className}`}>
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
            <p className="text-foreground font-medium">Laddar 3D-karta över Sverige...</p>
          </div>
        </motion.div>
      )}

      {/* Map controls */}
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 space-y-2">
        <button
          onClick={() => {
            if (map.current) {
              map.current.flyTo({
                center: [15.0, 62.0],
                zoom: 5,
                pitch: 45,
                bearing: 0,
                duration: 2000
              });
            }
          }}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          🇸🇪 Hela Sverige
        </button>
        
        <button
          onClick={() => {
            // Get user location and fly there
            navigator.geolocation.getCurrentPosition((position) => {
              if (map.current) {
                map.current.flyTo({
                  center: [position.coords.longitude, position.coords.latitude],
                  zoom: 12,
                  pitch: 60,
                  duration: 2000
                });
              }
            });
          }}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          📍 Min position
        </button>
      </div>

      {/* Preschool count */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2">
        <p className="text-sm font-medium text-foreground">
          {filteredPreschools.length} förskolor visas
        </p>
      </div>
    </div>
  );
};