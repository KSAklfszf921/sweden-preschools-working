/**
 * 🚀 OPTIMIZED CLUSTERING HOOK
 * 
 * React hook som integrerar Mapbox clustering med Supabase cache
 * enligt 2025 best practices för maximal prestanda och användarupplevelse.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { getClusteringCache } from '@/utils/clusteringCacheManager';

interface ClusteringConfig {
  clusterRadius: number;
  clusterMaxZoom: number;
  maxZoom: number;
  minZoom: number;
  enableCache: boolean;
  cacheTimeout: number;
}

interface ClusteringState {
  isLoading: boolean;
  error: string | null;
  clustersCount: number;
  cacheHitRate: number;
  lastUpdate: string;
}

interface UseOptimizedClusteringProps {
  map: mapboxgl.Map | null;
  config?: Partial<ClusteringConfig>;
  onClusterClick?: (clusterId: number, coordinates: [number, number]) => void;
  onPreschoolClick?: (preschool: Preschool) => void;
}

const DEFAULT_CONFIG: ClusteringConfig = {
  clusterRadius: 50,        // Optimal för förskoledata
  clusterMaxZoom: 12,       // Mapbox rekommendation för prestanda
  maxZoom: 12,              // Kritiskt för prestanda
  minZoom: 4,               // Förhindra rendering vid låg zoom
  enableCache: true,        // Aktivera Supabase cache
  cacheTimeout: 3600000     // 1 timme cache timeout
};

export const useOptimizedClustering = ({
  map,
  config = {},
  onClusterClick,
  onPreschoolClick
}: UseOptimizedClusteringProps) => {
  const { filteredPreschools } = useMapStore();
  const [state, setState] = useState<ClusteringState>({
    isLoading: false,
    error: null,
    clustersCount: 0,
    cacheHitRate: 0,
    lastUpdate: new Date().toISOString()
  });

  // Merge config med defaults
  const finalConfig: ClusteringConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config
  }), [config]);

  // Hämta cache manager
  const cacheManager = getClusteringCache();

  // Source och layer IDs
  const sourceId = 'optimized-preschools';
  const clusterLayerId = 'optimized-clusters';
  const clusterCountLayerId = 'optimized-cluster-count';
  const unclusteredLayerId = 'optimized-unclustered';

  // Filtrera valid preschools för prestanda
  const validPreschools = useMemo(() => {
    const valid = filteredPreschools.filter(p => 
      p.latitud !== null && 
      p.longitud !== null && 
      typeof p.latitud === 'number' && 
      typeof p.longitud === 'number' &&
      p.latitud >= 55.0 && p.latitud <= 69.1 && 
      p.longitud >= 10.9 && p.longitud <= 24.2
    );

    console.log(`🎯 useOptimizedClustering: ${valid.length}/${filteredPreschools.length} valid preschools`);
    return valid;
  }, [filteredPreschools]);

  // Generera GeoJSON data
  const geojsonData = useMemo(() => {
    return {
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
          personaltäthet: preschool.personaltäthet || 0,
          updated_at: preschool.updated_at
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [preschool.longitud, preschool.latitud]
        }
      }))
    };
  }, [validPreschools]);

  // Generera data version för cache invalidation
  const dataVersion = useMemo(() => {
    const dataString = JSON.stringify(
      validPreschools
        .map(p => ({ id: p.id, lat: p.latitud, lng: p.longitud, updated: p.updated_at }))
        .sort((a, b) => a.id.localeCompare(b.id))
    );
    return btoa(dataString).slice(0, 16);
  }, [validPreschools]);

  // Cleanup funktion för att ta bort layers och sources
  const cleanup = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    const layersToRemove = [clusterLayerId, clusterCountLayerId, unclusteredLayerId];
    
    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });
    
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    console.log('🧹 Cleaned up clustering layers');
  }, [map, sourceId, clusterLayerId, clusterCountLayerId, unclusteredLayerId]);

  // Försök hämta cached clusters
  const tryGetCachedClusters = useCallback(async () => {
    if (!cacheManager || !map) return null;

    try {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      
      const cached = await cacheManager.getCachedClusters(zoom, {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });

      if (cached && cached.dataVersion === dataVersion) {
        console.log('⚡ Using cached clusters');
        return cached;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting cached clusters:', error);
      return null;
    }
  }, [cacheManager, map, dataVersion]);

  // Cacha clusters till Supabase Storage
  const cacheCurrentClusters = useCallback(async () => {
    if (!cacheManager || !map || !map.getLayer(clusterLayerId)) return;

    try {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      
      // Hämta alla synliga cluster features
      const features = map.queryRenderedFeatures({ 
        layers: [clusterLayerId] 
      });

      const clusters = features.map(feature => ({
        id: feature.properties!.cluster_id,
        coordinates: (feature.geometry as any).coordinates,
        count: feature.properties!.point_count,
        avg_rating: feature.properties!.avg_rating || 0,
        total_children: feature.properties!.total_children || 0,
        properties: feature.properties
      }));

      if (clusters.length > 0) {
        await cacheManager.cacheClusters(zoom, {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        }, clusters, dataVersion);

        console.log(`💾 Cached ${clusters.length} clusters`);
      }
    } catch (error) {
      console.error('❌ Error caching clusters:', error);
    }
  }, [cacheManager, map, clusterLayerId, dataVersion]);

  // Lägg till clustering source med optimal konfiguration
  const addClusteringSource = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    map.addSource(sourceId, {
      type: 'geojson',
      data: geojsonData,
      cluster: true,
      clusterMaxZoom: finalConfig.clusterMaxZoom,
      clusterRadius: finalConfig.clusterRadius,
      maxzoom: finalConfig.maxZoom,
      buffer: 0,        // Prestanda-optimering för punktdata
      tolerance: 0.5,   // Geometri-förenkling
      clusterProperties: {
        // Cluster aggregations för bättre visualisering
        'avg_rating': [
          '/',
          ['+', ['accumulated'], ['get', 'google_rating']],
          ['get', 'point_count']
        ],
        'total_children': [
          '+', ['accumulated'], ['get', 'antal_barn']
        ],
        'avg_density': [
          '/',
          ['+', ['accumulated'], ['get', 'personaltäthet']], 
          ['get', 'point_count']
        ]
      }
    });

    console.log('✅ Added optimized clustering source');
  }, [map, sourceId, geojsonData, finalConfig]);

  // Lägg till cluster visualization layers
  const addClusterLayers = useCallback(() => {
    if (!map || !map.getSource(sourceId)) return;

    // Cluster circles med svensk färgskala
    map.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#4CAF50',      // Grön: 1-50 förskolor
          50, '#FF9800',  // Orange: 50-200 förskolor
          200, '#F44336'  // Röd: 200+ förskolor
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          15,       // 15px för små kluster
          50, 25,   // 25px för medium kluster
          200, 35   // 35px för stora kluster
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      }
    });

    // Cluster count labels
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
        'text-size': 16
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(0,0,0,0.3)',
        'text-halo-width': 1
      }
    });

    // Individual points (unclustered)
    map.addLayer({
      id: unclusteredLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      minzoom: finalConfig.minZoom + 4, // Visa individuella points vid högre zoom
      paint: {
        'circle-color': [
          'case',
          ['>', ['get', 'google_rating'], 4.0], '#4CAF50',
          ['>', ['get', 'google_rating'], 3.0], '#FF9800',
          ['==', ['get', 'google_rating'], 0], '#9E9E9E',
          '#F44336'
        ],
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 4,
          14, 8
        ],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    });

    console.log('✅ Added cluster visualization layers');
  }, [map, sourceId, clusterLayerId, clusterCountLayerId, unclusteredLayerId, finalConfig]);

  // Lägg till event handlers
  const addEventHandlers = useCallback(() => {
    if (!map) return;

    // Cluster click - zoom to expansion
    const handleClusterClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.[0]) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: [clusterLayerId]
      });
      
      const clusterId = features[0].properties!.cluster_id;
      const coordinates = (features[0].geometry as any).coordinates as [number, number];

      map.getSource(sourceId)!.getClusterExpansionZoom(
        clusterId,
        (err: any, zoom: number) => {
          if (err) return;

          map.easeTo({
            center: coordinates,
            zoom: zoom
          });

          // Cacha nya clusters efter zoom
          setTimeout(cacheCurrentClusters, 1000);
        }
      );

      onClusterClick?.(clusterId, coordinates);
    };

    // Individual preschool click
    const handlePreschoolClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.[0]) return;
      
      const feature = e.features[0];
      const preschool = validPreschools.find(p => p.id === feature.properties!.id);
      
      if (preschool) {
        onPreschoolClick?.(preschool);
      }
    };

    // Lägg till event listeners
    map.on('click', clusterLayerId, handleClusterClick);
    map.on('click', unclusteredLayerId, handlePreschoolClick);

    // Cursor styling
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

    console.log('✅ Added clustering event handlers');

    // Return cleanup function
    return () => {
      map.off('click', clusterLayerId, handleClusterClick);
      map.off('click', unclusteredLayerId, handlePreschoolClick);
      map.off('mouseenter', clusterLayerId);
      map.off('mouseleave', clusterLayerId);
      map.off('mouseenter', unclusteredLayerId);
      map.off('mouseleave', unclusteredLayerId);
    };
  }, [map, clusterLayerId, unclusteredLayerId, sourceId, validPreschools, onClusterClick, onPreschoolClick, cacheCurrentClusters]);

  // Huvudfunktion för att sätta upp clustering
  const setupClustering = useCallback(async () => {
    if (!map || !map.isStyleLoaded() || validPreschools.length === 0) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🎯 Setting up optimized clustering...');

      // 1. Cleanup befintliga layers
      cleanup();

      // 2. Försök använda cached data först
      if (finalConfig.enableCache) {
        const cached = await tryGetCachedClusters();
        if (cached) {
          setState(prev => ({ 
            ...prev, 
            clustersCount: cached.clusters.length,
            cacheHitRate: 0.9, // Simulated cache hit
            isLoading: false 
          }));
          return;
        }
      }

      // 3. Sätt upp från scratch
      addClusteringSource();
      addClusterLayers();
      const cleanupHandlers = addEventHandlers();

      // 4. Cacha efter initial setup
      if (finalConfig.enableCache) {
        setTimeout(cacheCurrentClusters, 2000);
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        clustersCount: validPreschools.length,
        lastUpdate: new Date().toISOString()
      }));

      console.log('✅ Optimized clustering setup complete');

      return cleanupHandlers;

    } catch (error) {
      console.error('❌ Error setting up clustering:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  }, [
    map,
    validPreschools,
    cleanup,
    finalConfig.enableCache,
    tryGetCachedClusters,
    addClusteringSource,
    addClusterLayers,
    addEventHandlers,
    cacheCurrentClusters
  ]);

  // Effect för att sätta upp clustering
  useEffect(() => {
    if (!map) return;

    let cleanupHandlers: (() => void) | undefined;

    const init = async () => {
      if (map.isStyleLoaded()) {
        cleanupHandlers = await setupClustering();
      } else {
        const handleStyleLoad = async () => {
          cleanupHandlers = await setupClustering();
        };
        map.on('style.load', handleStyleLoad);
        
        return () => {
          map.off('style.load', handleStyleLoad);
        };
      }
    };

    init();

    return () => {
      cleanupHandlers?.();
      cleanup();
    };
  }, [map, setupClustering, cleanup]);

  // Effect för att uppdatera data när preschools ändras
  useEffect(() => {
    if (!map || !map.getSource(sourceId)) return;

    const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
    source.setData(geojsonData);

    setState(prev => ({ 
      ...prev, 
      lastUpdate: new Date().toISOString(),
      clustersCount: validPreschools.length
    }));

    console.log(`🔄 Updated clustering data: ${validPreschools.length} preschools`);

    // Cacha nya data efter uppdatering
    if (finalConfig.enableCache) {
      setTimeout(cacheCurrentClusters, 1000);
    }
  }, [map, sourceId, geojsonData, validPreschools.length, finalConfig.enableCache, cacheCurrentClusters]);

  // Exposed methods för manual kontroll
  const methods = {
    refreshCache: cacheCurrentClusters,
    clearCache: cleanup,
    forceReload: setupClustering
  };

  return {
    state,
    methods,
    config: finalConfig
  };
};