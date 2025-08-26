import { HeatmapType } from '@/stores/mapStore';

// Swedish nature-inspired gradient colors
export const HEATMAP_GRADIENTS = {
  density: {
    name: 'Förskoltäthet',
    description: 'Antal förskolor per område',
    colors: [
      { stop: 0, color: 'rgba(0, 0, 0, 0)' },           // Transparent
      { stop: 0.05, color: 'rgba(173, 216, 230, 0.1)' }, // Ice blue
      { stop: 0.15, color: 'rgba(135, 206, 250, 0.4)' }, // Sky blue
      { stop: 0.25, color: 'rgba(70, 130, 180, 0.6)' },  // Steel blue
      { stop: 0.4, color: 'rgba(64, 224, 208, 0.75)' },  // Turquoise
      { stop: 0.6, color: 'rgba(255, 140, 0, 0.85)' },   // Orange
      { stop: 0.8, color: 'rgba(255, 69, 0, 0.9)' },     // Red-orange
      { stop: 1, color: 'rgba(139, 0, 0, 0.95)' }        // Dark red
    ]
  },
  staff: {
    name: 'Personaltäthet',
    description: 'Vuxen-barn ratio (bättre personal = grönare)',
    colors: [
      { stop: 0, color: 'rgba(0, 0, 0, 0)' },           // Transparent
      { stop: 0.1, color: 'rgba(220, 20, 60, 0.3)' },   // Crimson (low staff)
      { stop: 0.3, color: 'rgba(255, 165, 0, 0.5)' },   // Orange (medium)
      { stop: 0.5, color: 'rgba(255, 215, 0, 0.6)' },   // Gold (good)
      { stop: 0.7, color: 'rgba(154, 205, 50, 0.75)' }, // Yellow-green (better)
      { stop: 0.85, color: 'rgba(50, 205, 50, 0.85)' }, // Lime green (excellent)
      { stop: 1, color: 'rgba(34, 139, 34, 0.95)' }     // Forest green (best)
    ]
  },
  quality: {
    name: 'Lärarexamen %',
    description: 'Andel med förskollärarexamen (blå→silver→guld)',
    colors: [
      { stop: 0, color: 'rgba(0, 0, 0, 0)' },           // Transparent
      { stop: 0.1, color: 'rgba(70, 130, 180, 0.3)' },  // Steel blue (low)
      { stop: 0.3, color: 'rgba(100, 149, 237, 0.5)' }, // Cornflower blue
      { stop: 0.5, color: 'rgba(176, 196, 222, 0.7)' }, // Light steel blue
      { stop: 0.7, color: 'rgba(192, 192, 192, 0.8)' }, // Silver
      { stop: 0.85, color: 'rgba(255, 215, 0, 0.9)' },  // Gold
      { stop: 1, color: 'rgba(255, 165, 0, 0.95)' }     // Dark gold
    ]
  },
  rating: {
    name: 'Google Betyg',
    description: 'Höga betyg = guldfärgat',
    colors: [
      { stop: 0, color: 'rgba(0, 0, 0, 0)' },           // Transparent
      { stop: 0.1, color: 'rgba(128, 128, 128, 0.2)' }, // Gray (no rating)
      { stop: 0.3, color: 'rgba(169, 169, 169, 0.4)' }, // Dark gray (low)
      { stop: 0.5, color: 'rgba(255, 140, 0, 0.6)' },   // Dark orange (medium)
      { stop: 0.7, color: 'rgba(255, 165, 0, 0.8)' },   // Orange (good)
      { stop: 0.85, color: 'rgba(255, 215, 0, 0.9)' },  // Gold (excellent)
      { stop: 1, color: 'rgba(255, 223, 0, 0.95)' }     // Bright gold (perfect)
    ]
  }
} as const;

