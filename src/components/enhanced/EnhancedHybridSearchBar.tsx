import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, MapPin, X, Navigation, ChevronDown, ChevronUp, Target, Building, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMapStore } from '@/stores/mapStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import { ActiveFiltersDisplay } from './ActiveFiltersDisplay';
import { SWEDISH_MUNICIPALITIES } from '@/data/municipalities';
import Fuse from 'fuse.js';

interface EnhancedHybridSearchBarProps {
  className?: string;
}

interface SearchSuggestion {
  id: string;
  type: 'preschool' | 'kommun' | 'area' | 'recent';
  title: string;
  subtitle?: string;
  coordinates?: [number, number];
  preschoolId?: string;
  count?: number;
}

export const EnhancedHybridSearchBar: React.FC<EnhancedHybridSearchBarProps> = ({
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

  // State management - combining both approaches
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showAllResults, setShowAllResults] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('preschool-recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  // Fuse.js instances for fuzzy search
  const fusePreschools = useMemo(() => new Fuse(preschools, {
    keys: ['namn', 'adress'],
    threshold: 0.3,
    includeScore: true
  }), [preschools]);

  const fuseKommuner = useMemo(() => new Fuse(
    SWEDISH_MUNICIPALITIES.map(k => ({ name: k })), 
    {
      keys: ['name'],
      threshold: 0.3,
      includeScore: true
    }
  ), []);

  // Enhanced suggestion generation with Fuse.js fuzzy search
  const generateSuggestions = useCallback((query: string) => {
    if (!query || query.length < 2) {
      setSuggestions(recentSearches.slice(0, 5));
      setShowSuggestions(recentSearches.length > 0);
      return;
    }

    const results: SearchSuggestion[] = [];

    // Fuzzy search in preschool names with Fuse.js
    const preschoolMatches = fusePreschools.search(query)
      .slice(0, 8)
      .map(result => ({
        id: `preschool-${result.item.id}`,
        type: 'preschool' as const,
        title: result.item.namn,
        subtitle: `${result.item.kommun} • ${result.item.huvudman || 'Okänd huvudman'}`,
        coordinates: result.item.longitud && result.item.latitud 
          ? [result.item.longitud, result.item.latitud] as [number, number]
          : undefined,
        preschoolId: result.item.id
      }));

    results.push(...preschoolMatches);

    // Fuzzy search in kommun names with count
    const kommunMatches = fuseKommuner.search(query)
      .slice(0, 5)
      .map(result => {
        const kommun = result.item.name;
        const count = preschools.filter(p => p.kommun === kommun).length;
        return {
          id: `kommun-${kommun}`,
          type: 'kommun' as const,
          title: kommun,
          subtitle: `${count} förskolor`,
          count,
          coordinates: getKommunCenter(kommun)
        };
      });

    results.push(...kommunMatches);

    // Address search for longer queries
    if (query.length > 3) {
      const addressMatches = preschools
        .filter(p => 
          p.adress && 
          p.adress.toLowerCase().includes(query.toLowerCase()) &&
          p.latitud && 
          p.longitud
        )
        .slice(0, 3)
        .map(p => ({
          id: `address-${p.id}`,
          type: 'area' as const,
          title: p.adress!,
          subtitle: `${p.kommun} • ${p.namn}`,
          coordinates: [p.longitud!, p.latitud!] as [number, number],
          preschoolId: p.id
        }));

      results.push(...addressMatches);
    }

    const finalResults = results.slice(0, showAllResults ? results.length : 10);
    setSuggestions(finalResults);
    setShowSuggestions(finalResults.length > 0);
  }, [fusePreschools, fuseKommuner, preschools, recentSearches, showAllResults]);

  // Handle search query changes with live filtering
  useEffect(() => {
    generateSuggestions(searchQuery);
    
    // Live update filters as user types (from RTF suggestion)
    if (searchQuery.trim()) {
      setSearchFilters({ query: searchQuery });
    }
  }, [searchQuery, generateSuggestions, setSearchFilters]);

  // Handle suggestion selection with recent searches saving
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    // Save to recent searches (avoid duplicates)
    const newRecent = [
      suggestion,
      ...recentSearches.filter(r => r.id !== suggestion.id)
    ].slice(0, 10);
    
    setRecentSearches(newRecent);
    localStorage.setItem('preschool-recent-searches', JSON.stringify(newRecent));

    // Apply appropriate filters based on suggestion type
    if (suggestion.type === 'kommun') {
      const currentKommuner = searchFilters.kommuner || [];
      if (!currentKommuner.includes(suggestion.title)) {
        setSearchFilters({
          kommuner: [...currentKommuner, suggestion.title]
        });
      }
    } else if (suggestion.type === 'preschool' && suggestion.preschoolId) {
      setSearchFilters({
        query: suggestion.title
      });
      
      // Navigate to preschool location
      if (suggestion.coordinates) {
        setMapCenter(suggestion.coordinates);
        setMapZoom(15);
      }
    } else if (suggestion.type === 'area') {
      setSearchFilters({
        query: suggestion.title
      });
      
      if (suggestion.coordinates) {
        setMapCenter(suggestion.coordinates);
        setMapZoom(13);
      }
    }

    // Auto-close expanded view for mobile UX
    if (window.innerWidth < 768) {
      setIsExpanded(false);
    }

    inputRef.current?.blur();
  }, [recentSearches, searchFilters.kommuner, setSearchFilters, setMapCenter, setMapZoom]);

  // Keyboard navigation (from RTF suggestion)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSuggestionClick]);

  // GPS location functionality
  const handleGetCurrentLocation = useCallback(() => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      const center: [number, number] = [longitude, latitude];
      setUserLocation({ lat: latitude, lng: longitude });
      
      setMapCenter(center);
      setMapZoom(12);
      setSearchFilters({
        radius: 2000,
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

  // Clear search functionality
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
    clearFilters();
    setUserLocation(null);
    setSelectedIndex(-1);
    setShowAllResults(false);
  }, [clearFilters]);

  // Filter calculations
  const hasActiveFilters = useMemo(() => {
    return Object.keys(searchFilters).some(key => {
      const value = searchFilters[key as keyof typeof searchFilters];
      return value !== undefined && value !== null && 
        (Array.isArray(value) ? value.length > 0 : 
         typeof value === 'string' ? value.length > 0 : 
         typeof value === 'boolean' ? value : true);
    });
  }, [searchFilters]);

  const filterCount = useMemo(() => {
    return Object.keys(searchFilters).filter(key => {
      const value = searchFilters[key as keyof typeof searchFilters];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return true;
      if (typeof value === 'object' && value !== null) return true;
      return false;
    }).length;
  }, [searchFilters]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Suggestion icon helper
  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'preschool':
        return <Building className="w-4 h-4 text-blue-500" />;
      case 'kommun':
        return <MapPin className="w-4 h-4 text-green-500" />;
      case 'area':
        return <MapPin className="w-4 h-4 text-orange-500" />;
      case 'recent':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  // Minimized view (from OptimizedSearchBar)
  if (!isExpanded) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`absolute left-4 top-4 z-30 ${className}`}
      >
        <Card className="glass-search border-0 shadow-lg card-hover backdrop-blur-lg bg-white/80">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setIsExpanded(true)} 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 hover-scale transition-all duration-200 font-heading"
              >
                <Search className="h-4 w-4 mr-1 text-primary" />
                <span className="font-medium text-base">Sök förskolor</span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs ml-1">
                    {filterCount}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
              
              {/* Quick clear button when filters are active */}
              {hasActiveFilters && (
                <Button
                  onClick={clearSearch}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive/10"
                  title="Rensa alla filter"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>
            
            {/* Active filters display */}
            {hasActiveFilters && (
              <div className="pt-2 border-t border-border/50 mt-2">
                <ActiveFiltersDisplay />
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }

  // Expanded view (hybrid of both approaches)
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`absolute left-4 top-4 z-30 w-96 ${className}`}
      layout
      transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
    >
      <Card className="glass-search border-0 shadow-xl backdrop-blur-lg bg-white/85 border-white/40">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-semibold text-base">Sök förskolor</h3>
              {hasActiveFilters && (
                <Badge variant="secondary" className="h-5">
                  {filterCount}
                </Badge>
              )}
            </div>
            <Button 
              onClick={() => setIsExpanded(false)} 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-3">
            {/* Enhanced Search Input with fuzzy autocomplete */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                ref={inputRef} 
                type="text" 
                placeholder="Sök förskola, kommun eller adress..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setShowSuggestions(true);
                  generateSuggestions(searchQuery);
                }}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10 border-0 focus:ring-2 focus:ring-primary/20 bg-white/90" 
              />
              {searchQuery && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted/50"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              
              {/* Enhanced suggestions dropdown with animations */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white/98 backdrop-blur-md border border-border/50 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
                  >
                    {!searchQuery.trim() && recentSearches.length > 0 && (
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/30">
                        Senaste sökningar
                      </div>
                    )}

                    {suggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`p-3 cursor-pointer text-sm hover:bg-accent/50 transition-colors border-b border-border/50 last:border-b-0 ${
                          selectedIndex === index ? 'bg-accent/70' : ''
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getSuggestionIcon(suggestion.type)}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {suggestion.title}
                              </div>
                              {suggestion.subtitle && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {suggestion.subtitle}
                                </div>
                              )}
                            </div>
                          </div>
                          {suggestion.count && (
                            <Badge variant="secondary" className="text-xs h-4 px-1 ml-2">
                              {suggestion.count}
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Show more results option */}
                    {!showAllResults && suggestions.length >= 10 && (
                      <div
                        className="p-2 text-center text-xs text-blue-600 cursor-pointer hover:bg-gray-100"
                        onClick={() => setShowAllResults(true)}
                      >
                        Visa fler resultat...
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Multi-municipality selector (from OptimizedSearchBar) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Kommuner {searchFilters.kommuner && searchFilters.kommuner.length > 0 && (
                    <span className="text-primary">({searchFilters.kommuner.length})</span>
                  )}
                </label>
                <div className="space-y-2">
                  {/* Selected municipalities with badges */}
                  {searchFilters.kommuner && searchFilters.kommuner.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {searchFilters.kommuner.map(kommun => (
                        <Badge
                          key={kommun}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1 pl-2 py-1 text-xs"
                        >
                          <span>{kommun}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newKommuner = searchFilters.kommuner?.filter(k => k !== kommun);
                              setSearchFilters({
                                ...searchFilters,
                                kommuner: newKommuner?.length ? newKommuner : undefined
                              });
                            }}
                            className="h-3 w-3 p-0 hover:bg-destructive/20"
                          >
                            <X className="h-2 w-2" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Add municipality selector */}
                  <Select 
                    value="add" 
                    onValueChange={value => {
                      if (value !== 'add' && value !== 'all') {
                        const currentKommuner = searchFilters.kommuner || [];
                        if (!currentKommuner.includes(value)) {
                          setSearchFilters({
                            ...searchFilters,
                            kommuner: [...currentKommuner, value]
                          });
                        }
                      } else if (value === 'all') {
                        setSearchFilters({
                          ...searchFilters,
                          kommuner: undefined
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="+ Lägg till kommun" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="all">Rensa alla kommuner</SelectItem>
                      {SWEDISH_MUNICIPALITIES.map(kommun => (
                        <SelectItem 
                          key={kommun} 
                          value={kommun} 
                          className="text-xs"
                          disabled={searchFilters.kommuner?.includes(kommun)}
                        >
                          {kommun} ({preschools.filter(p => p.kommun === kommun).length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Huvudman</label>
                <Select 
                  value={searchFilters.huvudman || 'all'} 
                  onValueChange={value => {
                    setSearchFilters({
                      ...searchFilters,
                      huvudman: value === 'all' ? undefined : value
                    });
                  }}
                >
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

            {/* Enhanced GPS location button with glassmorphism */}
            <Button 
              onClick={handleGetCurrentLocation} 
              variant={userLocation ? "default" : "outline"} 
              size="sm" 
              className="w-full hover-scale transition-all duration-200 font-medium backdrop-blur-sm"
              disabled={isLocating}
            >
              {isLocating ? (
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : userLocation ? (
                <Target className="w-4 h-4 mr-2" />
              ) : (
                <Navigation className="w-4 h-4 mr-2" />
              )}
              {isLocating ? "Hämtar position..." : userLocation ? "Position aktiv" : "🎯 Nära mig"}
            </Button>

            {/* Results count and clear all */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {hasActiveFilters ? (
                  `${filteredPreschools.length.toLocaleString()} av ${preschools.length.toLocaleString()} förskolor`
                ) : (
                  `${preschools.length.toLocaleString()} förskolor totalt`
                )}
              </div>
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSearch}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3 mr-1" />
                  Rensa allt
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// Helper function to get municipality center coordinates
function getKommunCenter(kommun: string): [number, number] | null {
  const kommunCoordinates: Record<string, [number, number]> = {
    'Stockholm': [18.0686, 59.3293],
    'Göteborg': [11.9746, 57.7089],
    'Malmö': [13.0034, 55.6050],
    'Uppsala': [17.6389, 59.8585],
    'Västerås': [16.5554, 59.6099],
    'Örebro': [15.2066, 59.2741],
    'Linköping': [15.6214, 58.4108],
    'Helsingborg': [12.6945, 56.0465],
    'Jönköping': [14.1618, 57.7826],
    'Norrköping': [16.1926, 58.5877],
    'Lund': [13.1910, 55.7047],
    'Umeå': [20.2630, 63.8258],
    'Gävle': [17.1414, 60.6749],
    'Borås': [12.9401, 57.7210],
    'Eskilstuna': [16.5077, 59.3706],
    'Södertälje': [17.6253, 59.1955],
    'Karlstad': [13.5034, 59.3793],
    'Växjö': [14.8059, 56.8777],
    'Halmstad': [12.8580, 56.6745],
    'Sundsvall': [17.3063, 62.3908],
    'Luleå': [22.1567, 65.5848],
    'Trollhättan': [12.2886, 58.2837],
    'Östersund': [14.6357, 63.1792],
    'Borlänge': [15.4357, 60.4858],
    'Falun': [15.6356, 60.6066],
    'Skövde': [13.8454, 58.3914],
    'Karlskrona': [15.5866, 56.1612],
    'Kristianstad': [14.1591, 56.0294],
    'Kalmar': [16.3614, 56.6634],
    'Kungälv': [11.9746, 57.8737],
    'Partille': [11.9989, 57.7396],
    'Mölndal': [12.0134, 57.6554],
    'Lerum': [12.2691, 57.7706]
  };
  
  return kommunCoordinates[kommun] || null;
}