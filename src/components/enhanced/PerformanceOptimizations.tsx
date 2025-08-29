import React, { memo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';

interface MemoryOptimizedComponentProps {
  children: React.ReactNode;
  className?: string;
}

// Memory-optimized wrapper for heavy components
export const MemoryOptimizedComponent: React.FC<MemoryOptimizedComponentProps> = memo(({ children, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for shallow equality
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
});

// Performance-optimized map event handler
export const useOptimizedMapEvents = () => {
  const eventHandlersRef = useRef<Map<string, ((...args: any[]) => void)>>(new Map());
  
  const addEventHandler = useCallback((eventName: string, handler: (...args: any[]) => void) => {
    eventHandlersRef.current.set(eventName, handler);
  }, []);

  const removeEventHandler = useCallback((eventName: string) => {
    eventHandlersRef.current.delete(eventName);
  }, []);

  const clearAllHandlers = useCallback(() => {
    eventHandlersRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllHandlers();
    };
  }, [clearAllHandlers]);

  return { addEventHandler, removeEventHandler, clearAllHandlers };
};

// Optimized preschool data processor
export const useOptimizedPreschoolData = () => {
  const { preschools, filteredPreschools } = useMapStore();
  const cacheRef = useRef<Map<string, any>>(new Map());

  const getProcessedData = useCallback((filters: any) => {
    const cacheKey = JSON.stringify(filters);
    
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey);
    }

    // Process data
    const processed = {
      total: preschools.length,
      filtered: filteredPreschools.length,
      hasCoordinates: filteredPreschools.filter(p => p.latitud && p.longitud).length,
      withRating: filteredPreschools.filter(p => p.google_rating).length
    };

    cacheRef.current.set(cacheKey, processed);
    
    // Limit cache size
    if (cacheRef.current.size > 10) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }

    return processed;
  }, [preschools, filteredPreschools]);

  return { getProcessedData };
};

// Debounced state updater for performance
export const useDebouncedState = <T,>(initialValue: T, delay: number = 300) => {
  const [state, setState] = React.useState<T>(initialValue);
  const [debouncedState, setDebouncedState] = React.useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const updateState = useCallback((newValue: T) => {
    setState(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedState(newValue);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, debouncedState, updateState] as const;
};

// Intersection Observer for virtual scrolling
export const useIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) => {
  const observerRef = useRef<IntersectionObserver>();
  const elementsRef = useRef<Set<Element>>(new Set());

  const observe = useCallback((element: Element) => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(callback, {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
        ...options
      });
    }
    
    observerRef.current.observe(element);
    elementsRef.current.add(element);
  }, [callback, options]);

  const unobserve = useCallback((element: Element) => {
    observerRef.current?.unobserve(element);
    elementsRef.current.delete(element);
  }, []);

  const disconnect = useCallback(() => {
    observerRef.current?.disconnect();
    elementsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { observe, unobserve, disconnect };
};

// Optimized motion variants for better performance
export const optimizedMotionVariants = {
  listContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  },
  listItem: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  },
  fadeInOut: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.15 }
    }
  }
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const metricsRef = useRef({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0
  });

  const recordRender = useCallback(() => {
    const now = performance.now();
    const timeSinceLastRender = now - metricsRef.current.lastRenderTime;
    
    metricsRef.current.renderCount++;
    metricsRef.current.lastRenderTime = now;
    
    if (metricsRef.current.renderCount > 1) {
      metricsRef.current.averageRenderTime = 
        (metricsRef.current.averageRenderTime * (metricsRef.current.renderCount - 1) + timeSinceLastRender) / 
        metricsRef.current.renderCount;
    }

    // Log performance warnings
    if (timeSinceLastRender > 100) {
      console.warn(`Slow render detected: ${timeSinceLastRender.toFixed(2)}ms`);
    }
  }, []);

  const getMetrics = useCallback(() => ({
    ...metricsRef.current
  }), []);

  return { recordRender, getMetrics };
};

MemoryOptimizedComponent.displayName = 'MemoryOptimizedComponent';