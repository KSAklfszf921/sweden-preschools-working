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
  return;
};