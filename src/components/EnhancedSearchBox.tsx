import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Filter, Users, GraduationCap, X, Locate, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMapStore } from '@/stores/mapStore';

interface EnhancedSearchBoxProps {
  onLocationSearch?: (position: GeolocationPosition) => void;
  map?: mapboxgl.Map | null;
}

// Get all unique municipalities from the store
const getMunicipalities = (preschools: any[]) => {
  const municipalities = [...new Set(preschools.map(p => p.kommun))].filter(Boolean).sort();
  return municipalities;
};

export const EnhancedSearchBox: React.FC<EnhancedSearchBoxProps> = ({ onLocationSearch, map }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [maxChildren, setMaxChildren] = useState([200]);
  const [selectedHuvudman, setSelectedHuvudman] = useState<string>('alla');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [radius, setRadius] = useState([1000]); // In meters
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    setSearchFilters, 
    clearSearchFilters, 
    hasActiveFilters,
    searchFilters,
    preschools
  } = useMapStore();

  const municipalities = getMunicipalities(preschools);
  const selectedMunicipalities = searchFilters.kommuner || [];
  const hasSearchQuery = searchText.trim().length > 0;
  const hasNearbyMode = searchFilters.nearbyMode || false;

  // Filter suggestions based on search text
  const filteredSuggestions = searchText.trim().length > 0 
    ? municipalities.filter(m => 
        m.toLowerCase().includes(searchText.toLowerCase()) &&
        !selectedMunicipalities.includes(m)
      ).slice(0, 5)
    : [];

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
        
        // Set nearby mode filters
        setSearchFilters({
          center: [position.coords.longitude, position.coords.latitude],
          radius: radius[0],
          nearbyMode: true
        });
        
        setIsSearching(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsSearching(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleAddMunicipality = (municipality: string) => {
    const newMunicipalities = [...selectedMunicipalities, municipality];
    setSearchFilters({ kommuner: newMunicipalities });
    setSearchText('');
    setShowSuggestions(false);
  };

  const handleRemoveMunicipality = (municipality: string) => {
    const newMunicipalities = selectedMunicipalities.filter(m => m !== municipality);
    setSearchFilters({ kommuner: newMunicipalities.length > 0 ? newMunicipalities : undefined });
  };

  const handleSearch = () => {
    if (hasActiveFilters) {
      // Clear all filters
      clearSearchFilters();
      setSearchText('');
      setMaxChildren([200]);
      setSelectedHuvudman('alla');
      setRadius([1000]);
    } else {
      // Apply search
      const filters: any = {};
      
      if (selectedHuvudman !== 'alla') {
        filters.huvudman = selectedHuvudman;
      }
      
      if (maxChildren[0] < 200) {
        filters.maxChildren = maxChildren[0];
      }
      
      if (Object.keys(filters).length > 0) {
        setSearchFilters(filters);
      }
    }
  };

  const handleRadiusChange = (newRadius: number[]) => {
    setRadius(newRadius);
    if (hasNearbyMode && searchFilters.center) {
      setSearchFilters({
        ...searchFilters,
        radius: newRadius[0]
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredSuggestions.length > 0) {
      handleAddMunicipality(filteredSuggestions[0]);
    }
  };

  const getButtonText = () => {
    if (hasActiveFilters) return 'Rensa';
    return 'Sök';
  };

  const getButtonIcon = () => {
    if (hasActiveFilters) return <Trash2 className="h-4 w-4" />;
    return <Search className="h-4 w-4" />;
  };

  if (!isExpanded) {
    return (
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-4 left-4 z-50"
      >
        <Card className="bg-card/95 backdrop-blur-lg shadow-nordic border-border/50">
          <div className="p-2 flex items-center gap-2">
            <Button
              onClick={() => setIsExpanded(true)}
              variant="ghost"
              size="sm"
              className="h-8"
            >
              <Search className="h-4 w-4 mr-2" />
              Sök förskolor
            </Button>
            
            <Button
              onClick={handleLocationSearch}
              variant="outline"
              size="sm"
              disabled={isSearching}
              className="h-8"
            >
              <Locate className="h-4 w-4 mr-1" />
              {isSearching ? 'Söker...' : 'Nära mig'}
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute top-4 left-4 z-50 w-80"
    >
      <Card className="bg-card/95 backdrop-blur-lg shadow-nordic border-border/50">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Search className="h-4 w-4" />
              Sök förskolor
            </h3>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Municipality Search */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Sök kommun
            </label>
            <div className="relative">
              <Input
                ref={searchInputRef}
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSuggestions(searchText.length > 0)}
                placeholder="Skriv kommunnamn..."
                className="h-8 text-sm"
              />
              
              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50"
                  >
                    {filteredSuggestions.map((municipality) => (
                      <button
                        key={municipality}
                        onClick={() => handleAddMunicipality(municipality)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                      >
                        {municipality}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected municipalities */}
            {selectedMunicipalities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedMunicipalities.map((municipality) => (
                  <Badge
                    key={municipality}
                    variant="secondary"
                    className="text-xs px-2 py-1 flex items-center gap-1"
                  >
                    {municipality}
                    <button
                      onClick={() => handleRemoveMunicipality(municipality)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Location button */}
          <Button
            onClick={handleLocationSearch}
            variant="outline"
            size="sm"
            disabled={isSearching}
            className="w-full h-8"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {isSearching ? 'Hittar din position...' : 'Förskolor nära mig'}
          </Button>

          {/* Radius slider - only show when nearby mode is active */}
          <AnimatePresence>
            {hasNearbyMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Sökradie: {radius[0]}m
                </label>
                <Slider
                  value={radius}
                  onValueChange={handleRadiusChange}
                  max={5000}
                  min={500}
                  step={250}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>500m</span>
                  <span>5km</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Filter className="h-3 w-3" />
                Huvudman
              </label>
              <Select value={selectedHuvudman} onValueChange={setSelectedHuvudman}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alla">Alla</SelectItem>
                  <SelectItem value="Kommunal">Kommunal</SelectItem>
                  <SelectItem value="Privat">Privat</SelectItem>
                  <SelectItem value="Fristående">Fristående</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-3 w-3" />
                Max antal barn: {maxChildren[0]}
              </label>
              <Slider
                value={maxChildren}
                onValueChange={setMaxChildren}
                max={200}
                min={20}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>20</span>
                <span>200+</span>
              </div>
            </div>
          </div>

          {/* Search button */}
          <Button 
            onClick={handleSearch}
            className="w-full h-8"
            variant={hasActiveFilters ? "destructive" : "default"}
          >
            {getButtonIcon()}
            <span className="ml-2">{getButtonText()}</span>
          </Button>

          {/* Active filters indicator */}
          {hasActiveFilters && (
            <div className="text-xs text-muted-foreground">
              {selectedMunicipalities.length > 0 && `${selectedMunicipalities.length} kommuner valda`}
              {hasNearbyMode && ' • Närområde aktivt'}
              {selectedHuvudman !== 'alla' && ` • ${selectedHuvudman}`}
              {maxChildren[0] < 200 && ` • Max ${maxChildren[0]} barn`}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};