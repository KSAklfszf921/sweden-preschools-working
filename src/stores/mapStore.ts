import { create } from 'zustand';
import type { LngLatLike } from 'mapbox-gl';

export interface Preschool {
  id: string;
  namn: string;
  kommun: string;
  adress: string;
  latitud: number | null;
  longitud: number | null;
  antal_barn: number | null;
  huvudman: string;
  personaltäthet: number | null;
  andel_med_förskollärarexamen: number | null;
  antal_barngrupper: number;
  google_rating?: number;
  google_reviews_count?: number;
  google_reviews?: any;
  contact_phone?: string;
  website_url?: string;
  opening_hours?: any;
}

export interface SearchFilters {
  kommuner?: string[]; // Changed to array for multiple municipalities
  huvudman?: string;
  minPersonaltäthet?: number;
  maxPersonaltäthet?: number;
  minExamen?: number;
  maxExamen?: number;
  minBarngrupper?: number;
  maxBarngrupper?: number;
  radius?: number;
  center?: LngLatLike;
  query?: string;
  maxChildren?: number;
  minChildren?: number;
  minStaff?: number;
  maxStaff?: number;
  minExam?: number;
  maxExam?: number;
  minRating?: number;
  maxRating?: number;
  hasGoogleRating?: boolean;
  hasContact?: boolean;
  sortBy?: 'namn' | 'antal_barn' | 'google_rating' | 'andel_med_förskollärarexamen';
  sortOrder?: 'asc' | 'desc';
  nearbyMode?: boolean; // Track if "nearby" mode is active
  travelTime?: {
    userLocation: { lat: number; lng: number };
    maxMinutes: number;
    transportMode: 'walking' | 'bicycling' | 'driving' | 'transit';
  };
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
  lastUpdated?: number;
  updatePreschool: (updatedPreschool: Preschool) => void;
  
  // Heatmap states
  heatmapType: HeatmapType;
  heatmapIntensity: number;
  showHeatmap: boolean;
  
  // Layer visibility
  layerVisibility: LayerVisibility;
  
  // List module states
  visiblePreschools: Preschool[];
  listContext: 'viewport' | 'search' | 'nearby' | 'rated';
  listSortOrder: 'distance' | 'rating' | 'name' | 'quality';
  
  // Statistics and insights
  selectedCommune: string | null;
  statisticsData: StatisticsData | null;
  showStatistics: boolean;
  
  // Performance
  performanceMode: 'high' | 'medium' | 'low';
  
  // UI state
  searchBoxCollapsed: boolean;
  listPanelCollapsed: boolean;
  searchTerm: string;
  
  // Actions
  setPreschools: (preschools: Preschool[]) => void;
  setFilteredPreschools: (preschools: Preschool[]) => void;
  setSelectedPreschool: (preschool: Preschool | null) => void;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  clearSearchFilters: () => void;
  clearSpecificFilter: (filterKey: keyof SearchFilters) => void;
  hasActiveFilters: boolean;
  setLoading: (loading: boolean) => void;
  
  // UI actions
  setSearchBoxCollapsed: (collapsed: boolean) => void;
  setListPanelCollapsed: (collapsed: boolean) => void;
  setSearchTerm: (term: string) => void;
  setMapCenter: (center: LngLatLike) => void;
  setMapZoom: (zoom: number) => void;
  setShowClusters: (show: boolean) => void;
  
  // Heatmap actions
  setHeatmapType: (type: HeatmapType) => void;
  setHeatmapIntensity: (intensity: number) => void;
  setShowHeatmap: (show: boolean) => void;
  
  // Layer actions
  setLayerVisibility: (layer: keyof LayerVisibility, visible: boolean) => void;
  
  // List module actions
  setVisiblePreschools: (preschools: Preschool[]) => void;
  setListContext: (context: 'viewport' | 'search' | 'nearby' | 'rated') => void;
  setListSortOrder: (order: 'distance' | 'rating' | 'name' | 'quality') => void;
  updateVisiblePreschoolsFromViewport: (bounds: { north: number; south: number; east: number; west: number }) => void;
  
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
  mapCenter: [15.2, 62.4], // Optimized center over all of Sweden  
  mapZoom: 4.9, // Perfect zoom to show all of Sweden with visible clusters
  showClusters: true, // Start with clusters visible
  
