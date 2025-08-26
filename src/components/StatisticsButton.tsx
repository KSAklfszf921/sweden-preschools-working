import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMapStore } from '@/stores/mapStore';

export const StatisticsButton: React.FC = () => {
  const { searchFilters, filteredPreschools, preschools, showStatistics, setShowStatistics } = useMapStore();

  // Check if filters are active and calculate dynamic text
  const hasActiveFilters = Object.keys(searchFilters).some(key => {
    const value = searchFilters[key as keyof typeof searchFilters];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== '' && value !== null;
  });

  const getButtonText = () => {
    if (showStatistics) return 'Dölj statistik';
    
    if (hasActiveFilters) {
      const count = filteredPreschools.length;
      
      if (searchFilters.kommuner && searchFilters.kommuner.length > 0) {
        if (searchFilters.kommuner.length === 1) {
          return `Statistik för ${searchFilters.kommuner[0]} (${count})`;
        } else {
          return `Statistik för ${searchFilters.kommuner.length} kommuner (${count})`;
        }
      }
      if (searchFilters.nearbyMode) return `Statistik närområde (${count})`;
      if (searchFilters.huvudman) return `Statistik ${searchFilters.huvudman.toLowerCase()}a (${count})`;
      if (searchFilters.query) return `Statistik för "${searchFilters.query}" (${count})`;
      return `Statistik för filter (${count})`;
    }
    
    return `Visa statistik (${preschools.length})`;
  };

  const getBadgeColor = () => {
    if (!hasActiveFilters) return '';
    const ratio = filteredPreschools.length / preschools.length;
    if (ratio > 0.5) return 'bg-green-500/20 text-green-700';
    if (ratio > 0.2) return 'bg-yellow-500/20 text-yellow-700';
    return 'bg-blue-500/20 text-blue-700';
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setShowStatistics(!showStatistics)}
        variant={showStatistics ? "default" : "outline"}
        size="sm"
        data-testid="statistics-button"
        className="glass-panel border-0 shadow-lg hover:shadow-nordic transition-all duration-300 font-medium"
      >
        <BarChart3 className="w-4 h-4 mr-2" />
        {getButtonText()}
      </Button>
      
      {hasActiveFilters && (
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getBadgeColor()} border-2 border-background animate-pulse`} />
      )}
    </div>
  );
};