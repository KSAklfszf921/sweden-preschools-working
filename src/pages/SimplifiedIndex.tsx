import React, { useState, useEffect } from 'react';
import { SimpleMapbox } from '@/components/SimpleMapbox';
import { usePreschools } from '@/hooks/usePreschools';
import { useMapStore } from '@/stores/mapStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';
import { Settings, BarChart3, GitCompare, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import preschoolIcon from '@/assets/preschool-icon.jpg';

// DRASTISKT FÖRENKLAD INDEX - ENDAST VÄSENTLIGA FUNKTIONER
const SimplifiedIndex = () => {
  const { isLoading, error } = usePreschools();
  const { preschools, searchFilters, setSearchFilters } = useMapStore();
  
  const handleSearch = (query: string) => {
    setSearchFilters({ ...searchFilters, query });
  };
  const isMobile = useIsMobile();
  
  const [showLanding, setShowLanding] = useState(true);
  const [showStatistics, setShowStatistics] = useState(false);

  // Enkel landing animation - 2 sekunder max
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLanding(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
      {/* Enkel landing animation */}
      {showLanding && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600"
          initial={{ opacity: 1 }}
          animate={{ opacity: showLanding ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center text-white">
            <motion.div
              className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <MapPin className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-2">Sveriges Förskolor</h1>
            <p className="text-xl opacity-90">Laddar...</p>
          </div>
        </motion.div>
      )}

      <motion.div 
        className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: showLanding ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Förenklad header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showLanding ? 0 : 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="relative z-40 bg-white border-b border-border/10"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={preschoolIcon} 
                  alt="Sveriges Förskolor" 
                  className="w-12 h-12 rounded-xl shadow-lg"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gradient">
                    Förskolor i Sverige
                  </h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    Hitta och jämför förskolor
                  </p>
                </div>
              </div>

              {/* Enkla knappar - endast desktop */}
              {!isMobile && (
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowStatistics(true)}
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Statistik
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.header>

        <div className={`relative ${isMobile ? 'pb-16' : ''}`}>
          {/* Enkel sökruta */}
          {!isMobile && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: showLanding ? 0 : 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="absolute left-4 top-4 z-30"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Sök förskolor, kommun..." 
                  value={searchFilters.query || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-80 bg-white/95 backdrop-blur-sm shadow-lg border-0"
                />
              </div>
            </motion.div>
          )}

          {/* SNABB GOOGLE MAPS KARTA */}
          <motion.div 
            className={`${isMobile ? 'h-[calc(100vh-64px)]' : 'h-screen'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: showLanding ? 0 : 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <SimpleMapbox className="w-full h-full" />
          </motion.div>

          {/* Mobile sök-knapp */}
          {isMobile && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showLanding ? 0 : 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              className="fixed bottom-20 left-4 z-40"
            >
              <Button 
                variant="outline" 
                size="sm"
                className="glass-effect border-0 p-3 rounded-full shadow-lg"
              >
                <Search className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* Mobile statistik-knapp */}
          {isMobile && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showLanding ? 0 : 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              className="fixed bottom-20 right-4 z-40"
            >
              <Button 
                variant="outline" 
                size="sm"
                className="glass-effect border-0 p-3 rounded-full shadow-lg"
                onClick={() => setShowStatistics(true)}
              >
                <BarChart3 className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* Enkel loading overlay */}
          {isLoading && !showLanding && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-lg flex items-center justify-center z-50"
            >
              <div className="text-center">
                <motion.div 
                  className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <h2 className="text-xl font-semibold mb-2">Laddar förskolor...</h2>
                <p className="text-muted-foreground">Hämtar data från databasen</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Enkel statistik modal */}
        {showStatistics && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowStatistics(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Statistik</h3>
              <div className="space-y-2">
                <p><strong>Totalt antal förskolor:</strong> {preschools.length.toLocaleString()}</p>
                <p><strong>Med betyg:</strong> {preschools.filter(p => p.google_rating).length}</p>
                <p><strong>Genomsnittligt betyg:</strong> {
                  Math.round(
                    preschools
                      .filter(p => p.google_rating)
                      .reduce((sum, p) => sum + (p.google_rating || 0), 0) / 
                    preschools.filter(p => p.google_rating).length * 10
                  ) / 10 || 0
                }</p>
              </div>
              <Button 
                onClick={() => setShowStatistics(false)}
                className="mt-4 w-full"
              >
                Stäng
              </Button>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default SimplifiedIndex;