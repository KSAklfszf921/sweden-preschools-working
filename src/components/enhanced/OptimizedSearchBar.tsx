import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, MapPin, X, Navigation, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMapStore } from '@/stores/mapStore';
import { motion } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
interface OptimizedSearchBarProps {
  className?: string;
}
export const OptimizedSearchBar: React.FC<OptimizedSearchBarProps> = ({
  className
}) => {
  const {
    preschools,
    searchFilters,
    setSearchFilters,
    clearFilters,
    clearSpecificFilter,
    setMapCenter,
    setMapZoom,
    filteredPreschools
  } = useMapStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoized unique values for performance
  const uniqueKommuner = useMemo(() => [...new Set(preschools.map(p => p.kommun))].filter(Boolean).sort(), [preschools]);

  // Debounced search effect
  useEffect(() => {
    if (debouncedSearchQuery.length > 0) {
      const kommun = uniqueKommuner.find(k => k.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
      if (kommun) {
        setSearchFilters({
          kommuner: [kommun]
        });
      } else {
        setSearchFilters({
          query: debouncedSearchQuery
        });
      }
    } else if (debouncedSearchQuery.length === 0 && searchQuery.length === 0) {
      // Only clear when both debounced and actual query are empty
      clearFilters();
    }
  }, [debouncedSearchQuery, uniqueKommuner, setSearchFilters, clearFilters, searchQuery]);
  const handleGetCurrentLocation = useCallback(() => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      const {
        latitude,
        longitude
      } = position.coords;
      const center: [number, number] = [longitude, latitude];
      setUserLocation({
        lat: latitude,
        lng: longitude
      });
      setMapCenter(center);
      setMapZoom(12);
      setSearchFilters({
        radius: 2000,
        // 2km default
        center: center,
        nearbyMode: true
      });
      setIsLocating(false);
    }, error => {
      console.error('Error getting location:', error);
      setIsLocating(false);
      alert('Kunde inte hämta din position. Kontrollera att du tillåter platsåtkomst.');
    });
  }, [setMapCenter, setMapZoom, setSearchFilters]);
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    clearFilters();
    setUserLocation(null);
  }, [clearFilters]);
  const hasActiveFilters = useMemo(() => {
    return Object.keys(searchFilters).some(key => {
      const value = searchFilters[key as keyof typeof searchFilters];
      return value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? value.length > 0 : typeof value === 'boolean' ? value : true);
    });
  }, [searchFilters]);
  const filterCount = useMemo(() => Object.keys(searchFilters).filter(key => searchFilters[key as keyof typeof searchFilters] !== undefined).length, [searchFilters]);

  // Minimized view
  if (!isExpanded) {
    return <motion.div 
      initial={{ opacity: 0, x: -20, scale: 0.95 }} 
      animate={{ opacity: 1, x: 0, scale: 1 }} 
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`absolute left-8 top-8 z-30 ${className}`}
    >
      <Card className="glass-search border-0 shadow-elegant hover-glow-subtle">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsExpanded(true)} 
              variant="ghost" 
              size="sm" 
              className="h-12 px-6 hover-scale transition-smooth font-heading text-primary hover:text-primary hover:bg-primary/10 rounded-xl"
            >
              <Search className="h-5 w-5 mr-3 text-primary" />
              <span className="font-semibold text-lg">Sök förskolor</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-3 h-6 px-3 text-xs bg-primary/15 text-primary border-primary/20 rounded-lg">
                  {filterCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-3 opacity-60" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>;
  }
  return <motion.div 
    initial={{ opacity: 0, x: -20, scale: 0.95 }} 
    animate={{ opacity: 1, x: 0, scale: 1 }} 
    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    className={`absolute left-8 top-8 z-30 w-96 ${className}`}
  >
    <Card className="glass-search border-0 shadow-elegant hover-glow-subtle">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gray-100">
                <Search className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-gray-900">Sök förskolor</h3>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="mt-1 h-5 px-2 bg-gray-100 text-gray-800 border-gray-200 rounded-md text-xs">
                    {filterCount} aktiva filter
                  </Badge>
                )}
              </div>
            </div>
          <Button 
            onClick={() => setIsExpanded(false)} 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg transition-smooth"
          >
            <ChevronUp className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4" />
            <Input 
              ref={inputRef} 
              type="text" 
              placeholder="Sök kommun eller förskola..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-10 pr-10 h-10 border-0 bg-white/50 focus:bg-white focus:ring-2 focus:ring-gray-400/30 rounded-lg text-sm font-medium placeholder:text-gray-500 text-gray-900 transition-smooth" 
            />
            {searchQuery && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={clearSearch} 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-md transition-smooth"
              >
                <X className="h-3 w-3 text-gray-600" />
              </Button>
            )}
          </div>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-900 block">Aktiva filter</label>
              <div className="flex flex-wrap gap-1">
                {searchFilters.kommuner && searchFilters.kommuner.length > 0 && (
                  <Badge variant="secondary" className="h-6 px-2 bg-gray-100 text-gray-800 border-gray-200 rounded-md text-xs flex items-center gap-1">
                    {searchFilters.kommuner[0]}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => clearSpecificFilter('kommuner')}
                      className="h-3 w-3 p-0 hover:bg-red-100 rounded-full"
                    >
                      <X className="h-2 w-2 text-red-500" />
                    </Button>
                  </Badge>
                )}
                {searchFilters.huvudman && (
                  <Badge variant="secondary" className="h-6 px-2 bg-gray-100 text-gray-800 border-gray-200 rounded-md text-xs flex items-center gap-1">
                    {searchFilters.huvudman}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => clearSpecificFilter('huvudman')}
                      className="h-3 w-3 p-0 hover:bg-red-100 rounded-full"
                    >
                      <X className="h-2 w-2 text-red-500" />
                    </Button>
                  </Badge>
                )}
                {searchFilters.nearbyMode && (
                  <Badge variant="secondary" className="h-6 px-2 bg-gray-100 text-gray-800 border-gray-200 rounded-md text-xs flex items-center gap-1">
                    Nära mig
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => clearSpecificFilter('nearbyMode')}
                      className="h-3 w-3 p-0 hover:bg-red-100 rounded-full"
                    >
                      <X className="h-2 w-2 text-red-500" />
                    </Button>
                  </Badge>
                )}
                {searchFilters.query && (
                  <Badge variant="secondary" className="h-6 px-2 bg-gray-100 text-gray-800 border-gray-200 rounded-md text-xs flex items-center gap-1">
                    "{searchFilters.query}"
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => clearSpecificFilter('query')}
                      className="h-3 w-3 p-0 hover:bg-red-100 rounded-full"
                    >
                      <X className="h-2 w-2 text-red-500" />
                    </Button>
                  </Badge>
                )}
                {hasActiveFilters && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-md"
                  >
                    Rensa alla
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Quick filters */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-900 mb-2 block">Kommun</label>
              <Select value={searchFilters.kommuner?.[0] || 'all'} onValueChange={value => {
                setSearchFilters({
                  ...searchFilters,
                  kommuner: value === 'all' ? undefined : [value]
                });
              }}>
                <SelectTrigger className="h-9 text-xs bg-white/50 border-0 focus:ring-2 focus:ring-gray-400/30 rounded-lg transition-smooth text-gray-900">
                  <SelectValue placeholder="Välj kommun" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all" className="text-gray-900">Alla kommuner</SelectItem>
                  {uniqueKommuner.slice(0, 50).map(kommun => (
                    <SelectItem key={kommun} value={kommun} className="text-xs text-gray-900">
                      {kommun}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-900 mb-2 block">Huvudman</label>
              <Select value={searchFilters.huvudman || 'all'} onValueChange={value => {
                setSearchFilters({
                  ...searchFilters,
                  huvudman: value === 'all' ? undefined : value
                });
              }}>
                <SelectTrigger className="h-9 text-xs bg-white/50 border-0 focus:ring-2 focus:ring-gray-400/30 rounded-lg transition-smooth text-gray-900">
                  <SelectValue placeholder="Välj typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-gray-900">Alla typer</SelectItem>
                  <SelectItem value="Kommunal" className="text-gray-900">Kommunal</SelectItem>
                  <SelectItem value="Enskild" className="text-gray-900">Fristående</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location button */}
          <Button 
            onClick={handleGetCurrentLocation} 
            variant={userLocation ? "default" : "outline"} 
            size="sm" 
            className="w-full h-9 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-smooth" 
            disabled={isLocating}
          >
            {isLocating ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            ) : userLocation ? (
              <Target className="w-4 h-4 mr-2" />
            ) : (
              <Navigation className="w-4 h-4 mr-2" />
            )}
            <span className="text-sm font-medium">
              {isLocating ? "Hämtar position..." : userLocation ? "Position aktiv" : "Hitta närliggande"}
            </span>
          </Button>

            {/* Results count */}
            <div className="mt-2 text-xs text-gray-600 text-center">
              {filteredPreschools.length} förskolor {hasActiveFilters ? 'matchade' : 'totalt'}
            </div>
            
          </div>
        </div>
      </Card>
    </motion.div>;
};