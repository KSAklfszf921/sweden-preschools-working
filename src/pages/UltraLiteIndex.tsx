import React, { useState, useEffect } from 'react';
// ULTRA-LITE VERSION - inga tunga bibliotek alls!
import UltraSimpleMap from '@/components/UltraSimpleMap';
import { useUltraLitePreschools } from '@/hooks/useUltraLitePreschools';
import { useMapStore } from '@/stores/mapStore';
import preschoolIcon from '@/assets/preschool-icon.jpg';

// Ingen framer-motion, ingen fuse.js, inga lazy imports - bara det absolut nödvändiga!
const UltraLiteIndex = () => {
  const { isLoading, error } = useUltraLitePreschools();
  const { filteredPreschools } = useMapStore();
  const [showLanding, setShowLanding] = useState(true);

  // Enkel 2-sekunder loading utan animationer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLanding(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Ett fel uppstod</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ENKEL LOADING - ingen tung animation */}
      {showLanding && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)'
        }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{
              width: '64px',
              height: '64px',
              border: '4px solid white',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Sveriges Förskolor</h2>
            <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>Ultrasnabb version!</p>
          </div>
        </div>
      )}

      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        opacity: showLanding ? 0 : 1,
        transition: 'opacity 0.3s'
      }}>
        {/* MINIMAL HEADER - bara CSS */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          opacity: showLanding ? 0 : 1,
          transform: showLanding ? 'translateY(-8px)' : 'translateY(0)',
          transition: 'all 0.3s'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img 
                src={preschoolIcon} 
                alt="Sveriges Förskolor" 
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <div>
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  Förskolor i Sverige
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  fontWeight: 500,
                  margin: '0.5rem 0 0 0'
                }}>
                  Hitta och jämför förskolor – ultrasnabb version
                </p>
              </div>
            </div>

            {/* ENKEL STATUS */}
            <div style={{
              background: '#10b981',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
            }}>
              ✨ {filteredPreschools.length} förskolor
            </div>
          </div>
        </header>

        {/* ULTRALITE KARTA - bara HTML/CSS */}
        <div style={{ 
          height: 'calc(100vh - 120px)',
          opacity: showLanding ? 0 : 1,
          transition: 'opacity 0.4s 0.2s'
        }}>
          <UltraSimpleMap className="w-full h-full" />
        </div>

        {/* LOADING OVERLAY - minimal */}
        {isLoading && !showLanding && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(248, 250, 252, 0.95)',
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
                border: '4px solid #3B82F6',
                borderTop: '4px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }}></div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
                Laddar ultrasnabb karta...
              </h2>
              <p style={{ color: '#6b7280' }}>
                Ingen tung mapbox eller leaflet - bara ren prestanda!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CSS KEYFRAMES - bara för spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default UltraLiteIndex;