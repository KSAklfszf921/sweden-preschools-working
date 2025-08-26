import { create } from 'zustand';
import type { LngLatLike } from 'mapbox-gl';

export interface Preschool {
  id: string;
  namn: string;
  kommun: string;
  adress: string;
  latitud: number;
  longitud: number;
  antal_barn: number | null;
  huvudman: string;
  personaltäthet: number | null;
  andel_med_förskollärarexamen: number | null;
  antal_barngrupper: number;
  google_rating?: number;
  google_reviews_count?: number;
}

export interface SearchFilters {
  kommun?: string;
  huvudman?: string;
  minPersonaltäthet?: number;
  maxPersonaltäthet?: number;
  minExamen?: number;
  maxExamen?: number;
  minBarngrupper?: number;
  maxBarngrupper?: number;
  radius?: number;
  center?: LngLatLike;
}

export type HeatmapType = 'density' | 'staff' | 'quality' | 'rating';

export interface LayerVisibility {
  heatmap: boolean;
  clusters: boolean;
  markers: boolean;
  communeBorders: boolean;
}

export interface CommuneStats {
  kommun: string;
  count: number;
  avg_staff_density: number;
  avg_teacher_exam: number;
  avg_google_rating: number;
}

export interface StatisticsData {
  totalPreschools: number;
  communeStats: CommuneStats[];
  selectedCommuneData?: CommuneStats;
}

interface MapState {
  preschools: Preschool[];
  filteredPreschools: Preschool[];
  selectedPreschool: Preschool | null;
  searchFilters: SearchFilters;
  isLoading: boolean;
  mapCenter: LngLatLike;
  mapZoom: number;
  showClusters: boolean;
  
  // Heatmap states
  heatmapType: HeatmapType;
  heatmapIntensity: number;
  showHeatmap: boolean;
  
  // Layer visibility
  layerVisibility: LayerVisibility;
  
  // Statistics and insights
  selectedCommune: string | null;
  statisticsData: StatisticsData | null;
  showStatistics: boolean;
  
  // Performance
  performanceMode: 'high' | 'medium' | 'low';
  
  // Actions
  setPreschools: (preschools: Preschool[]) => void;
  setFilteredPreschools: (preschools: Preschool[]) => void;
  setSelectedPreschool: (preschool: Preschool | null) => void;
  setSearchFilters: (filters: SearchFilters) => void;
  setLoading: (loading: boolean) => void;
  setMapCenter: (center: LngLatLike) => void;
  setMapZoom: (zoom: number) => void;
  setShowClusters: (show: boolean) => void;
  
  // Heatmap actions
  setHeatmapType: (type: HeatmapType) => void;
  setHeatmapIntensity: (intensity: number) => void;
  setShowHeatmap: (show: boolean) => void;
  
  // Layer actions
  setLayerVisibility: (layer: keyof LayerVisibility, visible: boolean) => void;
  
  // Statistics actions
  setSelectedCommune: (commune: string | null) => void;
  setStatisticsData: (data: StatisticsData) => void;
  setShowStatistics: (show: boolean) => void;
  
  // Performance actions
  setPerformanceMode: (mode: 'high' | 'medium' | 'low') => void;
  
  applyFilters: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  preschools: [],
  filteredPreschools: [],
  selectedPreschool: null,
  searchFilters: {},
  isLoading: false,
  mapCenter: [15.0, 62.0], // Center of Sweden
  mapZoom: 5,
  showClusters: true,
  
  // Heatmap defaults
  heatmapType: 'density',
  heatmapIntensity: 1,
  showHeatmap: false,
  
  // Layer visibility defaults
  layerVisibility: {
    heatmap: false,
    clusters: true,
    markers: true,
    communeBorders: false,
  },
  
  // Statistics defaults
  selectedCommune: null,
  statisticsData: null,
  showStatistics: false,
  
  // Performance defaults
  performanceMode: 'high',

  setPreschools: (preschools) => {
    set({ preschools });
    get().applyFilters();
  },

  setFilteredPreschools: (filteredPreschools) => set({ filteredPreschools }),

  setSelectedPreschool: (selectedPreschool) => set({ selectedPreschool }),

  setSearchFilters: (filters) => {
    set({ searchFilters: { ...get().searchFilters, ...filters } });
    get().applyFilters();
  },

  setLoading: (isLoading) => set({ isLoading }),

  setMapCenter: (mapCenter) => set({ mapCenter }),

  setMapZoom: (mapZoom) => set({ mapZoom }),

  setShowClusters: (showClusters) => set({ showClusters }),
  
  // Heatmap actions
  setHeatmapType: (heatmapType) => set({ heatmapType }),
  
  setHeatmapIntensity: (heatmapIntensity) => set({ heatmapIntensity }),
  
  setShowHeatmap: (showHeatmap) => set({ showHeatmap }),
  
  // Layer actions
  setLayerVisibility: (layer, visible) => {
    set((state) => ({
      layerVisibility: {
        ...state.layerVisibility,
        [layer]: visible,
      },
    }));
  },
  
  // Statistics actions
  setSelectedCommune: (selectedCommune) => set({ selectedCommune }),
  
  setStatisticsData: (statisticsData) => set({ statisticsData }),
  
  setShowStatistics: (showStatistics) => set({ showStatistics }),
  
  // Performance actions
  setPerformanceMode: (performanceMode) => set({ performanceMode }),

  applyFilters: () => {
    const { preschools, searchFilters } = get();
    
    let filtered = preschools.filter(preschool => {
      // Kommun filter
      if (searchFilters.kommun && preschool.kommun !== searchFilters.kommun) {
        return false;
      }

      // Huvudman filter
      if (searchFilters.huvudman && preschool.huvudman !== searchFilters.huvudman) {
        return false;
      }

      // Personaltäthet filter
      if (searchFilters.minPersonaltäthet && (!preschool.personaltäthet || preschool.personaltäthet < searchFilters.minPersonaltäthet)) {
        return false;
      }
      if (searchFilters.maxPersonaltäthet && (!preschool.personaltäthet || preschool.personaltäthet > searchFilters.maxPersonaltäthet)) {
        return false;
      }

      // Förskollärarexamen filter
      if (searchFilters.minExamen && (!preschool.andel_med_förskollärarexamen || preschool.andel_med_förskollärarexamen < searchFilters.minExamen)) {
        return false;
      }
      if (searchFilters.maxExamen && (!preschool.andel_med_förskollärarexamen || preschool.andel_med_förskollärarexamen > searchFilters.maxExamen)) {
        return false;
      }

      // Barngrupper filter
      if (searchFilters.minBarngrupper && preschool.antal_barngrupper < searchFilters.minBarngrupper) {
        return false;
      }
      if (searchFilters.maxBarngrupper && preschool.antal_barngrupper > searchFilters.maxBarngrupper) {
        return false;
      }

      // Radius filter (if center is provided)
      if (searchFilters.radius && searchFilters.center) {
        const [centerLng, centerLat] = Array.isArray(searchFilters.center) 
          ? searchFilters.center 
          : 'lng' in searchFilters.center 
            ? [searchFilters.center.lng, searchFilters.center.lat]
            : [searchFilters.center.lon, searchFilters.center.lat];
        
        const distance = getDistance(
          centerLat, centerLng,
          preschool.latitud, preschool.longitud
        );
        
        if (distance > searchFilters.radius) {
          return false;
        }
      }

      return true;
    });

    set({ filteredPreschools: filtered });
  },
}));

// Helper function to calculate distance between two points
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}