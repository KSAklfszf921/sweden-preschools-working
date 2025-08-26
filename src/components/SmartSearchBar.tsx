import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Building, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';

interface SearchSuggestion {
  type: 'kommun' | 'preschool' | 'address';
  name: string;
  kommun?: string;
  matches: number;
}

interface SmartSearchBarProps {
  className?: string;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { preschools, setSearchFilters, searchFilters, setMapCenter, setMapZoom } = useMapStore();

  // Generate suggestions based on search query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Get unique kommuner and count matches
    const kommunMap = new Map<string, number>();
    const preschoolMatches: SearchSuggestion[] = [];

    preschools.forEach(preschool => {
      // Count kommun matches
      if (preschool.kommun?.toLowerCase().includes(query)) {
        kommunMap.set(preschool.kommun, (kommunMap.get(preschool.kommun) || 0) + 1);
      }

      // Check preschool name matches
      if (preschool.namn?.toLowerCase().includes(query)) {
        preschoolMatches.push({
          type: 'preschool',
          name: preschool.namn,
          kommun: preschool.kommun,
          matches: 1
        });
      }
    });

    // Add kommun suggestions
    Array.from(kommunMap.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by match count
      .slice(0, 3)
      .forEach(([kommun, count]) => {
        newSuggestions.push({
          type: 'kommun',
          name: kommun,
          matches: count
        });
      });

    // Add top preschool matches
    preschoolMatches
      .slice(0, 2)
      .forEach(match => newSuggestions.push(match));

    setSuggestions(newSuggestions.slice(0, 5));
    setSelectedIndex(-1);
  }, [searchQuery, preschools]);

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setSearchQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'kommun') {
      setSearchFilters({
        ...searchFilters,
        kommun: suggestion.name
      });
      
      // Find centrum of kommun for map positioning
      const kommunPreschools = preschools.filter(p => p.kommun === suggestion.name && p.latitud && p.longitud);
      if (kommunPreschools.length > 0) {
        const avgLat = kommunPreschools.reduce((sum, p) => sum + p.latitud!, 0) / kommunPreschools.length;
        const avgLng = kommunPreschools.reduce((sum, p) => sum + p.longitud!, 0) / kommunPreschools.length;
        setMapCenter([avgLng, avgLat]);
        setMapZoom(11);
      }
    } else if (suggestion.type === 'preschool') {
      const preschool = preschools.find(p => p.namn === suggestion.name);
      if (preschool && preschool.latitud && preschool.longitud) {
        setMapCenter([preschool.longitud, preschool.latitud]);
        setMapZoom(15);
        setSearchFilters({
          ...searchFilters,
          kommun: preschool.kommun || ''
        });
      }
    }

    setSearchQuery(suggestion.name);
    setIsExpanded(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCollapse();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[selectedIndex]);
    }
  };

  const clearSearch = () => {
    setSearchFilters({
      ...searchFilters,
      kommun: ''
    });
    setSearchQuery('');
    setMapCenter([15.5, 62.0]);
    setMapZoom(5.5);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'kommun': return <Globe className="w-4 h-4" />;
      case 'preschool': return <Building className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className={`relative z-50 ${className}`}>
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            key="collapsed"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={handleExpand}
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full bg-card/80 backdrop-blur-xl border-border/50 shadow-sm hover:bg-card/90"
            >
              <Search className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ width: 40, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <Card className="p-3 bg-card/90 backdrop-blur-xl border-border/50 shadow-lg">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Sök kommun, förskola..."
                  className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                />
                {searchQuery && (
                  <Button
                    onClick={clearSearch}
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  onClick={handleCollapse}
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 rounded-full"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 border-t border-border/50 pt-2"
                  >
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        key={`${suggestion.type}-${suggestion.name}`}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className={`w-full flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors ${
                          index === selectedIndex
                            ? 'bg-accent/50 text-accent-foreground'
                            : 'hover:bg-muted/50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {getIcon(suggestion.type)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{suggestion.name}</div>
                          {suggestion.kommun && suggestion.type === 'preschool' && (
                            <div className="text-xs text-muted-foreground truncate">
                              {suggestion.kommun}
                            </div>
                          )}
                        </div>
                        {suggestion.type === 'kommun' && (
                          <div className="text-xs text-muted-foreground">
                            {suggestion.matches} förskolor
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};