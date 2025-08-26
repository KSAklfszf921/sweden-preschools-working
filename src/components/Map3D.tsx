import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedPopup } from '@/components/enhanced/EnhancedPopup';
import { 
  generateHeatmapColorExpression, 
  calculateHeatmapWeight, 
  getAdaptiveIntensity,
  getAdaptiveRadius 
} from '@/utils/heatmapGradients';
import { 
  generateBuildingExtrusionLayer,
  generateBuildingFootprintLayer,
  generateTerrainContextLayers,
  getAddressClusterConfig
} from '@/utils/buildingExtrusions';

// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2tvZ3N0YWRpc2FrIiwiYSI6ImNtY3BhaXRpMjA0ZGcycHBqNHM4dmlwOW0ifQ.KKHGGPnrZVjNjDdITF-_bw';

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
    showClusters,
    heatmapType,
    heatmapIntensity,
    layerVisibility,
    preschools,
    updateVisiblePreschoolsFromViewport
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
      
      // Update visible preschools for list module
      const bounds = map.current.getBounds();
      updateVisiblePreschoolsFromViewport({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Zoom-based layer management and heatmap implementation
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Remove existing preschool layers and sources
    const layersToRemove = [
      'preschools-heatmap', 'preschools-heatmap-pulse', 
      'preschools-clusters', 'preschools-cluster-count', 
      'preschools-unclustered', 'preschool-buildings-3d',
      'preschool-buildings-footprint', 'parks-context', 'schools-context'
    ];
    
    layersToRemove.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
    });
    
    ['preschools', 'preschools-heatmap'].forEach(sourceId => {
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    });

    // Filter out preschools without valid coordinates
    const validPreschools = filteredPreschools.filter(p => 
      p.latitud && p.longitud && 
      p.latitud !== 0 && p.longitud !== 0 &&
      p.latitud >= 55.0 && p.latitud <= 69.1 && 
      p.longitud >= 10.9 && p.longitud <= 24.2
    );

    console.log(`Rendering ${validPreschools.length}/${filteredPreschools.length} preschools on map`);

    if (validPreschools.length === 0) return;

    // Determine which visualization to show based on zoom level
    const currentZoom = mapZoom;
    const shouldShowHeatmap = currentZoom <= 6;
    const shouldShowClusters = currentZoom > 6 && currentZoom <= 11;
    const shouldShowMarkers = currentZoom > 11;

    // Create GeoJSON data from valid preschools
    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: validPreschools.map(preschool => ({
        type: 'Feature' as const,
        properties: {
          id: preschool.id,
          namn: preschool.namn,
          kommun: preschool.kommun,
          adress: preschool.adress,
          antal_barn: preschool.antal_barn || 0,
          huvudman: preschool.huvudman,
          personaltäthet: preschool.personaltäthet || 0,
          andel_med_förskollärarexamen: preschool.andel_med_förskollärarexamen || 0,
          antal_barngrupper: preschool.antal_barngrupper,
          google_rating: preschool.google_rating || 0,
          // Enhanced weight calculation
          weight: calculateHeatmapWeight(preschool, heatmapType, currentZoom)
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [preschool.longitud, preschool.latitud]
        }
      }))
    };

    // Add revolutionary heatmap for low zoom levels (1-6)
    if (shouldShowHeatmap) {
      map.current.addSource('preschools-heatmap', {
        type: 'geojson',
        data: geojsonData
      });

      // Enhanced adaptive intensity calculation
      const dataCount = validPreschools.length;
      const adaptiveIntensity = getAdaptiveIntensity(dataCount, currentZoom, heatmapIntensity);

      map.current.addLayer({
        id: 'preschools-heatmap',
        type: 'heatmap',
        source: 'preschools-heatmap',
        maxzoom: 7,
        paint: {
          // Enhanced weight calculation with data-driven expressions
          'heatmap-weight': [
            'interpolate',
            ['exponential', 1.2],
            ['get', 'weight'],
            0, 0.1,
            0.5, 0.8,
            1, 1.5,
            2, 2.5,
            5, 4
          ],
          // Adaptive intensity based on zoom and data density
          'heatmap-intensity': [
            'interpolate',
            ['exponential', 1.5],
            ['zoom'],
            1, adaptiveIntensity * 0.3,
            3, adaptiveIntensity * 0.6,
            5, adaptiveIntensity * 1.0,
            6, adaptiveIntensity * 1.2
          ],
          // Dynamic gradient based on heatmap type
          'heatmap-color': generateHeatmapColorExpression(heatmapType) as any,
          // Smart adaptive radius
          'heatmap-radius': getAdaptiveRadius(currentZoom, dataCount),
          // Dynamic opacity that increases with zoom for better visibility
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            1, 0.4,
            2, 0.5,
            3, 0.65,
            4, 0.75,
            5, 0.85,
            6, 0.9
          ]
        }
      });

      // Add pulsing animation overlay for high-intensity areas
      if (layerVisibility.heatmap && currentZoom >= 4) {
        map.current.addLayer({
          id: 'preschools-heatmap-pulse',
          type: 'heatmap',
          source: 'preschools-heatmap',
          maxzoom: 7,
          paint: {
            'heatmap-weight': [
              'case',
              ['>', ['get', 'weight'], 2],
              ['*', ['get', 'weight'], 1.5],
              0
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              4, 0.3,
              6, 0.6
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(255, 255, 255, 0)',
              0.5, 'rgba(255, 255, 255, 0.1)',
              1, 'rgba(255, 255, 255, 0.3)'
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              4, 15,
              6, 25
            ],
            'heatmap-opacity': 0.6
          }
        });
      }
    }

    // Add smart clustering with enhanced configuration
    if (shouldShowClusters || shouldShowMarkers) {
      const clusterConfig = shouldShowClusters ? getAddressClusterConfig() : { cluster: false };
      
      map.current.addSource('preschools', {
        type: 'geojson',
        data: geojsonData,
        ...clusterConfig
      });
    }

    // Add cluster visualization for zoom levels 7-11
    if (shouldShowClusters) {
      map.current.addLayer({
        id: 'preschools-clusters',
        type: 'circle',
        source: 'preschools',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'avg_rating'],
            0, '#ef4444', // Red for low/no rating
            2.5, '#f59e0b', // Orange for medium
            4, '#22c55e', // Green for high quality
            5, '#059669' // Dark green for excellent
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'point_count'],
            1, 15,
            10, 25,
            50, 35,
            100, 45,
            500, 55,
            1000, 65
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.8
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

    // Add enhanced individual markers for high zoom levels (12+)
    if (shouldShowMarkers || !shouldShowClusters) {
      map.current.addLayer({
        id: 'preschools-unclustered',
        type: 'circle',
        source: 'preschools',
        filter: shouldShowClusters ? ['!', ['has', 'point_count']] : ['all'],
        minzoom: shouldShowMarkers ? 0 : 12,
        paint: {
          'circle-color': [
            'case',
            ['>', ['get', 'google_rating'], 0],
            [
              'interpolate',
              ['linear'],
              ['get', 'google_rating'],
              0, 'hsl(0, 84%, 60%)',
              2.5, 'hsl(30, 100%, 55%)',
              3.5, 'hsl(60, 100%, 55%)',
              4, 'hsl(120, 60%, 50%)',
              5, 'hsl(120, 80%, 40%)'
            ],
            [
              'case',
              ['==', ['get', 'huvudman'], 'Kommunal'],
              'hsl(130, 60%, 50%)', // Green for municipal
              'hsl(207, 89%, 55%)'  // Blue for private
            ]
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'antal_barn'], 20],
              0, 3,
              50, 5,
              100, 7
            ],
            12, [
              'interpolate', 
              ['linear'],
              ['coalesce', ['get', 'antal_barn'], 20],
              0, 6,
              50, 8,
              100, 12
            ],
            16, [
              'interpolate',
              ['linear'], 
              ['coalesce', ['get', 'antal_barn'], 20],
              0, 10,
              50, 14,
              100, 18
            ]
          ],
          'circle-stroke-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 1,
            12, 2,
            16, 3
          ],
          'circle-stroke-color': 'hsl(0, 0%, 100%)',
          'circle-opacity': [
            'case',
            ['>', ['get', 'google_rating'], 4],
            0.95, // High rating = more opaque
            0.8
          ]
        }
      });
    }

    // Add 3D buildings for very high zoom (14+)
    if (currentZoom >= 14 && layerVisibility.markers) {
      const buildingLayer = generateBuildingExtrusionLayer(currentZoom);
      map.current.addLayer(buildingLayer);
    }

    // Add building footprints for medium-high zoom (12-14)
    if (currentZoom >= 12 && currentZoom < 14 && layerVisibility.markers) {
      const footprintLayer = generateBuildingFootprintLayer();
      map.current.addLayer(footprintLayer);
    }

    // Add terrain context layers for environmental context
    if (currentZoom >= 12 && layerVisibility.communeBorders) {
      const contextLayers = generateTerrainContextLayers();
      contextLayers.forEach(layer => {
        map.current?.addLayer(layer);
      });
    }

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

    // Enhanced click handlers with popup system
    map.current.on('click', 'preschools-unclustered', (e) => {
      const feature = e.features?.[0];
      if (feature?.properties) {
        const preschool = filteredPreschools.find(p => p.id === feature.properties?.id);
        if (preschool) {
          setPopupPreschool(preschool);
          setShowPopup(true);
          
          // Gentle zoom to the selected preschool
          map.current?.easeTo({
            center: [preschool.longitud, preschool.latitud],
            zoom: Math.max(currentZoom, 13),
            pitch: 45,
            duration: 1500
          });
        }
      }
    });

    // Click handler for 3D buildings
    map.current.on('click', 'preschool-buildings-3d', (e) => {
      const feature = e.features?.[0];
      if (feature?.properties) {
        const preschool = filteredPreschools.find(p => p.id === feature.properties?.id);
        if (preschool) {
          setPopupPreschool(preschool);
          setShowPopup(true);
        }
      }
    });

    // Enhanced hover effects with multi-state interactions
    const cursorLayers = ['preschools-clusters', 'preschools-unclustered', 'preschool-buildings-3d'];
    cursorLayers.forEach(layerId => {
      map.current.on('mouseenter', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

  }, [filteredPreschools, showClusters, setSelectedPreschool, mapZoom, heatmapType, heatmapIntensity, layerVisibility]);

  // Calculate national averages for popup comparisons
  const nationalAverage = React.useMemo(() => {
    if (preschools.length === 0) return undefined;
    
    const validChildren = preschools.filter(p => p.antal_barn).map(p => p.antal_barn!);
    const validStaff = preschools.filter(p => p.personaltäthet).map(p => p.personaltäthet!);
    const validExam = preschools.filter(p => p.andel_med_förskollärarexamen).map(p => p.andel_med_förskollärarexamen!);
    const validRating = preschools.filter(p => p.google_rating).map(p => p.google_rating!);

    return {
      avgChildren: validChildren.length > 0 ? Math.round(validChildren.reduce((a, b) => a + b, 0) / validChildren.length) : 0,
      avgStaff: validStaff.length > 0 ? (validStaff.reduce((a, b) => a + b, 0) / validStaff.length) : 0,
      avgTeacherExam: validExam.length > 0 ? Math.round(validExam.reduce((a, b) => a + b, 0) / validExam.length) : 0,
      avgRating: validRating.length > 0 ? (validRating.reduce((a, b) => a + b, 0) / validRating.length) : 0,
    };
  }, [preschools]);

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
            nationalAverage={nationalAverage}
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

      {/* Enhanced preschool count with context */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2">
        <p className="text-sm font-medium text-foreground">
          {filteredPreschools.filter(p => 
            p.latitud && p.longitud && 
            p.latitud !== 0 && p.longitud !== 0 &&
            p.latitud >= 55.0 && p.latitud <= 69.1 && 
            p.longitud >= 10.9 && p.longitud <= 24.2
          ).length} av {filteredPreschools.length} förskolor på kartan
        </p>
        {filteredPreschools.length > filteredPreschools.filter(p => 
          p.latitud && p.longitud && 
          p.latitud !== 0 && p.longitud !== 0
        ).length && (
          <p className="text-xs text-muted-foreground">
            {filteredPreschools.length - filteredPreschools.filter(p => 
              p.latitud && p.longitud && 
              p.latitud !== 0 && p.longitud !== 0
            ).length} saknar koordinater
          </p>
        )}
      </div>
    </div>
  );
};