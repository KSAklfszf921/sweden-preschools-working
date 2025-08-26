import React, { useState } from 'react';
import { Map3D } from '@/components/Map3D';
import { AdvancedSearchBar } from '@/components/enhanced/AdvancedSearchBar';
import { PreschoolDetails } from '@/components/PreschoolDetails';
import { PreschoolListPanel } from '@/components/PreschoolListPanel';
import { AdminPanel } from '@/components/AdminPanel';
import { StatisticsPopup } from '@/components/StatisticsPopup';
import LayerControl from '@/components/LayerControl';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LandingAnimation } from '@/components/LandingAnimation';
import { StatisticsButton } from '@/components/StatisticsButton';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { ComparisonModal } from '@/components/ComparisonModal';
import { MobileNavigation } from '@/components/enhanced/MobileNavigation';
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
  const comparisonStore = useComparisonStore();
  const selectedPreschools = comparisonStore.selectedPreschools || [];
  const setIsOpen = comparisonStore.setIsOpen;
  const isMobile = useIsMobile();
  const [showLanding, setShowLanding] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

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
  return <>
      <AccessibilityEnhancements />
      <MobileOptimizations />
      {/* Landing Animation */}
      {showLanding && <LandingAnimation onComplete={() => setShowLanding(false)} />}

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10" id="main-content">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: showLanding ? 0 : 1, y: 0 }} 
          transition={{ delay: showLanding ? 0 : 0.5 }} 
          className="relative z-40 bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-b border-border/20 backdrop-blur-sm"
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Title Section */}
              <div className="flex items-center space-x-4">
                <img 
                  src={preschoolIcon} 
                  alt="Sveriges Förskolor"
                  className="w-12 h-12 rounded-xl shadow-lg"
                />
                <div>
                  <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Sveriges Förskolor
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    Hitta och jämför förskolor i hela Sverige med avancerad kartfunktionalitet
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <StatisticsButton />
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center gap-2 bg-background/50 hover:bg-accent/50 relative"
                  onClick={() => setIsOpen(true)}
                >
                  <GitCompare className="w-4 h-4" />
                  Jämför
                  {selectedPreschools.length > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                    >
                      {selectedPreschools.length}
                    </Badge>
                  )}
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
            <AdvancedSearchBar />
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

          {/* 3D Map with animated entry */}
          <motion.div initial={{
          opacity: 0,
          scale: 0.1
        }} animate={{
          opacity: showLanding ? 0 : 1,
          scale: showLanding ? 0.1 : 1
        }} transition={{
          delay: showLanding ? 0 : 0.5,
          duration: showLanding ? 0 : 3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }} className="h-screen">
            <Map3D className="w-full h-full" />
            <StatisticsPopup />
            <LayerControl />
          </motion.div>
          
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
          
          {/* Mobile Navigation */}
          {isMobile && <MobileNavigation />}
          
          {/* Admin Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showLanding ? 0 : 1, y: 0 }}
            transition={{ delay: showLanding ? 0 : 1.4 }}
            className="fixed bottom-4 right-4 z-40"
          >
            <Button
              onClick={() => setShowAdmin(true)}
              variant="outline"
              size="sm"
              className="bg-card/95 backdrop-blur-sm hover:bg-accent/50"
              title="Öppna adminpanel"
            >
              <Settings className="w-4 h-4" />
            </Button>
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
    </>;
};
export default Index;