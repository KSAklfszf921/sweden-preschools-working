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
    return <motion.div initial={{
      opacity: 0,
      x: -20
    }} animate={{
      opacity: 1,
      x: 0
    }} className={`absolute left-4 top-4 z-30 ${className}`}>
        <Card className="glass-search border-0 shadow-lg card-hover">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsExpanded(true)} variant="ghost" size="sm" className="h-8 px-2 hover-scale transition-all duration-200 font-heading">
                <Search className="h-4 w-4 mr-1 text-primary" />
                <span className="font-medium text-base">Sök förskolor</span>
                {hasActiveFilters && <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {filterCount}
                  </Badge>}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            
          </div>
        </Card>
      </motion.div>;
  }
  return <motion.div initial={{
    opacity: 0,
    x: -20
  }} animate={{
    opacity: 1,
    x: 0
  }} className={`absolute left-4 top-4 z-30 w-72 ${className}`}>
      <Card className="glass-search border-0 shadow-lg card-hover">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-semibold text-lg">Sök förskolor</h3>
              {hasActiveFilters && <Badge variant="secondary" className="h-5">
                  {filterCount}
                </Badge>}
            </div>
            <Button onClick={() => setIsExpanded(false)} variant="ghost" size="sm" className="h-6 w-6 p-0">
              <ChevronUp className="h-3 w-3" />
            </Button>
          </div>

          {/* Search Input */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input ref={inputRef} type="text" placeholder="Sök kommun eller förskola..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-10 border-0 focus:ring-2 focus:ring-primary/20" />
              {searchQuery && <Button size="sm" variant="ghost" onClick={clearSearch} className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted/50">
                  <X className="h-3 w-3" />
                </Button>}
            </div>

            {/* Quick filters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Kommun</label>
                <Select value={searchFilters.kommuner?.[0] || 'all'} onValueChange={value => {
                setSearchFilters({
                  ...searchFilters,
                  kommuner: value === 'all' ? undefined : [value]
                });
              }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Välj kommun" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">Alla kommuner</SelectItem>
                    {uniqueKommuner.slice(0, 50).map(kommun => <SelectItem key={kommun} value={kommun} className="text-xs">
                        {kommun}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Huvudman</label>
                <Select value={searchFilters.huvudman || 'all'} onValueChange={value => {
                setSearchFilters({
                  ...searchFilters,
                  huvudman: value === 'all' ? undefined : value
                });
              }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Välj typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla typer</SelectItem>
                    <SelectItem value="Kommunal">Kommunal</SelectItem>
                    <SelectItem value="Enskild">Fristående</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location button */}
            <Button onClick={handleGetCurrentLocation} variant={userLocation ? "default" : "outline"} size="sm" className="w-full" disabled={isLocating}>
              {isLocating ? <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" /> : userLocation ? <Target className="w-4 h-4 mr-2" /> : <Navigation className="w-4 h-4 mr-2" />}
              {isLocating ? "Hämtar position..." : userLocation ? "Position aktiv" : "Hitta närliggande"}
            </Button>

            {/* Results count */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Visar {filteredPreschools.length.toLocaleString()} av {preschools.length.toLocaleString()} förskolor
            </div>
          </div>
        </div>
      </Card>
    </motion.div>;
};