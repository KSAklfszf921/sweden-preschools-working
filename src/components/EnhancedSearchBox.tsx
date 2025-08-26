import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Filter, Users, GraduationCap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { useMapStore } from '@/stores/mapStore';

interface EnhancedSearchBoxProps {
  onLocationSearch?: (position: GeolocationPosition) => void;
  map?: mapboxgl.Map | null;
}

export const EnhancedSearchBox: React.FC<EnhancedSearchBoxProps> = ({ onLocationSearch, map }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [maxChildren, setMaxChildren] = useState([200]);
  const [selectedHuvudman, setSelectedHuvudman] = useState<string>('alla');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    setSearchFilters, 
    clearSearchFilters, 
    hasActiveFilters,
    searchFilters 
  } = useMapStore();

  // Auto-expand when there are active filters
  useEffect(() => {
    if (hasActiveFilters) {
      setIsExpanded(true);
    }
  }, [hasActiveFilters]);

  const handleLocationSearch = () => {
    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsExpanded(true);
        if (onLocationSearch) {
          onLocationSearch(position);
        }
        if (map) {
          map.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 12,
            pitch: 60,
            duration: 2000
          });
        }
        setIsSearching(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsSearching(false);
      }
    );
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      setIsExpanded(true);
      // Apply search filters
      setSearchFilters({
        query: searchText,
        huvudman: selectedHuvudman === 'alla' ? undefined : selectedHuvudman,
        maxChildren: maxChildren[0] < 200 ? maxChildren[0] : undefined
      });
    }
  };

  const handleClearFilters = () => {
    setSearchText('');
    setSelectedHuvudman('alla');
    setMaxChildren([200]);
    clearSearchFilters();
    setIsExpanded(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 left-4 z-30"
    >
      <Card className={`bg-card/95 backdrop-blur-lg border-border/50 shadow-nordic transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-64'
      }`}>
        {/* Main search bar */}
        <div className="p-3 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Sök kommun, förskola..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-4 h-9 text-sm bg-background/50"
              />
            </div>
            <Button
              onClick={hasActiveFilters ? handleClearFilters : handleSearch}
              variant={hasActiveFilters ? "destructive" : "default"}
              size="sm"
              className="h-9 px-3"
            >
              {hasActiveFilters ? (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Rensa
                </>
              ) : (
                <>
                  <Search className="h-3 w-3 mr-1" />
                  {searchText ? 'Sök' : 'Sök'}
                </>
              )}
            </Button>
          </div>

          {/* Location button */}
          <Button
            onClick={handleLocationSearch}
            variant="outline"
            size="sm"
            disabled={isSearching}
            className="w-full h-9 justify-start bg-background/50"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {isSearching ? 'Hämtar position...' : 'Förskolor nära mig'}
          </Button>

          {/* Expand/collapse button */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            {isExpanded ? 'Färre filter' : 'Fler filter'}
          </Button>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border/50"
            >
              <div className="p-3 space-y-4">
                {/* Huvudman filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    Huvudman
                  </label>
                  <Select value={selectedHuvudman} onValueChange={setSelectedHuvudman}>
                    <SelectTrigger className="h-8 text-xs bg-background/50">
                      <SelectValue placeholder="Välj huvudman" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alla">Alla</SelectItem>
                      <SelectItem value="Kommunal">Kommunal</SelectItem>
                      <SelectItem value="Privat">Privat</SelectItem>
                      <SelectItem value="Enskild">Enskild</SelectItem>
                      <SelectItem value="Kooperativ">Kooperativ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Max children slider */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Max antal barn: {maxChildren[0] >= 200 ? 'Alla' : maxChildren[0]}
                  </label>
                  <Slider
                    value={maxChildren}
                    onValueChange={setMaxChildren}
                    max={200}
                    min={10}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10</span>
                    <span>200+</span>
                  </div>
                </div>

                {/* Apply filters button */}
                <Button
                  onClick={handleSearch}
                  className="w-full h-8 text-xs"
                  disabled={!searchText && selectedHuvudman === 'alla' && maxChildren[0] >= 200}
                >
                  Tillämpa filter
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};