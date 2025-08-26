import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMapStore } from '@/stores/mapStore';
import { useComparisonStore } from '@/stores/comparisonStore';
import { supabase } from '@/integrations/supabase/client';
import { X, MapPin, Users, GraduationCap, Star, Phone, Globe, Camera, Navigation, Plus, Route, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PreschoolDetailsModal } from './enhanced/PreschoolDetailsModal';
import { StarRating } from '@/components/ui/star-rating';
import { DirectionsPanel } from '@/components/directions/DirectionsPanel';
import { StreetViewPanel } from '@/components/streetview/StreetViewPanel';

interface GoogleData {
  google_rating?: number;
  google_reviews_count?: number;
  google_photos?: string[];
  website_url?: string;
  contact_phone?: string;
  formatted_address?: string;
}

export const PreschoolDetails: React.FC = () => {
  const { selectedPreschool, setSelectedPreschool } = useMapStore();
  const { addToComparison, removeFromComparison, isInComparison } = useComparisonStore();
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  const [googleData, setGoogleData] = useState<GoogleData | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();

  useEffect(() => {
    if (selectedPreschool) {
      fetchGoogleData();
    }
  }, [selectedPreschool]);

  const fetchGoogleData = async () => {
    if (!selectedPreschool) return;

    setIsLoadingGoogle(true);
    try {
      // First, check if we have cached Google data
      const { data: cachedData } = await supabase
        .from('preschool_google_data')
        .select('*')
        .eq('preschool_id', selectedPreschool.id)
        .single();

      if (cachedData && cachedData.last_updated) {
        const lastUpdated = new Date(cachedData.last_updated);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

        // Use cached data if it's less than 24 hours old
        if (hoursDiff < 24) {
          setGoogleData({
            google_rating: cachedData.google_rating,
            google_reviews_count: cachedData.google_reviews_count,
            google_photos: cachedData.google_photos || [],
            website_url: cachedData.website_url,
            contact_phone: cachedData.contact_phone,
            formatted_address: cachedData.formatted_address
          });
          
          // Load photo URLs
          if (cachedData.google_photos && cachedData.google_photos.length > 0) {
            loadPhotoUrls(cachedData.google_photos);
          }
          setIsLoadingGoogle(false);
          return;
        }
      }

      // Fetch fresh data from Google Places enricher
      const { data, error } = await supabase.functions.invoke('google-places-enricher', {
        body: {
          preschoolId: selectedPreschool.id,
          lat: selectedPreschool.latitud,
          lng: selectedPreschool.longitud,
          address: selectedPreschool.adress,
          name: selectedPreschool.namn
        }
      });

      if (error) throw error;

      if (data?.success) {
        // Refetch cached data after enrichment
        const { data: refreshedData } = await supabase
          .from('preschool_google_data')
          .select('*')
          .eq('preschool_id', selectedPreschool.id)
          .single();
        
        if (refreshedData) {
          setGoogleData(refreshedData);
          if (refreshedData.google_photos && refreshedData.google_photos.length > 0) {
            loadPhotoUrls(refreshedData.google_photos);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Google data:', error);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const loadPhotoUrls = async (photoReferences: string[]) => {
    try {
      const photoUrls = await Promise.all(
        photoReferences.slice(0, 3).map(async (ref) => {
          const { data } = await supabase.functions.invoke('google-places', {
            body: {
              action: 'getPhoto',
              photoReference: ref,
              maxWidth: 400
            }
          });
          return data?.data?.photoUrl;
        })
      );
      setPhotos(photoUrls.filter(Boolean));
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const openDirections = () => {
    if (selectedPreschool) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPreschool.latitud},${selectedPreschool.longitud}`;
      window.open(url, '_blank');
    }
  };

  const handleComparisonToggle = () => {
    if (!selectedPreschool) return;
    
    if (isInComparison(selectedPreschool.id)) {
      removeFromComparison(selectedPreschool.id);
    } else {
      addToComparison(selectedPreschool);
    }
  };

  if (!selectedPreschool) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ duration: 0.3 }}
        className="fixed right-4 top-4 bottom-4 w-96 z-50"
      >
        <Card className="h-full bg-card/95 backdrop-blur-sm border-border/50 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {selectedPreschool.namn}
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{selectedPreschool.adress}, {selectedPreschool.kommun}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPreschool(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Google Rating */}
            {googleData?.google_rating && (
              <div className="mt-3">
                <StarRating 
                  rating={googleData.google_rating} 
                  reviewCount={googleData.google_reviews_count || 0}
                  size="md"
                />
                {googleData.google_rating >= 4.5 && (
                  <Badge variant="default" className="ml-2 text-xs">
                    Högbetyg
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Photos */}
            {photos.length > 0 && (
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Bilder
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((photoUrl, index) => (
                    <img
                      key={index}
                      src={photoUrl}
                      alt={`${selectedPreschool.namn} bild ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold mb-3">Grundinformation</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Huvudman:</span>
                  <Badge variant="secondary">{selectedPreschool.huvudman}</Badge>
                </div>
                
                {selectedPreschool.antal_barn && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Antal barn:</span>
                    <span className="font-medium">{selectedPreschool.antal_barn}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barngrupper:</span>
                  <span className="font-medium">{selectedPreschool.antal_barngrupper}</span>
                </div>
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Kvalitetsmått
              </h3>
              <div className="space-y-3">
                {selectedPreschool.personaltäthet && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Personaltäthet:</span>
                    <span className="font-medium">{selectedPreschool.personaltäthet.toFixed(1)}</span>
                  </div>
                )}

                {selectedPreschool.andel_med_förskollärarexamen && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Förskollärarexamen:</span>
                    <span className="font-medium">
                      {selectedPreschool.andel_med_förskollärarexamen.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            {(googleData?.website_url || googleData?.contact_phone) && (
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold mb-3">Kontakt</h3>
                <div className="space-y-2">
                  {googleData.website_url && (
                    <a
                      href={googleData.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      Webbsida
                    </a>
                  )}
                  {googleData.contact_phone && (
                    <a
                      href={`tel:${googleData.contact_phone}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="w-4 h-4" />
                      {googleData.contact_phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoadingGoogle && (
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <span className="text-sm">Hämtar ytterligare information...</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-border space-y-2">
            <Button 
              onClick={handleComparisonToggle}
              variant={isInComparison(selectedPreschool.id) ? "destructive" : "secondary"}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isInComparison(selectedPreschool.id) ? 'Ta bort från jämförelse' : 'Lägg till jämförelse'}
            </Button>
            <Button 
              onClick={() => setShowDetailedModal(true)}
              variant="default"
              className="w-full"
            >
              Visa alla detaljer
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => setShowDirections(!showDirections)} 
                variant="outline"
                size="sm"
              >
                <Route className="w-4 h-4 mr-2" />
                Restid
              </Button>
              <Button 
                onClick={() => setShowStreetView(!showStreetView)} 
                variant="outline"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Gatuvy
              </Button>
            </div>
            <Button 
              onClick={openDirections} 
              variant="outline"
              className="w-full"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Öppna i Google Maps
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Additional Panels */}
      {showDirections && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed right-4 bottom-4 w-96 z-40"
        >
          <DirectionsPanel
            preschool={selectedPreschool}
            userLocation={userLocation}
            onClose={() => setShowDirections(false)}
          />
        </motion.div>
      )}

      {showStreetView && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed left-4 bottom-4 w-96 z-40"
        >
          <StreetViewPanel
            preschool={selectedPreschool}
            onClose={() => setShowStreetView(false)}
          />
        </motion.div>
      )}

      {/* Detailed Modal */}
      <PreschoolDetailsModal
        preschool={selectedPreschool}
        isOpen={showDetailedModal}
        onClose={() => setShowDetailedModal(false)}
      />
    </AnimatePresence>
  );
};