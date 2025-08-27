import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMapStore } from '@/stores/mapStore';

interface OptimizedStatisticsButtonProps {
  className?: string;
}

export const OptimizedStatisticsButton = memo<OptimizedStatisticsButtonProps>(({ className }) => {
  const { 
    filteredPreschools, 
    visiblePreschools, 
    preschools, 
    searchFilters, 
    hasActiveFilters,
    setShowStatistics,
    showStatistics
  } = useMapStore();

  // Memoized statistics calculation
  const stats = useMemo(() => {
    const total = preschools.length;
    const filtered = filteredPreschools.length;
    const visible = visiblePreschools.length;
    
    // Calculate context-aware counts
    let primaryCount = filtered;
    let secondaryCount = visible;
    let contextLabel = '';
    
    if (hasActiveFilters) {
      if (searchFilters.kommuner && searchFilters.kommuner.length > 0) {
        contextLabel = `i ${searchFilters.kommuner.join(', ')}`;
      } else if (searchFilters.nearbyMode) {
        contextLabel = 'närliggande';
      } else if (searchFilters.query) {
        contextLabel = 'sökresultat';
      } else {
        contextLabel = 'filtrerade';
      }
    } else {
      contextLabel = 'totalt';
      primaryCount = total;
      secondaryCount = visible;
    }

    return {
      total,
      filtered,
      visible,
      primaryCount,
      secondaryCount,
      contextLabel,
      hasFilters: hasActiveFilters,
      showViewportInfo: visible < filtered && visible > 0
    };
  }, [preschools.length, filteredPreschools.length, visiblePreschools.length, searchFilters, hasActiveFilters]);

  const buttonText = useMemo(() => {
    if (stats.hasFilters) {
      if (stats.showViewportInfo) {
        return `${stats.primaryCount} ${stats.contextLabel} (${stats.secondaryCount} på karta)`;
      }
      return `${stats.primaryCount} ${stats.contextLabel}`;
    }
    
    if (stats.showViewportInfo) {
      return `${stats.total} ${stats.contextLabel} (${stats.visible} på karta)`;
    }
    
    return `${stats.total} ${stats.contextLabel}`;
  }, [stats]);

  const handleClick = () => {
    setShowStatistics(!showStatistics);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Button 
        variant={showStatistics ? "default" : "outline"}
        size="lg" 
        className="items-center gap-3 glass-effect hover-glow-subtle relative border-0 font-semibold transition-all duration-200" 
        onClick={handleClick}
      >
        {/* Icon with context indicator */}
        <div className="relative">
          <BarChart3 className="w-5 h-5" />
          {stats.hasFilters && (
            <Filter className="w-2 h-2 absolute -top-1 -right-1 text-primary" />
          )}
        </div>
        
        {/* Dynamic text */}
        <span className="text-sm font-medium">
          {buttonText}
        </span>
        
        {/* Context badges */}
        <div className="flex items-center gap-1">
          {stats.showViewportInfo && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              <MapPin className="w-2.5 h-2.5 mr-1" />
              Kartvy
            </Badge>
          )}
          
          {stats.hasFilters && (
            <Badge variant="default" className="text-xs h-5 px-1.5 bg-primary/20 text-primary-foreground">
              Filtrerat
            </Badge>
          )}
        </div>
      </Button>
    </motion.div>
  );
});

OptimizedStatisticsButton.displayName = 'OptimizedStatisticsButton';