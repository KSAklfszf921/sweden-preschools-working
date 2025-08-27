// Performance configuration constants
export const PERFORMANCE_CONFIG = {
  // List virtualization
  VIRTUAL_ITEM_HEIGHT: 120,
  VIRTUAL_BUFFER_SIZE: 5,
  MAX_RENDERED_ITEMS: 50,
  
  // Map performance
  MAX_VISIBLE_MARKERS: 200,
  CLUSTERING_THRESHOLD: 100,
  HEATMAP_MAX_ZOOM: 12,
  
  // Animation performance
  REDUCED_MOTION_THRESHOLD: 100, // items
  ANIMATION_DURATION_FAST: 150,
  ANIMATION_DURATION_NORMAL: 300,
  
  // Debounce and throttle
  SEARCH_DEBOUNCE: 300,
  SCROLL_THROTTLE: 16, // ~60fps
  VIEWPORT_UPDATE_THROTTLE: 100,
  
  // Memory management
  IMAGE_CACHE_SIZE: 50,
  DATA_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  
  // Network optimization
  BATCH_SIZE_SMALL: 10,
  BATCH_SIZE_MEDIUM: 25,
  BATCH_SIZE_LARGE: 50,
  REQUEST_TIMEOUT: 10000,
  
  // Mobile optimizations
  MOBILE_MAX_ITEMS: 25,
  MOBILE_CLUSTER_THRESHOLD: 50,
  MOBILE_ANIMATION_REDUCE: true
} as const;

// Performance mode configurations
export const PERFORMANCE_MODES = {
  high: {
    maxVisibleItems: PERFORMANCE_CONFIG.MAX_RENDERED_ITEMS * 2,
    enableAnimations: true,
    enableClustering: false,
    virtualScrolling: true,
    imagePreloading: true,
    reducedMotion: false
  },
  medium: {
    maxVisibleItems: PERFORMANCE_CONFIG.MAX_RENDERED_ITEMS,
    enableAnimations: true,
    enableClustering: true,
    virtualScrolling: true,
    imagePreloading: false,
    reducedMotion: false
  },
  low: {
    maxVisibleItems: PERFORMANCE_CONFIG.MOBILE_MAX_ITEMS,
    enableAnimations: false,
    enableClustering: true,
    virtualScrolling: true,
    imagePreloading: false,
    reducedMotion: true
  }
} as const;

// Auto-detect performance mode based on device capabilities
export const getOptimalPerformanceMode = () => {
  // Check if running on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check available memory (if supported)
  const memory = (navigator as any).deviceMemory;
  const lowMemory = memory && memory < 4; // Less than 4GB
  
  // Check connection speed
  const connection = (navigator as any).connection;
  const slowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  
  // Check CPU cores
  const cores = navigator.hardwareConcurrency || 4;
  const lowCPU = cores < 4;
  
  if (isMobile || lowMemory || slowConnection || lowCPU) {
    return 'low';
  } else if (memory && memory >= 8 && cores >= 8) {
    return 'high';
  } else {
    return 'medium';
  }
};

// Performance monitoring utilities
export const measurePerformance = <T extends any[], R>(
  fn: (...args: T) => R,
  name: string
) => {
  return (...args: T): R => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    if (end - start > 10) {
      console.log(`Performance: ${name} took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  };
};

// Debounce with performance tracking
export const performanceDebounce = <T extends any[]>(
  fn: (...args: T) => any,
  delay: number,
  name?: string
) => {
  let timeoutId: NodeJS.Timeout;
  let lastExecuted = 0;
  
  return (...args: T) => {
    const now = Date.now();
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      if (name && now - lastExecuted > 100) {
        console.log(`Performance: ${name} executed after ${now - lastExecuted}ms`);
      }
      lastExecuted = now;
      fn(...args);
    }, delay);
  };
};