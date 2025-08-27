import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Building, Clock, X } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface SearchSuggestion {
  id: string;
  type: 'preschool' | 'kommun' | 'area' | 'recent';
  title: string;
  subtitle?: string;
  coordinates?: [number, number];
  preschoolId?: number;
}

export const SmartSearchAutocomplete: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { 
    preschools, 
    setMapCenter, 
    setMapZoom, 
    setSelectedPreschool,
    searchTerm,
    setSearchTerm 
  } = useMapStore();

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

  // Generate suggestions based on real Supabase data
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return recentSearches.slice(0, 5);
    }

    const query = searchQuery.toLowerCase().trim();
    const results: SearchSuggestion[] = [];

    // Search in preschool names (real data from Supabase)
    const preschoolMatches = preschools
      .filter(p => 
        p.namn && 
        p.namn.toLowerCase().includes(query) &&
        p.latitud && 
        p.longitud
      )
      .slice(0, 8)
      .map(p => ({
        id: `preschool-${p.id}`,
        type: 'preschool' as const,
        title: p.namn,
        subtitle: `${p.kommun} • ${p.huvudman || 'Okänd huvudman'}`,
        coordinates: [p.longitud!, p.latitud!] as [number, number],
        preschoolId: p.id
      }));

    results.push(...preschoolMatches);

    // Search in kommun names (real data from Supabase)
    const kommunMatches = [...new Set(
      preschools
        .filter(p => 
          p.kommun && 
          p.kommun.toLowerCase().includes(query) &&
          p.latitud && 
          p.longitud
        )
        .map(p => p.kommun)
    )]
      .slice(0, 5)
      .map(kommun => {
        // Find center point of kommun based on actual preschool locations
        const kommunPreschools = preschools.filter(p => 
          p.kommun === kommun && 
          p.latitud && 
          p.longitud
        );
        
        const avgLat = kommunPreschools.reduce((sum, p) => sum + p.latitud!, 0) / kommunPreschools.length;
        const avgLng = kommunPreschools.reduce((sum, p) => sum + p.longitud!, 0) / kommunPreschools.length;
        
        return {
          id: `kommun-${kommun}`,
          type: 'kommun' as const,
          title: kommun,
          subtitle: `${kommunPreschools.length} förskolor`,
          coordinates: [avgLng, avgLat] as [number, number]
        };
      });

    results.push(...kommunMatches);

    // Search in addresses (real data from Supabase)
    const addressMatches = preschools
      .filter(p => 
        p.adress && 
        p.adress.toLowerCase().includes(query) &&
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

    return results.slice(0, 12);
  }, [searchQuery, preschools, recentSearches]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSearchTerm(value);
    setSelectedIndex(-1);
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.title);
    setSearchTerm(suggestion.title);
    setIsOpen(false);
    setSelectedIndex(-1);

    // Save to recent searches (avoid duplicates)
    const newRecent = [
      suggestion,
      ...recentSearches.filter(r => r.id !== suggestion.id)
    ].slice(0, 10);
    
    setRecentSearches(newRecent);
    localStorage.setItem('preschool-recent-searches', JSON.stringify(newRecent));

    // Navigate to location
    if (suggestion.coordinates) {
      setMapCenter(suggestion.coordinates);
      
      if (suggestion.type === 'preschool' && suggestion.preschoolId) {
        const preschool = preschools.find(p => p.id === suggestion.preschoolId);
        if (preschool) {
          setSelectedPreschool(preschool);
          setMapZoom(15);
        }
      } else if (suggestion.type === 'kommun') {
        setMapZoom(11);
      } else {
        setMapZoom(13);
      }
    }

    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

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

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Sök förskola, kommun eller adress..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 bg-white/95 backdrop-blur-sm border border-border/50"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="bg-white/98 backdrop-blur-md border border-border/50 shadow-lg max-h-80 overflow-y-auto">
              <div className="p-2">
                {!searchQuery.trim() && recentSearches.length > 0 && (
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/30">
                    Senaste sökningar
                  </div>
                )}

                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-accent/50 transition-colors ${
                      selectedIndex === index ? 'bg-accent/70' : ''
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    {getSuggestionIcon(suggestion.type)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {suggestion.title}
                      </div>
                      {suggestion.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close suggestions */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};