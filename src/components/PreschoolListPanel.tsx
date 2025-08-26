import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, MapPin, Star, Users, GraduationCap, Building2, Home, X } from 'lucide-react';
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
    mapZoom,
    hasActiveFilters,
    clearFilters
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
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-8 right-8 z-50 ${className}`}
    >
      <Button 
        onClick={() => setIsExpanded(true)} 
        variant="secondary" 
        size="lg" 
        className="glass-search shadow-elegant px-6 py-4 hover-scale hover-glow-subtle transition-smooth font-heading rounded-xl"
      >
        <MapPin className="h-6 w-6 mr-3 text-primary" />
        <span className="text-lg font-semibold">{visiblePreschools.length}</span>
      </Button>
    </motion.div>;
  }
  return <motion.div 
    initial={{ x: '100%', scale: 0.95 }} 
    animate={{ x: 0, scale: 1 }} 
    exit={{ x: '100%', scale: 0.95 }}
    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    className={`fixed top-36 right-8 w-96 z-40 ${className}`} 
    style={{
      height: Math.max(MIN_VISIBLE_ITEMS * 72 + 160, 360) + 'px'
    }}
  >
    <Card className="h-full glass-search shadow-elegant border-0 hover-glow-subtle transition-smooth flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200/20 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gray-100">
              <MapPin className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <h3 className="text-gray-900 font-bold text-lg font-heading">{getContextTitle()}</h3>
              <p className="text-xs text-gray-600 font-medium">
                {visiblePreschools.length} {hasActiveFilters ? 'matchade' : 'förskolor'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearFilters}
                className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-md"
              >
                <X className="h-3 w-3 mr-1" />
                Rensa
              </Button>
            )}
            <Button 
              onClick={() => setIsExpanded(false)} 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg transition-smooth"
            >
              <ChevronUp className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div ref={scrollContainerRef} className="h-full overflow-y-auto p-3 space-y-2 animate-fade-in" onScroll={handleScroll}>
            <AnimatePresence>
              {currentPreschools.map((preschool, index) => <motion.div key={preschool.id} initial={{
              opacity: 0,
              y: 16
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: -16
            }} transition={{
              delay: index * 0.04,
              ease: [0.4, 0, 0.2, 1]
            }}>
                  <PreschoolListItem preschool={preschool} isSelected={selectedPreschool?.id === preschool.id} onClick={() => handlePreschoolClick(preschool)} />
                </motion.div>)}
            </AnimatePresence>
            
            {displayedItems < visiblePreschools.length && (
              <div className="text-center py-3 border-t border-gray-200/20 mt-4">
                <p className="text-xs text-gray-600 font-semibold">
                  Visar {displayedItems} av {visiblePreschools.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
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
    whileHover={{ scale: 1.02, y: -3 }} 
    whileTap={{ scale: 0.98 }} 
    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    className={`p-2 rounded-lg border cursor-pointer transition-smooth ${
      isSelected 
        ? 'border-gray-400 bg-gray-100 shadow-sm' 
        : 'border-gray-200/50 hover:border-gray-300 bg-white/50 hover:bg-white hover:shadow-sm'
    }`}
    onClick={onClick}
  >
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1 font-heading">
            {preschool.namn}
          </h4>
        </div>
        {preschool.google_rating && (
          <div className="flex items-center gap-1 flex-shrink-0 px-2 py-1 bg-gray-100 rounded-md">
            <Star className="h-3 w-3 fill-current text-gray-600" />
            <span className="text-xs font-bold text-gray-700">
              {preschool.google_rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs text-gray-600 min-w-0">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate font-medium">{preschool.kommun}</span>
        </div>
        
        {preschool.huvudman && (
          <Badge 
            variant="outline" 
            className="text-xs px-2 py-0.5 h-5 flex items-center gap-1 font-medium rounded-md bg-gray-50 text-gray-700 border-gray-200 flex-shrink-0"
          >
            <HuvudmanIcon className="h-3 w-3" />
            <span>{huvudmanInfo.label}</span>
          </Badge>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1">
        {preschool.antal_barn && (
          <Badge variant="secondary" className="text-xs px-2 py-0.5 h-4 bg-gray-100 text-gray-700 rounded-md">
            <Users className="h-3 w-3 mr-1" />
            <span className="font-medium">{preschool.antal_barn}</span>
          </Badge>
        )}
        {preschool.andel_med_förskollärarexamen && (
          <Badge variant="outline" className="text-xs px-2 py-0.5 h-4 border-gray-300 text-gray-700 rounded-md">
            <GraduationCap className="h-3 w-3 mr-1" />
            <span className="font-medium">{Math.round(preschool.andel_med_förskollärarexamen)}%</span>
          </Badge>
        )}
      </div>
    </div>
  </motion.div>;
};