import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Eye, Clock, TrendingUp, Database, MapPin, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMapStore } from '@/stores/mapStore';

interface PerformanceMetrics {
  renderTime: number;
  frameRate: number;
  memoryUsage: number;
  visibleElements: number;
  loadTime: number;
  cacheHitRate: number;
}

export const PerformanceDashboard: React.FC = () => {
  const { preschools, visiblePreschools, filteredPreschools } = useMapStore();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    frameRate: 0,
    memoryUsage: 0,
    visibleElements: 0,
    loadTime: 0,
    cacheHitRate: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      // Mock performance metrics (in real app, these would come from actual measurements)
      const now = performance.now();
      
      // Estimate render performance
      const renderStart = performance.now();
      // Simulate work
      const temp = visiblePreschools.length * 0.1;
      const renderTime = performance.now() - renderStart;

      // Memory usage estimation (rough approximation)
      const memoryEstimate = (preschools.length * 0.5 + visiblePreschools.length * 0.8) / 1024;

      setMetrics({
        renderTime: renderTime,
        frameRate: Math.max(30, 60 - visiblePreschools.length * 0.01),
        memoryUsage: memoryEstimate,
        visibleElements: visiblePreschools.length,
        loadTime: now,
        cacheHitRate: Math.min(95, 70 + (visiblePreschools.length / preschools.length) * 25)
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, [preschools.length, visiblePreschools.length, filteredPreschools.length]);

  // Performance grade calculation
  const getPerformanceGrade = (): { grade: string; color: string; description: string } => {
    let score = 100;
    
    if (metrics.renderTime > 16) score -= 20; // 60fps = 16.67ms per frame
    if (metrics.frameRate < 30) score -= 30;
    if (metrics.memoryUsage > 50) score -= 15;
    if (metrics.visibleElements > 1000) score -= 10;
    if (metrics.cacheHitRate < 80) score -= 15;

    if (score >= 90) return { grade: 'A+', color: 'text-green-600 bg-green-100', description: 'Utmärkt prestanda' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600 bg-green-100', description: 'Mycket bra prestanda' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600 bg-blue-100', description: 'Bra prestanda' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600 bg-yellow-100', description: 'Godkänd prestanda' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-600 bg-orange-100', description: 'Sämre prestanda' };
    return { grade: 'F', color: 'text-red-600 bg-red-100', description: 'Dålig prestanda' };
  };

  const performanceGrade = getPerformanceGrade();

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <motion.button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-black/80 text-white p-2 rounded-lg hover:bg-black/90 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Activity className="w-4 h-4" />
      </motion.button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="absolute top-12 right-0 w-80"
          >
            <Card className="p-4 bg-white/95 backdrop-blur-sm border border-border/50 shadow-xl">
              <div className="space-y-4">
                {/* Header with grade */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Prestanda</h3>
                  </div>
                  <Badge className={performanceGrade.color}>
                    {performanceGrade.grade}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  {performanceGrade.description}
                </p>

                {/* Core metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs font-medium">Render</span>
                    </div>
                    <div className="text-sm font-bold">
                      {metrics.renderTime.toFixed(1)}ms
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metrics.frameRate.toFixed(0)} FPS
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Database className="w-3 h-3 text-blue-500" />
                      <span className="text-xs font-medium">Minne</span>
                    </div>
                    <div className="text-sm font-bold">
                      {metrics.memoryUsage.toFixed(1)}MB
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ~{Math.round(metrics.memoryUsage * 1.2)}MB max
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Eye className="w-3 h-3 text-green-500" />
                      <span className="text-xs font-medium">Synliga</span>
                    </div>
                    <div className="text-sm font-bold">
                      {metrics.visibleElements.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      av {preschools.length.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <TrendingUp className="w-3 h-3 text-purple-500" />
                      <span className="text-xs font-medium">Cache</span>
                    </div>
                    <div className="text-sm font-bold">
                      {metrics.cacheHitRate.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Träffar
                    </div>
                  </div>
                </div>

                {/* Performance indicators */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Optimeringar</h4>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span>Viewport Culling</span>
                    <Badge variant={metrics.visibleElements < preschools.length ? "default" : "secondary"}>
                      {metrics.visibleElements < preschools.length ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span>LOD System</span>
                    <Badge variant="default">
                      Aktiv
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span>Clustering</span>
                    <Badge variant={metrics.visibleElements > 100 ? "default" : "secondary"}>
                      {metrics.visibleElements > 100 ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span>Progressive Loading</span>
                    <Badge variant="default">
                      Aktiv
                    </Badge>
                  </div>
                </div>

                {/* Performance tips */}
                {metrics.frameRate < 30 && (
                  <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs">
                    <div className="flex items-center space-x-1 text-yellow-700">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">Prestandavarning</span>
                    </div>
                    <p className="mt-1 text-yellow-600">
                      Zooma ut eller aktivera clustering för bättre prestanda
                    </p>
                  </div>
                )}

                {/* Data stats */}
                <div className="border-t pt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Totalt förskolor:</span>
                    <span>{preschools.length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filtrerade:</span>
                    <span>{filteredPreschools.length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>I viewport:</span>
                    <span>{visiblePreschools.length.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};