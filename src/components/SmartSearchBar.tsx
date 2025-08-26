import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Building, Globe, Sliders } from 'lucide-react';
import { NearbyPreschoolsButton } from './NearbyPreschoolsButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    preschools,
    setSearchFilters,
    searchFilters,
    setMapCenter,
    setMapZoom,
    filteredPreschools
  } = useMapStore();

  // Filter states
  const [huvudmanFilter, setHuvudmanFilter] = useState<string>('');
  const [antalBarnRange, setAntalBarnRange] = useState<[number, number]>([0, 200]);
  const [personalRange, setPersonalRange] = useState<[number, number]>([0, 20]);
  const [examRange, setExamRange] = useState<[number, number]>([0, 100]);
  const hasActiveFilters = searchQuery || huvudmanFilter || antalBarnRange[0] > 0 || antalBarnRange[1] < 200 || personalRange[0] > 0 || personalRange[1] < 20 || examRange[0] > 0 || examRange[1] < 100;

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
    Array.from(kommunMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([kommun, count]) => {
      newSuggestions.push({
        type: 'kommun',
        name: kommun,
        matches: count
      });
    });

    // Add top preschool matches
    preschoolMatches.slice(0, 2).forEach(match => newSuggestions.push(match));
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
      // Apply kommun filter and zoom to kommun
      applyFilters({
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
        applyFilters({
          kommun: preschool.kommun || ''
        });
      }
    }
    setSearchQuery(suggestion.name);
    setIsExpanded(false);
    setSuggestions([]);
  };
  const applyFilters = (overrides = {}) => {
    const filters = {
      kommun: huvudmanFilter ? '' : searchQuery,
      huvudman: huvudmanFilter,
      minPersonaltäthet: personalRange[0] > 0 ? personalRange[0] : undefined,
      maxPersonaltäthet: personalRange[1] < 20 ? personalRange[1] : undefined,
      minExamen: examRange[0] > 0 ? examRange[0] : undefined,
      maxExamen: examRange[1] < 100 ? examRange[1] : undefined,
      minBarngrupper: antalBarnRange[0] > 0 ? antalBarnRange[0] : undefined,
      maxBarngrupper: antalBarnRange[1] < 200 ? antalBarnRange[1] : undefined,
      ...overrides
    };
    setSearchFilters(filters);
  };
  const clearFilters = () => {
    setSearchQuery('');
    setHuvudmanFilter('');
    setAntalBarnRange([0, 200]);
    setPersonalRange([0, 20]);
    setExamRange([0, 100]);
    setSearchFilters({});
    setMapCenter([15.5, 62.0]);
    setMapZoom(5.5);
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
  const getIcon = (type: string) => {
    switch (type) {
      case 'kommun':
        return <Globe className="w-4 h-4" />;
      case 'preschool':
        return <Building className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };
  const handleNearMe = () => {
    navigator.geolocation.getCurrentPosition(position => {
      const {
        latitude,
        longitude
      } = position.coords;
      setMapCenter([longitude, latitude]);
      setMapZoom(12);
    }, error => {
      console.error('Error getting location:', error);
    });
  };
  return <div className={`relative z-50 ${className}`}>
      <AnimatePresence mode="wait">
        {!isExpanded ? <motion.div key="collapsed" initial={{
        scale: 0.9
      }} animate={{
        scale: 1
      }} exit={{
        scale: 0.9
      }} transition={{
        duration: 0.2
      }} className="my-0 py-0">
            <Button onClick={handleExpand} variant="outline" size="icon" className="w-10 h-10 backdrop-blur-xl border-border/50 shadow-lg bg-slate-700 hover:bg-slate-600 py-0 text-center text-base rounded-sm px-[40px] my-[15px] mx-[30px]">
              <Search className="w-4 h-4" />
            </Button>
          </motion.div> : <motion.div key="expanded" initial={{
        width: 40,
        opacity: 0
      }} animate={{
        width: 380,
        opacity: 1
      }} exit={{
        width: 40,
        opacity: 0
      }} transition={{
        duration: 0.3,
        ease: "easeInOut"
      }} className="overflow-hidden">
            <Card className="p-4 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
              {/* Search Input */}
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input ref={inputRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Sök kommun, förskola..." className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0" />
                <Button onClick={handleCollapse} variant="ghost" size="icon" className="w-6 h-6 rounded-full">
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex gap-2 mb-3">
                <NearbyPreschoolsButton />
                <Button onClick={searchQuery && !hasActiveFilters ? () => applyFilters() : clearFilters} variant={hasActiveFilters ? "destructive" : "default"} size="sm" className="text-xs h-7">
                  {hasActiveFilters ? "Rensa" : "Sök"}
                </Button>
              </div>

              {/* Filters Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3 h-3" />
                  <span className="text-xs font-medium">Filter</span>
                </div>

                {/* Huvudman Filter */}
                <div>
                  <Label className="text-xs text-muted-foreground">Huvudman</Label>
                  <Select value={huvudmanFilter} onValueChange={setHuvudmanFilter}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Alla" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alla</SelectItem>
                      <SelectItem value="Kommunal">Kommunal</SelectItem>
                      <SelectItem value="Enskild">Enskild</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Antal Barn Range */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Antal barn: {antalBarnRange[0]} - {antalBarnRange[1]}
                  </Label>
                  <Slider value={antalBarnRange} onValueChange={value => setAntalBarnRange(value as [number, number])} max={200} min={0} step={5} className="mt-1" />
                </div>

                {/* Personal Range */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Personaltäthet: {personalRange[0]} - {personalRange[1]}
                  </Label>
                  <Slider value={personalRange} onValueChange={value => setPersonalRange(value as [number, number])} max={20} min={0} step={0.5} className="mt-1" />
                </div>

                {/* Lärarexamen Range */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Lärarexamen %: {examRange[0]} - {examRange[1]}
                  </Label>
                  <Slider value={examRange} onValueChange={value => setExamRange(value as [number, number])} max={100} min={0} step={5} className="mt-1" />
                </div>
              </div>

              {/* Results Counter */}
              {hasActiveFilters && <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="text-xs text-muted-foreground">
                    {filteredPreschools.length} förskolor hittades
                  </div>
                </div>}

              {/* Suggestions */}
              <AnimatePresence>
                {suggestions.length > 0 && <motion.div initial={{
              opacity: 0,
              y: -10
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: -10
            }} className="mt-3 border-t border-border/50 pt-3">
                    {suggestions.map((suggestion, index) => <motion.button key={`${suggestion.type}-${suggestion.name}`} onClick={() => handleSuggestionSelect(suggestion)} className={`w-full flex items-center gap-2 p-2 rounded-md text-left text-xs transition-colors ${index === selectedIndex ? 'bg-accent/50 text-accent-foreground' : 'hover:bg-muted/50'}`} whileHover={{
                scale: 1.02
              }} whileTap={{
                scale: 0.98
              }}>
                        {getIcon(suggestion.type)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{suggestion.name}</div>
                          {suggestion.kommun && suggestion.type === 'preschool' && <div className="text-xs text-muted-foreground truncate">
                              {suggestion.kommun}
                            </div>}
                        </div>
                        {suggestion.type === 'kommun' && <div className="text-xs text-muted-foreground">
                            {suggestion.matches} st
                          </div>}
                      </motion.button>)}
                  </motion.div>}
              </AnimatePresence>
            </Card>
          </motion.div>}
      </AnimatePresence>
    </div>;
};