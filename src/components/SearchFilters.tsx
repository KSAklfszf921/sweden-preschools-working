import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMapStore } from '@/stores/mapStore';
import { Filter, X, MapPin, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchFiltersProps {
  className?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    searchFilters,
    setSearchFilters,
    preschools,
    filteredPreschools,
    setMapCenter,
    setMapZoom
  } = useMapStore();

  // Get unique values for dropdowns
  const uniqueKommuner = [...new Set(preschools.map(p => p.kommun))].sort();
  const uniqueHuvudman = [...new Set(preschools.map(p => p.huvudman))].sort();

  const handleLocationSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      if (searchQuery.toLowerCase() === 'min position') {
        navigator.geolocation.getCurrentPosition((position) => {
          const center: [number, number] = [position.coords.longitude, position.coords.latitude];
          setSearchFilters({
            center: center,
            radius: 10
          });
          setMapCenter(center);
          setMapZoom(12);
        });
      } else {
        // Check if it's a kommun name
        const kommun = uniqueKommuner.find(k => 
          k.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (kommun) {
          setSearchFilters({ kommun });
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const clearFilters = () => {
    setSearchFilters({});
    setSearchQuery('');
    setMapCenter([15.0, 62.0]);
    setMapZoom(5);
  };

  const hasActiveFilters = Object.keys(searchFilters).length > 0;
  const filterCount = Object.keys(searchFilters).filter(key => 
    searchFilters[key as keyof typeof searchFilters] !== undefined
  ).length;

  // Minimized view
  if (!isExpanded) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`fixed top-4 left-4 z-30 ${className}`}
      >
        <Card className="bg-card/95 backdrop-blur-sm shadow-nordic border-border">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsExpanded(true)}
                variant="ghost"
                size="sm"
                className="h-8 px-2"
              >
                <Search className="h-3 w-3 mr-1" />
                <span className="text-xs">Sök & Filter</span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {filterCount}
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Quick stats */}
            <div className="mt-2 text-xs text-muted-foreground">
              {filteredPreschools.length.toLocaleString()} förskolor
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Expanded view
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`fixed top-4 left-4 z-30 w-72 ${className}`}
    >
      <Card className="bg-card/95 backdrop-blur-sm shadow-nordic border-border">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-foreground">Sök & Filter</h3>
              {hasActiveFilters && (
                <Badge variant="secondary" className="h-5">
                  {filterCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Button
                onClick={() => setIsExpanded(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Sök kommun eller 'min position'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLocationSearch();
                  }
                }}
                className="flex-1 h-8 text-sm"
              />
              <Button 
                onClick={handleLocationSearch}
                size="sm"
                variant="default"
                className="h-8 px-3"
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>

            {/* Quick filters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Kommun</label>
                <Select
                  value={searchFilters.kommun || ''}
                  onValueChange={(value) => setSearchFilters({ kommun: value || undefined })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Välj kommun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alla kommuner</SelectItem>
                    {uniqueKommuner.slice(0, 20).map(kommun => (
                      <SelectItem key={kommun} value={kommun} className="text-xs">
                        {kommun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Huvudman</label>
                <Select
                  value={searchFilters.huvudman || ''}
                  onValueChange={(value) => setSearchFilters({ huvudman: value || undefined })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Välj typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alla typer</SelectItem>
                    {uniqueHuvudman.map(huvudman => (
                      <SelectItem key={huvudman} value={huvudman} className="text-xs">
                        {huvudman}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results summary */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Resultat:</span>
                <span className="font-medium text-foreground">
                  {filteredPreschools.length.toLocaleString()} förskolor
                </span>
              </div>
              {hasActiveFilters && (
                <div className="mt-2">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs"
                  >
                    Rensa alla filter
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};