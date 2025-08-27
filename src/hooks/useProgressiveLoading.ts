import { useState, useEffect, useRef, useCallback } from 'react';
import { useMapStore } from '@/stores/mapStore';

interface ProgressiveLoadingOptions {
  viewport: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoom: number;
  chunkSize?: number;
  loadDelay?: number;
}

export const useProgressiveLoading = (options: ProgressiveLoadingOptions) => {
  const { preschools } = useMapStore();
  const [loadedChunks, setLoadedChunks] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const {
    viewport,
    zoom,
    chunkSize = 100,
    loadDelay = 50
  } = options;

  // Filter preschools within viewport
  const viewportPreschools = preschools.filter(preschool => {
    if (!preschool.latitud || !preschool.longitud) return false;
    
    return (
      preschool.latitud >= viewport.south &&
      preschool.latitud <= viewport.north &&
      preschool.longitud >= viewport.west &&
      preschool.longitud <= viewport.east
    );
  });

  // Create chunks based on spatial distribution
  const createSpatialChunks = useCallback(() => {
    if (viewportPreschools.length === 0) return [];
    
    // Sort by geographic quadrants for better visual loading
    const sorted = [...viewportPreschools].sort((a, b) => {
      const aQuadrant = getQuadrant(a.latitud!, a.longitud!, viewport);
      const bQuadrant = getQuadrant(b.latitud!, b.longitud!, viewport);
      
      if (aQuadrant !== bQuadrant) {
        return aQuadrant - bQuadrant;
      }
      
      // Within same quadrant, sort by distance from center
      const centerLat = (viewport.north + viewport.south) / 2;
      const centerLng = (viewport.east + viewport.west) / 2;
      
      const aDistance = Math.sqrt(
        Math.pow(a.latitud! - centerLat, 2) + Math.pow(a.longitud! - centerLng, 2)
      );
      const bDistance = Math.sqrt(
        Math.pow(b.latitud! - centerLat, 2) + Math.pow(b.longitud! - centerLng, 2)
      );
      
      return aDistance - bDistance;
    });

    // Split into chunks
    const chunks = [];
    for (let i = 0; i < sorted.length; i += chunkSize) {
      chunks.push(sorted.slice(i, i + chunkSize));
    }
    
    return chunks;
  }, [viewportPreschools, chunkSize, viewport]);

  const spatialChunks = createSpatialChunks();

  // Get quadrant (0-3) for spatial sorting
  const getQuadrant = (lat: number, lng: number, bounds: typeof viewport): number => {
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    
    if (lat >= centerLat && lng >= centerLng) return 0; // NE
    if (lat >= centerLat && lng < centerLng) return 1; // NW
    if (lat < centerLat && lng < centerLng) return 2; // SW
    return 3; // SE
  };

  // Progressive loading of chunks
  const loadNextChunk = useCallback(() => {
    if (loadedChunks.size >= spatialChunks.length) {
      setIsLoading(false);
      return;
    }

    const nextChunkIndex = loadedChunks.size;
    setLoadedChunks(prev => new Set([...prev, nextChunkIndex]));
    setLoadProgress((nextChunkIndex + 1) / spatialChunks.length);

    // Schedule next chunk load
    if (nextChunkIndex + 1 < spatialChunks.length) {
      loadingTimeoutRef.current = setTimeout(loadNextChunk, loadDelay);
    } else {
      setIsLoading(false);
    }
  }, [loadedChunks, spatialChunks.length, loadDelay]);

  // Reset and start loading when viewport or zoom changes significantly
  useEffect(() => {
    const shouldReload = loadedChunks.size === 0 || 
                        (spatialChunks.length > 0 && loadedChunks.size < spatialChunks.length);
    
    if (shouldReload && spatialChunks.length > 0) {
      setIsLoading(true);
      setLoadProgress(0);
      
      // Clear existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // Start loading first chunk immediately
      if (!loadedChunks.has(0)) {
        setLoadedChunks(new Set([0]));
        setLoadProgress(1 / spatialChunks.length);
        
        // Schedule remaining chunks
        if (spatialChunks.length > 1) {
          loadingTimeoutRef.current = setTimeout(loadNextChunk, loadDelay);
        } else {
          setIsLoading(false);
        }
      }
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [viewport, zoom, spatialChunks.length]);

  // Reset when viewport changes dramatically
  useEffect(() => {
    setLoadedChunks(new Set());
    setLoadProgress(0);
  }, [viewport.north, viewport.south, viewport.east, viewport.west]);

  // Get currently loaded preschools
  const loadedPreschools = spatialChunks
    .filter((_, index) => loadedChunks.has(index))
    .flat();

  // Get priority level for different zoom ranges
  const getPriorityLevel = useCallback((zoom: number) => {
    if (zoom >= 15) return 'high'; // Individual markers
    if (zoom >= 12) return 'medium'; // Small clusters
    if (zoom >= 8) return 'low'; // Large clusters
    return 'minimal'; // Heatmap only
  }, []);

  const priorityLevel = getPriorityLevel(zoom);

  // Adjust chunk size based on zoom and device performance
  const getOptimalChunkSize = useCallback(() => {
    const baseSize = chunkSize;
    
    // Reduce chunk size for higher zoom levels (more detail needed)
    if (zoom >= 15) return Math.max(20, baseSize * 0.2);
    if (zoom >= 12) return Math.max(50, baseSize * 0.5);
    if (zoom >= 8) return baseSize;
    
    // Increase chunk size for lower zoom levels (less detail needed)
    return baseSize * 2;
  }, [zoom, chunkSize]);

  // Performance metrics
  const metrics = {
    totalPreschools: viewportPreschools.length,
    loadedCount: loadedPreschools.length,
    chunksTotal: spatialChunks.length,
    chunksLoaded: loadedChunks.size,
    loadProgress: loadProgress,
    priorityLevel,
    optimalChunkSize: getOptimalChunkSize(),
    isComplete: loadedChunks.size >= spatialChunks.length && spatialChunks.length > 0
  };

  return {
    loadedPreschools,
    isLoading,
    loadProgress,
    metrics,
    spatialChunks,
    loadedChunks
  };
};