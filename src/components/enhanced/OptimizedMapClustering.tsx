import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { mapboxConfig } from '@/utils/mapboxConfig';

interface ClusterPoint {
  id: string;
  coordinates: [number, number];
  properties: {
    cluster: boolean;
    cluster_id?: number;
    point_count?: number;
    point_count_abbreviated?: string;
    preschool?: any;
  };
}

interface OptimizedMapClusteringProps {
  zoom: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export const OptimizedMapClustering: React.FC<OptimizedMapClusteringProps> = ({ 
  zoom, 
  bounds 
}) => {
  const { preschools, visiblePreschools } = useMapStore();

  // Progressive loading based on zoom level
  const shouldShowHeatmap = zoom < mapboxConfig.settings.zoomThresholds.heatmapOnly;
  const shouldShowClusters = zoom >= mapboxConfig.settings.zoomThresholds.clustersStart && 
                           zoom < mapboxConfig.settings.zoomThresholds.markersStart;
  const shouldShowMarkers = zoom >= mapboxConfig.settings.zoomThresholds.markersStart;

  // Filter preschools within viewport bounds for performance
  const viewportPreschools = useMemo(() => {
    return preschools.filter(preschool => {
      if (!preschool.latitud || !preschool.longitud) return false;
      
      return (
        preschool.latitud >= bounds.south &&
        preschool.latitud <= bounds.north &&
        preschool.longitud >= bounds.west &&
        preschool.longitud <= bounds.east
      );
    });
  }, [preschools, bounds]);

  // Create clusters based on zoom level
  const clusters = useMemo(() => {
    if (!shouldShowClusters || viewportPreschools.length === 0) {
      return [];
    }

    return createClusters(viewportPreschools, zoom);
  }, [viewportPreschools, zoom, shouldShowClusters]);

  // Heatmap data points
  const heatmapPoints = useMemo(() => {
    if (!shouldShowHeatmap) return [];
    
    return viewportPreschools.map(preschool => ({
      lat: preschool.latitud!,
      lng: preschool.longitud!,
      intensity: calculateHeatmapIntensity(preschool)
    }));
  }, [viewportPreschools, shouldShowHeatmap]);

  // Individual markers for high zoom levels
  const markers = useMemo(() => {
    if (!shouldShowMarkers) return [];
    
    return viewportPreschools.map(preschool => ({
      id: preschool.id,
      lat: preschool.latitud!,
      lng: preschool.longitud!,
      preschool
    }));
  }, [viewportPreschools, shouldShowMarkers]);

  // Create clusters using a simple grid-based approach
  const createClusters = useCallback((preschools: any[], currentZoom: number) => {
    const clusterRadius = mapboxConfig.settings.clusterRadius / Math.pow(2, currentZoom - 10);
    const clusters: ClusterPoint[] = [];
    const processed = new Set<string>();

    preschools.forEach(preschool => {
      if (processed.has(preschool.id)) return;

      const nearby = preschools.filter(other => {
        if (processed.has(other.id) || other.id === preschool.id) return false;
        
        const distance = calculateDistance(
          preschool.latitud, preschool.longitud,
          other.latitud, other.longitud
        );
        
        return distance < clusterRadius;
      });

      if (nearby.length > 0) {
        // Create cluster
        const allPoints = [preschool, ...nearby];
        const centerLat = allPoints.reduce((sum, p) => sum + p.latitud, 0) / allPoints.length;
        const centerLng = allPoints.reduce((sum, p) => sum + p.longitud, 0) / allPoints.length;

        clusters.push({
          id: `cluster-${preschool.id}`,
          coordinates: [centerLng, centerLat],
          properties: {
            cluster: true,
            cluster_id: clusters.length,
            point_count: allPoints.length,
            point_count_abbreviated: allPoints.length > 999 ? `${Math.round(allPoints.length / 1000)}k` : allPoints.length.toString()
          }
        });

        allPoints.forEach(p => processed.add(p.id));
      } else {
        // Single point
        clusters.push({
          id: preschool.id,
          coordinates: [preschool.longitud, preschool.latitud],
          properties: {
            cluster: false,
            preschool
          }
        });
        processed.add(preschool.id);
      }
    });

    return clusters;
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate heatmap intensity based on preschool properties
  const calculateHeatmapIntensity = (preschool: any): number => {
    let intensity = 1;
    
    // Factor in number of children
    if (preschool.antal_barn) {
      intensity += preschool.antal_barn * 0.01;
    }
    
    // Factor in rating
    if (preschool.google_rating && preschool.google_rating > 0) {
      intensity += preschool.google_rating * 0.2;
    }
    
    // Factor in staff density
    if (preschool.personaltäthet) {
      intensity += preschool.personaltäthet * 0.5;
    }
    
    return Math.min(intensity, 10); // Cap at 10
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Heatmap layer */}
      {shouldShowHeatmap && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10"
        >
          <svg className="w-full h-full">
            <defs>
              <radialGradient id="heatmapGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={mapboxConfig.swedenStyle.heatmap.critical} stopOpacity="0.8" />
                <stop offset="25%" stopColor={mapboxConfig.swedenStyle.heatmap.intense} stopOpacity="0.6" />
                <stop offset="50%" stopColor={mapboxConfig.swedenStyle.heatmap.high} stopOpacity="0.4" />
                <stop offset="75%" stopColor={mapboxConfig.swedenStyle.heatmap.medium} stopOpacity="0.2" />
                <stop offset="100%" stopColor={mapboxConfig.swedenStyle.heatmap.low} stopOpacity="0.1" />
              </radialGradient>
            </defs>
            
            {heatmapPoints.map((point, index) => (
              <circle
                key={index}
                cx={`${((point.lng - bounds.west) / (bounds.east - bounds.west)) * 100}%`}
                cy={`${((bounds.north - point.lat) / (bounds.north - bounds.south)) * 100}%`}
                r={mapboxConfig.settings.heatmapRadius}
                fill="url(#heatmapGradient)"
                opacity={point.intensity / 10}
              />
            ))}
          </svg>
        </motion.div>
      )}

      {/* Cluster markers */}
      {shouldShowClusters && clusters.map(cluster => (
        <motion.div
          key={cluster.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute pointer-events-auto"
          style={{
            left: `${((cluster.coordinates[0] - bounds.west) / (bounds.east - bounds.west)) * 100}%`,
            top: `${((bounds.north - cluster.coordinates[1]) / (bounds.north - bounds.south)) * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: cluster.properties.cluster ? 20 : 15
          }}
        >
          {cluster.properties.cluster ? (
            // Cluster marker
            <div 
              className="flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform"
              style={{
                width: Math.min(50, 20 + (cluster.properties.point_count! * 0.5)),
                height: Math.min(50, 20 + (cluster.properties.point_count! * 0.5))
              }}
            >
              {cluster.properties.point_count_abbreviated}
            </div>
          ) : (
            // Individual marker
            <div 
              className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform"
            />
          )}
        </motion.div>
      ))}

      {/* Individual markers for high zoom */}
      {shouldShowMarkers && markers.map(marker => (
        <motion.div
          key={marker.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute pointer-events-auto"
          style={{
            left: `${((marker.lng - bounds.west) / (bounds.east - bounds.west)) * 100}%`,
            top: `${((bounds.north - marker.lat) / (bounds.north - bounds.south)) * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 25
          }}
        >
          <div 
            className={`rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform ${
              getMarkerColor(marker.preschool.huvudman)
            }`}
            style={{
              width: getMarkerSize(marker.preschool.antal_barn),
              height: getMarkerSize(marker.preschool.antal_barn)
            }}
          >
            {/* Quality indicator ring */}
            {marker.preschool.google_rating && marker.preschool.google_rating >= 4.5 && (
              <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-pulse" />
            )}
          </div>
        </motion.div>
      ))}

      {/* Performance metrics */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
          <div>Zoom: {zoom.toFixed(1)}</div>
          <div>Viewport: {viewportPreschools.length} förskolor</div>
          <div>Mode: {shouldShowHeatmap ? 'Heatmap' : shouldShowClusters ? 'Clusters' : 'Markers'}</div>
          {shouldShowClusters && <div>Clusters: {clusters.filter(c => c.properties.cluster).length}</div>}
        </div>
      )}
    </div>
  );
};

// Helper functions
const getMarkerColor = (huvudman?: string) => {
  if (!huvudman) return 'bg-gray-500';
  
  const colors = mapboxConfig.swedenStyle.preschoolColors;
  if (huvudman.toLowerCase().includes('kommun')) return `bg-blue-500`;
  if (huvudman.toLowerCase().includes('privat')) return `bg-green-500`;
  if (huvudman.toLowerCase().includes('kooperativ')) return `bg-orange-500`;
  return 'bg-gray-500';
};

const getMarkerSize = (antalBarn?: number) => {
  if (!antalBarn || antalBarn <= 20) return mapboxConfig.settings.markerSizes.small;
  if (antalBarn <= 50) return mapboxConfig.settings.markerSizes.medium;
  return mapboxConfig.settings.markerSizes.large;
};