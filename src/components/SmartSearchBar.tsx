import React, { useState } from 'react';
import { Search, X, MapPin, Filter, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';

interface SmartSearchBarProps {
  className?: string;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleLocationSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      if (searchQuery.toLowerCase() === 'min position') {
        navigator.geolocation.getCurrentPosition((position) => {
          const center: [number, number] = [position.coords.longitude, position.coords.latitude];
          setSearchFilters({
            center: center,
            radius: 10000 // 10km radius
          });
          setMapCenter(center);
          setMapZoom(12);
          setIsLoading(false);
        }, (error) => {
          console.error('Geolocation error:', error);
          setIsLoading(false);
        });
      } else {
        // Check if it's a kommun name
        const kommun = uniqueKommuner.find(k => 
          k.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (kommun) {
          setSearchFilters({ kommuner: kommun ? [kommun] : undefined });
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFilters({});
    setMapCenter([15.0, 62.0]);
    setMapZoom(5);
  };

  const hasActiveSearch = searchQuery.length > 0 || Object.keys(searchFilters).length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-md mx-4 ${className}`}
    >
      <Card className="bg-card/95 backdrop-blur-lg shadow-lg border-border/50">
        <div className="p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Sök kommun, förskola eller 'min position'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLocationSearch();
                  }
                }}
                className="pr-8 h-9 text-sm"
              />
              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button 
              onClick={handleLocationSearch}
              disabled={isLoading || !searchQuery.trim()}
              size="sm"
              className="h-9 px-3"
            >
              {isLoading ? (
                <div className="animate-spin w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                <Search className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Results summary */}
          {hasActiveSearch && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {filteredPreschools.length.toLocaleString()} förskolor
              </span>
              <Button
                onClick={clearSearch}
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-xs"
              >
                Rensa
              </Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};