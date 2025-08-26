import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, MapPin, Star, Users, GraduationCap } from 'lucide-react';

interface PreschoolListPanelProps {
  className?: string;
}

const ITEMS_PER_PAGE = 6;

export const PreschoolListPanel: React.FC<PreschoolListPanelProps> = ({ className }) => {
  const {
    visiblePreschools,
    selectedPreschool,
    setSelectedPreschool,
    listContext,
    listSortOrder,
    setListSortOrder,
    mapZoom
  } = useMapStore();

  const [displayedItems, setDisplayedItems] = useState(ITEMS_PER_PAGE);
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset displayed items when visible preschools change
  useEffect(() => {
    setDisplayedItems(ITEMS_PER_PAGE);
  }, [visiblePreschools]);

  // Handle infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (displayedItems < visiblePreschools.length) {
        setDisplayedItems(prev => Math.min(prev + ITEMS_PER_PAGE, visiblePreschools.length));
      }
    }
  };

  const getContextTitle = () => {
    if (mapZoom <= 6) return 'Heatmap-vy';
    if (mapZoom <= 11) return 'Område';
    return 'I denna vy';
  };

  const getContextSubtitle = () => {
    if (mapZoom <= 6) return 'Zoom in för att se förskolor';
    if (mapZoom <= 11) return `${visiblePreschools.length} förskolor i området`;
    return `${visiblePreschools.length} synliga förskolor`;
  };

  const currentPreschools = visiblePreschools.slice(0, displayedItems);

  const handlePreschoolClick = (preschool: any) => {
    setSelectedPreschool(preschool);
  };

  if (!isExpanded) {
    return (
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        className={`fixed top-4 right-4 z-50 ${className}`}
      >
        <Button
          onClick={() => setIsExpanded(true)}
          variant="secondary"
          className="bg-card/90 backdrop-blur-sm shadow-nordic"
        >
          <MapPin className="h-4 w-4 mr-2" />
          {visiblePreschools.length}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className={`fixed top-4 right-4 bottom-4 w-80 z-40 ${className}`}
    >
      <Card className="h-full bg-card/95 backdrop-blur-sm shadow-nordic border-border">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">{getContextTitle()}</h3>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{getContextSubtitle()}</p>
          
          {mapZoom > 6 && (
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => setListSortOrder('rating')}
                variant={listSortOrder === 'rating' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
              >
                Betyg
              </Button>
              <Button
                onClick={() => setListSortOrder('quality')}
                variant={listSortOrder === 'quality' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
              >
                Kvalitet
              </Button>
              <Button
                onClick={() => setListSortOrder('name')}
                variant={listSortOrder === 'name' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
              >
                Namn
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {mapZoom <= 6 ? (
            // Heatmap view - show aggregated stats
            <div className="p-4 space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {visiblePreschools.length}
                </div>
                <div className="text-sm text-muted-foreground">förskolor totalt</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Genomsnittligt betyg:</span>
                  <span className="font-medium text-foreground">
                    {visiblePreschools.length > 0 
                      ? (visiblePreschools.reduce((sum, p) => sum + (p.google_rating || 0), 0) / visiblePreschools.filter(p => p.google_rating).length).toFixed(1)
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Genomsnittlig personaltäthet:</span>
                  <span className="font-medium text-foreground">
                    {visiblePreschools.length > 0 
                      ? (visiblePreschools.reduce((sum, p) => sum + (p.personaltäthet || 0), 0) / visiblePreschools.filter(p => p.personaltäthet).length).toFixed(1)
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // List view
            <div 
              ref={scrollContainerRef}
              className="h-full overflow-y-auto p-2 space-y-2"
              onScroll={handleScroll}
            >
              <AnimatePresence>
                {currentPreschools.map((preschool, index) => (
                  <motion.div
                    key={preschool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PreschoolListItem
                      preschool={preschool}
                      isSelected={selectedPreschool?.id === preschool.id}
                      onClick={() => handlePreschoolClick(preschool)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {displayedItems < visiblePreschools.length && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Visar {displayedItems} av {visiblePreschools.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scrolla för att se fler
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

interface PreschoolListItemProps {
  preschool: any;
  isSelected: boolean;
  onClick: () => void;
}

const PreschoolListItem: React.FC<PreschoolListItemProps> = ({ preschool, isSelected, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-sm' 
          : 'border-border hover:border-primary/50 bg-card'
      }`}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-foreground text-sm leading-tight line-clamp-2">
            {preschool.namn}
          </h4>
          {preschool.google_rating && (
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <Star className="h-3 w-3 fill-current text-yellow-500" />
              <span className="text-xs font-medium text-foreground">
                {preschool.google_rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{preschool.kommun}</span>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {preschool.antal_barn && (
            <Badge variant="secondary" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {preschool.antal_barn}
            </Badge>
          )}
          {preschool.andel_med_förskollärarexamen && (
            <Badge variant="outline" className="text-xs">
              <GraduationCap className="h-3 w-3 mr-1" />
              {Math.round(preschool.andel_med_förskollärarexamen)}%
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};