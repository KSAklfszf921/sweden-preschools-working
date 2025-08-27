import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Search, BarChart3, Settings } from 'lucide-react';

// DIREKT Supabase-anslutning utan mellanhänder
const supabase = createClient(
  'https://zfeqsdtddvelapbrwlol.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZXFzZHRkZHZlbGFwYnJ3bG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNjE5ODksImV4cCI6MjAzNTgzNzk4OX0.1Cz7S5Jn7JI-9Y8f6Xjgh2wvGdl6Rp3KvL4M8Nn5QPc'
);

interface Preschool {
  id: string;
  namn: string;
  kommun: string;
  latitud: number;
  longitud: number;
  google_rating?: number;
}

const IndexMinimal = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [preschools, setPreschools] = useState<Preschool[]>([]);
  const [filteredPreschools, setFilteredPreschools] = useState<Preschool[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [mapInstance, setMapInstance] = useState<any>(null);

  // DIREKT datafetch - ingen hook mellanhand
  useEffect(() => {
    const fetchPreschools = async () => {
      try {
        const { data, error } = await supabase
          .from('forskolor_sverige')
          .select('id, namn, kommun, latitud, longitud, google_rating')
          .limit(2000); // Begränsa för prestanda

        if (error) throw error;
        
        const validData = data?.filter(p => p.latitud && p.longitud) || [];
        setPreschools(validData);
        setFilteredPreschools(validData);
        setIsLoading(false);
        
        // Starta mappladdning efter data
        setTimeout(() => setShowLanding(false), 1000);
      } catch (error) {
        console.error('Error fetching preschools:', error);
        setIsLoading(false);
      }
    };

    fetchPreschools();
  }, []);

  // ENKEL sökning utan Fuse.js
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPreschools(preschools);
      return;
    }

    const filtered = preschools.filter(p => 
      p.namn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.kommun?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPreschools(filtered);
  }, [searchTerm, preschools]);

  // LEAFLET laddning - EXAKT som LeafletMap.tsx men förenklad
  const loadLeaflet = async () => {
    if (isMapLoaded || !mapContainer.current) return;

    // CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    cssLink.crossOrigin = '';
    document.head.appendChild(cssLink);

    // JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => {
      // @ts-ignore
      const L = window.L;
      
      const map = L.map(mapContainer.current, {
        center: [62.4, 15.2],
        zoom: 5.5,
        minZoom: 4,
        maxZoom: 16,
        preferCanvas: true,
        renderer: L.canvas()
      });

      // OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 16,
        updateWhenZooming: false,
        updateWhenIdle: true
      }).addTo(map);

      setMapInstance(map);
      setIsMapLoaded(true);
    };

    document.body.appendChild(script);
  };

  // Lägg till markers när karta är redo
  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;

    // @ts-ignore
    const L = window.L;
    
    // Ta bort gamla markers
    mapInstance.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker) {
        mapInstance.removeLayer(layer);
      }
    });

    // Lägg till nya markers - begränsade för prestanda
    filteredPreschools.slice(0, 1000).forEach(preschool => {
      if (!preschool.latitud || !preschool.longitud) return;

      const marker = L.circleMarker([preschool.latitud, preschool.longitud], {
        radius: 4,
        fillColor: preschool.google_rating ? '#10b981' : '#3b82f6',
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      });

      const popupContent = `
        <div style="padding: 8px; font-family: system-ui; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
            ${preschool.namn}
          </h3>
          <p style="margin: 4px 0; color: #666; font-size: 14px;">
            <strong>Kommun:</strong> ${preschool.kommun}
          </p>
          ${preschool.google_rating ? `
            <p style="margin: 4px 0; color: #059669; font-size: 14px;">
              <strong>Betyg:</strong> ⭐ ${preschool.google_rating}
            </p>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent).addTo(mapInstance);
    });
  }, [mapInstance, isMapLoaded, filteredPreschools]);

  // Starta mappladdning när landing är klar
  useEffect(() => {
    if (!showLanding) {
      loadLeaflet();
    }
  }, [showLanding]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #3b82f6, #1d4ed8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid white',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px' }}>
            Sveriges Förskolor
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>
            Laddar data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn:hover {
          background: rgba(255,255,255,1);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .search-input {
          padding: 12px 16px;
          border: none;
          border-radius: 12px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          width: 320px;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .search-input:focus {
          outline: none;
          box-shadow: 0 4px 16px rgba(59,130,246,0.3);
        }
      `}</style>

      {/* Landing Screen */}
      {showLanding && (
        <div style={{
          position: 'fixed',
          inset: '0',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #3b82f6, #1d4ed8)',
          color: 'white'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              border: '4px solid white',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 24px'
            }} />
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 12px' }}>
              Sveriges Förskolor
            </h2>
            <p style={{ fontSize: '18px', opacity: 0.9, margin: 0 }}>
              Förbereder karta...
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
        opacity: showLanding ? 0 : 1,
        transition: 'opacity 0.3s'
      }}>
        {/* Header */}
        <header style={{
          position: 'relative',
          zIndex: 40,
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '24px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(to bottom right, #10b981, #059669)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MapPin style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  margin: '0 0 8px',
                  background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Förskolor i Sverige
                </h1>
                <p style={{
                  fontSize: '16px',
                  color: '#64748b',
                  margin: 0
                }}>
                  Hitta och jämför förskolor – i hela landet
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn">
                <BarChart3 style={{ width: '20px', height: '20px' }} />
                Statistik
              </button>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div style={{
          position: 'absolute',
          left: '16px',
          top: '140px',
          zIndex: 25
        }}>
          <div style={{ position: 'relative' }}>
            <Search style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '20px',
              height: '20px',
              color: '#64748b'
            }} />
            <input
              type="text"
              placeholder="Sök förskola eller kommun..."
              className="search-input"
              style={{ paddingLeft: '48px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Map Container */}
        <div
          ref={mapContainer}
          style={{
            width: '100%',
            height: 'calc(100vh - 140px)',
            opacity: showLanding ? 0 : 1,
            transition: 'opacity 0.4s ease 0.2s'
          }}
        />

        {/* Status */}
        {isMapLoaded && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '24px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              background: '#10b981',
              borderRadius: '50%',
              animation: 'spin 2s linear infinite'
            }} />
            Leaflet karta • {filteredPreschools.length} förskolor
          </div>
        )}

        {/* Settings Button */}
        <button
          className="btn"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 40,
            padding: '16px',
            borderRadius: '20px'
          }}
        >
          <Settings style={{ width: '24px', height: '24px' }} />
        </button>
      </div>
    </>
  );
};

export default IndexMinimal;