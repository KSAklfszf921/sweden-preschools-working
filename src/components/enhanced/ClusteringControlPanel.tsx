/**
 * 🎛️ CLUSTERING CONTROL PANEL
 * 
 * Administrativ panel för att kontrollera clustering-inställningar
 * och monitorera prestanda i realtid.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  TrendingUp, 
  Database, 
  Clock, 
  MapPin, 
  Zap,
  BarChart3,
  Layers,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import { getClusteringCache } from '@/utils/clusteringCacheManager';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ClusteringControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  clusteringStats?: {
    isLoading: boolean;
    error: string | null;
    clustersCount: number;
    cacheHitRate: number;
    lastUpdate: string;
  };
  clusteringMethods?: {
    refreshCache: () => void;
    clearCache: () => void;
    forceReload: () => void;
  };
}

export const ClusteringControlPanel: React.FC<ClusteringControlPanelProps> = ({
  isOpen,
  onClose,
  clusteringStats,
  clusteringMethods
}) => {
  const {
    clusteringEnabled,
    clusteringPerformanceMode,
    layerVisibility,
    filteredPreschools,
    setClusteringEnabled,
    setClusteringPerformanceMode,
    setLayerVisibility
  } = useMapStore();

  const [cacheStats, setCacheStats] = useState<{
    totalCacheFiles: number;
    cacheSize: number;
    lastUpdate: string;
    hitRate: number;
  } | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hämta cache statistik
  useEffect(() => {
    const fetchCacheStats = async () => {
      const cacheManager = getClusteringCache();
      if (cacheManager) {
        try {
          const stats = await cacheManager.getCacheStats();
          setCacheStats(stats);
        } catch (error) {
          console.error('❌ Error fetching cache stats:', error);
        }
      }
    };

    if (isOpen) {
      fetchCacheStats();
      const interval = setInterval(fetchCacheStats, 30000); // Update every 30s
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleRefreshCache = async () => {
    setIsRefreshing(true);
    try {
      await clusteringMethods?.refreshCache();
      // Refresh cache stats
      const cacheManager = getClusteringCache();
      if (cacheManager) {
        const stats = await cacheManager.getCacheStats();
        setCacheStats(stats);
      }
    } catch (error) {
      console.error('❌ Error refreshing cache:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Clustering Control</h2>
                <p className="text-sm text-gray-600">Hantera kartans clustering-inställningar</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Configuration Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    Konfiguration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Clustering Enable/Disable */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">Clustering</label>
                      <p className="text-sm text-gray-600">Aktivera/inaktivera kartklustering</p>
                    </div>
                    <Button
                      variant={clusteringEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setClusteringEnabled(!clusteringEnabled)}
                    >
                      {clusteringEnabled ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aktiverad
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Inaktiverad
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Performance Mode */}
                  <div>
                    <label className="font-medium text-gray-900 block mb-2">Prestanda Läge</label>
                    <div className="flex gap-2">
                      <Button
                        variant={clusteringPerformanceMode === 'optimized' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setClusteringPerformanceMode('optimized')}
                        className="flex-1"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Optimerad
                      </Button>
                      <Button
                        variant={clusteringPerformanceMode === 'legacy' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setClusteringPerformanceMode('legacy')}
                        className="flex-1"
                      >
                        <Database className="w-4 h-4 mr-2" />
                        Legacy
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Optimerad använder Supabase cache för bättre prestanda
                    </p>
                  </div>

                  {/* Layer Visibility */}
                  <div>
                    <label className="font-medium text-gray-900 block mb-2">Layer Synlighet</label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Optimerade Kluster</span>
                        <Button
                          variant={layerVisibility.optimizedClusters ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLayerVisibility('optimizedClusters', !layerVisibility.optimizedClusters)}
                        >
                          {layerVisibility.optimizedClusters ? 'Visa' : 'Dölj'}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Legacy Kluster</span>
                        <Button
                          variant={layerVisibility.clusters ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLayerVisibility('clusters', !layerVisibility.clusters)}
                        >
                          {layerVisibility.clusters ? 'Visa' : 'Dölj'}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Individuella Markers</span>
                        <Button
                          variant={layerVisibility.markers ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLayerVisibility('markers', !layerVisibility.markers)}
                        >
                          {layerVisibility.markers ? 'Visa' : 'Dölj'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    Realtids Statistik
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Current Stats */}
                  {clusteringStats && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {clusteringStats.clustersCount}
                        </div>
                        <div className="text-xs text-blue-700">Aktiva Kluster</div>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Database className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-900">
                          {(clusteringStats.cacheHitRate * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-green-700">Cache Hit Rate</div>
                      </div>
                    </div>
                  )}

                  {/* Data Summary */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Totala Förskolor</span>
                      <Badge variant="secondary">{filteredPreschools.length}</Badge>
                    </div>
                    {clusteringStats && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Senast Uppdaterad</span>
                        <span className="text-xs text-gray-600">
                          {new Date(clusteringStats.lastUpdate).toLocaleTimeString('sv-SE')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cache Statistics */}
                  {cacheStats && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h4 className="font-medium text-blue-900 mb-2">Supabase Cache</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Cache Filer:</span>
                          <span className="font-medium">{cacheStats.totalCacheFiles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Storlek:</span>
                          <span className="font-medium">{formatBytes(cacheStats.cacheSize)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hit Rate:</span>
                          <span className="font-medium">{(cacheStats.hitRate * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {clusteringStats?.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-900">Clustering Error</span>
                      </div>
                      <p className="text-sm text-red-700">{clusteringStats.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3 flex-wrap">
              <Button
                onClick={handleRefreshCache}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Uppdaterar...' : 'Uppdatera Cache'}
              </Button>
              
              {clusteringMethods?.clearCache && (
                <Button
                  variant="outline"
                  onClick={clusteringMethods.clearCache}
                  className="flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  Rensa Cache
                </Button>
              )}
              
              {clusteringMethods?.forceReload && (
                <Button
                  variant="outline"
                  onClick={clusteringMethods.forceReload}
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Ladda Om Allt
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 ml-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Ladda Om Sida
              </Button>
            </div>

            {/* Performance Tips */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Prestanda Tips
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Använd "Optimerad" läge för bästa prestanda med många förskolor</li>
                <li>• Cache uppdateras automatiskt när data ändras</li>
                <li>• Dölj individuella markers vid låg zoom för bättre prestanda</li>
                <li>• Legacy läge används som fallback om optimerad clustering misslyckas</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClusteringControlPanel;