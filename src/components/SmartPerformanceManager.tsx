// SMART PERFORMANCE MANAGER
// Background optimization patterns from both reference projects

import React, { useEffect } from 'react';
import { performanceOptimizer } from '@/utils/performanceOptimizer';
import { dataCache } from '@/utils/dataCache';
import { useMapStore } from '@/stores/mapStore';

interface SmartPerformanceManagerProps {
  children: React.ReactNode;
}

export const SmartPerformanceManager: React.FC<SmartPerformanceManagerProps> = ({ children }) => {
  const { setPerformanceMode } = useMapStore();

  useEffect(() => {
    // Initialize performance monitoring
    const initPerformanceOptimizations = () => {
      // 1. Monitor memory usage
      const memoryCheck = setInterval(() => {
        const memoryUsage = performanceOptimizer.getMemoryUsage();
        
        if (memoryUsage) {
          if (memoryUsage.percentage > 85) {
            console.warn('🔥 High memory usage detected, switching to low performance mode');
            setPerformanceMode('low');
            performanceOptimizer.manageCacheSize();
          } else if (memoryUsage.percentage > 70) {
            setPerformanceMode('medium');
          } else {
            setPerformanceMode('high');
          }
        }
      }, 15000); // Check every 15 seconds

      // 2. Regular cache cleanup
      const cacheCleanup = setInterval(() => {
        dataCache.cleanup();
      }, 5 * 60 * 1000); // Every 5 minutes

      // 3. Performance monitoring for slow operations
      const performanceCheck = setInterval(() => {
        const stats = dataCache.getStats();
        if (stats.size > 80) { // Cache getting full
          console.log('📊 Cache usage:', stats);
          dataCache.cleanup();
        }
      }, 2 * 60 * 1000); // Every 2 minutes

      return () => {
        clearInterval(memoryCheck);
        clearInterval(cacheCleanup);
        clearInterval(performanceCheck);
      };
    };

    const cleanup = initPerformanceOptimizations();

    // 4. Preload critical resources when idle
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        console.log('🚀 Preloading critical resources during idle time');
        // Preload any heavy components or data here
      });
    }

    // 5. Detect slow network and adjust accordingly
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const networkOptimization = () => {
          if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
            console.log('📶 Slow network detected, optimizing for low bandwidth');
            setPerformanceMode('low');
          } else if (connection.effectiveType === '3g') {
            setPerformanceMode('medium');
          } else {
            setPerformanceMode('high');
          }
        };

        networkOptimization();
        connection.addEventListener('change', networkOptimization);

        cleanup(); // Call the original cleanup
        return () => {
          connection.removeEventListener('change', networkOptimization);
        };
      }
    }

    return cleanup;
  }, [setPerformanceMode]);

  // Error boundary for performance issues
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Performance error detected:', event.error);
      
      // If we get performance-related errors, switch to low performance mode
      if (event.error?.message?.includes('memory') || 
          event.error?.message?.includes('performance') ||
          event.error?.message?.includes('timeout')) {
        setPerformanceMode('low');
        performanceOptimizer.manageCacheSize();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [setPerformanceMode]);

  // Detect device capabilities and optimize accordingly
  useEffect(() => {
    const optimizeForDevice = () => {
      // Check for low-end device indicators
      const isLowEndDevice = 
        navigator.hardwareConcurrency <= 2 || // 2 or fewer CPU cores
        (navigator as any).deviceMemory <= 2 || // 2GB or less RAM
        /Android.*Chrome\/[0-5]/.test(navigator.userAgent); // Old Android Chrome

      if (isLowEndDevice) {
        console.log('📱 Low-end device detected, using conservative performance settings');
        setPerformanceMode('low');
      }

      // Check for high-end device indicators
      const isHighEndDevice = 
        navigator.hardwareConcurrency >= 8 && // 8+ CPU cores
        (navigator as any).deviceMemory >= 8; // 8GB+ RAM

      if (isHighEndDevice) {
        console.log('🚀 High-end device detected, enabling full performance');
        setPerformanceMode('high');
      }
    };

    optimizeForDevice();
  }, [setPerformanceMode]);

  // Log performance stats in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const logStats = setInterval(() => {
        const memoryUsage = performanceOptimizer.getMemoryUsage();
        const cacheStats = dataCache.getStats();
        
        console.log('📊 Performance Stats:', {
          memory: memoryUsage ? `${memoryUsage.percentage.toFixed(1)}%` : 'unavailable',
          cache: `${cacheStats.size}/${cacheStats.maxSize} items`,
          connection: (navigator as any).connection?.effectiveType || 'unknown'
        });
      }, 30000); // Every 30 seconds in dev

      return () => clearInterval(logStats);
    }
  }, []);

  return <>{children}</>;
};

export default SmartPerformanceManager;