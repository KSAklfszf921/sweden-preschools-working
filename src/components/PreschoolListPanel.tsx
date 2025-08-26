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
    return 'Alla förskolor';
  };

  const getContextSubtitle = () => {
    if (mapZoom <= 6) return `${visiblePreschools.length} förskolor i området`;
    return `${visiblePreschools.length} förskolor visas`;
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
            size="sm"
            className="bg-card/95 backdrop-blur-lg shadow-nordic px-3 py-1.5 hover:scale-110 transition-all duration-200"
          >
          <MapPin className="h-3 w-3 mr-1" />
          <span className="text-xs font-medium">{visiblePreschools.length}</span>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className={`fixed top-4 right-4 ${mapZoom <= 6 ? 'h-48' : 'bottom-4'} w-64 z-40 ${className}`}
    >
      <Card className="h-full bg-card/95 backdrop-blur-lg shadow-nordic border-border/50 hover:shadow-glow transition-all duration-300">
        {/* Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-sm text-foreground">{getContextTitle()}</h3>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{getContextSubtitle()}</p>
          
          {mapZoom > 6 && (
            <div className="flex gap-1 mt-2">
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
            <div className="p-3 space-y-3">
              <div className="text-center">
                <div className="text-xl font-bold text-primary mb-1">
                  {visiblePreschools.length}
                </div>
                <div className="text-xs text-muted-foreground">förskolor totalt</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Genomsnittligt betyg:</span>
                  <span className="font-medium text-foreground">
                    {visiblePreschools.length > 0 
                      ? (visiblePreschools.reduce((sum, p) => sum + (p.google_rating || 0), 0) / visiblePreschools.filter(p => p.google_rating).length).toFixed(1)
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-xs">
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
              className="h-full overflow-y-auto p-1.5 space-y-1.5"
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
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">
                    Visar {displayedItems} av {visiblePreschools.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 opacity-75">
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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`p-2 rounded-md border cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-sm' 
          : 'border-border hover:border-primary/50 bg-card'
      }`}
      onClick={onClick}
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-foreground text-xs leading-tight line-clamp-2">
            {preschool.namn}
          </h4>
          {preschool.google_rating && (
            <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
              <Star className="h-2.5 w-2.5 fill-current text-yellow-500" />
              <span className="text-xs font-medium text-foreground">
                {preschool.google_rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
          <MapPin className="h-2.5 w-2.5" />
          <span className="truncate text-xs">{preschool.kommun}</span>
        </div>
        
        <div className="flex flex-wrap gap-0.5">
          {preschool.antal_barn && (
            <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
              <Users className="h-2.5 w-2.5 mr-0.5" />
              {preschool.antal_barn}
            </Badge>
          )}
          {preschool.andel_med_förskollärarexamen && (
            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
              <GraduationCap className="h-2.5 w-2.5 mr-0.5" />
              {Math.round(preschool.andel_med_förskollärarexamen)}%
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};