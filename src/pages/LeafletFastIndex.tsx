import React, { useState, useEffect } from 'react';
import { MapPin, Search, BarChart3 } from 'lucide-react';
import preschoolIcon from '@/assets/preschool-icon.jpg';

// LEAFLET-BASERAD VERSION - EXAKT SOM FRAMGÅNGSRIKA PROJEKTEN
// Leaflet är MYCKET lättare än Mapbox GL JS

interface LeafletPreschool {
  id: string;
  Namn: string;
  Kommun: string;
  Adress: string;
  Latitud: number | null;
  Longitud: number | null;
  'Antal barn': number | null;
}

const LeafletFastIndex = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [showStatistics, setShowStatistics] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preschools, setPreschools] = useState<LeafletPreschool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<any>(null);

  // Snabb landing - bara 800ms
  useEffect(() => {
    const timer = setTimeout(() => setShowLanding(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Load data och karta när landing är klar
  useEffect(() => {
    if (!showLanding) {
      loadPreschoolsDirectly();
      loadLeaflet();
    }
  }, [showLanding]);

  const loadPreschoolsDirectly = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Direct Supabase call - MINIMAL overhead
      const supabaseUrl = 'https://zfeqsdtddvelapbrwlol.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZXFzZHRkZHZlbGFwYnJ3bG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5ODc5ODEsImV4cCI6MjA1MDU2Mzk4MX0.Lkc9oWfR7fRAd6b9UYH5uBVfJD6dXQe7LCm2gSI-1s4';

      const response = await fetch(`${supabaseUrl}/rest/v1/Förskolor?select=id,Namn,Kommun,Adress,Latitud,Longitud,Antal barn&limit=1500`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch preschools');
      
      const data = await response.json();
      setPreschools(data || []);
      console.log(`✅ Leaflet: Loaded ${data.length} preschools directly from Supabase`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preschools');
      console.error('Error loading preschools:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeaflet = async () => {
    try {
      // Load Leaflet CSS - MYCKET lättare än Mapbox
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      cssLink.crossOrigin = '';
      document.head.appendChild(cssLink);

      // Load Leaflet JS - BARA ~40kb vs 2MB Mapbox!
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => {
        // @ts-ignore
        const L = window.L;

        const mapContainer = document.getElementById('leaflet-container');
        if (mapContainer) {
          // LEAFLET MAP - exakt som framgångsrika projekten
          const leafletMap = L.map(mapContainer, {
            center: [62.4, 15.2], // Center of Sweden
            zoom: 6,
            minZoom: 4,
            maxZoom: 16,
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: false,
            keyboard: true,
            dragging: true,
            // PERFORMANCE SETTINGS som i framgångsrika projekten
            preferCanvas: true, // Better performance for many markers
            renderer: L.canvas() // Canvas renderer for better performance
          });

          // OpenStreetMap tiles - GRATIS och snabbt
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 16,
            // PERFORMANCE optimizations
            updateWhenZooming: false,
            updateWhenIdle: true,
            keepBuffer: 2
          }).addTo(leafletMap);

          setMap(leafletMap);
          setLeafletLoaded(true);
          
          // Add markers när data är laddat
          if (preschools.length > 0) {
            addLeafletMarkers(leafletMap);
          }
        }
      };
      
      script.onerror = () => {
        console.error('Failed to load Leaflet');
      };
      
      document.body.appendChild(script);
    } catch (error) {
      console.error('Error loading Leaflet:', error);
    }
  };

  const addLeafletMarkers = (leafletMap: any) => {
    // @ts-ignore
    const L = window.L;
    
    // Clear existing markers
    leafletMap.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        leafletMap.removeLayer(layer);
      }
    });

    // Filter och begränsa för prestanda - som framgångsrika projekten
    const validPreschools = preschools
      .filter(p => {
        if (!p.Latitud || !p.Longitud || p.Latitud === 0 || p.Longitud === 0) return false;
        if (searchQuery) {
          return p.Namn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 p.Kommun.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .slice(0, 500); // Leaflet klarar fler markers än Mapbox

    console.log(`Adding ${validPreschools.length} Leaflet markers`);

    // LEAFLET MARKERS - mycket lättare än Mapbox markers
    validPreschools.forEach((preschool) => {
      // Enkla cirklar som framgångsrika projekten
      const marker = L.circleMarker([preschool.Latitud, preschool.Longitud], {
        radius: 6,
        fillColor: '#3b82f6',
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      });

      // Popup som framgångsrika projekten
      marker.bindPopup(`
        <div style="padding: 8px; font-family: system-ui; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #333;">
            ${preschool.Namn}
          </h3>
          <p style="margin: 4px 0; color: #666; font-size: 14px;">
            <strong>Kommun:</strong> ${preschool.Kommun}
          </p>
          ${preschool.Adress ? `
            <p style="margin: 4px 0; color: #666; font-size: 14px;">
              <strong>Adress:</strong> ${preschool.Adress}
            </p>
          ` : ''}
          ${preschool['Antal barn'] ? `
            <p style="margin: 4px 0; color: #666; font-size: 14px;">
              <strong>Antal barn:</strong> ${preschool['Antal barn']}
            </p>
          ` : ''}
        </div>
      `, {
        closeButton: true,
        autoPan: true,
        keepInView: true
      });

      marker.addTo(leafletMap);
    });
  };

  // Update markers när search ändras
  useEffect(() => {
    if (leafletLoaded && map && preschools.length > 0) {
      addLeafletMarkers(map);
    }
  }, [searchQuery, leafletLoaded, map, preschools]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>Ett fel uppstod</h1>
          <p style={{ color: '#6b7280' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Ultra-snabb landing animation */}
      {showLanding && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          opacity: showLanding ? 1 : 0,
          transition: 'opacity 0.4s ease'
        }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              margin: '0 auto 1rem', 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              animation: 'leafletPulse 1.5s infinite'
            }}>
              <MapPin style={{ width: '40px', height: '40px' }} />
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>Sveriges Förskolor</h1>
            <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>LEAFLET - Ultra-snabb!</p>
          </div>
        </div>
      )}

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        opacity: showLanding ? 0 : 1,
        transition: 'opacity 0.4s ease'
      }}>
        {/* Header som framgångsrika projekten */}
        <header style={{
          position: 'relative',
          zIndex: 40,
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem',
          opacity: showLanding ? 0 : 1,
          transform: `translateY(${showLanding ? '-15px' : '0'})`,
          transition: 'all 0.3s ease 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img 
                src={preschoolIcon} 
                alt="Sveriges Förskolor" 
                style={{ width: '48px', height: '48px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Förskolor i Sverige
                </h1>
                <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
                  LEAFLET - {preschools.length} förskolor laddat snabbt!
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowStatistics(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <BarChart3 style={{ width: '18px', height: '18px' }} />
              Statistik
            </button>
          </div>
        </header>

        {/* Sökruta - som framgångsrika projekten */}
        <div style={{
          position: 'absolute',
          left: '1rem',
          top: '140px',
          zIndex: 30,
          opacity: showLanding ? 0 : 1,
          transform: `translateX(${showLanding ? '-15px' : '0'})`,
          transition: 'all 0.3s ease 0.3s'
        }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              width: '16px', 
              height: '16px', 
              color: '#9ca3af' 
            }} />
            <input 
              placeholder="Sök förskolor, kommun..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '2.5rem',
                width: '300px',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(8px)',
                borderRadius: '0.5rem',
                border: 'none',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        {/* LEAFLET KARTA - som framgångsrika projekten */}
        <div style={{
          height: 'calc(100vh - 120px)',
          opacity: showLanding ? 0 : 1,
          transition: 'opacity 0.4s ease 0.4s'
        }}>
          <div 
            id="leaflet-container" 
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Loading overlay */}
        {isLoading && !showLanding && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(248,250,252,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                border: '4px solid #10b981', 
                borderTop: '4px solid transparent', 
                borderRadius: '50%', 
                margin: '0 auto 1rem',
                animation: 'leafletSpin 0.8s linear infinite'
              }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Laddar förskolor...</h2>
              <p style={{ color: '#6b7280' }}>LEAFLET - Snabbaste kartan!</p>
            </div>
          </div>
        )}

        {/* Status som framgångsrika projekten */}
        {leafletLoaded && (
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '2rem',
            fontSize: '0.875rem',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#10b981', 
              borderRadius: '50%',
              animation: 'leafletPulse 2s infinite'
            }} />
            LEAFLET Ultra-snabb • {preschools.filter(p => p.Latitud && p.Longitud).length} förskolor
          </div>
        )}
      </div>

      {/* Statistik modal */}
      {showStatistics && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem'
          }}
          onClick={() => setShowStatistics(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '400px',
              width: '100%',
              transform: 'scale(0.9)',
              animation: 'leafletScaleIn 0.3s ease forwards'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>LEAFLET Statistik</h3>
            <div style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
              <p><strong>Totalt antal förskolor:</strong> {preschools.length.toLocaleString()}</p>
              <p><strong>Med koordinater:</strong> {preschools.filter(p => p.Latitud && p.Longitud).length}</p>
              <p><strong>Med barn-data:</strong> {preschools.filter(p => p['Antal barn']).length}</p>
              {searchQuery && (
                <p><strong>Filtrerade:</strong> {preschools.filter(p => 
                  p.Namn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.Kommun.toLowerCase().includes(searchQuery.toLowerCase())
                ).length}</p>
              )}
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>
                <strong>Prestanda:</strong> Leaflet - bara ~40kb vs 2MB Mapbox!
              </p>
            </div>
            <button 
              onClick={() => setShowStatistics(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Stäng
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes leafletPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes leafletSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes leafletScaleIn {
          0% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        
        /* Leaflet optimizations */
        .leaflet-container {
          background: #f8fafc !important;
        }
        .leaflet-control-zoom {
          border-radius: 0.5rem !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 0.75rem !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </>
  );
};

export default LeafletFastIndex;