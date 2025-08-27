// ADVANCED CLUSTERING ALGORITHM
// Extracted from sveriges-forskolor high-performance clustering

export interface ClusterPoint {
  id: string;
  lat: number;
  lng: number;
  data: any;
}

export interface Cluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  points: ClusterPoint[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

class SmartClustering {
  private readonly minClusterSize = 2;
  private readonly maxZoomForClustering = 14;
  
  // Dynamic cluster radius based on zoom level
  private getClusterRadius(zoom: number): number {
    if (zoom >= 14) return 30;   // Close zoom - small clusters
    if (zoom >= 12) return 60;   // Medium zoom
    if (zoom >= 10) return 120;  // Far zoom - larger clusters
    return 200; // Very far zoom - big clusters
  }

  cluster(points: ClusterPoint[], zoom: number): Cluster[] {
    if (zoom >= this.maxZoomForClustering) {
      return []; // No clustering at high zoom levels
    }

    const clusters: Cluster[] = [];
    const processed = new Set<string>();
    const radius = this.getClusterRadius(zoom);

    points.forEach(point => {
      if (processed.has(point.id)) return;

      const cluster: Cluster = {
        id: `cluster-${point.lat}-${point.lng}-${Date.now()}`,
        lat: point.lat,
        lng: point.lng,
        count: 1,
        points: [point],
        bounds: {
          north: point.lat,
          south: point.lat,
          east: point.lng,
          west: point.lng
        }
      };

      processed.add(point.id);

      // Find nearby points to cluster
      points.forEach(otherPoint => {
        if (processed.has(otherPoint.id)) return;

        const distance = this.calculatePixelDistance(
          point.lat, point.lng,
          otherPoint.lat, otherPoint.lng,
          zoom
        );

        if (distance <= radius) {
          cluster.points.push(otherPoint);
          cluster.count++;
          processed.add(otherPoint.id);

          // Update cluster center (weighted average)
          const totalLat = cluster.points.reduce((sum, p) => sum + p.lat, 0);
          const totalLng = cluster.points.reduce((sum, p) => sum + p.lng, 0);
          cluster.lat = totalLat / cluster.points.length;
          cluster.lng = totalLng / cluster.points.length;

          // Update bounds
          cluster.bounds.north = Math.max(cluster.bounds.north, otherPoint.lat);
          cluster.bounds.south = Math.min(cluster.bounds.south, otherPoint.lat);
          cluster.bounds.east = Math.max(cluster.bounds.east, otherPoint.lng);
          cluster.bounds.west = Math.min(cluster.bounds.west, otherPoint.lng);
        }
      });

      // Only keep clusters with minimum size
      if (cluster.count >= this.minClusterSize) {
        clusters.push(cluster);
      } else {
        // Return single points as individual "clusters"
        cluster.points.forEach(p => {
          processed.delete(p.id);
          clusters.push({
            id: `single-${p.id}`,
            lat: p.lat,
            lng: p.lng,
            count: 1,
            points: [p],
            bounds: {
              north: p.lat,
              south: p.lat,
              east: p.lng,
              west: p.lng
            }
          });
        });
      }
    });

    return clusters;
  }

  // Fast viewport-based clustering
  clusterInViewport(
    points: ClusterPoint[], 
    zoom: number, 
    bounds: { north: number; south: number; east: number; west: number }
  ): Cluster[] {
    // Pre-filter points in viewport for performance
    const viewportPoints = points.filter(point => 
      point.lat >= bounds.south && point.lat <= bounds.north &&
      point.lng >= bounds.west && point.lng <= bounds.east
    );

    return this.cluster(viewportPoints, zoom);
  }

  // Calculate pixel distance for clustering (more accurate than geographic distance for UI)
  private calculatePixelDistance(lat1: number, lng1: number, lat2: number, lng2: number, zoom: number): number {
    const scale = Math.pow(2, zoom);
    const pixelLat1 = (lat1 + 90) * scale;
    const pixelLng1 = (lng1 + 180) * scale;
    const pixelLat2 = (lat2 + 90) * scale;
    const pixelLng2 = (lng2 + 180) * scale;
    
    return Math.sqrt(
      Math.pow(pixelLat2 - pixelLat1, 2) + 
      Math.pow(pixelLng2 - pixelLng1, 2)
    );
  }

  // Hierarchical clustering for better performance at low zoom levels
  hierarchicalCluster(points: ClusterPoint[], zoom: number): Cluster[] {
    if (points.length < 100) {
      return this.cluster(points, zoom);
    }

    // For large datasets, use a grid-based approach first
    const gridSize = zoom < 8 ? 0.5 : zoom < 10 ? 0.2 : 0.1; // Degrees
    const grid = new Map<string, ClusterPoint[]>();

    points.forEach(point => {
      const gridX = Math.floor(point.lat / gridSize);
      const gridY = Math.floor(point.lng / gridSize);
      const key = `${gridX}-${gridY}`;
      
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(point);
    });

    // Cluster within each grid cell
    const allClusters: Cluster[] = [];
    grid.forEach(gridPoints => {
      if (gridPoints.length > 1) {
        allClusters.push(...this.cluster(gridPoints, zoom + 2)); // Tighter clustering within grid
      } else {
        // Single point
        const point = gridPoints[0];
        allClusters.push({
          id: `single-${point.id}`,
          lat: point.lat,
          lng: point.lng,
          count: 1,
          points: [point],
          bounds: {
            north: point.lat,
            south: point.lat,
            east: point.lng,
            west: point.lng
          }
        });
      }
    });

    return allClusters;
  }
}

export const smartClustering = new SmartClustering();