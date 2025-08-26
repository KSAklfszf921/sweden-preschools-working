import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, MapPin, Star, Users, GraduationCap, Building2, Home } from 'lucide-react';
interface PreschoolListPanelProps {
  className?: string;
}
const ITEMS_PER_PAGE = 6;
const MIN_VISIBLE_ITEMS = 6;
export const PreschoolListPanel: React.FC<PreschoolListPanelProps> = ({
  className
}) => {
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
    const {
      scrollTop,
      scrollHeight,
      clientHeight
    } = e.currentTarget;
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
    return <motion.div 
      initial={{ x: '100%', scale: 0.95 }} 
      animate={{ x: 0, scale: 1 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-6 right-6 z-50 ${className}`}
    >
      <Button 
        onClick={() => setIsExpanded(true)} 
        variant="secondary" 
        size="lg" 
        className="glass-search shadow-nordic px-5 py-3 hover:scale-105 hover-glow-subtle transition-all duration-300 font-heading"
      >
        <MapPin className="h-5 w-5 mr-2 text-primary" />
        <span className="text-base font-semibold">{visiblePreschools.length}</span>
      </Button>
    </motion.div>;
  }
  return <motion.div 
    initial={{ x: '100%', scale: 0.95 }} 
    animate={{ x: 0, scale: 1 }} 
    exit={{ x: '100%', scale: 0.95 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className={`fixed top-32 right-6 w-80 z-40 ${className}`} 
    style={{
      height: Math.max(MIN_VISIBLE_ITEMS * 65 + 140, 320) + 'px'
    }}
  >
    <Card className="h-full glass-search shadow-nordic border-0 hover-glow-subtle transition-all duration-300 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border/20 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-foreground font-bold text-lg font-heading">{getContextTitle()}</h3>
              <p className="text-sm text-muted-foreground font-medium">{visiblePreschools.length}</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsExpanded(false)} 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div ref={scrollContainerRef} className="h-full overflow-y-auto p-4 space-y-2 animate-fade-in" onScroll={handleScroll}>
            <AnimatePresence>
              {currentPreschools.map((preschool, index) => <motion.div key={preschool.id} initial={{
              opacity: 0,
              y: 10
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: -10
            }} transition={{
              delay: index * 0.03
            }}>
                  <PreschoolListItem preschool={preschool} isSelected={selectedPreschool?.id === preschool.id} onClick={() => handlePreschoolClick(preschool)} />
                </motion.div>)}
            </AnimatePresence>
            
            {displayedItems < visiblePreschools.length && (
              <div className="text-center py-3 border-t border-border/20 mt-4">
                <p className="text-sm text-muted-foreground font-medium">
                  Visar {displayedItems} av {visiblePreschools.length}
                </p>
                <p className="text-xs text-muted-foreground/75 mt-1">
                  Scrolla för att se fler
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>;
};
interface PreschoolListItemProps {
  preschool: any;
  isSelected: boolean;
  onClick: () => void;
}
const PreschoolListItem: React.FC<PreschoolListItemProps> = ({
  preschool,
  isSelected,
  onClick
}) => {
  const getHuvudmanInfo = (huvudman: string) => {
    switch (huvudman) {
      case 'Kommunal':
        return {
          icon: Building2,
          label: 'Kommunal',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'Enskild':
        return {
          icon: Home,
          label: 'Fristående',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      default:
        return {
          icon: Building2,
          label: 'Okänd',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };
  const huvudmanInfo = getHuvudmanInfo(preschool.huvudman);
  const HuvudmanIcon = huvudmanInfo.icon;
  return <motion.div 
    whileHover={{ scale: 1.02, y: -2 }} 
    whileTap={{ scale: 0.98 }} 
    transition={{ duration: 0.2 }}
    className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
      isSelected 
        ? 'border-primary bg-primary/10 shadow-glow' 
        : 'border-border/30 hover:border-primary/40 bg-card/50 hover:bg-card hover:shadow-nordic'
    }`} 
    onClick={onClick}
  >
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-1 font-heading">
            {preschool.namn}
          </h4>
        </div>
        {preschool.google_rating && (
          <div className="flex items-center gap-1 flex-shrink-0 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Star className="h-3 w-3 fill-current text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300">
              {preschool.google_rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate font-medium">{preschool.kommun}</span>
        </div>
        
        {preschool.huvudman && (
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-1 h-6 flex items-center gap-1 font-medium rounded-lg ${huvudmanInfo.color} ${huvudmanInfo.bgColor} ${huvudmanInfo.borderColor} flex-shrink-0`}
          >
            <HuvudmanIcon className="h-3 w-3" />
            <span>{huvudmanInfo.label}</span>
          </Badge>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {preschool.antal_barn && (
          <Badge variant="secondary" className="text-xs px-2 py-1 h-6 bg-secondary/60 rounded-lg">
            <Users className="h-3 w-3 mr-1" />
            <span className="font-medium">{preschool.antal_barn}</span>
          </Badge>
        )}
        {preschool.andel_med_förskollärarexamen && (
          <Badge variant="outline" className="text-xs px-2 py-1 h-6 border-muted-foreground/30 rounded-lg">
            <GraduationCap className="h-3 w-3 mr-1" />
            <span className="font-medium">{Math.round(preschool.andel_med_förskollärarexamen)}%</span>
          </Badge>
        )}
      </div>
    </div>
  </motion.div>;
};