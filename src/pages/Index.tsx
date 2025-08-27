import React, { useState, Suspense, lazy, useEffect } from 'react';
import { LeafletMap } from '@/components/LeafletMap';
import { OptimizedSearchBar } from '@/components/enhanced/OptimizedSearchBar';
import { ErrorBoundary } from '@/components/enhanced/ErrorBoundary';
import { LoadingBoundary } from '@/components/enhanced/LoadingBoundary';
import { OfflineHandler } from '@/components/enhanced/OfflineHandler';
import PerformanceOptimizer from '@/components/enhanced/PerformanceOptimizer';
import { SmartPerformanceManager } from '@/components/SmartPerformanceManager';
// Remove direct imports - now lazy loaded
// import { AdminPanel } from '@/components/AdminPanel';
// import { StatisticsPopup } from '@/components/StatisticsPopup';
import LayerControl from '@/components/LayerControl';
import { EnhancedSwedenAnimation } from '@/components/EnhancedSwedenAnimation';
import { MapTransitions } from '@/components/enhanced/MapTransitions';
import { AnimatedButton } from '@/components/enhanced/InteractiveElements';
import { OptimizedStatisticsButton } from '@/components/enhanced/OptimizedStatisticsButton';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { ComparisonModal } from '@/components/ComparisonModal';
import { MobileNavigation } from '@/components/enhanced/MobileNavigation';
import { DynamicStatisticsPanel } from '@/components/enhanced/DynamicStatisticsPanel';
import { PerformanceCriticalList } from '@/components/enhanced/PerformanceCriticalList';
import { AccessibilityEnhancements } from '@/components/enhanced/AccessibilityEnhancements';
import { EnhancedHybridSearchBar } from '@/components/enhanced/EnhancedHybridSearchBar';
import { MobileSwipeNavigation } from '@/components/enhanced/MobileSwipeNavigation';
import { DistanceRoutingPanel } from '@/components/enhanced/DistanceRoutingPanel';
import { PerformanceDashboard } from '@/components/enhanced/PerformanceDashboard';
import { DynamicStatisticsModal } from '@/components/enhanced/DynamicStatisticsModal';

