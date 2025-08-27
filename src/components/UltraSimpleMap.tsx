import React, { useState, useMemo } from 'react';
import { useMapStore } from '@/stores/mapStore';

// ENKLASTE MÖJLIGA karta - bara HTML + CSS, inga externa bibliotek
const UltraSimpleMap = ({ className }: { className?: string }) => {
  const { filteredPreschools } = useMapStore();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Skapa regionala grupper baserat på kommun
  const regions = useMemo(() => {
    const regionMap = new Map<string, { count: number; communes: Set<string> }>();
    
    filteredPreschools.forEach(preschool => {
      if (!preschool.kommun) return;
      
      // Skapa region baserad på första 3 bokstäverna i kommunen
      const regionKey = preschool.kommun.substring(0, 3).toUpperCase();
      
      if (!regionMap.has(regionKey)) {
        regionMap.set(regionKey, { count: 0, communes: new Set() });
      }
      
      const region = regionMap.get(regionKey)!;
      region.count++;
      region.communes.add(preschool.kommun);
    });
    
    return Array.from(regionMap.entries())
      .map(([key, data]) => ({
        name: key,
        count: data.count,
        communes: Array.from(data.communes)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Bara top 20 regioner
  }, [filteredPreschools]);

  return (
    <div className={`${className} bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden`}>
      {/* KLAR INDIKATOR att det är rätt karta */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full font-bold text-lg z-50 shadow-xl animate-bounce">
        🎉 ULTRA-ENKEL KARTA AKTIV - INGEN TUNG LEAFLET! 🎉
      </div>

      {/* Enkel grid-layout för regioner */}
      <div className="absolute inset-0 p-8 pt-20 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {regions.map((region, index) => {
            const size = Math.min(180, 80 + Math.sqrt(region.count) * 10);
            const isSelected = selectedRegion === region.name;
            
            return (
              <div
                key={region.name}
                className={`
                  relative bg-white rounded-xl shadow-lg p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl
                  ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50' : ''}
                `}
                style={{ minHeight: `${size}px` }}
                onClick={() => setSelectedRegion(isSelected ? null : region.name)}
              >
                {/* Region namn */}
                <div className="font-bold text-2xl text-gray-800 mb-2">
                  {region.name}
                </div>
                
                {/* Antal förskolor */}
                <div className="text-lg text-blue-600 font-semibold mb-3">
                  {region.count} förskolor
                </div>
                
                {/* Visual representation */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {Array.from({ length: Math.min(20, region.count) }, (_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-blue-500 rounded-full"
                    />
                  ))}
                  {region.count > 20 && (
                    <div className="text-xs text-gray-500 ml-1">
                      +{region.count - 20} till
                    </div>
                  )}
                </div>
                
                {/* Expanderad info när vald */}
                {isSelected && (
                  <div className="border-t pt-3 mt-3">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Kommuner:
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {region.communes.slice(0, 5).map(commune => (
                        <div key={commune} className="truncate">
                          • {commune}
                        </div>
                      ))}
                      {region.communes.length > 5 && (
                        <div className="text-xs text-gray-500 italic">
                          +{region.communes.length - 5} fler kommuner
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div className="absolute bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
        ✅ ULTRA-SNABB: {filteredPreschools.length} förskolor • Ingen tung map library!
      </div>

      {/* Info */}
      <div className="absolute bottom-4 left-4 bg-white/95 rounded-lg p-3 shadow-lg max-w-xs">
        <h4 className="font-bold text-sm mb-1">⚡ Ultra-prestanda karta</h4>
        <p className="text-xs text-gray-600">
          Bara HTML + CSS • Inga tunga map tiles • Inga externa libraries
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Klicka på regioner för mer info
        </p>
      </div>
    </div>
  );
};

export default UltraSimpleMap;