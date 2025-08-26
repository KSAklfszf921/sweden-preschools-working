export const mapboxConfig = {
  accessToken: 'pk.eyJ1Ijoic2tvZ3N0YWRpc2FrIiwiYSI6ImNtY3BhaXRpMjA0ZGcycHBqNHM4dmlwOW0ifQ.KKHGGPnrZVjNjDdITF-_bw',
  
  // Swedish-inspired map style configuration
  swedenStyle: {
    // Water colors - inspired by Swedish lakes
    water: 'hsl(210, 85%, 45%)', // Deep blue like Swedish lakes
    
    // Land colors - inspired by Swedish forests and meadows  
    land: 'hsl(85, 40%, 92%)', // Light green-gray like Nordic landscapes
    forest: 'hsl(130, 35%, 25%)', // Deep forest green
    
    // Infrastructure colors
    roads: 'hsl(220, 15%, 70%)', // Subtle gray roads
    buildings: 'hsl(220, 15%, 85%)', // Light Nordic buildings
    
    // Heatmap colors - Swedish flag inspired
    heatmap: {
      low: 'hsl(207, 89%, 85%)', // Light Nordic blue
      medium: 'hsl(207, 89%, 60%)', // Medium Nordic blue  
      high: 'hsl(207, 89%, 35%)', // Deep Nordic blue
      intense: 'hsl(47, 100%, 65%)', // Swedish flag yellow
      critical: 'hsl(0, 84%, 60%)' // Warning red
    }
  },
  
  // Performance settings optimized for Sweden
  settings: {
    maxZoom: 18,
    minZoom: 4,
    centerSweden: [15.5, 62.0], // Geographic center of Sweden
    defaultZoom: 5.5,
    
    // Clustering settings
    clusterRadius: 50,
    clusterMaxZoom: 11,
    
    // Heatmap settings
    heatmapRadius: 20,
    heatmapMaxZoom: 9,
    heatmapIntensity: 1
  }
};