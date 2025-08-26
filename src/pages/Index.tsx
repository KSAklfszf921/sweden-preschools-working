import React, { useState } from 'react';
import { Map3D } from '@/components/Map3D';
import { SmartSearchBar } from '@/components/SmartSearchBar';
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
import { usePreschools } from '@/hooks/usePreschools';
import { useMapStore } from '@/stores/mapStore';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
const Index = () => {
  const {
    isLoading,
    error
  } = usePreschools();
  const {
    searchBoxCollapsed,
    setSearchBoxCollapsed
  } = useMapStore();
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
      {/* Landing Animation */}
      {showLanding && <LandingAnimation onComplete={() => setShowLanding(false)} />}

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 bg-slate-50">
        {/* Header */}
        <motion.header initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: showLanding ? 0 : 1,
        y: 0
      }} transition={{
        delay: showLanding ? 0 : 0.5
      }} className="relative z-40 backdrop-blur-xl border-b border-border/30 bg-neutral-50">
          <div className="container mx-auto px-0 py-[10px] my-0 bg-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="px-[20px] my-0 text-left text-[#000a0e] font-bold text-2xl">Sveriges förskolor</h1>
                
              </div>
              <div className="flex items-center gap-3">
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
            <SmartSearchBar />
          </motion.div>

          {/* Statistics Button */}
          <motion.div initial={{
          opacity: 0,
          y: -20
        }} animate={{
          opacity: showLanding ? 0 : 1,
          y: 0
        }} transition={{
          delay: showLanding ? 0 : 1.2
        }} className="absolute left-4 top-20 z-30">
            <StatisticsButton />
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

          {/* Admin Panel Toggle - Bottom Right */}
          <motion.div initial={{
          opacity: 0,
          scale: 0
        }} animate={{
          opacity: showLanding ? 0 : 1,
          scale: showLanding ? 0 : 1
        }} transition={{
          delay: showLanding ? 0 : 2.0
        }} className="absolute bottom-6 right-6 z-40">
            <Button variant="outline" size="icon" onClick={() => setShowAdmin(true)} className="bg-card/95 backdrop-blur-lg border-border/50 shadow-nordic hover:bg-accent/80 transition-all duration-300 hover:scale-110" title="Administratörspanel">
              <Settings className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Preschool details panel */}
          <PreschoolDetails />

          {/* Admin Panel */}
          <AdminPanel isOpen={showAdmin} onClose={() => setShowAdmin(false)} />

          {/* Comparison Panel and Modal */}
          <ComparisonPanel />
          <ComparisonModal />

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