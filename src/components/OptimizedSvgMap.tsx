import React, { useState, useMemo, useCallback } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { MapPin, ZoomIn, ZoomOut, Layers } from 'lucide-react';

interface OptimizedSvgMapProps {
  className?: string;
}

// HYBRID-LÖSNING: SVG prestanda + clustering-tekniker från framgångsrika projekt
const OptimizedSvgMap: React.FC<OptimizedSvgMapProps> = ({ className }) => {
  const { filteredPreschools } = useMapStore();
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(2); // 1=heatmap, 2=clusters, 3=individual
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  // ZOOM-BASERAD RENDERING som svenska-forskolor-karta
  const getRenderingStrategy = () => {
    if (zoomLevel === 1) return 'heatmap';
    if (zoomLevel === 2) return 'clusters'; 
    return 'individual';
  };

  // SMART clustering som sveriges-forskolor (chunked loading-inspirerad)
  const processedData = useMemo(() => {
    const renderStrategy = getRenderingStrategy();
    
    if (renderStrategy === 'heatmap') {
      // Heatmap-läge: bara län/regioner
      const regions = new Map<string, { count: number, lat: number, lng: number, region: string }>();
      
      filteredPreschools.forEach(p => {
        if (!p.latitud || !p.longitud) return;
        
        // Förenklad regions-gruppering baserad på koordinater
        const regionKey = `${Math.floor(p.latitud/2)}_${Math.floor(p.longitud/2)}`;
        const existing = regions.get(regionKey);
        
        if (existing) {
          existing.count++;
          existing.lat = (existing.lat + p.latitud) / 2;
          existing.lng = (existing.lng + p.longitud) / 2;
        } else {
          regions.set(regionKey, {
            count: 1,
            lat: p.latitud,
            lng: p.longitud,
            region: p.kommun || 'Okänd'
          });
        }
      });
      
      return Array.from(regions.values()).slice(0, 15); // Max 15 för heatmap
    }
    
    if (renderStrategy === 'clusters') {
      // Cluster-läge: per kommun som vårt original
      const communes = new Map<string, { 
        count: number, 
        lat: number, 
        lng: number, 
        kommun: string,
        avgRating?: number,
        preschools: any[]
      }>();
      
      filteredPreschools.forEach(p => {
        if (!p.latitud || !p.longitud) return;
        
        const key = p.kommun;
        const existing = communes.get(key);
        
        if (existing) {
          existing.count++;
          existing.lat = (existing.lat + p.latitud) / 2;
          existing.lng = (existing.lng + p.longitud) / 2;
          existing.preschools.push(p);
          if (p.google_rating) {
            existing.avgRating = ((existing.avgRating || 0) + p.google_rating) / 2;
          }
        } else {
          communes.set(key, {
            count: 1,
            lat: p.latitud,
            lng: p.longitud,
            kommun: p.kommun,
            avgRating: p.google_rating,
            preschools: [p]
          });
        }
      });
      
      return Array.from(communes.values()).slice(0, 75); // Max 75 clusters
    }
    
    // Individual mode: visa alla men begränsat
    return filteredPreschools
      .filter(p => p.latitud && p.longitud)
      .slice(0, 200) // Max 200 individual markers för prestanda
      .map(p => ({
        count: 1,
        lat: p.latitud,
        lng: p.longitud,
        kommun: p.kommun,
        namn: p.namn,
        avgRating: p.google_rating,
        preschools: [p]
      }));
  }, [filteredPreschools, zoomLevel]);

  // Koordinat-konvertering (samma som innan)
  const toSvgCoordinates = useCallback((lat: number, lng: number) => {
    const x = 280 + ((lng - 10.9) / (24.2 - 10.9)) * (750 - 280);
    const y = 15 + ((69.1 - lat) / (69.1 - 55.3)) * (665 - 15);
    return { 
      x: Math.max(280, Math.min(750, x)), 
      y: Math.max(15, Math.min(665, y)) 
    };
  }, []);

  const renderStrategy = getRenderingStrategy();

  return (
    <div className={`relative ${className}`} style={{ background: 'linear-gradient(180deg, #e0f2fe 0%, #f8fafc 100%)' }}>
      {/* ZOOM CONTROLS - inspirerad av Mapbox-projektet */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
        <button 
          onClick={() => setZoomLevel(Math.min(3, zoomLevel + 1))}
          className="bg-white hover:bg-gray-50 p-2 rounded-lg shadow-lg border transition-all"
          disabled={zoomLevel === 3}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setZoomLevel(Math.max(1, zoomLevel - 1))}
          className="bg-white hover:bg-gray-50 p-2 rounded-lg shadow-lg border transition-all"
          disabled={zoomLevel === 1}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
          className="bg-white hover:bg-gray-50 p-2 rounded-lg shadow-lg border transition-all"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* HUVUDKARTA */}
      <svg viewBox="0 0 800 1000" className="w-full h-full" style={{ maxHeight: '100vh' }}>
        <defs>
          <linearGradient id="swedenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          
          {/* HEATMAP GRADIENT för zoom level 1 */}
          <radialGradient id="heatmapGradient">
            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.8)" />
            <stop offset="50%" stopColor="rgba(245, 158, 11, 0.6)" />
            <stop offset="100%" stopColor="rgba(34, 197, 94, 0.4)" />
          </radialGradient>
        </defs>
        
        {/* Sverige silhuett */}
        <path
          d="M280,40 L320,25 L380,20 L440,15 L500,25 L560,45 L620,75 L670,115 L710,165 L740,220 L750,280 L745,340 L735,400 L720,460 L695,515 L660,565 L610,605 L550,635 L485,655 L415,665 L345,660 L280,645 L220,620 L170,585 L130,540 L100,485 L85,425 L80,365 L90,305 L110,250 L140,200 L180,155 L230,115 Z"
          fill="url(#swedenGradient)"
          stroke="#94a3b8"
          strokeWidth="1.5"
          className="hover:fill-blue-50 transition-all duration-200"
        />

        {/* ADAPTIVE RENDERING baserat på zoom-level */}
        {processedData.map((item, index) => {
          const { x, y } = toSvgCoordinates(item.lat, item.lng);
          
          if (renderStrategy === 'heatmap') {
            // HEATMAP MODE - stora, genomskinliga cirklar
            const radius = Math.min(50, Math.max(20, Math.sqrt(item.count) * 8));
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={radius}
                fill="url(#heatmapGradient)"
                className="opacity-70 hover:opacity-90 cursor-pointer transition-opacity"
                onClick={() => setSelectedMarker(item)}
              />
            );
          }
          
          if (renderStrategy === 'clusters') {
            // CLUSTER MODE - mediumstora markers med antal
            const size = Math.min(20, Math.max(8, Math.sqrt(item.count) * 3));
            const color = item.avgRating ? '#10b981' : '#3b82f6';
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                  className="hover:scale-125 transition-all duration-200 cursor-pointer"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                  onClick={() => setSelectedMarker(item)}
                />
                {item.count > 1 && (
                  <text
                    x={x}
                    y={y + 1}
                    textAnchor="middle"
                    fontSize="10"
                    fill="white"
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    {item.count}
                  </text>
                )}
              </g>
            );
          }
          
          // INDIVIDUAL MODE - små, precisa markers
          const color = item.avgRating ? '#10b981' : '#3b82f6';
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill={color}
              stroke="white"
              strokeWidth="1"
              className="hover:scale-150 transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedMarker(item)}
            />
          );
        })}
      </svg>

      {/* POPUP - förbättrad från framgångsrika projekten */}
      {selectedMarker && (
        <div className="absolute top-20 right-4 bg-white rounded-lg shadow-xl p-4 max-w-xs z-50 border">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-gray-900">
              {renderStrategy === 'individual' ? selectedMarker.namn : selectedMarker.kommun || selectedMarker.region}
            </h3>
            <button 
              onClick={() => setSelectedMarker(null)}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-600 mb-2">
            <strong>{selectedMarker.count}</strong> {selectedMarker.count === 1 ? 'förskola' : 'förskolor'}
          </p>
          {selectedMarker.avgRating && (
            <p className="text-green-600 text-sm mb-2">
              ⭐ Snittbetyg: {selectedMarker.avgRating.toFixed(1)}
            </p>
          )}
          <p className="text-xs text-gray-500">
            {renderStrategy === 'heatmap' && 'Regionvy • Zooma in för detaljer'}
            {renderStrategy === 'clusters' && 'Kommunvy • Zooma in för enskilda förskolor'}
            {renderStrategy === 'individual' && 'Detaljvy • Individuell förskola'}
          </p>
        </div>
      )}

      {/* STATUS - med render-info */}
      <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-full text-sm flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        🚀 OPTIMERAD HYBRID-KARTA • 
        {renderStrategy === 'heatmap' && `Heatmap • ${processedData.length} regioner`}
        {renderStrategy === 'clusters' && `Kluster • ${processedData.length} kommuner`}
        {renderStrategy === 'individual' && `Detalj • ${processedData.length} förskolor`}
      </div>

      {/* INSTRUKTIONER */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
        <h4 className="font-semibold text-sm mb-2">🎯 Smart karta-teknik</h4>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full opacity-70"></div>
            <span>Zoom 1: Heatmap-regioner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Zoom 2: Kluster-kommuner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Zoom 3: Individuella</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Teknik från framgångsrika projekten!
        </p>
      </div>
    </div>
  );
};

export default OptimizedSvgMap;