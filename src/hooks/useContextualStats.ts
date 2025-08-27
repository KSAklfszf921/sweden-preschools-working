import { useState, useEffect, useMemo } from 'react';
import { useMapStore } from '@/stores/mapStore';
import type { Preschool } from '@/stores/mapStore';

export interface ContextualStats {
  title: string;
  context: 'sweden' | 'municipality' | 'viewport' | 'nearby' | 'search';
  contextDescription: string;
  totalPreschools: number;
  totalChildren: number;
  avgChildrenPerPreschool: number;
  teacherPercentage: number;
  staffRatio: number;
  avgRating: number;
  communalCount: number;
  privateCount: number;
  communalPercentage: number;
  privatePercentage: number;
  comparisonWithNational: {
    teacherPercentage: 'above' | 'below' | 'equal';
    staffRatio: 'above' | 'below' | 'equal';
    avgChildren: 'above' | 'below' | 'equal';
  };
  preschools: Preschool[];
}

// National averages for comparison
const NATIONAL_AVERAGES = {
  teacherPercentage: 40.8,
  staffRatio: 5.1,
  avgChildrenPerPreschool: 55
};

export const useContextualStats = (): ContextualStats => {
  const { 
    preschools,
    filteredPreschools, 
    visiblePreschools,
    selectedMunicipality,
    searchQuery,
    isGeolocationActive,
    userLocation,
    mapBounds
  } = useMapStore();

  const [context, setContext] = useState<'sweden' | 'municipality' | 'viewport' | 'nearby' | 'search'>('sweden');

  const stats = useMemo(() => {
    let contextPreschools = filteredPreschools;
    let title = "Statistik & Analys";
    let contextDescription = "Statistik för alla förskolor";
    let newContext: typeof context = 'sweden';

    // Determine context based on current state
    if (searchQuery && searchQuery.trim() !== '') {
      // User has searched for something specific
      contextPreschools = filteredPreschools;
      title = "Statistik & Analys";
      contextDescription = `Sökresultat för "${searchQuery}"`;
      newContext = 'search';
    } else if (selectedMunicipality) {
      // User has selected a specific municipality
      contextPreschools = preschools.filter(p => 
        p.kommun?.toLowerCase() === selectedMunicipality.toLowerCase()
      );
      title = "Statistik & Analys";
      contextDescription = `Statistik för ${selectedMunicipality}`;
      newContext = 'municipality';
    } else if (isGeolocationActive && userLocation) {
      // User has geolocation active - show nearby preschools
      contextPreschools = visiblePreschools.length > 0 ? visiblePreschools : filteredPreschools;
      title = "Statistik & Analys"; 
      contextDescription = "Statistik för närområdet";
      newContext = 'nearby';
    } else if (visiblePreschools.length > 0 && visiblePreschools.length < filteredPreschools.length * 0.8) {
      // User has zoomed in to a specific area
      contextPreschools = visiblePreschools;
      title = "Statistik & Analys";
      contextDescription = `Statistik för ${contextPreschools.length} förskolor i området`;
      newContext = 'viewport';
    } else {
      // Default - all preschools
      contextPreschools = filteredPreschools;
      title = "Statistik & Analys";
      contextDescription = "Statistik för alla förskolor";
      newContext = 'sweden';
    }

    setContext(newContext);

    // Calculate statistics
    const validPreschools = contextPreschools.filter(p => p && typeof p === 'object');
    const totalPreschools = validPreschools.length;
    
    // Total children calculation
    const totalChildren = validPreschools.reduce((sum, p) => {
      const children = p.antal_barn || 0;
      return sum + (typeof children === 'number' ? children : 0);
    }, 0);

    // Average children per preschool
    const avgChildrenPerPreschool = totalPreschools > 0 ? 
      Math.round(totalChildren / totalPreschools) : 0;

    // Teacher percentage calculation
    const preschoolsWithTeachers = validPreschools.filter(p => 
      p.personal_andel_forskollararexamen != null && 
      p.personal_andel_forskollararexamen > 0
    );
    
    const teacherPercentage = preschoolsWithTeachers.length > 0 ?
      preschoolsWithTeachers.reduce((sum, p) => {
        const percentage = p.personal_andel_forskollararexamen || 0;
        return sum + (percentage * 100); // Convert to percentage if it's a decimal
      }, 0) / preschoolsWithTeachers.length : 0;

    // Staff ratio calculation (approximate based on children and groups)
    const preschoolsWithStaffData = validPreschools.filter(p => 
      p.antal_barn && p.antal_barn > 0
    );
    
    const staffRatio = preschoolsWithStaffData.length > 0 ?
      preschoolsWithStaffData.reduce((sum, p) => {
        // Estimate: approximately 1 staff per 6 children (Swedish standard)
        const estimatedStaff = Math.ceil((p.antal_barn || 0) / 6);
        return sum + (estimatedStaff > 0 ? (p.antal_barn || 0) / estimatedStaff : 0);
      }, 0) / preschoolsWithStaffData.length : 5.1;

    // Google rating calculation
    const preschoolsWithRating = validPreschools.filter(p => 
      p.google_rating && p.google_rating > 0
    );
    
    const avgRating = preschoolsWithRating.length > 0 ?
      preschoolsWithRating.reduce((sum, p) => sum + (p.google_rating || 0), 0) / preschoolsWithRating.length : 0;

    // Communal vs Private distribution
    const communalCount = validPreschools.filter(p => 
      p.huvudman && p.huvudman.toLowerCase().includes('kommunal')
    ).length;
    
    const privateCount = validPreschools.filter(p => 
      p.huvudman && !p.huvudman.toLowerCase().includes('kommunal')
    ).length;

    const communalPercentage = totalPreschools > 0 ? (communalCount / totalPreschools) * 100 : 0;
    const privatePercentage = totalPreschools > 0 ? (privateCount / totalPreschools) * 100 : 0;

    // Comparison with national averages
    const getComparison = (current: number, national: number): 'above' | 'below' | 'equal' => {
      const diff = Math.abs(current - national);
      if (diff < national * 0.05) return 'equal'; // Within 5%
      return current > national ? 'above' : 'below';
    };

    const comparisonWithNational = {
      teacherPercentage: getComparison(teacherPercentage, NATIONAL_AVERAGES.teacherPercentage),
      staffRatio: getComparison(staffRatio, NATIONAL_AVERAGES.staffRatio),
      avgChildren: getComparison(avgChildrenPerPreschool, NATIONAL_AVERAGES.avgChildrenPerPreschool)
    };

    return {
      title,
      context: newContext,
      contextDescription,
      totalPreschools,
      totalChildren,
      avgChildrenPerPreschool,
      teacherPercentage: Math.round(teacherPercentage * 10) / 10, // Round to 1 decimal
      staffRatio: Math.round(staffRatio * 10) / 10,
      avgRating: Math.round(avgRating * 10) / 10,
      communalCount,
      privateCount,
      communalPercentage: Math.round(communalPercentage * 10) / 10,
      privatePercentage: Math.round(privatePercentage * 10) / 10,
      comparisonWithNational,
      preschools: validPreschools
    };
  }, [
    preschools,
    filteredPreschools, 
    visiblePreschools,
    selectedMunicipality,
    searchQuery,
    isGeolocationActive,
    userLocation,
    mapBounds
  ]);

  return stats;
};