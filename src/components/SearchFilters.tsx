import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useMapStore } from '@/stores/mapStore';
import { Filter, X, MapPin, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchFiltersProps {
  className?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [personaltathetRange, setPersonaltathetRange] = useState<[number, number]>([0, 10]);
  const [examenRange, setExamenRange] = useState<[number, number]>([0, 100]);
  const [barngruppRange, setBarngruppRange] = useState<[number, number]>([1, 15]);
  const [radiusKm, setRadiusKm] = useState(10);
  
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
      // Use browser geolocation or geocoding service
        if (searchQuery.toLowerCase() === 'min position') {
        navigator.geolocation.getCurrentPosition((position) => {
          const center: [number, number] = [position.coords.longitude, position.coords.latitude];
          setSearchFilters({
            center: center,
            radius: radiusKm
          });
          setMapCenter(center);
          setMapZoom(12);
        });
      } else {
        // Search for kommun or address
        const matchingKommun = uniqueKommuner.find(k => 
          k.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (matchingKommun) {
          setSearchFilters({ kommun: matchingKommun });
          
          // Find center of kommun
          const kommunPreschools = preschools.filter(p => p.kommun === matchingKommun);
          if (kommunPreschools.length > 0) {
            const avgLat = kommunPreschools.reduce((sum, p) => sum + p.latitud, 0) / kommunPreschools.length;
            const avgLng = kommunPreschools.reduce((sum, p) => sum + p.longitud, 0) / kommunPreschools.length;
            setMapCenter([avgLng, avgLat]);
            setMapZoom(10);
          }
        }
      }
    } catch (error) {
      console.error('Location search error:', error);
    }
  };

  const clearFilters = () => {
    setSearchFilters({});
    setSearchQuery('');
    setPersonaltathetRange([0, 10]);
    setExamenRange([0, 100]);
    setBarngruppRange([1, 15]);
    setRadiusKm(10);
  };

  const hasActiveFilters = Object.keys(searchFilters).length > 0;

  return (
    <Card className={`bg-card/95 backdrop-blur-sm border-border/50 ${className}`}>
      <div className="p-4">
        {/* Header with toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Sök & Filtrera</h3>
            {hasActiveFilters && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {filteredPreschools.length}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
          </Button>
        </div>

        {/* Search bar - always visible */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Sök kommun eller skriv 'min position'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleLocationSearch} disabled={!searchQuery.trim()}>
            <MapPin className="w-4 h-4" />
          </Button>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Basic filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kommun">Kommun</Label>
                  <Select
                    value={searchFilters.kommun || ''}
                    onValueChange={(value) => setSearchFilters({ kommun: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj kommun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alla kommuner</SelectItem>
                      {uniqueKommuner.map(kommun => (
                        <SelectItem key={kommun} value={kommun}>{kommun}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="huvudman">Huvudman</Label>
                  <Select
                    value={searchFilters.huvudman || ''}
                    onValueChange={(value) => setSearchFilters({ huvudman: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj huvudman" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alla huvudmän</SelectItem>
                      {uniqueHuvudman.map(huvudman => (
                        <SelectItem key={huvudman} value={huvudman}>{huvudman}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Range filters */}
              <div className="space-y-4">
                <div>
                  <Label>Personaltäthet: {personaltathetRange[0]} - {personaltathetRange[1]}</Label>
                  <Slider
                    value={personaltathetRange}
                    onValueChange={(value) => {
                      setPersonaltathetRange(value as [number, number]);
                      setSearchFilters({
                        minPersonaltäthet: value[0],
                        maxPersonaltäthet: value[1]
                      });
                    }}
                    max={10}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Andel med förskollärarexamen: {examenRange[0]}% - {examenRange[1]}%</Label>
                  <Slider
                    value={examenRange}
                    onValueChange={(value) => {
                      setExamenRange(value as [number, number]);
                      setSearchFilters({
                        minExamen: value[0],
                        maxExamen: value[1]
                      });
                    }}
                    max={100}
                    min={0}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Antal barngrupper: {barngruppRange[0]} - {barngruppRange[1]}</Label>
                  <Slider
                    value={barngruppRange}
                    onValueChange={(value) => {
                      setBarngruppRange(value as [number, number]);
                      setSearchFilters({
                        minBarngrupper: value[0],
                        maxBarngrupper: value[1]
                      });
                    }}
                    max={15}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {searchFilters.center && (
                  <div>
                    <Label>Sökradie: {radiusKm} km</Label>
                    <Slider
                      value={[radiusKm]}
                      onValueChange={(value) => {
                        setRadiusKm(value[0]);
                        setSearchFilters({ radius: value[0] });
                      }}
                      max={50}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  Rensa filter
                </Button>
                <Button onClick={() => setIsExpanded(false)} className="flex-1">
                  Visa resultat ({filteredPreschools.length})
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};