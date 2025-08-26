import React, { useState } from 'react';
import { Map3D } from '@/components/Map3D';
import { SearchFilters } from '@/components/SearchFilters';
import { PreschoolDetails } from '@/components/PreschoolDetails';
import { PreschoolListPanel } from '@/components/PreschoolListPanel';
import { AdminPanel } from '@/components/AdminPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LandingAnimation } from '@/components/LandingAnimation';
import { usePreschools } from '@/hooks/usePreschools';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { isLoading, error } = usePreschools();
  const [showLanding, setShowLanding] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Ett fel uppstod</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Landing Animation */}
      {showLanding && (
        <LandingAnimation onComplete={() => setShowLanding(false)} />
      )}

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showLanding ? 0 : 1, y: 0 }}
          transition={{ delay: showLanding ? 0 : 0.5 }}
          className="relative z-40 bg-card/95 backdrop-blur-lg border-b border-border/50 shadow-nordic"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-nature-lake to-nature-forest bg-clip-text text-transparent">
                  Sveriges Förskolor
                </h1>
                <p className="text-sm text-muted-foreground">Hitta och jämför förskolor i hela Sverige</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live data från 8,739 förskolor
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </motion.header>

      {/* Main content */}
      <div className="relative">
          {/* Search filters - overlay on map */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: showLanding ? 0 : 1, x: 0 }}
            transition={{ delay: showLanding ? 0 : 1.0 }}
            className="absolute left-4 top-4 z-30 w-80"
          >
            <SearchFilters />
          </motion.div>

          {/* Preschool List Panel - right side */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: showLanding ? 0 : 1, x: 0 }}
            transition={{ delay: showLanding ? 0 : 1.5 }}
          >
            <PreschoolListPanel />
          </motion.div>

          {/* 3D Map with animated entry */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.1 }}
            animate={{ 
              opacity: showLanding ? 0 : 1, 
              scale: showLanding ? 0.1 : 1 
            }}
            transition={{ 
              delay: showLanding ? 0 : 0.5, 
              duration: showLanding ? 0 : 3,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="h-screen"
          >
            <Map3D className="w-full h-full" />
          </motion.div>

          {/* Admin Panel Toggle - Bottom Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: showLanding ? 0 : 1, scale: showLanding ? 0 : 1 }}
            transition={{ delay: showLanding ? 0 : 2.0 }}
            className="absolute bottom-6 right-6 z-40"
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAdmin(true)}
              className="bg-card/95 backdrop-blur-lg border-border/50 shadow-nordic hover:bg-accent/80 transition-all duration-300 hover:scale-110"
              title="Administratörspanel"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Preschool details panel */}
          <PreschoolDetails />

          {/* Admin Panel */}
          <AdminPanel isOpen={showAdmin} onClose={() => setShowAdmin(false)} />

          {/* Loading overlay */}
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
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <h2 className="text-xl font-semibold text-foreground mb-2">Laddar Sveriges förskolor...</h2>
                <p className="text-muted-foreground">Hämtar data från Supabase-databasen</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default Index;
