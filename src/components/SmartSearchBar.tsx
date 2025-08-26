import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Filter, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMapStore } from '@/stores/mapStore';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchFilters } from '@/components/SearchFilters';

export const SmartSearchBar: React.FC = () => {
  const { preschools, searchFilters, setSearchFilters, clearFilters } = useMapStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get unique municipalities for suggestions
  const uniqueKommuner = [...new Set(preschools.map(p => p.kommun))].filter(Boolean).sort();

  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsLoading(true);
      
      // Generate suggestions based on search query
      const filteredKommuner = uniqueKommuner.filter(kommun => 
        kommun.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

      const filteredPreschools = preschools
        .filter(p => p.namn.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 3)
        .map(p => p.namn);

      setSuggestions([...filteredKommuner, ...filteredPreschools]);
      setShowSuggestions(true);

      // Auto-apply filters for exact matches
      const kommun = uniqueKommuner.find(k => 
        k.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (kommun) {
        setSearchFilters({ kommuner: [kommun] });
      } else {
        // Search in preschool names
        const matchingPreschools = preschools.filter(p => 
          p.namn.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (matchingPreschools.length > 0) {
          setSearchFilters({ query: searchQuery });
        }
      }
      setIsLoading(false);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  }, [searchQuery, preschools, uniqueKommuner, setSearchFilters]);

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    clearFilters();
  };

  const hasActiveFilters = () => {
    return Object.keys(searchFilters).some(key => {
      const value = searchFilters[key as keyof typeof searchFilters];
      return value !== undefined && value !== null && 
        (Array.isArray(value) ? value.length > 0 : 
         typeof value === 'string' ? value.length > 0 : 
         typeof value === 'boolean' ? value : true);
    });
  };

  return (
    <div className="relative w-80">
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
        <div className="flex items-center gap-2 p-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Sök förskolor, kommuner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 border-0 focus:ring-2 focus:ring-primary/20"
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
          </div>

          {/* Filter toggle button */}
          <Button
            size="sm"
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilters() && (
              <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                !
              </Badge>
            )}
          </Button>

          {/* Clear all filters button */}
          {hasActiveFilters() && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSearch}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              title="Rensa alla filter"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Active filters display */}
        {hasActiveFilters() && (
          <div className="px-3 pb-2">
            <div className="flex flex-wrap gap-1">
              {searchFilters.query && (
                <Badge variant="secondary" className="text-xs">
                  Sök: {searchFilters.query}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSearchFilters({ ...searchFilters, query: undefined })}
                    className="ml-1 h-3 w-3 p-0"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              {searchFilters.kommuner && searchFilters.kommuner.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Kommuner: {searchFilters.kommuner.length}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSearchFilters({ ...searchFilters, kommuner: undefined })}
                    className="ml-1 h-3 w-3 p-0"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              {searchFilters.nearbyMode && (
                <Badge variant="secondary" className="text-xs">
                  I närheten
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSearchFilters({ ...searchFilters, nearbyMode: false, center: undefined, radius: undefined })}
                    className="ml-1 h-3 w-3 p-0"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Advanced filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <SearchFilters onClose={() => setShowFilters(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 z-40"
          >
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border/20 last:border-0"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    setShowSuggestions(false);
                    setSearchFilters({ query: suggestion });
                  }}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </div>
              ))}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};