  // Heatmap defaults
  heatmapType: 'density',
  heatmapIntensity: 1,
  showHeatmap: false,
  
  // Layer visibility defaults - start with clusters
  layerVisibility: {
    heatmap: false,
    clusters: true,
    markers: true,
    communeBorders: false,
  },
  
  // List module defaults
  visiblePreschools: [],
  listContext: 'viewport',
  listSortOrder: 'distance',
  
  // Statistics defaults
  selectedCommune: null,
  statisticsData: null,
  showStatistics: false,
  
  // Performance defaults
  performanceMode: 'high',
  
  // UI state defaults
  searchBoxCollapsed: false,
  listPanelCollapsed: false,
  searchTerm: '',

  updatePreschool: (updatedPreschool) => set((state) => ({
    preschools: state.preschools.map(p => 
      p.id === updatedPreschool.id ? updatedPreschool : p
    )
  })),

  setPreschools: (preschools) => {
    console.log(`Setting ${preschools.length} preschools in store`);
    set({ preschools });
    get().applyFilters();
    // Force re-render of map components by updating a timestamp
    set({ lastUpdated: Date.now() });
  },

  setFilteredPreschools: (filteredPreschools) => set({ filteredPreschools }),

  setSelectedPreschool: (selectedPreschool) => set({ selectedPreschool }),

