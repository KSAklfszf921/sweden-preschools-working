import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Star, User, MapPin, Eye, Heart, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMapStore } from '@/stores/mapStore';
import { PreschoolDetailsPanel } from './PreschoolDetailsPanel';
import { useDebounce } from '@/hooks/useDebounce';

interface PreschoolListProps {
  className?: string;
}

// Memoized preschool item component for performance
const PreschoolListItem = memo(({ 
  preschool, 
  index, 
  onPreschoolClick, 
  onFavorite, 
  onCompare, 
  onShowDetails,
  isFavorite,
  isInComparison,
  comparisonFull
}: {
  preschool: any;
  index: number;
  onPreschoolClick: (preschool: any) => void;
  onFavorite: (id: string, e: React.MouseEvent) => void;
  onCompare: (id: string, e: React.MouseEvent) => void;
  onShowDetails: (preschool: any) => void;
  isFavorite: boolean;
  isInComparison: boolean;
  comparisonFull: boolean;
}) => {
  const getRatingDisplay = useCallback((rating?: number) => {
    if (!rating) return null;
    
    const color = rating >= 4.5 ? 'text-green-600' : 
                  rating >= 4.0 ? 'text-yellow-600' : 
                  'text-orange-600';
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Star className="h-3 w-3 fill-current" />
        <span className="text-xs font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  }, []);

  const getHuvudmanColor = useCallback((huvudman: string) => {
    return huvudman === 'Kommunal' ? 'bg-blue-500/10 text-blue-700 border-blue-200' :
           'bg-green-500/10 text-green-700 border-green-200';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.01, 0.2) }}
      layout
    >
      <Card className="hover-lift-subtle cursor-pointer border border-border/30 bg-background/50 relative transition-all duration-200">
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 
                  className="font-medium text-sm text-foreground truncate hover:text-primary cursor-pointer transition-colors duration-200"
                  onClick={() => onPreschoolClick(preschool)}
                  title={preschool.namn}
                >
                  {preschool.namn}
                </h4>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">
                    {preschool.kommun}
                  </span>
                </div>
              </div>
              
              {/* Rating */}
              {getRatingDisplay(preschool.google_rating)}
            </div>

            {/* Details row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1.5 py-0.5 ${getHuvudmanColor(preschool.huvudman)}`}
                >
                  {preschool.huvudman === 'Enskild' ? 'Fristående' : preschool.huvudman}
                </Badge>
                
                {preschool.antal_barn && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="text-xs">{preschool.antal_barn}</span>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-primary/10 transition-colors duration-200"
                  onClick={(e) => onFavorite(preschool.id, e)}
                >
                  <Heart 
                    className={`h-3 w-3 transition-colors duration-200 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-primary/10 transition-colors duration-200"
                  onClick={(e) => onCompare(preschool.id, e)}
                  disabled={comparisonFull && !isInComparison}
                >
                  <ArrowLeftRight 
                    className={`h-3 w-3 transition-colors duration-200 ${isInComparison ? 'fill-blue-500 text-blue-500' : ''}`} 
                  />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-primary/10 transition-colors duration-200"
                  onClick={() => onShowDetails(preschool)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Quality indicator */}
            {preschool.andel_med_förskollärarexamen && (
              <div className="flex items-center gap-1">
                <div className="flex-1 bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-gradient-primary h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, preschool.andel_med_förskollärarexamen)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(preschool.andel_med_förskollärarexamen)}% förskollärare
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

PreschoolListItem.displayName = 'PreschoolListItem';

// Virtual scrolling component for performance
const VirtualizedList = memo(({ 
  items, 
  onPreschoolClick, 
  onFavorite, 
  onCompare, 
  onShowDetails,
  favorites,
  comparison
}: {
  items: any[];
  onPreschoolClick: (preschool: any) => void;
  onFavorite: (id: string, e: React.MouseEvent) => void;
  onCompare: (id: string, e: React.MouseEvent) => void;
  onShowDetails: (preschool: any) => void;
  favorites: Set<string>;
  comparison: Set<string>;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  
  const ITEM_HEIGHT = 120; // Approximate height of each item
  const BUFFER_SIZE = 5; // Extra items to render outside viewport

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
      const end = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE);
      
      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [items.length]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const offsetY = visibleRange.start * ITEM_HEIGHT;
  const totalHeight = items.length * ITEM_HEIGHT;

  return (
    <div 
      ref={containerRef}
      className="overflow-y-auto max-h-[calc(100vh-16rem)] relative"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          <div className="space-y-2 p-2">
            {visibleItems.map((preschool, index) => (
              <PreschoolListItem
                key={preschool.id}
                preschool={preschool}
                index={visibleRange.start + index}
                onPreschoolClick={onPreschoolClick}
                onFavorite={onFavorite}
                onCompare={onCompare}
                onShowDetails={onShowDetails}
                isFavorite={favorites.has(preschool.id)}
                isInComparison={comparison.has(preschool.id)}
                comparisonFull={comparison.size >= 3}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

export const PerformanceCriticalList: React.FC<PreschoolListProps> = ({ className }) => {
  const { 
    filteredPreschools, 
    visiblePreschools,
    searchFilters, 
    setSelectedPreschool, 
    setMapCenter, 
    setMapZoom, 
    preschools,
    listContext,
    setListContext
  } = useMapStore();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedPreschoolForDetails, setSelectedPreschoolForDetails] = useState<any>(null);
  const [listSearch, setListSearch] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'children' | 'quality'>('rating');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [comparison, setComparison] = useState<Set<string>>(new Set());
  const [viewportOnly, setViewportOnly] = useState(true); // Default to viewport-only for better performance

  const debouncedListSearch = useDebounce(listSearch, 300);

  // Force re-render when visibility changes
  useEffect(() => {
    console.log(`👁️ Viewport visibility changed - viewportOnly: ${viewportOnly}, visible count: ${visiblePreschools.length}`);
  }, [viewportOnly, visiblePreschools.length]);

  // Choose data source based on viewport toggle with real-time updates
  const sourcePreschools = useMemo(() => {
    console.log(`📊 List data source update - viewportOnly: ${viewportOnly}, visible: ${visiblePreschools.length}, filtered: ${filteredPreschools.length}`);
    return viewportOnly ? visiblePreschools : filteredPreschools;
  }, [viewportOnly, visiblePreschools, filteredPreschools]);

  // Enhanced sorting and filtering with performance optimization
  const processedPreschools = useMemo(() => {
    const start = performance.now();
    
    let result = [...sourcePreschools].filter(p => p.latitud && p.longitud);

    // Apply list-specific search
    if (debouncedListSearch) {
      const query = debouncedListSearch.toLowerCase();
      result = result.filter(p => 
        p.namn.toLowerCase().includes(query) || 
        p.kommun.toLowerCase().includes(query) ||
        p.adress?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.google_rating || 0) - (a.google_rating || 0);
        case 'name':
          return a.namn.localeCompare(b.namn);
        case 'children':
          return (b.antal_barn || 0) - (a.antal_barn || 0);
        case 'quality':
          return (b.andel_med_förskollärarexamen || 0) - (a.andel_med_förskollärarexamen || 0);
        default:
          return 0;
      }
    });

    const end = performance.now();
    console.log(`🔄 List processed: ${result.length} items (from ${sourcePreschools.length} source) - viewport: ${viewportOnly} - search: "${debouncedListSearch}" - sort: ${sortBy}`);
    
    if (end - start > 10) {
      console.log(`⚠️ List processing took ${end - start}ms for ${result.length} items`);
    }

    return result;
  }, [sourcePreschools, debouncedListSearch, sortBy]);

  const handlePreschoolClick = useCallback((preschool: any) => {
    if (preschool.longitud && preschool.latitud) {
      setSelectedPreschool(preschool);
      setMapCenter([preschool.longitud, preschool.latitud]);
      setMapZoom(15);
    }
  }, [setSelectedPreschool, setMapCenter, setMapZoom]);

  const handleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  }, []);

  const handleCompare = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setComparison(prev => {
      const newComparison = new Set(prev);
      if (newComparison.has(id)) {
        newComparison.delete(id);
      } else if (newComparison.size < 3) {
        newComparison.add(id);
      }
      return newComparison;
    });
  }, []);

  const getContextTitle = () => {
    if (viewportOnly) {
      return 'Synliga på kartan';
    }
    if (searchFilters.kommuner && searchFilters.kommuner.length > 0) {
      return `Förskolor i ${searchFilters.kommuner.join(', ')}`;
    }
    if (searchFilters.nearbyMode) {
      return 'Närliggande förskolor';
    }
    if (searchFilters.query) {
      return `Sökresultat för "${searchFilters.query}"`;
    }
    return 'Alla förskolor';
  };

  const getCountDescription = () => {
    const totalCount = processedPreschools.length;
    const sourceCount = sourcePreschools.length;
    const allCount = filteredPreschools.length;
    
    if (listSearch) {
      if (viewportOnly) {
        return `${totalCount} träffar på kartan (av ${sourceCount} synliga)`;
      } else {
        return `${totalCount} sökträffar (av ${allCount} filtrerade)`;
      }
    }
    
    if (viewportOnly) {
      return `${totalCount} synliga på kartan (av ${allCount} totalt)`;
    }
    
    return `${totalCount} förskolor`;
  };

  // Calculate national averages for comparisons (memoized)
  const nationalAverage = useMemo(() => {
    if (preschools.length === 0) return undefined;
    const validChildren = preschools.filter(p => p.antal_barn).map(p => p.antal_barn!);
    const validStaff = preschools.filter(p => p.personaltäthet).map(p => p.personaltäthet!);
    const validExam = preschools.filter(p => p.andel_med_förskollärarexamen).map(p => p.andel_med_förskollärarexamen!);
    const validRating = preschools.filter(p => p.google_rating).map(p => p.google_rating!);
    return {
      avgChildren: validChildren.length > 0 ? Math.round(validChildren.reduce((a, b) => a + b, 0) / validChildren.length) : 0,
      avgStaff: validStaff.length > 0 ? validStaff.reduce((a, b) => a + b, 0) / validStaff.length : 0,
      avgTeacherExam: validExam.length > 0 ? Math.round(validExam.reduce((a, b) => a + b, 0) / validExam.length) : 0,
      avgRating: validRating.length > 0 ? validRating.reduce((a, b) => a + b, 0) / validRating.length : 0
    };
  }, [preschools]);

  // Show details panel if a preschool is selected
  if (selectedPreschoolForDetails) {
    return (
      <PreschoolDetailsPanel
        preschool={selectedPreschoolForDetails}
        onBack={() => setSelectedPreschoolForDetails(null)}
        nationalAverage={nationalAverage}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`absolute right-4 top-4 z-30 w-80 max-h-[calc(100vh-2rem)] ${className}`}
    >
      <Card className="glass-card border-0 shadow-lg h-full flex flex-col">
        {/* Enhanced Header */}
        <div className="p-4 border-b border-border/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-heading font-semibold text-sm text-foreground">
                {getContextTitle()}
              </h3>
              <p className="text-xs text-muted-foreground">
                {getCountDescription()}
              </p>
            </div>
            <Button
              onClick={() => setIsCollapsed(!isCollapsed)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
          </div>

          {/* Search and Controls */}
          {!isCollapsed && (
            <div className="space-y-2">
              <Input
                placeholder="Sök i listan..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="h-8 text-xs"
              />
              
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs p-1 rounded border bg-background"
                >
                  <option value="rating">Betyg</option>
                  <option value="name">Namn</option>
                  <option value="children">Antal barn</option>
                  <option value="quality">Kvalitet</option>
                </select>
                
                <Button
                  size="sm"
                  variant={viewportOnly ? "default" : "outline"}
                  onClick={() => setViewportOnly(!viewportOnly)}
                  className="text-xs h-6 px-2"
                >
                  {viewportOnly ? 'Endast karta' : 'Alla'}
                </Button>
                
                {comparison.size > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Jämför ({comparison.size})
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Virtual Scrolled List */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="flex-1 overflow-hidden"
            >
              {processedPreschools.length > 0 ? (
                <VirtualizedList
                  items={processedPreschools}
                  onPreschoolClick={handlePreschoolClick}
                  onFavorite={handleFavorite}
                  onCompare={handleCompare}
                  onShowDetails={setSelectedPreschoolForDetails}
                  favorites={favorites}
                  comparison={comparison}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    {listSearch ? 'Inga förskolor matchar sökningen.' : 
                     viewportOnly ? 'Inga förskolor synliga i kartvy.' :
                     'Inga förskolor hittades med de valda filtren.'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};