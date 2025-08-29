import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Star, User, MapPin, Eye, Heart, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMapStore } from '@/stores/mapStore';
import { PreschoolDetailsPanel } from './PreschoolDetailsPanel';
import { useDebounce } from '@/hooks/useDebounce';

interface VirtualizedPreschoolListProps {
  className?: string;
  onShowDetails?: (preschool: any) => void;
}

export const VirtualizedPreschoolList: React.FC<VirtualizedPreschoolListProps> = ({ className }) => {
  const { filteredPreschools, searchFilters, setSelectedPreschool, setMapCenter, setMapZoom, preschools } = useMapStore();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [selectedPreschoolForDetails, setSelectedPreschoolForDetails] = React.useState<any>(null);
  const [listSearch, setListSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'rating' | 'name' | 'children' | 'quality'>('rating');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list');
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set());
  const [comparison, setComparison] = React.useState<Set<string>>(new Set());

  const debouncedListSearch = useDebounce(listSearch, 300);

  // Enhanced sorting and filtering with virtual scrolling optimization
  const processedPreschools = useMemo(() => {
    let result = [...filteredPreschools].filter(p => p.latitud && p.longitud);

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

    return result;
  }, [filteredPreschools, debouncedListSearch, sortBy]);

  const handlePreschoolClick = useCallback((preschool: any) => {
    if (preschool.longitud && preschool.latitud) {
      setSelectedPreschool(preschool);
      setMapCenter([preschool.longitud, preschool.latitud]);
      setMapZoom(15);
    }
  }, [setSelectedPreschool, setMapCenter, setMapZoom]);

  const handleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  }, [favorites]);

  const handleCompare = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newComparison = new Set(comparison);
    if (newComparison.has(id)) {
      newComparison.delete(id);
    } else if (newComparison.size < 3) {
      newComparison.add(id);
    }
    setComparison(newComparison);
  }, [comparison]);

  const getContextTitle = () => {
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

  const getRatingDisplay = (rating?: number) => {
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
  };

  const getHuvudmanColor = (huvudman: string) => {
    return huvudman === 'Kommunal' ? 'bg-blue-500/10 text-blue-700 border-blue-200' :
           'bg-green-500/10 text-green-700 border-green-200';
  };

  // Calculate national averages for comparisons
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
                {processedPreschools.length} förskolor
                {listSearch && ` (filtrerade från ${filteredPreschools.length})`}
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
              
              <div className="flex items-center gap-2">
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
              <div className="p-2 overflow-y-auto max-h-[calc(100vh-16rem)]">
                <div className="space-y-2">
                  {processedPreschools.map((preschool, index) => (
                    <motion.div
                      key={preschool.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.02, 0.5) }}
                    >
                      <Card className="hover-lift-subtle cursor-pointer border border-border/30 bg-background/50 relative">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            {/* Header row */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 
                                  className="font-medium text-sm text-foreground truncate hover:text-primary cursor-pointer"
                                  onClick={() => handlePreschoolClick(preschool)}
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
                                  className="h-6 w-6 p-0 hover:bg-primary/10"
                                  onClick={(e) => handleFavorite(preschool.id, e)}
                                >
                                  <Heart 
                                    className={`h-3 w-3 ${favorites.has(preschool.id) ? 'fill-red-500 text-red-500' : ''}`} 
                                  />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-primary/10"
                                  onClick={(e) => handleCompare(preschool.id, e)}
                                  disabled={comparison.size >= 3 && !comparison.has(preschool.id)}
                                >
                                  <ArrowLeftRight 
                                    className={`h-3 w-3 ${comparison.has(preschool.id) ? 'fill-blue-500 text-blue-500' : ''}`} 
                                  />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-primary/10"
                                  onClick={() => setSelectedPreschoolForDetails(preschool)}
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
                  ))}
                  
                  {processedPreschools.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">
                        {listSearch ? 'Inga förskolor matchar sökningen.' : 'Inga förskolor hittades med de valda filtren.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};