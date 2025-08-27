import { useEffect, useCallback, useRef } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { useDebounce } from './useDebounce';

export const useMapViewportSync = (map: mapboxgl.Map | null) => {
  const { updateVisiblePreschoolsFromViewport } = useMapStore();
  const lastUpdateRef = useRef<number>(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  
  const updateViewport = useCallback(() => {
    if (!map) return;
    
    const now = Date.now();
    if (now - lastUpdateRef.current < 100) { // Throttle to max 10 updates per second
      return;
    }
    
    const bounds = map.getBounds();
    
    updateVisiblePreschoolsFromViewport({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    });
    
    lastUpdateRef.current = now;
  }, [map, updateVisiblePreschoolsFromViewport]);

  const debouncedUpdate = useDebounce(updateViewport, 150);

  useEffect(() => {
    if (!map) return;

    const handleMoveEnd = () => {
      // Clear any pending timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Immediate update for pan/zoom end
      updateViewport();
    };

    const handleMove = () => {
      // Debounced update during movement
      debouncedUpdate();
    };

    const handleZoomEnd = () => {
      updateViewport();
    };

    map.on('moveend', handleMoveEnd);
    map.on('move', handleMove);
    map.on('zoomend', handleZoomEnd);

    // Initial update
    updateViewport();

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('move', handleMove);
      map.off('zoomend', handleZoomEnd);
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [map, updateViewport, debouncedUpdate]);

  return { updateViewport };
};