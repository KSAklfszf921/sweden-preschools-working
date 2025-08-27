import { lazy } from 'react';

// 🚀 LAZY LOADED COMPONENTS för bättre prestanda
// Laddar komponenter endast när de behövs

// Heavy admin components
export const AdminPanel = lazy(() => 
  import('./AdminPanel').then(module => ({ default: module.AdminPanel }))
);

// Statistics components
export const StatisticsPanel = lazy(() => 
  import('./StatisticsPanel').then(module => ({ default: module.StatisticsPanel }))
);

// Comparison modal
export const ComparisonModal = lazy(() => 
  import('./ComparisonModal').then(module => ({ default: module.ComparisonModal }))
);

// Enhanced components
export const PreschoolDetailsModal = lazy(() => 
  import('./enhanced/PreschoolDetailsModal').then(module => ({ default: module.PreschoolDetailsModal }))
);

export const ClusteringControlPanel = lazy(() => 
  import('./enhanced/ClusteringControlPanel').then(module => ({ default: module.ClusteringControlPanel }))
);

export const PerformanceDashboard = lazy(() => 
  import('./enhanced/PerformanceDashboard').then(module => ({ default: module.PerformanceDashboard }))
);

// Street view and directions - heavy components
export const StreetViewPanel = lazy(() => 
  import('./streetview/StreetViewPanel').then(module => ({ default: module.StreetViewPanel }))
);

export const DirectionsPanel = lazy(() => 
  import('./directions/DirectionsPanel').then(module => ({ default: module.DirectionsPanel }))
);

// Advanced search components
export const AdvancedSearch = lazy(() => 
  import('./enhanced/AdvancedSearch').then(module => ({ default: module.AdvancedSearch }))
);

// Export functions
export const ExportFunctions = lazy(() => 
  import('./enhanced/ExportFunctions').then(module => ({ default: module.ExportFunctions }))
);