// OPTIMIZED MAP CLUSTERING COMPONENT
// Integrates smart clustering from sveriges-forskolor with performance patterns

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { smartClustering, type ClusterPoint } from '@/utils/clustering';
import { dataCache, cacheKeys } from '@/utils/dataCache';
import { performanceOptimizer, createOptimizedHandler } from '@/utils/performanceOptimizer';

interface OptimizedMapClusteringProps {
  map: any; // Mapbox map instance
  zoom: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export const OptimizedMapClustering: React.FC<OptimizedMapClusteringProps> = ({
  map,
  zoom,
  bounds
}) => {
  const { filteredPreschools, layerVisibility } = useMapStore();
  const [clusters, setClusters] = useState<any[]>([]);
  const markersRef = useRef<any[]>([]);

  // Convert preschools to cluster points format
  const clusterPoints: ClusterPoint[] = useMemo(() => {
    return filteredPreschools
      .filter(p => p.latitud && p.longitud)
      .map(preschool => ({
        id: preschool.id,
        lat: preschool.latitud!,
        lng: preschool.longitud!,
        data: preschool
      }));
  }, [filteredPreschools]);

  // Optimized clustering with caching
  const updateClusters = useMemo(() => 
    createOptimizedHandler(
      () => {
        if (!map || !layerVisibility.optimizedClusters) return;

        // Check cache first
        const cacheKey = cacheKeys.clustering(zoom, bounds);
        const cachedClusters = dataCache.get(cacheKey);
        
        if (cachedClusters) {
          console.log('🚀 Using cached clusters');
          setClusters(cachedClusters);
          return;
        }

        // Perform clustering with viewport optimization
        performanceOptimizer.measurePerformance('clustering', () => {
          const newClusters = smartClustering.clusterInViewport(
            clusterPoints, 
            zoom, 
            bounds
          );
          
          // Cache the results
          dataCache.set(cacheKey, newClusters, 2 * 60 * 1000); // 2 minutes
          setClusters(newClusters);
        });
      },
      { debounce: 150, key: 'cluster-update' }
    ),
    [clusterPoints, zoom, bounds, map, layerVisibility.optimizedClusters]
  );

  // Update clusters when dependencies change
  useEffect(() => {
    updateClusters();
  }, [updateClusters]);

  // Clean up existing markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  // Add cluster markers to map
  useEffect(() => {
    if (!map || !layerVisibility.optimizedClusters) {
      clearMarkers();
      return;
    }

    clearMarkers();

    // Batch process markers for performance
    performanceOptimizer.batchProcess(
      clusters,
      (cluster) => {
        const el = document.createElement('div');
        el.className = 'optimized-cluster-marker';
        
        if (cluster.count === 1) {
          // Single preschool marker
          el.innerHTML = `
            <div style="
              width: 12px;
              height: 12px;
              background: linear-gradient(45deg, #3b82f6, #1d4ed8);
              border: 2px solid white;
              border-radius: 50%;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              transition: transform 0.15s ease;
            " 
            onmouseover="this.style.transform='scale(1.3)'" 
            onmouseout="this.style.transform='scale(1)'"
            title="${cluster.points[0].data.namn}"></div>
          `;
        } else {
          // Cluster marker
          const size = Math.min(40, 20 + Math.log(cluster.count) * 5);
          const opacity = Math.min(0.9, 0.6 + (cluster.count / 100));
          
          el.innerHTML = `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background: linear-gradient(135deg, #f59e0b, #d97706);
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${Math.max(10, size / 3)}px;
              cursor: pointer;
              box-shadow: 0 3px 8px rgba(0,0,0,0.3);
              opacity: ${opacity};
              transition: all 0.2s ease;
            " 
            onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.4)'" 
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 3px 8px rgba(0,0,0,0.3)'"
            title="${cluster.count} förskolor">${cluster.count}</div>
          `;

          // Click handler for clusters
          el.addEventListener('click', () => {
            // Zoom into cluster bounds
            const padding = 20;
            map.fitBounds([
              [cluster.bounds.west, cluster.bounds.south],
              [cluster.bounds.east, cluster.bounds.north]
            ], { padding });
          });
        }

        // Add marker to map using Mapbox GL JS
        const marker = new (window as any).mapboxgl.Marker(el, { anchor: 'center' })
          .setLngLat([cluster.lng, cluster.lat])
          .addTo(map);
        
        markersRef.current.push(marker);
      },
      25, // Process 25 markers per batch
      5   // 5ms delay between batches
    );
  }, [map, clusters, layerVisibility.optimizedClusters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, []);

  // Memory management
  useEffect(() => {
    const interval = setInterval(() => {
      performanceOptimizer.manageCacheSize();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return null; // This is a logical component, no UI
};

export default OptimizedMapClustering;