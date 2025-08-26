import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronUp, ChevronDown, MapPin, Star, Users, GraduationCap, Building2, Home } from 'lucide-react';
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
  const isMobile = useIsMobile();
  const [displayedItems, setDisplayedItems] = useState(ITEMS_PER_PAGE);
  const [isExpanded, setIsExpanded] = useState(!isMobile);
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
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className={`fixed ${isMobile ? 'bottom-20 right-4' : 'top-4 right-4'} z-50 ${className}`}
    >
      <Button 
        onClick={() => setIsExpanded(true)} 
        variant="secondary" 
        size={isMobile ? "default" : "sm"} 
        className="bg-card/95 backdrop-blur-lg shadow-nordic px-3 py-1.5 hover:scale-110 transition-all duration-200"
      >
        <MapPin className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'} mr-1`} />
        <span className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium`}>{visiblePreschools.length}</span>
      </Button>
    </motion.div>;
  }
  // Mobile bottom sheet design
  if (isMobile) {
    return (
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        className={`fixed inset-x-0 bottom-0 z-40 ${className}`}
        style={{ height: 'min(40vh, 400px)' }}
      >
        <div className="h-full bg-card/95 backdrop-blur-lg shadow-nordic border-t border-border/50 rounded-t-2xl flex flex-col">
          {/* Drag handle */}
          <div className="flex justify-center py-2">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
          
          {/* Header */}
          <div className="px-4 pb-2 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-foreground font-semibold text-lg">{getContextTitle()}</h3>
                <p className="text-xs text-muted-foreground">{getContextSubtitle()}</p>
              </div>
              <Button 
                onClick={() => setIsExpanded(false)} 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden min-h-0 px-4">
            <div 
              ref={scrollContainerRef} 
              className="h-full overflow-y-auto py-2 space-y-2 animate-fade-in" 
              onScroll={handleScroll}
            >
              <AnimatePresence>
                {currentPreschools.map((preschool, index) => (
                  <motion.div
                    key={preschool.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <PreschoolListItem 
                      preschool={preschool} 
                      isSelected={selectedPreschool?.id === preschool.id} 
                      onClick={() => handlePreschoolClick(preschool)}
                      isMobile={true}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {displayedItems < visiblePreschools.length && (
                <div className="text-center py-3 border-t border-border/30">
                  <p className="text-sm text-muted-foreground">
                    Visar {displayedItems} av {visiblePreschools.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 opacity-75">
                    Scrolla för att se fler
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Desktop layout
  return <motion.div initial={{
    x: '100%'
  }} animate={{
    x: 0
  }} exit={{
    x: '100%'
  }} className={`fixed top-20 right-4 w-64 z-40 ${className}`} style={{
    height: Math.max(MIN_VISIBLE_ITEMS * 60 + 120, 300) + 'px'
  }}>
      <Card className="h-full bg-card/95 backdrop-blur-lg shadow-nordic border-border/50 hover:shadow-glow transition-all duration-300 flex flex-col rounded-xl">
        {/* Header */}
        <div className="p-2 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-foreground font-semibold text-xl text-center">{getContextTitle()}</h3>
            <Button onClick={() => setIsExpanded(false)} variant="ghost" size="sm" className="h-5 w-5 p-0">
              <ChevronUp className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{getContextSubtitle()}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div ref={scrollContainerRef} className="h-full overflow-y-auto p-2 space-y-1 animate-fade-in" onScroll={handleScroll}>
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
                  <PreschoolListItem preschool={preschool} isSelected={selectedPreschool?.id === preschool.id} onClick={() => handlePreschoolClick(preschool)} isMobile={false} />
                </motion.div>)}
            </AnimatePresence>
            
            {displayedItems < visiblePreschools.length && <div className="text-center py-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground">
                  Visar {displayedItems} av {visiblePreschools.length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 opacity-75">
                  Scrolla för att se fler
                </p>
              </div>}
          </div>
        </div>
      </Card>
    </motion.div>;
};
interface PreschoolListItemProps {
  preschool: any;
  isSelected: boolean;
  onClick: () => void;
  isMobile?: boolean;
}
const PreschoolListItem: React.FC<PreschoolListItemProps> = ({
  preschool,
  isSelected,
  onClick,
  isMobile = false
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
  return <motion.div whileHover={{
    scale: 1.01
  }} whileTap={{
    scale: 0.99
  }} className={`${isMobile ? 'p-3' : 'p-1.5'} rounded-md border cursor-pointer transition-all duration-200 hover-scale ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50 bg-card'}`} onClick={onClick} style={{ minHeight: isMobile ? '44px' : 'auto' }}>
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <h4 className="font-medium text-foreground text-xs leading-tight line-clamp-1">
            {preschool.namn}
          </h4>
        </div>
        {preschool.google_rating && <div className="flex items-center gap-0.5 flex-shrink-0">
            <Star className="h-2.5 w-2.5 fill-current text-yellow-500" />
            <span className="text-xs font-medium text-foreground">
              {preschool.google_rating.toFixed(1)}
            </span>
          </div>}
      </div>
      
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-0.5 text-xs text-muted-foreground min-w-0">
          <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
          <span className="truncate text-xs">{preschool.kommun}</span>
        </div>
        
        {preschool.huvudman && <Badge variant="outline" className={`text-xs px-1 py-0 h-4 flex items-center gap-0.5 ${huvudmanInfo.color} ${huvudmanInfo.bgColor} ${huvudmanInfo.borderColor} flex-shrink-0`}>
            <HuvudmanIcon className="h-2.5 w-2.5" />
            <span className="font-medium">{huvudmanInfo.label}</span>
          </Badge>}
      </div>
      
      <div className="flex flex-wrap gap-0.5">
        {preschool.antal_barn && <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
            <Users className="h-2.5 w-2.5 mr-0.5" />
            {preschool.antal_barn}
          </Badge>}
        {preschool.andel_med_förskollärarexamen && <Badge variant="outline" className="text-xs px-1 py-0 h-4">
            <GraduationCap className="h-2.5 w-2.5 mr-0.5" />
            {Math.round(preschool.andel_med_förskollärarexamen)}%
          </Badge>}
      </div>
    </div>
  </motion.div>;
};