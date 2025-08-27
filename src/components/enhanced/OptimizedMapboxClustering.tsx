import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapStore, Preschool } from '@/stores/mapStore';

interface OptimizedClusteringProps {
  map: mapboxgl.Map | null;
  preschools: Preschool[];
  onClusterClick?: (clusterId: number, coordinates: [number, number]) => void;
  onPreschoolClick?: (preschool: Preschool) => void;
}

/**
 * 🚀 OPTIMERAD MAPBOX CLUSTERING KOMPONENT
 * 
 * Implementerar Mapbox best practices för hantering av tusentals datapunkter:
 * - Clustering aktiverat med optimerade inställningar
 * - Zoom-nivå begränsningar för prestanda
 * - Färgkodade kluster baserat på storlek
 * - Interaktiv zoom-till-kluster funktionalitet
 * - Prestanda-optimerad rendering
 */
export const OptimizedMapboxClustering: React.FC<OptimizedClusteringProps> = ({
  map,
  preschools,
  onClusterClick,
  onPreschoolClick
}) => {
  const sourceId = 'preschools-optimized';
  const clusterLayerId = 'clusters-optimized';
  const clusterCountLayerId = 'cluster-count-optimized';
  const unclusteredLayerId = 'unclustered-point-optimized';

  // Memoize valid preschools för prestanda
  const validPreschools = useMemo(() => {
    return preschools.filter(p => 
      p.latitud !== null && 
      p.longitud !== null && 
      typeof p.latitud === 'number' && 
      typeof p.longitud === 'number' &&
      p.latitud >= 55.0 && p.latitud <= 69.1 && 
      p.longitud >= 10.9 && p.longitud <= 24.2
    );
  }, [preschools]);

  // Memoize GeoJSON data enligt Mapbox best practices
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
          google_rating: preschool.google_rating || 0,
          antal_barn: preschool.antal_barn || 0,
          personaltäthet: preschool.personaltäthet || 0
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [preschool.longitud, preschool.latitud]
        }
      }))
    };
    
    console.log(`🎯 Optimized clustering: Generated GeoJSON with ${geoData.features.length} features`);
    return geoData;
  }, [validPreschools]);

  // Rensa befintliga layers och sources
  const cleanupExistingLayers = useCallback(() => {
    if (!map?.isStyleLoaded()) return;

    const layersToRemove = [clusterLayerId, clusterCountLayerId, unclusteredLayerId];
    
    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        console.log(`🗑️ Removed layer: ${layerId}`);
      }
    });
    
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
      console.log(`🗑️ Removed source: ${sourceId}`);
    }
  }, [map, sourceId, clusterLayerId, clusterCountLayerId, unclusteredLayerId]);

  // Lägg till optimerad clustering source enligt Mapbox research
  const addOptimizedSource = useCallback(() => {
    if (!map || !map.isStyleLoaded() || validPreschools.length === 0) return;

    map.addSource(sourceId, {
      type: 'geojson',
      data: geojsonData,
      cluster: true,
      // KRITISK OPTIMERING: Lägre clusterMaxZoom för bättre prestanda (från research)
      clusterMaxZoom: 12, // Stoppa clustering vid zoom 12 (Mapbox rekommendation)
      clusterRadius: 50,  // 50px optimal för förskoledata
      // PRESTANDA-OPTIMERING: Begränsa maxzoom för snabbare rendering
      maxzoom: 12,       // Kritiskt för prestanda enligt dokumentation
      // OPTIMERING: Buffer endast för punktdata
      buffer: 0,         // Endast för punkter - ökar hastigheten
      tolerance: 0.5,    // Geometri-förenkling för prestanda
      // Cluster properties för avancerad visualisering
      clusterProperties: {
        // Genomsnittligt betyg i klustret
        'avg_rating': [
          '/',
          ['+', ['accumulated'], ['get', 'google_rating']],
          ['get', 'point_count']
        ],
        // Totalt antal barn i klustret
        'total_children': ['+', ['accumulated'], ['get', 'antal_barn']],
        // Genomsnittlig personaltäthet
        'avg_density': [
          '/',
          ['+', ['accumulated'], ['get', 'personaltäthet']],
          ['get', 'point_count']
        ]
      }
    });

    console.log('🚀 Added optimized clustering source with Mapbox best practices');
  }, [map, sourceId, geojsonData, validPreschools]);

  // Lägg till cluster circles med färgkodning baserat på research
  const addClusterLayer = useCallback(() => {
    if (!map || !map.getSource(sourceId)) return;

    map.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        // OPTIMERAD FÄRGSKALA enligt Mapbox recommendations för Sverige
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#4CAF50',    // Grön: 1-50 förskolor (landsbygd)
          50, '#FF9800', // Orange: 50-200 förskolor (städer)
          200, '#F44336' // Röd: 200+ förskolor (storstäder)
        ],
        // OPTIMERAD STORLEKSSKALA för bättre synlighet
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          15,      // 15px för små kluster
          50, 25,  // 25px för medium kluster  
          200, 35  // 35px för stora kluster
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      }
    });

    console.log('✅ Added optimized cluster circles layer');
  }, [map, sourceId, clusterLayerId]);

  // Lägg till cluster count labels
  const addClusterCountLayer = useCallback(() => {
    if (!map || !map.getSource(sourceId)) return;

    map.addLayer({
      id: clusterCountLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': [
          'case',
          ['>=', ['get', 'point_count'], 1000],
          [
            'concat',
            [
              'number-format',
              ['/', ['get', 'point_count'], 1000],
              { 'max-fraction-digits': 1 }
            ],
            'k'
          ],
          ['number-format', ['get', 'point_count'], {}]
        ],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 16,
        'text-allow-overlap': true
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(0,0,0,0.3)',
        'text-halo-width': 1
      }
    });

    console.log('✅ Added cluster count layer with k-notation');
  }, [map, sourceId, clusterCountLayerId]);

  // Lägg till unclustered points
  const addUnclusteredLayer = useCallback(() => {
    if (!map || !map.getSource(sourceId)) return;

    map.addLayer({
      id: unclusteredLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      // VIKTIGT: Sätt minzoom för att förhindra rendering vid låg zoom
      minzoom: 8, // Visa individuella förskolor endast vid zoom 8+
      paint: {
        // Färgkodning baserat på Google rating
        'circle-color': [
          'case',
          ['>', ['get', 'google_rating'], 4.0], '#4CAF50', // Hög rating - grön
          ['>', ['get', 'google_rating'], 3.0], '#FF9800', // Medium rating - orange
          ['==', ['get', 'google_rating'], 0], '#9E9E9E',  // Ingen rating - grå
          '#F44336'  // Låg rating - röd
        ],
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 4,   // Vid zoom 8, radius 4px
          14, 8   // Vid zoom 14, radius 8px
        ],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    });

    console.log('✅ Added unclustered points layer with zoom-based visibility');
  }, [map, sourceId, unclusteredLayerId]);

  // Lägg till click handlers för interaktivitet
  const addClickHandlers = useCallback(() => {
    if (!map) return;

    // Click handler för kluster - zoom till expansion
    map.on('click', clusterLayerId, (e) => {
      if (!e.features?.[0]) return;
      
      const features = map.queryRenderedFeatures(e.point, {
        layers: [clusterLayerId]
      });
      const clusterId = features[0].properties!.cluster_id;
      const coordinates = (features[0].geometry as any).coordinates as [number, number];

      // Hämta expansion zoom level
      map.getSource(sourceId)!.getClusterExpansionZoom(
        clusterId,
        (err: any, zoom: number) => {
          if (err) return;

          map.easeTo({
            center: coordinates,
            zoom: zoom
          });
        }
      );

      if (onClusterClick) {
        onClusterClick(clusterId, coordinates);
      }
    });

    // Click handler för individuella förskolor
    map.on('click', unclusteredLayerId, (e) => {
      if (!e.features?.[0]) return;
      
      const feature = e.features[0];
      const preschool = validPreschools.find(p => p.id === feature.properties!.id);
      
      if (preschool && onPreschoolClick) {
        onPreschoolClick(preschool);
      }
    });

    // Cursor styling för bättre UX
    map.on('mouseenter', clusterLayerId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', clusterLayerId, () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', unclusteredLayerId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', unclusteredLayerId, () => {
      map.getCanvas().style.cursor = '';
    });

    console.log('🖱️ Added optimized click handlers');
  }, [map, clusterLayerId, unclusteredLayerId, sourceId, validPreschools, onClusterClick, onPreschoolClick]);

  // Huvudfunktion för att sätta upp optimerad clustering
  const setupOptimizedClustering = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    console.log('🎯 Setting up optimized Mapbox clustering...');
    
    // 1. Rensa befintliga layers
    cleanupExistingLayers();
    
    // 2. Lägg till optimerad source
    addOptimizedSource();
    
    // 3. Lägg till alla layers i rätt ordning
    addClusterLayer();
    addClusterCountLayer(); 
    addUnclusteredLayer();
    
    // 4. Lägg till interaktivitet
    addClickHandlers();
    
    console.log('✅ Optimized clustering setup complete!');
  }, [
    map,
    cleanupExistingLayers,
    addOptimizedSource,
    addClusterLayer,
    addClusterCountLayer,
    addUnclusteredLayer,
    addClickHandlers
  ]);

  // Effect för att sätta upp clustering när map eller data ändras
  useEffect(() => {
    if (!map) return;

    if (map.isStyleLoaded()) {
      setupOptimizedClustering();
    } else {
      map.on('style.load', setupOptimizedClustering);
    }

    // Cleanup function
    return () => {
      map.off('style.load', setupOptimizedClustering);
    };
  }, [map, setupOptimizedClustering]);

  // Effect för att uppdatera data när preschools ändras
  useEffect(() => {
    if (!map || !map.getSource(sourceId)) return;

    const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
    source.setData(geojsonData);
    
    console.log(`🔄 Updated clustering data: ${validPreschools.length} preschools`);
  }, [map, sourceId, geojsonData, validPreschools.length]);

  return null; // Denna komponent renderar inget visuellt
};

export default OptimizedMapboxClustering;