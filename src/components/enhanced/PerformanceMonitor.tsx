import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentsRendered: number;
}

let renderCount = 0;
let lastRenderTime = 0;

export const usePerformanceMonitor = (componentName: string = 'Unknown') => {
  const renderStartTime = useRef<number>(0);
  
  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount++;
    
    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      lastRenderTime = renderTime;
      
      // Log slow renders
      if (renderTime > 16) { // More than one frame at 60fps
        console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
      
      // Log memory usage in development
      if (process.env.NODE_ENV === 'development' && (performance as any).memory) {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // More than 50MB
          console.warn(`High memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
        }
      }
    };
  });

  return {
    getRenderCount: () => renderCount,
    getLastRenderTime: () => lastRenderTime,
    getMemoryUsage: () => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        return {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        };
      }
      return null;
    }
  };
};

// Performance context for component tree optimization
export const PerformanceContext = {
  shouldOptimize: false,
  maxVisibleItems: 100,
  enableVirtualization: true,
  deferNonCritical: true
};

// Debounced performance checker
let performanceCheckTimeout: NodeJS.Timeout;

export const checkPerformance = () => {
  clearTimeout(performanceCheckTimeout);
  performanceCheckTimeout = setTimeout(() => {
    const metrics = {
      renderCount,
      lastRenderTime,
      timestamp: Date.now()
    };
    
    // Auto-adjust performance settings
    if (lastRenderTime > 33) { // More than 2 frames
      PerformanceContext.shouldOptimize = true;
      PerformanceContext.maxVisibleItems = 50;
      console.log('Performance optimization enabled due to slow renders');
    } else if (lastRenderTime < 8) { // Less than half a frame
      PerformanceContext.shouldOptimize = false;
      PerformanceContext.maxVisibleItems = 200;
    }
  }, 100);
};

// Call performance check on component renders
export const withPerformanceMonitoring = <T extends {}>(Component: React.ComponentType<T>) => {
  return (props: T) => {
    usePerformanceMonitor(Component.displayName || Component.name);
    checkPerformance();
    return <Component {...props} />;
  };
};