  setSearchFilters: (filters) => {
    const state = get();
    const newFilters = { ...state.searchFilters, ...filters };
    set({ searchFilters: newFilters });
    
    // Apply filters first to get updated filteredPreschools
    state.applyFilters();
    
    // Apply filters immediately without setTimeout
    const updatedState = get();
      
      if (filters.kommuner && filters.kommuner.length > 0) {
        // Handle multiple municipalities
        if (filters.kommuner.length === 1) {
          const kommun = filters.kommuner[0];
          const kommunCenter = getKommunCenter(kommun);
          if (kommunCenter) {
            set({ mapCenter: kommunCenter, mapZoom: 11 });
          } else {
            // Fallback: calculate center from preschools in this municipality
            const kommunPreschools = updatedState.filteredPreschools.filter(p => p.kommun === kommun);
            if (kommunPreschools.length > 0) {
              const lats = kommunPreschools.map(p => p.latitud).filter(Boolean);
              const lngs = kommunPreschools.map(p => p.longitud).filter(Boolean);
              if (lats.length > 0) {
                const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
                const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
                
                // Calculate appropriate zoom based on spread within municipality
                const latSpread = Math.max(...lats) - Math.min(...lats);
                const lngSpread = Math.max(...lngs) - Math.min(...lngs);
                const maxSpread = Math.max(latSpread, lngSpread);
                
                let zoom = 12;
                if (maxSpread < 0.005) zoom = 15;
                else if (maxSpread < 0.01) zoom = 14;
                else if (maxSpread < 0.02) zoom = 13;
                else if (maxSpread < 0.05) zoom = 12;
                else zoom = 11;
                
                set({ mapCenter: [centerLng, centerLat], mapZoom: zoom });
              }
            }
          }
        } else {
          // Multiple municipalities - calculate center from all filtered preschools
          const filtered = updatedState.filteredPreschools;
          const lats = filtered.map(p => p.latitud).filter(Boolean);
          const lngs = filtered.map(p => p.longitud).filter(Boolean);
          
          if (lats.length > 0) {
            const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
            const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
            
            // Calculate zoom based on spread for multiple municipalities
            const latSpread = Math.max(...lats) - Math.min(...lats);
            const lngSpread = Math.max(...lngs) - Math.min(...lngs);
            const maxSpread = Math.max(latSpread, lngSpread);
            
            let zoom = 8;
            if (maxSpread < 0.05) zoom = 11;
            else if (maxSpread < 0.1) zoom = 10;
            else if (maxSpread < 0.3) zoom = 9;
            else if (maxSpread < 0.5) zoom = 8;
            else if (maxSpread < 1.0) zoom = 7;
            else zoom = 6;
            
            set({ mapCenter: [centerLng, centerLat], mapZoom: zoom });
          }
        }
      } else if (filters.center && filters.nearbyMode) {
        // Center on user location with appropriate zoom for nearby search
        set({ mapCenter: filters.center, mapZoom: 13 });
      } else if (filters.query && !filters.kommuner) {
        // If searching by text, try to find a preschool to center on
        const filteredPreschools = updatedState.filteredPreschools;
        if (filteredPreschools.length > 0) {
          if (filteredPreschools.length === 1) {
            // Single result - zoom in close
            const preschool = filteredPreschools[0];
            if (preschool.longitud && preschool.latitud) {
              set({ mapCenter: [preschool.longitud, preschool.latitud], mapZoom: 15 });
            }
          } else {
            // Multiple results - calculate best fit
            const lats = filteredPreschools.map(p => p.latitud).filter(Boolean);
            const lngs = filteredPreschools.map(p => p.longitud).filter(Boolean);
            
            if (lats.length > 0) {
              const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
              const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
              
              const latSpread = Math.max(...lats) - Math.min(...lats);
              const lngSpread = Math.max(...lngs) - Math.min(...lngs);
              const maxSpread = Math.max(latSpread, lngSpread);
              
              let zoom = 12;
              if (maxSpread < 0.005) zoom = 15;
              else if (maxSpread < 0.01) zoom = 14;
              else if (maxSpread < 0.02) zoom = 13;
              else if (maxSpread < 0.05) zoom = 12;
              else if (maxSpread < 0.1) zoom = 11;
              else zoom = 10;
              
              set({ mapCenter: [centerLng, centerLat], mapZoom: zoom });
            }
          }
        }
      } else if (updatedState.filteredPreschools.length > 0 && Object.keys(newFilters).length > 0) {
        // Auto-center on filtered results if we have any
        const filtered = updatedState.filteredPreschools;
        const lats = filtered.map(p => p.latitud).filter(Boolean);
        const lngs = filtered.map(p => p.longitud).filter(Boolean);
        
        if (lats.length > 0 && lngs.length > 0) {
          const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
          const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
          
          // Calculate appropriate zoom based on result spread
          const latSpread = Math.max(...lats) - Math.min(...lats);
          const lngSpread = Math.max(...lngs) - Math.min(...lngs);
          const maxSpread = Math.max(latSpread, lngSpread);
          
          let zoom = 10;
          if (maxSpread < 0.01) zoom = 15;
          else if (maxSpread < 0.05) zoom = 13;
          else if (maxSpread < 0.1) zoom = 11;
          else if (maxSpread < 0.5) zoom = 9;
          else zoom = 7;
          
          set({ mapCenter: [centerLng, centerLat], mapZoom: zoom });
        }
      }
  },

  clearFilters: () => {
    set({ 
      searchFilters: {},
      mapCenter: [15.0, 62.0], // Reset to Sweden center
      mapZoom: 5 // Reset to country view
    });
    get().applyFilters();
  },

  clearSearchFilters: () => {
    set({ 
      searchFilters: {},
      mapCenter: [15.0, 62.0], // Reset to Sweden center
      mapZoom: 5 // Reset to country view
    });
    get().applyFilters();
  },

  clearSpecificFilter: (filterKey: keyof SearchFilters) => {
    const state = get();
    const newFilters = { ...state.searchFilters };
    delete newFilters[filterKey];
    
    // If clearing nearbyMode, also clear center and radius
    if (filterKey === 'nearbyMode') {
      delete newFilters.center;
      delete newFilters.radius;
      set({ 
        searchFilters: newFilters,
        mapCenter: [15.0, 62.0],
        mapZoom: 5 
      });
    } else {
      set({ searchFilters: newFilters });
    }
    
    state.applyFilters();
  },

