import React, { useState, useMemo } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { MapPin } from 'lucide-react';

interface UltraLightSvgMapProps {
  className?: string;
}

// ULTRA-LÄTT Sverige SVG karta - bara ~2KB istället för MB med tiles
const UltraLightSvgMap: React.FC<UltraLightSvgMapProps> = ({ className }) => {
  const { filteredPreschools } = useMapStore();
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  // FÖRBÄTTRAD koordinat-konvertering för Sverige med mer exakt mapping
  const toSvgCoordinates = (lat: number, lng: number) => {
    // Sverige bounds: 55.3-69.1 lat, 10.9-24.2 lng
    // Mappat till vår SVG-form (280-750 x, 15-665 y)
    const x = 280 + ((lng - 10.9) / (24.2 - 10.9)) * (750 - 280);
    const y = 15 + ((69.1 - lat) / (69.1 - 55.3)) * (665 - 15);
    return { 
      x: Math.max(280, Math.min(750, x)), 
      y: Math.max(15, Math.min(665, y)) 
    };
  };

  // Gruppera förskolor per kommun för bättre prestanda
  const communeGroups = useMemo(() => {
    const groups = new Map<string, { 
      count: number, 
      lat: number, 
      lng: number, 
      kommun: string,
      avgRating?: number 
    }>();
    
    filteredPreschools.forEach(preschool => {
      if (!preschool.latitud || !preschool.longitud) return;
      
      const key = preschool.kommun;
      const existing = groups.get(key);
      
      if (existing) {
        existing.count++;
        existing.lat = (existing.lat + preschool.latitud) / 2;
        existing.lng = (existing.lng + preschool.longitud) / 2;
        if (preschool.google_rating) {
          existing.avgRating = ((existing.avgRating || 0) + preschool.google_rating) / 2;
        }
      } else {
        groups.set(key, {
          count: 1,
          lat: preschool.latitud,
          lng: preschool.longitud,
          kommun: preschool.kommun,
          avgRating: preschool.google_rating
        });
      }
    });
    
    return Array.from(groups.values()).slice(0, 50); // Max 50 markers för prestanda
  }, [filteredPreschools]);

  return (
    <div className={`relative ${className}`} style={{ background: 'linear-gradient(180deg, #e0f2fe 0%, #f8fafc 100%)' }}>
      {/* ENKEL Sverige SVG silhuett - bara ~1KB */}
      <svg 
        viewBox="0 0 800 1000" 
        className="w-full h-full" 
        style={{ maxHeight: '100vh' }}
      >
        {/* Sverige silhuett - optimerad och mer exakt */}
        <path
          d="M280,40 L320,25 L380,20 L440,15 L500,25 L560,45 L620,75 L670,115 L710,165 L740,220 L750,280 L745,340 L735,400 L720,460 L695,515 L660,565 L610,605 L550,635 L485,655 L415,665 L345,660 L280,645 L220,620 L170,585 L130,540 L100,485 L85,425 L80,365 L90,305 L110,250 L140,200 L180,155 L230,115 Z"
          fill="#f8fafc"
          stroke="#94a3b8"
          strokeWidth="1.5"
          className="hover:fill-blue-50 transition-all duration-200"
          style={{
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))'
          }}
        />
        
        {/* Lätt bakgrund för Sverige */}
        <defs>
          <linearGradient id="swedenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>
        
        <path
          d="M280,40 L320,25 L380,20 L440,15 L500,25 L560,45 L620,75 L670,115 L710,165 L740,220 L750,280 L745,340 L735,400 L720,460 L695,515 L660,565 L610,605 L550,635 L485,655 L415,665 L345,660 L280,645 L220,620 L170,585 L130,540 L100,485 L85,425 L80,365 L90,305 L110,250 L140,200 L180,155 L230,115 Z"
          fill="url(#swedenGradient)"
        />

        {/* Ultra-enkla markers - bara cirklar */}
        {communeGroups.map((group, index) => {
          const { x, y } = toSvgCoordinates(group.lat, group.lng);
          const size = Math.min(20, Math.max(6, Math.sqrt(group.count) * 3));
          const color = group.avgRating ? '#10b981' : '#3b82f6';
          
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
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                  animation: selectedMarker?.kommun === group.kommun ? 'pulse 1s infinite' : 'none'
                }}
                onClick={() => setSelectedMarker(group)}
              >
                <animate
                  attributeName="r"
                  values={`${size};${size + 2};${size}`}
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
              {group.count > 1 && (
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {group.count}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Enkel popup för utvald marker */}
      {selectedMarker && (
        <div 
          className="absolute bg-white rounded-lg shadow-xl p-4 max-w-xs z-50 pointer-events-auto"
          style={{
            top: '20px',
            right: '20px',
            border: '1px solid #e2e8f0'
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-gray-900">
              {selectedMarker.kommun}
            </h3>
            <button 
              onClick={() => setSelectedMarker(null)}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-600 mb-2">
            <strong>{selectedMarker.count}</strong> förskolor
          </p>
          {selectedMarker.avgRating && (
            <p className="text-green-600 text-sm">
              ⭐ Snittbetyg: {selectedMarker.avgRating.toFixed(1)}
            </p>
          )}
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-full text-sm flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        Ultra-lätt SVG • {filteredPreschools.length} förskolor
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h4 className="font-semibold text-sm mb-2">Förskolor per kommun</h4>
        <div className="flex items-center gap-2 text-xs mb-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Standard</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Med betyg</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Storlek = antal förskolor
        </p>
      </div>

      {/* Ladda-knapp för att återgå till avancerad karta om önskas */}
      <div className="absolute bottom-4 left-4">
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg"
          onClick={() => {
            // Kan implementera växling till Leaflet om användaren vill
            console.log('Användare vill ha mer avancerad karta');
          }}
        >
          <MapPin className="w-4 h-4 inline mr-2" />
          Avancerad karta
        </button>
      </div>
    </div>
  );
};

export default UltraLightSvgMap;