// Weight calculation functions for each heatmap type
export const calculateHeatmapWeight = (preschool: any, type: HeatmapType, zoom: number): number => {
  let baseWeight = 1;
  
  switch (type) {
    case 'density':
      // Base weight with child count influence
      const childCount = preschool.antal_barn || 0;
      baseWeight = 1 + Math.log10(Math.max(childCount, 1)) * 0.3;
      // Add group count influence
      const groupCount = preschool.antal_barngrupper || 1;
      baseWeight += Math.log10(groupCount + 1) * 0.2;
      break;
      
    case 'staff':
      // Staff density with logarithmic scaling (higher is better)
      const staffRatio = preschool.personaltäthet || 0;
      if (staffRatio > 0) {
        // Invert the scale: higher staff ratio = higher weight
        baseWeight = Math.max(0.2, Math.log10(staffRatio * 20) * 0.8);
      } else {
        baseWeight = 0.1; // Low weight for unknown staff ratio
      }
      break;
      
    case 'quality':
      // Teacher qualification percentage with exponential scaling
      const qualPercent = preschool.andel_med_förskollärarexamen || 0;
      baseWeight = Math.max(0.2, Math.pow(qualPercent / 100, 0.7) * 2.5);
      break;
      
    case 'rating':
      // Google rating with exponential emphasis on higher ratings
      const rating = preschool.google_rating || 0;
      if (rating > 0) {
        baseWeight = Math.max(0.3, Math.pow(rating / 5, 1.5) * 3);
        // Boost for high review count
        const reviewCount = preschool.google_reviews_count || 0;
        if (reviewCount > 10) {
          baseWeight *= (1 + Math.log10(reviewCount / 10) * 0.2);
        }
      } else {
        baseWeight = 0.1; // Low weight for no rating
      }
      break;
      
    default:
      // Enhanced default weight considering multiple factors
      const childrenWeight = Math.log10(Math.max(preschool.antal_barn || 1, 1)) * 0.2;
      const ratingWeight = preschool.google_rating ? (preschool.google_rating / 5) * 0.3 : 0;
      const groupWeight = preschool.antal_barngrupper ? Math.log10(preschool.antal_barngrupper + 1) * 0.2 : 0;
      const qualityWeight = preschool.andel_med_förskollärarexamen ? (preschool.andel_med_förskollärarexamen / 100) * 0.3 : 0;
      baseWeight = 1 + childrenWeight + ratingWeight + groupWeight + qualityWeight;
      break;
  }
  
  // Apply zoom-based weight adjustment to prevent oversaturation
  const zoomAdjustment = Math.min(zoom / 6, 1);
  return Math.max(0.1, Math.min(baseWeight * (0.5 + zoomAdjustment * 0.5), 6));
};

// Generate Mapbox GL heatmap color expression from gradient
export const generateHeatmapColorExpression = (type: HeatmapType) => {
  const gradient = HEATMAP_GRADIENTS[type];
  
  const expression: any[] = [
    'interpolate',
    ['exponential', 1.8],
    ['heatmap-density']
  ];
  
  gradient.colors.forEach(({ stop, color }) => {
    expression.push(stop, color);
  });
  
  return expression;
};

// Get adaptive intensity based on data density and zoom
export const getAdaptiveIntensity = (dataCount: number, zoom: number, baseIntensity: number = 1): number => {
  // Logarithmic scaling based on data density
  const densityFactor = Math.log10(Math.max(dataCount, 10)) / 4;
  
  // Zoom-based intensity scaling
  const zoomFactor = Math.pow(zoom / 6, 1.5);
  
  // Combine factors with base intensity
  const adaptiveIntensity = densityFactor * zoomFactor * baseIntensity * 0.8;
  
  return Math.min(Math.max(adaptiveIntensity, 0.1), 3);
};

// Get adaptive radius based on zoom and data density
export const getAdaptiveRadius = (zoom: number, dataCount: number): any => {
  const baseSizes = [
    Math.max(6, 15 - dataCount / 500),
    Math.max(8, 18 - dataCount / 400),
    Math.max(12, 22 - dataCount / 300),
    Math.max(16, 28 - dataCount / 200),
    Math.max(20, 35 - dataCount / 150),
    Math.max(25, 45 - dataCount / 100)
  ];
  
  return [
    'interpolate',
    ['exponential', 1.8],
    ['zoom'],
    1, baseSizes[0],
    2, baseSizes[1], 
    3, baseSizes[2],
    4, baseSizes[3],
    5, baseSizes[4],
    6, baseSizes[5]
  ];
};