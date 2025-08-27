import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Star, Users, Navigation } from 'lucide-react';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const MobileSwipeNavigation: React.FC = () => {
  const isMobile = useIsMobile();
  const { filteredPreschools, selectedPreschool, setSelectedPreschool } = useMapStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  
  // Only show mobile swipe navigation on mobile devices
  if (!isMobile) return null;

  // Auto-show when preschools are available
  useEffect(() => {
    if (filteredPreschools.length > 0 && !isVisible) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [filteredPreschools.length, isVisible]);

  // Hide if no preschools
  if (filteredPreschools.length === 0) return null;

  // Current preschool in view
  const currentPreschool = filteredPreschools[currentIndex];

  // Transform for smooth card transitions
  const cardScale = useTransform(x, [-300, 0, 300], [0.8, 1, 0.8]);
  const cardOpacity = useTransform(x, [-300, 0, 300], [0.3, 1, 0.3]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    
    if (info.offset.x > swipeThreshold && currentIndex > 0) {
      // Swiped right - previous preschool
      setCurrentIndex(currentIndex - 1);
      setSelectedPreschool(filteredPreschools[currentIndex - 1]);
    } else if (info.offset.x < -swipeThreshold && currentIndex < filteredPreschools.length - 1) {
      // Swiped left - next preschool  
      setCurrentIndex(currentIndex + 1);
      setSelectedPreschool(filteredPreschools[currentIndex + 1]);
    }
    
    // Reset position
    x.set(0);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedPreschool(filteredPreschools[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (currentIndex < filteredPreschools.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedPreschool(filteredPreschools[currentIndex + 1]);
    }
  };

  // Update current index when selected preschool changes from other sources
  useEffect(() => {
    if (selectedPreschool) {
      const index = filteredPreschools.findIndex(p => p.id === selectedPreschool.id);
      if (index >= 0 && index !== currentIndex) {
        setCurrentIndex(index);
      }
    }
  }, [selectedPreschool, filteredPreschools, currentIndex]);

  if (!currentPreschool || !isVisible) return null;

  return (
    <>
      {/* Toggle button */}
      <motion.button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-20 right-4 z-50 md:hidden bg-primary/90 text-primary-foreground p-3 rounded-full shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
      >
        <Navigation className="w-5 h-5" />
      </motion.button>

      {/* Swipe Navigation Panel */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-40 md:hidden"
      >
        <div ref={constraintsRef} className="relative">
          <motion.div
            drag="x"
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{ x, scale: cardScale, opacity: cardOpacity }}
            className="cursor-grab active:cursor-grabbing"
          >
            <Card className="bg-white/95 backdrop-blur-sm border border-border/50 shadow-lg p-4">
              {/* Header with navigation indicators */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-full bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </motion.button>
                  
                  <span className="text-xs text-muted-foreground font-medium">
                    {currentIndex + 1} av {filteredPreschools.length}
                  </span>
                  
                  <motion.button
                    onClick={goToNext}
                    disabled={currentIndex === filteredPreschools.length - 1}
                    className="p-2 rounded-full bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>

                <button 
                  onClick={() => setIsVisible(false)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  ✕
                </button>
              </div>

              {/* Progress indicators */}
              <div className="flex justify-center space-x-1 mb-4">
                {Array.from({ length: Math.min(5, filteredPreschools.length) }, (_, idx) => {
                  let realIndex;
                  if (filteredPreschools.length <= 5) {
                    realIndex = idx;
                  } else {
                    realIndex = Math.max(0, Math.min(filteredPreschools.length - 5, currentIndex - 2)) + idx;
                  }
                  
                  return (
                    <div
                      key={realIndex}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                        realIndex === currentIndex 
                          ? 'bg-primary w-4' 
                          : 'bg-border'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Preschool info */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-2">
                    {currentPreschool.namn}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {currentPreschool.kommun}
                    </span>
                    {currentPreschool.huvudman && (
                      <Badge variant="outline" className="text-xs">
                        {currentPreschool.huvudman === 'Kommunal' ? 'Kommunal' : 'Fristående'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Rating */}
                    {currentPreschool.google_rating && currentPreschool.google_rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">
                          {currentPreschool.google_rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Children count */}
                    {currentPreschool.antal_barn && currentPreschool.antal_barn > 0 && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">
                          {currentPreschool.antal_barn}
                        </span>
                      </div>
                    )}

                    {/* Teacher percentage */}
                    {currentPreschool.personal_andel_forskollararexamen && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(currentPreschool.personal_andel_forskollararexamen * 100)}% lärare
                      </Badge>
                    )}
                  </div>

                  {/* Swipe hint */}
                  <div className="text-xs text-muted-foreground">
                    👆 Swipa
                  </div>
                </div>
              </div>

              {/* Swipe visual feedback */}
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-lg"
                style={{
                  background: useTransform(
                    x,
                    [-300, -100, 0, 100, 300],
                    [
                      'linear-gradient(90deg, rgba(34,197,94,0.1) 0%, transparent 100%)',
                      'linear-gradient(90deg, rgba(34,197,94,0.05) 0%, transparent 100%)', 
                      'transparent',
                      'linear-gradient(270deg, rgba(59,130,246,0.05) 0%, transparent 100%)',
                      'linear-gradient(270deg, rgba(59,130,246,0.1) 0%, transparent 100%)'
                    ]
                  )
                }}
              />
            </Card>
          </motion.div>
        </div>

        {/* Instructions on first use */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 4, duration: 2 }}
          className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-2 rounded-full text-xs whitespace-nowrap flex items-center space-x-2"
        >
          <Navigation className="w-3 h-3" />
          <span>Swipa för att bläddra mellan förskolor</span>
        </motion.div>
      </motion.div>
    </>
  );
};