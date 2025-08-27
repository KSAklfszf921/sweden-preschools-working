import React, { useState, useEffect } from 'react';
import { MapPin, Search, BarChart3 } from 'lucide-react';
import preschoolIcon from '@/assets/preschool-icon.jpg';

// HELT FRISTÅENDE VERSION - INGA TUNGA DEPENDENCIES
// Direkt Supabase-anslutning utan mellanhands-hooks

interface SimplePreschool {
  id: string;
  Namn: string;
  Kommun: string;
  Adress: string;
  Latitud: number | null;
  Longitud: number | null;
  'Antal barn': number | null;
  'Andel med förskollärarexamen': number | null;
}

const StandaloneFastIndex = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [showStatistics, setShowStatistics] = useState(false);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preschools, setPreschools] = useState<SimplePreschool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Ultra-snabb landing - bara 1 sekund
  useEffect(() => {
    const timer = setTimeout(() => setShowLanding(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Load data direkt från Supabase utan mellanhänder
  useEffect(() => {
    if (!showLanding) {
      loadPreschoolsDirectly();
      loadMapbox();
    }
  }, [showLanding]);

  const loadPreschoolsDirectly = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Direct Supabase call - NO HEAVY DEPENDENCIES
      const supabaseUrl = 'https://zfeqsdtddvelapbrwlol.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZXFzZHRkZHZlbGFwYnJ3bG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5ODc5ODEsImV4cCI6MjA1MDU2Mzk4MX0.Lkc9oWfR7fRAd6b9UYH5uBVfJD6dXQe7LCm2gSI-1s4';

      const response = await fetch(`${supabaseUrl}/rest/v1/Förskolor?select=id,Namn,Kommun,Adress,Latitud,Longitud,Antal barn,Andel med förskollärarexamen&limit=1000`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch preschools');
      
      const data = await response.json();
      setPreschools(data || []);
      console.log(`✅ Loaded ${data.length} preschools directly from Supabase`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preschools');
      console.error('Error loading preschools:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMapbox = async () => {
    try {
      // Load CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      document.head.appendChild(cssLink);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => {
        // @ts-ignore
        const mapboxgl = window.mapboxgl;
        mapboxgl.accessToken = 'pk.eyJ1Ijoic2tvZ3N0YWRpc2FrIiwiYSI6ImNtY3BhaXRpMjA0ZGcycHBqNHM4dmlwOW0ifQ.KKHGGPnrZVjNjDdITF-_bw';

        const mapContainer = document.getElementById('mapbox-container');
        if (mapContainer) {
          const map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/mapbox/light-v10',
            center: [15.2, 62.4],
            zoom: 5.5,
            dragRotate: false,
            pitchWithRotate: false,
            touchZoomRotate: false,
          });

          map.addControl(new mapboxgl.NavigationControl({
            showCompass: false,
            showZoom: true
          }), 'top-right');

          map.on('load', () => {
            setMapboxLoaded(true);
            addMarkersDirectly(map);
          });
        }
      };
      
      document.body.appendChild(script);
    } catch (error) {
      console.error('Error loading Mapbox:', error);
    }
  };

  const addMarkersDirectly = (map: any) => {
    // @ts-ignore
    const mapboxgl = window.mapboxgl;
    
    // Filter and limit for performance
    const validPreschools = preschools
      .filter(p => {
        if (!p.Latitud || !p.Longitud || p.Latitud === 0 || p.Longitud === 0) return false;
        if (searchQuery) {
          return p.Namn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 p.Kommun.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .slice(0, 400); // Begränsa för prestanda

    // Clear existing markers
    document.querySelectorAll('.standalone-marker').forEach(m => m.remove());

    validPreschools.forEach((preschool) => {
      const el = document.createElement('div');
      el.className = 'standalone-marker';
      el.style.cssText = `
        width: 8px;
        height: 8px;
        background-color: #3b82f6;
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: transform 0.2s ease;
      `;

      el.addEventListener('mouseenter', () => el.style.transform = 'scale(1.4)');
      el.addEventListener('mouseleave', () => el.style.transform = 'scale(1)');

      const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(`
        <div style="padding: 8px; font-family: system-ui;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${preschool.Namn}</h3>
          <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Kommun:</strong> ${preschool.Kommun}</p>
          ${preschool.Adress ? `<p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Adress:</strong> ${preschool.Adress}</p>` : ''}
          ${preschool['Antal barn'] ? `<p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Antal barn:</strong> ${preschool['Antal barn']}</p>` : ''}
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([preschool.Longitud, preschool.Latitud])
        .setPopup(popup)
        .addTo(map);
    });

    console.log(`✅ Added ${validPreschools.length} markers to map`);
  };

  // Update markers when search changes
  useEffect(() => {
    if (mapboxLoaded && preschools.length > 0) {
      const mapContainer = document.getElementById('mapbox-container');
      if (mapContainer) {
        const map = (mapContainer as any)._map;
        if (map) addMarkersDirectly(map);
      }
    }
  }, [searchQuery, mapboxLoaded, preschools]);

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
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          opacity: showLanding ? 1 : 0,
          transition: 'opacity 0.5s ease'
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
              animation: 'pulse 1.5s infinite'
            }}>
              <MapPin style={{ width: '40px', height: '40px' }} />
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>Sveriges Förskolor</h1>
            <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>ULTRA-SNABB karta!</p>
          </div>
        </div>
      )}

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        opacity: showLanding ? 0 : 1,
        transition: 'opacity 0.5s ease'
      }}>
        {/* Ultra-enkel header */}
        <header style={{
          position: 'relative',
          zIndex: 40,
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem',
          opacity: showLanding ? 0 : 1,
          transform: `translateY(${showLanding ? '-20px' : '0'})`,
          transition: 'all 0.4s ease 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img 
                src={preschoolIcon} 
                alt="Sveriges Förskolor" 
                style={{ width: '48px', height: '48px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Förskolor i Sverige
                </h1>
                <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
                  ULTRA-SNABB version - {preschools.length} förskolor!
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
                fontWeight: '500'
              }}
            >
              <BarChart3 style={{ width: '18px', height: '18px' }} />
              Statistik
            </button>
          </div>
        </header>

        {/* Enkel sökruta */}
        <div style={{
          position: 'absolute',
          left: '1rem',
          top: '140px',
          zIndex: 30,
          opacity: showLanding ? 0 : 1,
          transform: `translateX(${showLanding ? '-20px' : '0'})`,
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
                width: '320px',
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

        {/* FRISTÅENDE ULTRA-SNABB MAPBOX KARTA */}
        <div style={{
          height: 'calc(100vh - 120px)',
          opacity: showLanding ? 0 : 1,
          transition: 'opacity 0.4s ease 0.4s'
        }}>
          <div 
            id="mapbox-container" 
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
                border: '4px solid #3b82f6', 
                borderTop: '4px solid transparent', 
                borderRadius: '50%', 
                margin: '0 auto 1rem',
                animation: 'spin 0.8s linear infinite'
              }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Laddar förskolor...</h2>
              <p style={{ color: '#6b7280' }}>Direct från Supabase - SNABBT!</p>
            </div>
          </div>
        )}

        {/* Status indikator */}
        {mapboxLoaded && (
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
              animation: 'pulse 2s infinite'
            }} />
            FRISTÅENDE SNABB • {preschools.filter(p => p.Latitud && p.Longitud).length} förskolor
          </div>
        )}
      </div>

      {/* Enkel statistik modal */}
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
              animation: 'scaleIn 0.3s ease forwards'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Snabb Statistik</h3>
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
            </div>
            <button 
              onClick={() => setShowStatistics(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#3b82f6',
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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default StandaloneFastIndex;