// Aggressive lazy loading for optimal performance
const PreschoolDetailsPanel = lazy(() => import('@/components/enhanced/PreschoolDetailsPanel').then(module => ({ default: module.PreschoolDetailsPanel })));
const AdminPanel = lazy(() => import('@/components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const StatisticsPopup = lazy(() => import('@/components/StatisticsPopup').then(m => ({ default: m.StatisticsPopup })));
const DynamicStatisticsModal = lazy(() => import('@/components/enhanced/DynamicStatisticsModal').then(m => ({ default: m.DynamicStatisticsModal })));
const ComparisonModal = lazy(() => import('@/components/ComparisonModal').then(m => ({ default: m.ComparisonModal })));
const PerformanceDashboard = lazy(() => import('@/components/enhanced/PerformanceDashboard').then(m => ({ default: m.PerformanceDashboard })));

import { MobileOptimizations } from '@/components/enhanced/MobileOptimizations';
import { usePreschools } from '@/hooks/usePreschools';
import { useMapStore } from '@/stores/mapStore';
import { useComparisonStore } from '@/stores/comparisonStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';
import { Settings, BarChart3, GitCompare, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import preschoolIcon from '@/assets/preschool-icon.jpg';

const Index = () => {
  const {
    isLoading,
    error
  } = usePreschools();
  const {
    searchBoxCollapsed,
    setSearchBoxCollapsed
  } = useMapStore();
  const {
    selectedPreschools,
    setIsOpen
  } = useComparisonStore();
  const isMobile = useIsMobile();
  const [showLanding, setShowLanding] = useState(true);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

  // 🚀 OPTIMERAD: Snabbare övergång utan extra delays
  const handleLandingComplete = () => {
    setShowLanding(false);
    // Starta kartan direkt för snabbare känsla
    setIsMapVisible(true);
  };

  // 🛡️ SÄKERHETSÅTGÄRD: Om animationen inte fungerar, visa huvudinnehållet efter 5 sekunder
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (showLanding) {
        console.warn('Loading animation timeout - showing main content as fallback');
        handleLandingComplete();
      }
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, [showLanding]);

  // Add toggle button for collapsed search box
  const showSearchToggle = searchBoxCollapsed;
  
  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Ett fel uppstod</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>;
  }

  return <OfflineHandler>
      <PerformanceOptimizer>
        <SmartPerformanceManager>
          <AccessibilityEnhancements />
          <MobileOptimizations />
        
      {/* 🇸🇪 NY FÖRBÄTTRAD SVERIGE LADDNINGSANIMATION MED EXAKT TIMING */}
      {showLanding && (
        <ErrorBoundary fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Laddar Sveriges Förskolor...</h2>
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            </div>
          </div>
        }>
          <EnhancedSwedenAnimation onComplete={handleLandingComplete} />
        </ErrorBoundary>
      )}

      <motion.div 
        className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10" 
        id="main-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: showLanding ? 0 : 1 }}
        transition={{ 
          delay: 0, // Ingen delay för snabbare känsla
          duration: 0.6, // Snabbare fade-in
          ease: "easeOut"
        }}
      >
        {/* Header - Snabbare entrance */}
        <motion.header 
          initial={{ opacity: 0, y: -15 }} 
          animate={{ opacity: showLanding ? 0 : 1, y: 0 }} 
          transition={{ 
            delay: 0, 
            duration: 0.4, // Snabbare
            ease: "easeOut"
          }}
          className="relative z-40 bg-white border-b border-border/10"
        >
          <div className="container mx-auto px-6 md:px-8 py-4 md:py-6">
            <div className="flex items-center justify-between">
              {/* Logo and Title Section */}
              <div className="flex items-center space-x-3 md:space-x-5">
                <motion.img 
                  src={preschoolIcon} 
                  alt="Sveriges Förskolor" 
                  className="w-10 h-10 md:w-14 md:h-14 rounded-2xl shadow-lg hover-lift"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                />
                <div>
                  <h1 className="text-xl md:text-4xl font-bold text-gradient font-heading leading-tight">
                    Förskolor i Sverige
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground font-medium mt-1 md:mt-2 hidden sm:block">
                    Hitta och jämför förskolor – i hela landet
                  </p>
                </div>
              </div>

              {/* Action Buttons - Desktop only */}
              <div className="hidden md:flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="items-center gap-3 glass-effect hover-glow-subtle relative border-0 font-semibold" 
                  onClick={() => setShowStatistics(true)}
                >
                  <BarChart3 className="w-5 h-5" />
                  Statistik
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="items-center gap-3 glass-effect hover-glow-subtle relative border-0 font-semibold" 
                  onClick={() => setIsOpen(true)}
                >
                  <GitCompare className="w-5 h-5" />
                  Jämför
                  {selectedPreschools.length > 0 && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 h-6 w-6 p-0 text-sm flex items-center justify-center bg-primary text-primary-foreground">
                      {selectedPreschools.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.header>

      {/* Main content */}
      <div className={`relative ${isMobile ? 'pb-16' : ''}`}>
          {/* Smart Search Bar - Snabbare */}
          {!isMobile && (
            <motion.div 
              initial={{ opacity: 0, x: -20, scale: 0.95 }} 
              animate={{ opacity: showLanding ? 0 : 1, x: 0, scale: 1 }} 
              transition={{ 
                delay: 0, 
                duration: 0.3, // Snabbare
                ease: "easeOut"
              }}
              className="absolute left-4 top-4 z-25"
            >
              <ErrorBoundary>
                <LoadingBoundary>
                  <EnhancedHybridSearchBar />
                </LoadingBoundary>
              </ErrorBoundary>
            </motion.div>
          )}

          {/* Performance Critical List Panel - Responsiv placering */}
          <motion.div 
            initial={{ opacity: 0, x: 20, scale: 0.95 }} 
            animate={{ opacity: showLanding ? 0 : 1, x: 0, scale: 1 }} 
            transition={{ 
              delay: 0.1, 
              duration: 0.3, // Snabbare
              ease: "easeOut"
            }}
            className="hidden lg:block"
          >
            <ErrorBoundary>
              <LoadingBoundary>
                <PerformanceCriticalList />
              </LoadingBoundary>
            </ErrorBoundary>
          </motion.div>

          {/* 3D Map med snabbare fade-in */}
          <motion.div 
            className={`${isMobile ? 'h-[calc(100vh-64px)]' : 'h-screen'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: showLanding ? 0 : 1 }}
            transition={{ 
              delay: 0.2, 
              duration: 0.4, // Snabbare
              ease: "easeOut"
            }}
          >
            <MapTransitions isMapVisible={isMapVisible}>
              <LeafletMap className="w-full h-full" />
              <StatisticsPopup />
              <LayerControl />
            </MapTransitions>
          </motion.div>
          
          {/* Toggle button for collapsed search box */}
          {showSearchToggle && <button onClick={() => setSearchBoxCollapsed(false)} className="absolute top-4 left-4 z-50 bg-card/95 backdrop-blur-lg shadow-nordic border-border/50 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
              🔍 Sök förskolor
            </button>}

          {/* Lazy-loaded heavy components with Suspense */}
          <Suspense fallback={<div className="loading-spinner">Loading...</div>}>
            <AdminPanel isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
          </Suspense>

          {/* Comparison Panel and Modal */}
          <ComparisonPanel />
          <Suspense fallback={null}>
            <ComparisonModal />
          </Suspense>

          {/* Dynamic Statistics Modal */}
          <Suspense fallback={null}>
            <DynamicStatisticsModal 
              isOpen={showStatistics} 
              onClose={() => setShowStatistics(false)} 
            />
          </Suspense>

          {/* Enhanced features */}
          <DynamicStatisticsPanel />
          
          {/* Performance Dashboard - only load when needed */}
          {process.env.NODE_ENV === 'development' && (
            <Suspense fallback={null}>
              <PerformanceDashboard />
            </Suspense>
          )}
          
          {/* Mobile Navigation */}
          {isMobile && <MobileNavigation />}
          
          {/* Mobile List Button */}
          {isMobile && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: showLanding ? 0 : 1, y: 0 }} 
              transition={{ delay: 0.3, duration: 0.3 }}
              className="fixed bottom-20 right-4 z-40 md:hidden"
            >
              <Button 
                variant="outline" 
                size="sm" 
                className="glass-effect hover-glow-subtle border-0 p-3 rounded-full shadow-lg"
                onClick={() => {/* Toggle mobile list */}}
              >
                <MapPin className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* Mobile Statistics Button */}
          {isMobile && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: showLanding ? 0 : 1, y: 0 }} 
              transition={{ delay: 0.3, duration: 0.3 }}
              className="fixed bottom-20 left-4 z-40 md:hidden"
            >
              <Button 
                variant="outline" 
                size="sm" 
                className="glass-effect hover-glow-subtle border-0 p-3 rounded-full shadow-lg"
                onClick={() => setShowStatistics(true)}
              >
                <BarChart3 className="w-5 h-5" />
              </Button>
            </motion.div>
          )}
          
          {/* Mobile Swipe Navigation */}
          <MobileSwipeNavigation />
          
          {/* Admin Button - Snabbare entrance */}
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.9 }} 
            animate={{ opacity: showLanding ? 0 : 1, y: 0, scale: 1 }} 
            transition={{ 
              delay: 0.4, 
              duration: 0.3, // Snabbare
              ease: "easeOut"
            }}
            className="fixed bottom-6 right-6 z-40"
          >
            <AnimatedButton 
              onClick={() => setShowAdmin(true)} 
              variant="outline" 
              size="lg" 
              className="glass-effect hover-glow-subtle border-0 p-4 rounded-2xl shadow-nordic"
            >
              <Settings className="w-6 h-6" />
            </AnimatedButton>
          </motion.div>

          {/* 🚀 OPTIMERAD: Snabbare loading overlay */}
          {isLoading && !showLanding && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-lg flex items-center justify-center z-50"
            >
              <div className="text-center">
                <motion.div 
                  className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <h2 className="text-xl font-semibold text-foreground mb-2">Laddar Sveriges förskolor...</h2>
                <p className="text-muted-foreground">Hämtar data från Supabase-databasen</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
        </SmartPerformanceManager>
      </PerformanceOptimizer>
    </OfflineHandler>;
};

export default Index;