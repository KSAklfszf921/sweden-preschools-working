import React, { useState, Suspense, lazy } from 'react';
import { Map3D } from '@/components/Map3D';
import { OptimizedSearchBar } from '@/components/enhanced/OptimizedSearchBar';
import { ErrorBoundary } from '@/components/enhanced/ErrorBoundary';
import { LoadingBoundary } from '@/components/enhanced/LoadingBoundary';
import { OfflineHandler } from '@/components/enhanced/OfflineHandler';
import PerformanceOptimizer from '@/components/enhanced/PerformanceOptimizer';
import { AdminPanel } from '@/components/AdminPanel';
import { StatisticsPopup } from '@/components/StatisticsPopup';
import LayerControl from '@/components/LayerControl';
import { LandingAnimation } from '@/components/LandingAnimation';
import { MapTransitions } from '@/components/enhanced/MapTransitions';
import { AnimatedButton } from '@/components/enhanced/InteractiveElements';
import { OptimizedStatisticsButton } from '@/components/enhanced/OptimizedStatisticsButton';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { ComparisonModal } from '@/components/ComparisonModal';
import { MobileNavigation } from '@/components/enhanced/MobileNavigation';
import { DynamicStatisticsPanel } from '@/components/enhanced/DynamicStatisticsPanel';
import { PerformanceCriticalList } from '@/components/enhanced/PerformanceCriticalList';
import { AccessibilityEnhancements } from '@/components/enhanced/AccessibilityEnhancements';
import { SmartSearchAutocomplete } from '@/components/enhanced/SmartSearchAutocomplete';
import { MobileSwipeNavigation } from '@/components/enhanced/MobileSwipeNavigation';
import { DistanceRoutingPanel } from '@/components/enhanced/DistanceRoutingPanel';
import { PerformanceDashboard } from '@/components/enhanced/PerformanceDashboard';

// Lazy load heavy components for better performance
const PreschoolDetailsPanel = lazy(() => import('@/components/enhanced/PreschoolDetailsPanel').then(module => ({ default: module.PreschoolDetailsPanel })));

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

  const handleLandingComplete = () => {
    // Smooth transition from loading to main content
    setTimeout(() => {
      setShowLanding(false);
      // Start map transition immediately after landing completes
      setTimeout(() => {
        setIsMapVisible(true);
      }, 100);
    }, 50); // Small delay for smooth transition
  };

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
        <AccessibilityEnhancements />
        <MobileOptimizations />
      {/* Landing Animation */}
      {showLanding && <LandingAnimation onComplete={handleLandingComplete} />}

      <motion.div 
        className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10" 
        id="main-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: showLanding ? 0 : 1 }}
        transition={{ 
          delay: showLanding ? 0 : 0.05, 
          duration: 0.8,
          ease: "easeOut"
        }}
      >
        {/* Header - Smooth entrance over 1 second timeline */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: showLanding ? 0 : 1, y: 0 }} 
          transition={{ 
            delay: showLanding ? 0 : 0.1, 
            duration: 0.5,
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
                <OptimizedStatisticsButton />
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
          {/* Smart Search Bar - Staggered over 1 second */}
          {!isMobile && (
            <motion.div 
              initial={{ opacity: 0, x: -30, scale: 0.95 }} 
              animate={{ opacity: showLanding ? 0 : 1, x: 0, scale: 1 }} 
              transition={{ 
                delay: showLanding ? 0 : 0.2, 
                duration: 0.4,
                ease: "easeOut"
              }}
              className="absolute left-6 top-6 z-30"
            >
              <ErrorBoundary>
                <LoadingBoundary>
                  <SmartSearchAutocomplete />
                </LoadingBoundary>
              </ErrorBoundary>
            </motion.div>
          )}


          {/* Performance Critical List Panel - Staggered over 1 second */}
          <motion.div 
            initial={{ opacity: 0, x: 30, scale: 0.95 }} 
            animate={{ opacity: showLanding ? 0 : 1, x: 0, scale: 1 }} 
            transition={{ 
              delay: showLanding ? 0 : 0.3, 
              duration: 0.4,
              ease: "easeOut"
            }}
          >
            <ErrorBoundary>
              <LoadingBoundary>
                <PerformanceCriticalList />
              </LoadingBoundary>
            </ErrorBoundary>
          </motion.div>

          {/* 3D Map with smooth fade-in */}
          <motion.div 
            className={`${isMobile ? 'h-[calc(100vh-64px)]' : 'h-screen'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: showLanding ? 0 : 1 }}
            transition={{ 
              delay: showLanding ? 0 : 0.4, 
              duration: 0.6,
              ease: "easeOut"
            }}
          >
            <MapTransitions isMapVisible={isMapVisible}>
              <Map3D className="w-full h-full" />
              <StatisticsPopup />
              <LayerControl />
            </MapTransitions>
          </motion.div>
          
          {/* Toggle button for collapsed search box */}
          {showSearchToggle && <button onClick={() => setSearchBoxCollapsed(false)} className="absolute top-4 left-4 z-50 bg-card/95 backdrop-blur-lg shadow-nordic border-border/50 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
              🔍 Sök förskolor
            </button>}


          {/* Admin Panel */}
          <AdminPanel isOpen={showAdmin} onClose={() => setShowAdmin(false)} />

          {/* Comparison Panel and Modal */}
          <ComparisonPanel />
          <ComparisonModal />

          {/* Enhanced features */}
          <DynamicStatisticsPanel />
          
          {/* Performance Dashboard */}
          <PerformanceDashboard />
          
          {/* Mobile Navigation */}
          {isMobile && <MobileNavigation />}
          
          {/* Mobile Swipe Navigation */}
          <MobileSwipeNavigation />
          
          {/* Admin Button - Final element in 1-second sequence */}
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: showLanding ? 0 : 1, y: 0, scale: 1 }} 
            transition={{ 
              delay: showLanding ? 0 : 0.7, 
              duration: 0.3,
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

          {/* Loading overlay */}
          {isLoading && !showLanding && <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} className="absolute inset-0 bg-background/80 backdrop-blur-lg flex items-center justify-center z-50">
              <div className="text-center">
                <motion.div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" animate={{
                rotate: 360
              }} transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }} />
                <h2 className="text-xl font-semibold text-foreground mb-2">Laddar Sveriges förskolor...</h2>
                <p className="text-muted-foreground">Hämtar data från Supabase-databasen</p>
              </div>
            </motion.div>}
        </div>
      </motion.div>
      </PerformanceOptimizer>
    </OfflineHandler>;
};
export default Index;