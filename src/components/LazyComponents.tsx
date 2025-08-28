import { lazy } from 'react';

// 🚀 LAZY LOADED COMPONENTS för bättre prestanda
// Laddar komponenter endast när de behövs

// Heavy admin components
export const AdminPanel = lazy(() => 
  import('./AdminPanel').then(module => ({ default: module.AdminPanel }))
);

// Statistics components
export const StatisticsPanel = lazy(() => 
  import('./StatisticsPanel')
);

// Comparison modal
export const ComparisonModal = lazy(() => 
  import('./ComparisonModal').then(module => ({ default: module.ComparisonModal }))
);

// Enhanced components (commented out as they don't exist)
// export const PreschoolDetailsModal = lazy(() => 
//   import('./enhanced/PreschoolDetailsModal')
// );

// export const ClusteringControlPanel = lazy(() => 
//   import('./enhanced/ClusteringControlPanel')
// );

// export const PerformanceDashboard = lazy(() => 
//   import('./enhanced/PerformanceDashboard')
// );

// Street view and directions - heavy components
export const StreetViewPanel = lazy(() => 
  import('./streetview/StreetViewPanel').then(module => ({ default: module.StreetViewPanel }))
);

export const DirectionsPanel = lazy(() => 
  import('./directions/DirectionsPanel').then(module => ({ default: module.DirectionsPanel }))
);

// Advanced search components (commented out as they don't exist)
// export const AdvancedSearch = lazy(() => 
//   import('./enhanced/AdvancedSearch')
// );

// Export functions (commented out as they don't exist)
// export const ExportFunctions = lazy(() => 
//   import('./enhanced/ExportFunctions')
// );