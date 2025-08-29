import { useEffect, useMemo } from 'react';
import type mapboxgl from 'mapbox-gl';
import { useMapStore } from '@/stores/mapStore';

interface BubbleMapIntegrationProps {
  map: mapboxgl.Map | null;
}

export const BubbleMapIntegration: React.FC<BubbleMapIntegrationProps> = ({ map }) => {
  const { filteredPreschools, mapZoom } = useMapStore();

  // Determine when to show bubble visualization (zoom levels 6-9)
  const shouldShowBubbles = mapZoom >= 6 && mapZoom <= 9;

  // Create clustered bubble data
  const bubbleData = useMemo(() => {
    if (!shouldShowBubbles || !filteredPreschools.length) return null;

    // Simple clustering based on proximity and zoom level
    const clusters = new Map();
    const clusterRadius = mapZoom >= 8 ? 0.01 : mapZoom >= 7 ? 0.02 : 0.05;

    filteredPreschools.forEach(preschool => {
      if (!preschool.latitud || !preschool.longitud) return;

      // Find existing cluster or create new one
      const existingCluster = Array.from(clusters.values()).find(cluster => {
        const distance = Math.sqrt(
          Math.pow(cluster.lat - preschool.latitud!, 2) + 
          Math.pow(cluster.lng - preschool.longitud!, 2)
        );
        return distance < clusterRadius;
      });

      if (existingCluster) {
        existingCluster.preschools.push(preschool);
        existingCluster.count++;
        // Recalculate center
        existingCluster.lat = existingCluster.preschools.reduce((sum, p) => sum + p.latitud!, 0) / existingCluster.count;
        existingCluster.lng = existingCluster.preschools.reduce((sum, p) => sum + p.longitud!, 0) / existingCluster.count;
        // Update average rating
        const validRatings = existingCluster.preschools.filter(p => p.google_rating);
        existingCluster.avgRating = validRatings.length > 0 
          ? validRatings.reduce((sum, p) => sum + p.google_rating!, 0) / validRatings.length 
          : 0;
      } else {
        clusters.set(clusters.size, {
          id: clusters.size,
          lat: preschool.latitud,
          lng: preschool.longitud,
          count: 1,
          preschools: [preschool],
          avgRating: preschool.google_rating || 0,
          type: preschool.huvudman === 'Kommunal' ? 'kommunal' : 'enskild'
        });
      }
    });

    return {
      type: 'FeatureCollection' as const,
      features: Array.from(clusters.values()).map(cluster => ({
        type: 'Feature' as const,
        properties: {
          id: cluster.id,
          count: cluster.count,
          avgRating: cluster.avgRating,
          type: cluster.type,
          preschools: cluster.preschools.map(p => ({
            id: p.id,
            namn: p.namn,
            kommun: p.kommun
          }))
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [cluster.lng, cluster.lat]
        }
      }))
    };
  }, [filteredPreschools, shouldShowBubbles, mapZoom]);

  // Integrate bubble visualization into map
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = 'preschool-bubbles';
    const layerId = 'preschool-bubbles-layer';
    const labelLayerId = 'preschool-bubbles-labels';

    // Remove existing bubble layers
    if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    // Add bubble visualization when appropriate
    if (shouldShowBubbles && bubbleData && bubbleData.features.length > 0) {
      // Add source
      map.addSource(sourceId, {
        type: 'geojson',
        data: bubbleData
      });

      // Add bubble layer
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            1, 15,
            5, 25,
            10, 35,
            20, 45,
            50, 60
          ],
          'circle-color': [
            'case',
            ['>', ['get', 'avgRating'], 4.5], 'hsl(120, 70%, 50%)', // Excellent rating - green
            ['>', ['get', 'avgRating'], 4.0], 'hsl(60, 70%, 55%)',  // Good rating - yellow
            ['>', ['get', 'avgRating'], 0], 'hsl(25, 70%, 55%)',    // Some rating - orange
            ['==', ['get', 'type'], 'kommunal'], 'hsl(210, 70%, 55%)', // Municipal - blue
            'hsl(140, 60%, 50%)'  // Private/Independent - green
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Add labels
      map.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['get', 'count'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Add click handler for bubbles
      const handleBubbleClick = (e: mapboxgl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [layerId]
        });

        if (features.length > 0) {
          const feature = features[0];
          const count = feature.properties?.count;
          
          if (count > 1) {
            // Zoom in to show individual markers
            map.flyTo({
              center: (feature.geometry as any).coordinates,
              zoom: Math.min(mapZoom + 2, 16),
              duration: 1000
            });
          }
        }
      };

      map.on('click', layerId, handleBubbleClick);
      map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
      });

      // Cleanup function
      return () => {
        map.off('click', layerId, handleBubbleClick);
        if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      };
    }
  }, [map, shouldShowBubbles, bubbleData, mapZoom]);

  return null; // This component only manages map layers
};