  get hasActiveFilters() {
    const filters = get().searchFilters;
    return Boolean(
      (filters.kommuner && filters.kommuner.length > 0) ||
      (filters.huvudman && filters.huvudman !== 'alla') ||
      (filters.maxChildren && filters.maxChildren < 200) ||
      filters.nearbyMode ||
      (filters.radius && filters.center) ||
      (filters.query && filters.query.trim().length > 0) ||
      filters.minPersonaltäthet ||
      filters.maxPersonaltäthet ||
      filters.minExamen ||
      filters.maxExamen ||
      filters.minBarngrupper ||
      filters.maxBarngrupper ||
      filters.travelTime
    );
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
  
  // List module actions
  setVisiblePreschools: (visiblePreschools) => set({ visiblePreschools }),
  
  setListContext: (listContext) => set({ listContext }),
  
  setListSortOrder: (listSortOrder) => set({ listSortOrder }),
  
  updateVisiblePreschoolsFromViewport: (bounds) => {
    const { filteredPreschools, listSortOrder } = get();
    
    // Filter preschools within viewport bounds with performance optimization
    const visibleInViewport = filteredPreschools.filter(preschool => {
      if (!preschool.latitud || !preschool.longitud) return false;
      
      // Fast bounds check
      const lat = preschool.latitud;
      const lng = preschool.longitud;
      
      return lat >= bounds.south && lat <= bounds.north &&
             lng >= bounds.west && lng <= bounds.east;
    });
    
    // Sort based on current sort order with performance optimization
    if (visibleInViewport.length < 1000) {
      switch (listSortOrder) {
        case 'rating':
          visibleInViewport.sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0));
          break;
        case 'name':
          visibleInViewport.sort((a, b) => a.namn.localeCompare(b.namn));
          break;
        case 'quality':
          visibleInViewport.sort((a, b) => (b.andel_med_förskollärarexamen || 0) - (a.andel_med_förskollärarexamen || 0));
          break;
        case 'distance':
        default:
          // Distance sorting requires user position, for now keep default order
          break;
      }
    }
    
