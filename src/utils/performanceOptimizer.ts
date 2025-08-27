// PERFORMANCE OPTIMIZATION UTILITIES
// Smart patterns from svenska-forskolor-karta

import { dataCache, cacheKeys } from './dataCache';

class PerformanceOptimizer {
  private pendingRequests = new Map<string, Promise<any>>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  
  // Deduplicate identical API requests
  async dedupedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // Debounced function executor
  debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = 300
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        fn(...args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    };
  }

  // Throttled function executor
  throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = 100
  ): (...args: Parameters<T>) => void {
    let lastExecution = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastExecution >= delay) {
        fn(...args);
        lastExecution = now;
      }
    };
  }

  // Batch process array in chunks to avoid blocking UI
  async batchProcess<T, R>(
    items: T[],
    processor: (item: T) => R | Promise<R>,
    batchSize: number = 50,
    delay: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
      
      // Yield to main thread between batches
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  }

  // Smart pagination for large datasets
  paginate<T>(items: T[], page: number, pageSize: number = 50): {
    items: T[];
    hasMore: boolean;
    total: number;
    currentPage: number;
  } {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = items.slice(startIndex, endIndex);
    
    return {
      items: paginatedItems,
      hasMore: endIndex < items.length,
      total: items.length,
      currentPage: page
    };
  }

  // Memory-conscious filtering for large datasets
  smartFilter<T>(
    items: T[],
    filterFn: (item: T) => boolean,
    maxResults: number = 1000
  ): T[] {
    const results: T[] = [];
    
    for (const item of items) {
      if (results.length >= maxResults) break;
      if (filterFn(item)) {
        results.push(item);
      }
    }
    
    return results;
  }

  // Viewport-based visibility optimization
  isInViewport(
    itemBounds: { lat: number; lng: number },
    viewport: { north: number; south: number; east: number; west: number },
    buffer: number = 0.01 // Add small buffer for smooth scrolling
  ): boolean {
    return (
      itemBounds.lat >= (viewport.south - buffer) &&
      itemBounds.lat <= (viewport.north + buffer) &&
      itemBounds.lng >= (viewport.west - buffer) &&
      itemBounds.lng <= (viewport.east + buffer)
    );
  }

  // Preload critical data with smart timing
  async preloadCriticalData(preloadFn: () => Promise<void>): Promise<void> {
    // Wait for idle time before preloading
    if ('requestIdleCallback' in window) {
      return new Promise(resolve => {
        window.requestIdleCallback(async () => {
          await preloadFn();
          resolve();
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(preloadFn, 100);
    }
  }

  // Memory usage monitor
  getMemoryUsage(): { used: number; limit: number; percentage: number } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  // Smart cache management based on memory pressure
  manageCacheSize(): void {
    const memoryUsage = this.getMemoryUsage();
    
    if (memoryUsage && memoryUsage.percentage > 80) {
      console.warn('High memory usage detected, clearing non-essential cache');
      dataCache.cleanup();
      
      // Clear old search results
      dataCache.invalidatePattern('search:');
      dataCache.invalidatePattern('clusters:');
    }
  }

  // Performance monitoring
  measurePerformance<T>(
    operation: string,
    fn: () => T | Promise<T>
  ): T | Promise<T> {
    const start = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        this.logPerformance(operation, duration);
      });
    } else {
      const duration = performance.now() - start;
      this.logPerformance(operation, duration);
      return result;
    }
  }

  private logPerformance(operation: string, duration: number): void {
    if (duration > 100) { // Only log slow operations
      console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  // Cleanup resources
  cleanup(): void {
    this.pendingRequests.clear();
    
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

export const performanceOptimizer = new PerformanceOptimizer();

// React hook for performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const measureRender = () => {
    return performanceOptimizer.measurePerformance(
      `${componentName} render`,
      () => { /* render logic */ }
    );
  };

  return { measureRender };
}

// Utility for creating optimized event handlers
export const createOptimizedHandler = <T extends (...args: any[]) => any>(
  handler: T,
  options: {
    debounce?: number;
    throttle?: number;
    key?: string;
  } = {}
): ((...args: Parameters<T>) => void) => {
  const key = options.key || handler.name || 'handler';
  
  if (options.debounce) {
    return performanceOptimizer.debounce(key, handler, options.debounce);
  } else if (options.throttle) {
    return performanceOptimizer.throttle(handler, options.throttle);
  }
  
  return handler;
};