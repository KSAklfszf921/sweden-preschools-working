// Removed mapbox dependency for ultra-light performance
type LngLatBoundsLike = [[number, number], [number, number]];
type LngLatLike = [number, number] | { lng: number; lat: number };
import type { Preschool } from '@/stores/mapStore';

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewOptions {
  center?: LngLatLike;
  zoom?: number;
  bounds?: LngLatBoundsLike;
  duration?: number;
  essential?: boolean;
  pitch?: number;
  bearing?: number;
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Calculate optimal map view for a set of preschools
 */
export const calculateOptimalView = (preschools: Preschool[], scenario: string): MapViewOptions => {
  if (preschools.length === 0) {
    return {
      center: [15.5, 62.0], // Sweden center
      zoom: 5.5,
      duration: 1000,
      essential: true,
      pitch: 30
    };
  }

  const validPreschools = preschools.filter(p => p.latitud && p.longitud);
  
  if (validPreschools.length === 0) {
    return {
      center: [15.5, 62.0],
      zoom: 5.5,
      duration: 1000,
      essential: true,
      pitch: 30
    };
  }

  if (validPreschools.length === 1) {
    return {
      center: [validPreschools[0].longitud!, validPreschools[0].latitud!],
      zoom: 14,
      duration: 1500,
      essential: true,
      pitch: 45
    };
  }

  // Calculate bounds
  const lngs = validPreschools.map(p => p.longitud!);
  const lats = validPreschools.map(p => p.latitud!);
  
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  return {
    bounds: [[minLng, minLat], [maxLng, maxLat]] as LngLatBoundsLike,
    padding: { top: 50, bottom: 50, left: 50, right: 50 },
    duration: 1200,
    essential: true,
    pitch: 30
  };
};

/**
 * Determine view scenario based on data
 */
export const determineViewScenario = (preschoolCount: number, municipalityCount: number): string => {
  if (preschoolCount === 1) return 'single';
  if (preschoolCount <= 10) return 'few';
  if (municipalityCount === 1) return 'municipality';
  if (municipalityCount <= 3) return 'region';
  return 'national';
};

/**
 * Create smooth easing function
 */
export const createSmoothEasing = (scenario: string) => {
  return (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};