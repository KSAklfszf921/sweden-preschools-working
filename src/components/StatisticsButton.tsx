import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatisticsComparisonModal } from './StatisticsComparisonModal';
import { useMapStore } from '@/stores/mapStore';

export const StatisticsButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { searchFilters, filteredPreschools, preschools } = useMapStore();

  // Check if filters are active
  const hasActiveFilters = Object.keys(searchFilters).some(key => {
    const value = searchFilters[key as keyof typeof searchFilters];
    return value !== undefined && value !== '' && value !== null;
  }) && filteredPreschools.length !== preschools.length;

  if (!hasActiveFilters) return null;

  const getButtonText = () => {
    if (searchFilters.kommun) return `Statistik för ${searchFilters.kommun}`;
    if (searchFilters.radius) return 'Statistik för närområdet';
    if (searchFilters.huvudman) return `Statistik för ${searchFilters.huvudman.toLowerCase()}a`;
    return 'Statistik för filter';
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="outline"
        size="sm"
        className="bg-card/80 backdrop-blur-xl border-border/50 shadow-lg hover:bg-card/90"
      >
        <BarChart3 className="w-4 h-4 mr-2" />
        {getButtonText()}
      </Button>

      <StatisticsComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};