    set({ visiblePreschools: visibleInViewport });
  },
  
  // Performance actions
  setPerformanceMode: (performanceMode) => set({ performanceMode }),
  
  // UI actions
  setSearchBoxCollapsed: (searchBoxCollapsed) => set({ searchBoxCollapsed }),
  setListPanelCollapsed: (listPanelCollapsed) => set({ listPanelCollapsed }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),

  applyFilters: () => {
    const { preschools, searchFilters } = get();
    
    const filtered = preschools.filter(preschool => {
      // Query filter (search in name and kommun)
      if (searchFilters.query) {
        const query = searchFilters.query.toLowerCase();
        const nameMatch = preschool.namn.toLowerCase().includes(query);
        const kommunMatch = preschool.kommun.toLowerCase().includes(query);
        if (!nameMatch && !kommunMatch) {
          return false;
        }
      }

      // Max children filter
      if (searchFilters.maxChildren && preschool.antal_barn && preschool.antal_barn > searchFilters.maxChildren) {
        return false;
      }

      // Kommuner filter (multiple municipalities)
      if (searchFilters.kommuner && searchFilters.kommuner.length > 0) {
        if (!searchFilters.kommuner.includes(preschool.kommun)) {
          return false;
        }
      }

      // Huvudman filter - handle both database value and display mapping
      if (searchFilters.huvudman) {
        const filterValue = searchFilters.huvudman === 'Fristående' ? 'Enskild' : searchFilters.huvudman;
        if (preschool.huvudman !== filterValue) {
          return false;
        }
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
        
        // Convert radius from meters to kilometers for comparison
        const radiusInKm = searchFilters.radius / 1000;
        if (distance > radiusInKm) {
          return false;
        }
      }

      // Travel time filter (placeholder for now - would need Google Directions API integration)
      if (searchFilters.travelTime) {
        // This would require calling Google Directions API for each preschool
        // For now, we'll use a simple distance approximation
        const userLat = searchFilters.travelTime.userLocation.lat;
        const userLng = searchFilters.travelTime.userLocation.lng;
        
        const distance = getDistance(userLat, userLng, preschool.latitud, preschool.longitud);
        
        // Rough approximation: cycling speed ~15 km/h, walking ~5 km/h, driving ~30 km/h, transit ~20 km/h
        const speedKmh = {
          walking: 5,
          bicycling: 15,
          driving: 30,
          transit: 20
        }[searchFilters.travelTime.transportMode];
        
        const estimatedTimeMinutes = (distance / speedKmh) * 60;
        
        if (estimatedTimeMinutes > searchFilters.travelTime.maxMinutes) {
          return false;
        }
      }

      return true;
    });

    set({ filteredPreschools: filtered });
    
    // Also update visible preschools if in viewport-only mode
    // This ensures the list updates immediately when filters change
    console.log(`🔍 Applied filters, ${filtered.length} preschools match criteria`);
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

// Swedish municipality center coordinates (comprehensive list)
function getKommunCenter(kommun: string): [number, number] | null {
  const kommunCoordinates: Record<string, [number, number]> = {
    'Stockholm': [18.0686, 59.3293],
    'Göteborg': [11.9746, 57.7089],
    'Malmö': [13.0034, 55.6050],
    'Uppsala': [17.6389, 59.8585],
    'Västerås': [16.5554, 59.6099],
    'Örebro': [15.2066, 59.2741],
    'Linköping': [15.6214, 58.4108],
    'Helsingborg': [12.6945, 56.0465],
    'Jönköping': [14.1618, 57.7826],
    'Norrköping': [16.1926, 58.5877],
    'Lund': [13.1910, 55.7047],
    'Umeå': [20.2630, 63.8258],
    'Gävle': [17.1414, 60.6749],
    'Borås': [12.9401, 57.7210],
    'Eskilstuna': [16.5077, 59.3706],
    'Södertälje': [17.6253, 59.1955],
    'Karlstad': [13.5034, 59.3793],
    'Täby': [18.0631, 59.4439],
    'Växjö': [14.8059, 56.8777],
    'Halmstad': [12.8580, 56.6745],
    'Sundsvall': [17.3063, 62.3908],
    'Luleå': [22.1567, 65.5848],
    'Trollhättan': [12.2886, 58.2837],
    'Östersund': [14.6357, 63.1792],
    'Borlänge': [15.4357, 60.4858],
    'Falun': [15.6356, 60.6066],
    'Skövde': [13.8454, 58.3914],
    'Karlskrona': [15.5866, 56.1612],
    'Kristianstad': [14.1591, 56.0294],
    'Kalmar': [16.3614, 56.6634],
    'Vänersborg': [12.3225, 58.3789],
    'Varberg': [12.2504, 57.1057],
    'Trelleborg': [13.1567, 55.3753],
    'Åkersberga': [18.2878, 59.4797],
    'Visby': [18.2948, 57.6348],
    'Mora': [14.5389, 61.0088],
    'Sandviken': [16.7725, 60.6184],
    'Kiruna': [20.2253, 67.8558],
    'Kungälv': [11.9746, 57.8737],
    'Partille': [11.9989, 57.7396],
    'Mölndal': [12.0134, 57.6554],
    'Lerum': [12.2691, 57.7706],
    'Stenungsund': [11.8263, 58.0706],
    'Ale': [12.0465, 57.9378],
    'Alingsås': [12.5344, 57.9304],
    'Vårgårda': [12.8162, 58.0356],
    'Herrljunga': [13.0239, 58.0916],
    'Tranemo': [13.3454, 57.4886],
    'Svenljunga': [13.1064, 57.4976],
    'Vara': [12.9584, 58.2596],
    'Götene': [13.4234, 58.3896],
    'Tibro': [12.5264, 58.4236],
    'Lidköping': [13.1577, 58.5052],
    'Mariestad': [13.8238, 58.7096],
    'Kungsbacka': [12.0784, 57.4866]
  };
  
  return kommunCoordinates[kommun] || null;
}