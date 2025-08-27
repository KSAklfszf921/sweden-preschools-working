import React, { useState, useEffect } from 'react';
// ENKEL IMPLEMENTATION - bara Leaflet och grundläggande komponenter
import { LeafletMap } from '@/components/LeafletMap';
import { AdminPanel } from '@/components/AdminPanel';
import { ComparisonModal } from '@/components/ComparisonModal';
import { usePreschools } from '@/hooks/usePreschools';
import { useMapStore } from '@/stores/mapStore';
import { useComparisonStore } from '@/stores/comparisonStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Settings, BarChart3, GitCompare, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import preschoolIcon from '@/assets/preschool-icon.jpg';

const Index = () => {
  const {
    preschools,
    isLoading,
    error
  } = usePreschools();
  const {
    searchBoxCollapsed,
    setSearchBoxCollapsed
  } = useMapStore();
  const {
    selectedPreschools,
    setIsOpen
  } = useComparisonStore();
  const isMobile = useIsMobile();
  const [showLanding, setShowLanding] = useState(true);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // 🚀 OPTIMERAD: Snabbare övergång utan extra delays
  const handleLandingComplete = () => {
    setShowLanding(false);
    // Starta kartan direkt för snabbare känsla
    setIsMapVisible(true);
  };

  // 🛡️ SÄKERHETSÅTGÄRD: Om animationen inte fungerar, visa huvudinnehållet efter 5 sekunder
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (showLanding) {
        console.warn('Loading animation timeout - showing main content as fallback');
        handleLandingComplete();
      }
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, [showLanding]);

  // Add toggle button for collapsed search box
  const showSearchToggle = searchBoxCollapsed;
  
  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Ett fel uppstod</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>;
  }

  return (
    <>
      {/* FÖRENKLAD SNABB LOADING - ingen tung animation */}
      {showLanding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold mb-2">Sveriges Förskolor</h2>
            <p className="text-lg opacity-90">Laddar snabbt...</p>
          </div>
        </div>
      )}

      <div 
        className={`min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 transition-opacity duration-300 ${showLanding ? 'opacity-0' : 'opacity-100'}`}
        id="main-content"
      >
        {/* FÖRENKLAD Header - ingen motion animation */}
        <header 
          className={`relative z-40 bg-white border-b border-border/10 transition-all duration-200 ${showLanding ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}
        >
          <div className="container mx-auto px-6 md:px-8 py-4 md:py-6">
            <div className="flex items-center justify-between">
              {/* Logo and Title Section */}
              <div className="flex items-center space-x-3 md:space-x-5">
                <img 
                  src={preschoolIcon} 
                  alt="Sveriges Förskolor" 
                  className="w-10 h-10 md:w-14 md:h-14 rounded-2xl shadow-lg hover:scale-105 transition-transform duration-200"
                />
                <div>
                  <h1 className="text-xl md:text-4xl font-bold text-gradient font-heading leading-tight">
                    Förskolor i Sverige
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground font-medium mt-1 md:mt-2 hidden sm:block">
                    Hitta och jämför förskolor – i hela landet
                  </p>
                </div>
              </div>

              {/* Action Buttons - Desktop only */}
              <div className="hidden md:flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="items-center gap-3 glass-effect hover-glow-subtle relative border-0 font-semibold" 
                  onClick={() => setIsOpen(true)}
                >
                  <GitCompare className="w-5 h-5" />
                  Jämför
                  {selectedPreschools.length > 0 && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 h-6 w-6 p-0 text-sm flex items-center justify-center bg-primary text-primary-foreground">
                      {selectedPreschools.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </header>

      {/* Main content */}
      <div className={`relative ${isMobile ? 'pb-16' : ''}`}>
          {/* Enkel sökning - sparar på prestanda */}

          {/* FÖRENKLAD MAP - CSS transition endast */}
          <div 
            className={`${isMobile ? 'h-[calc(100vh-64px)]' : 'h-screen'} transition-opacity duration-400 delay-200 ${showLanding ? 'opacity-0' : 'opacity-100'}`}
          >
            <LeafletMap preschools={preschools || []} className="w-full h-full" />
          </div>
          
          {/* Toggle button for collapsed search box */}
          {showSearchToggle && <button onClick={() => setSearchBoxCollapsed(false)} className="absolute top-4 left-4 z-50 bg-card/95 backdrop-blur-lg shadow-nordic border-border/50 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
              🔍 Sök förskolor
            </button>}

          {/* BARA kritiska komponenter som användaren aktivt behöver */}
          
          {/* Admin Panel - bara när användaren klickar */}
          {showAdmin && (
            <AdminPanel isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
          )}

          {/* Jämför Modal */}
          <ComparisonModal />
          
          {/* FÖRENKLAD Mobile List Button */}
          {isMobile && (
            <div 
              className={`fixed bottom-20 right-4 z-40 md:hidden transition-all duration-300 delay-300 ${showLanding ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}
            >
              <Button 
                variant="outline" 
                size="sm" 
                className="glass-effect hover-glow-subtle border-0 p-3 rounded-full shadow-lg"
                onClick={() => {/* Toggle mobile list */}}
              >
                <MapPin className="w-5 h-5" />
              </Button>
            </div>
          )}

          
          {/* FÖRENKLAD Admin Button - ingen AnimatedButton */}
          <div 
            className={`fixed bottom-6 right-6 z-40 transition-all duration-300 delay-400 ${showLanding ? 'opacity-0 translate-y-3 scale-90' : 'opacity-100 translate-y-0 scale-100'}`}
          >
            <Button 
              onClick={() => setShowAdmin(true)} 
              variant="outline" 
              size="lg" 
              className="glass-effect hover:scale-105 transition-transform border-0 p-4 rounded-2xl shadow-lg hover:shadow-xl"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>

          {/* FÖRENKLAD Loading overlay - CSS endast */}
          {isLoading && !showLanding && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-lg flex items-center justify-center z-50 animate-fadeIn">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Laddar snabb Leaflet-karta...</h2>
                <p className="text-muted-foreground">Lätt och snabb kartupplevelse!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Index;