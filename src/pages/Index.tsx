import React, { useState } from 'react';
import { Map3D } from '@/components/Map3D';
import { OptimizedSearchBar } from '@/components/enhanced/OptimizedSearchBar';
import { ErrorBoundary } from '@/components/enhanced/ErrorBoundary';
import { LoadingBoundary } from '@/components/enhanced/LoadingBoundary';
import { OfflineHandler } from '@/components/enhanced/OfflineHandler';
import PerformanceOptimizer from '@/components/enhanced/PerformanceOptimizer';
import { PreschoolDetails } from '@/components/PreschoolDetails';
import { PreschoolListPanel } from '@/components/PreschoolListPanel';
import { AdminPanel } from '@/components/AdminPanel';
import { StatisticsPopup } from '@/components/StatisticsPopup';
import LayerControl from '@/components/LayerControl';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LandingAnimation } from '@/components/LandingAnimation';
import { MapTransitions } from '@/components/enhanced/MapTransitions';
import { EnhancedPanel } from '@/components/enhanced/EnhancedLayout';
import { AnimatedButton } from '@/components/enhanced/InteractiveElements';
import { StatisticsButton } from '@/components/StatisticsButton';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { ComparisonModal } from '@/components/ComparisonModal';
import { MobileNavigation } from '@/components/enhanced/MobileNavigation';
import EnhancedStatisticsPanel from '@/components/enhanced/EnhancedStatisticsPanel';
import { AccessibilityEnhancements } from '@/components/enhanced/AccessibilityEnhancements';
import { SmartNotificationSystem } from '@/components/enhanced/SmartNotificationSystem';
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
    setShowLanding(false);
    // Start map transition after landing animation
    setTimeout(() => {
      setIsMapVisible(true);
    }, 200);
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

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10" id="main-content">
        {/* Header */}
        <motion.header initial={{
          opacity: 0,
          y: -20
        }} animate={{
          opacity: showLanding ? 0 : 1,
          y: 0
        }} transition={{
          delay: showLanding ? 0 : 0.5
        }} className="relative z-40 bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-b border-border/20 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Title Section */}
              <div className="flex items-center space-x-4">
                <img src={preschoolIcon} alt="Sveriges Förskolor" className="w-12 h-12 rounded-xl shadow-lg" />
                <div>
                  <h1 className="text-3xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-[#000a0e]/[0.71] font-semibold text-justify mx-0 py-[5px] my-[5px]">Förskolor i Sverige</h1>
                  <p className="text-sm text-muted-foreground font-medium mt-1">Hitta och jämför förskolor – i hela landet</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <StatisticsButton />
                <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 bg-background/50 hover:bg-accent/50 relative" onClick={() => setIsOpen(true)}>
                  <GitCompare className="w-4 h-4" />
                  Jämför
                  {selectedPreschools.length > 0 && <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                      {selectedPreschools.length}
                    </Badge>}
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </motion.header>

      {/* Main content */}
      <div className="relative">
          {/* Smart Search Bar */}
          <motion.div initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: showLanding ? 0 : 1,
            x: 0
          }} transition={{
            delay: showLanding ? 0 : 1.0
          }} className="absolute left-4 top-4 z-30">
        <ErrorBoundary>
          <LoadingBoundary>
            <OptimizedSearchBar />
          </LoadingBoundary>
        </ErrorBoundary>
          </motion.div>


          {/* Preschool List Panel - right side */}
          <motion.div initial={{
            opacity: 0,
            x: 20
          }} animate={{
            opacity: showLanding ? 0 : 1,
            x: 0
          }} transition={{
            delay: showLanding ? 0 : 1.5
          }}>
            <PreschoolListPanel />
          </motion.div>

          {/* 3D Map with enhanced transitions */}
          <div className="h-screen">
            <MapTransitions isMapVisible={isMapVisible}>
              <Map3D className="w-full h-full" />
              <StatisticsPopup />
              <LayerControl />
            </MapTransitions>
          </div>
          
          {/* Toggle button for collapsed search box */}
          {showSearchToggle && <button onClick={() => setSearchBoxCollapsed(false)} className="absolute top-4 left-4 z-50 bg-card/95 backdrop-blur-lg shadow-nordic border-border/50 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
              🔍 Sök förskolor
            </button>}


          {/* Preschool details panel */}
          <PreschoolDetails />

          {/* Admin Panel */}
          <AdminPanel isOpen={showAdmin} onClose={() => setShowAdmin(false)} />

          {/* Comparison Panel and Modal */}
          <ComparisonPanel />
          <ComparisonModal />

          {/* Enhanced features */}
          <SmartNotificationSystem />
          <EnhancedStatisticsPanel />
          
          {/* Mobile Navigation */}
          {isMobile && <MobileNavigation />}
          
          {/* Admin Button */}
          <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: showLanding ? 0 : 1,
            y: 0
          }} transition={{
            delay: showLanding ? 0 : 1.4
          }} className="fixed bottom-4 right-4 z-40">
            <AnimatedButton 
              onClick={() => setShowAdmin(true)} 
              variant="outline" 
              size="sm" 
              className="bg-card/95 backdrop-blur-sm hover:bg-accent/50 hover-glow-subtle"
            >
              <Settings className="w-4 h-4" />
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
      </div>
      </PerformanceOptimizer>
    </OfflineHandler>;
};
export default Index;