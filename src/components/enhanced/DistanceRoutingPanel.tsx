import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Navigation, MapPin, Clock, Route, Car, Walking, Bike, X, ExternalLink } from 'lucide-react';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DistanceData {
  distance: string;
  duration: string;
  mode: 'driving' | 'walking' | 'bicycling';
}

interface DistanceRoutingPanelProps {
  preschool: Preschool;
}

export const DistanceRoutingPanel: React.FC<DistanceRoutingPanelProps> = ({ preschool }) => {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distances, setDistances] = useState<DistanceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<'driving' | 'walking' | 'bicycling'>('driving');
  const locationRequestedRef = useRef(false);

  // Request user location on component mount
  useEffect(() => {
    if (!locationRequestedRef.current) {
      requestLocation();
      locationRequestedRef.current = true;
    }
  }, []);

  // Calculate distances when location is available
  useEffect(() => {
    if (userLocation && preschool.latitud && preschool.longitud) {
      calculateDistances();
    }
  }, [userLocation, preschool]);

  const requestLocation = () => {
    setIsLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolokalisering stöds inte av denna webbläsare');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = 'Kunde inte hämta din position';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Platsbehörighet nekades. Aktivera platsdelning i webbläsaren.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Platsinformation är inte tillgänglig';
            break;
          case error.TIMEOUT:
            errorMessage = 'Timeout vid hämtning av position';
            break;
        }
        setLocationError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const calculateDistances = async () => {
    if (!userLocation || !preschool.latitud || !preschool.longitud) return;

    setIsLoading(true);
    const modes: ('driving' | 'walking' | 'bicycling')[] = ['driving', 'walking', 'bicycling'];
    const newDistances: DistanceData[] = [];

    try {
      // Calculate distances for all travel modes
      const promises = modes.map(async (mode) => {
        const distance = calculateStraightLineDistance(
          userLocation.lat, 
          userLocation.lng, 
          preschool.latitud!, 
          preschool.longitud!
        );

        // Estimate duration based on average speeds
        const speeds = {
          driving: 40, // km/h in city
          walking: 5,  // km/h
          bicycling: 15 // km/h
        };

        const durationMinutes = Math.round((distance / speeds[mode]) * 60);

        return {
          distance: `${distance.toFixed(1)} km`,
          duration: formatDuration(durationMinutes),
          mode
        };
      });

      const results = await Promise.all(promises);
      setDistances(results);
    } catch (error) {
      console.error('Error calculating distances:', error);
      setLocationError('Kunde inte beräkna avståndet');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate straight-line distance between two points (Haversine formula)
  const calculateStraightLineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}t ${remainingMinutes}min` : `${hours}t`;
  };

  const getModeIcon = (mode: 'driving' | 'walking' | 'bicycling') => {
    switch (mode) {
      case 'driving':
        return <Car className="w-4 h-4" />;
      case 'walking':
        return <Walking className="w-4 h-4" />;
      case 'bicycling':
        return <Bike className="w-4 h-4" />;
    }
  };

  const getModeColor = (mode: 'driving' | 'walking' | 'bicycling') => {
    switch (mode) {
      case 'driving':
        return 'text-blue-600 bg-blue-50';
      case 'walking':
        return 'text-green-600 bg-green-50';
      case 'bicycling':
        return 'text-orange-600 bg-orange-50';
    }
  };

  const getModeLabel = (mode: 'driving' | 'walking' | 'bicycling') => {
    switch (mode) {
      case 'driving':
        return 'Bil';
      case 'walking':
        return 'Gång';
      case 'bicycling':
        return 'Cykel';
    }
  };

  const openGoogleMapsDirections = (mode: 'driving' | 'walking' | 'bicycling') => {
    if (!userLocation || !preschool.latitud || !preschool.longitud) return;

    const travelMode = mode === 'bicycling' ? 'bicycling' : mode === 'walking' ? 'walking' : 'driving';
    const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${preschool.latitud},${preschool.longitud}/@${preschool.latitud},${preschool.longitud},15z/data=!4m2!4m1!3e${travelMode === 'driving' ? '0' : travelMode === 'walking' ? '2' : '1'}`;
    window.open(url, '_blank');
  };

  const selectedDistance = distances.find(d => d.mode === selectedMode);

  return (
    <Card className="p-4 bg-white/95 backdrop-blur-sm border border-border/50 shadow-lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Avstånd & Restid</h3>
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>Till {preschool.namn}</span>
          </div>
        </div>

        {/* Loading or error state */}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
            <span className="text-sm text-muted-foreground">
              {!userLocation ? 'Hämtar din position...' : 'Beräknar avståndet...'}
            </span>
          </div>
        )}

        {locationError && (
          <div className="text-center py-4">
            <p className="text-sm text-red-600 mb-3">{locationError}</p>
            <Button 
              onClick={requestLocation} 
              variant="outline" 
              size="sm"
            >
              <Navigation className="w-4 h-4 mr-1" />
              Försök igen
            </Button>
          </div>
        )}

        {/* Distance results */}
        {!isLoading && !locationError && distances.length > 0 && (
          <>
            {/* Mode selector */}
            <div className="flex space-x-2">
              {distances.map((distance) => (
                <motion.button
                  key={distance.mode}
                  onClick={() => setSelectedMode(distance.mode)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg transition-colors ${
                    selectedMode === distance.mode
                      ? getModeColor(distance.mode) + ' border-2 border-current'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {getModeIcon(distance.mode)}
                  <span className="text-xs font-medium">{getModeLabel(distance.mode)}</span>
                </motion.button>
              ))}
            </div>

            {/* Selected distance details */}
            {selectedDistance && (
              <motion.div
                key={selectedMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getModeIcon(selectedMode)}
                      <span className="font-medium text-sm">{getModeLabel(selectedMode)}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Uppskattning
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {selectedDistance.distance}
                      </div>
                      <div className="text-xs text-muted-foreground">Avstånd</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">
                        {selectedDistance.duration}
                      </div>
                      <div className="text-xs text-muted-foreground">Restid</div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => openGoogleMapsDirections(selectedMode)}
                    className="w-full"
                    size="sm"
                  >
                    <Route className="w-4 h-4 mr-2" />
                    Få vägbeskrivning
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </Card>
              </motion.div>
            )}

            {/* Quick distance overview */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {distances.map((distance) => (
                <div 
                  key={distance.mode} 
                  className="text-center p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-center mb-1">
                    {getModeIcon(distance.mode)}
                  </div>
                  <div className="font-medium">{distance.distance}</div>
                  <div className="text-muted-foreground">{distance.duration}</div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-muted-foreground text-center bg-yellow-50 p-2 rounded-lg">
              💡 Avståndet är beräknat fågelvägen. Faktiska rutter kan vara längre.
            </div>
          </>
        )}
      </div>
    </Card>
  );
};