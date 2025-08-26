import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useImageCache } from '@/hooks/useImageCache';

interface PreschoolImageGalleryProps {
  preschoolId: string;
  preschoolName: string;
  streetViewPanoId?: string;
  lat?: number;
  lng?: number;
}

export const PreschoolImageGallery: React.FC<PreschoolImageGalleryProps> = ({
  preschoolId,
  preschoolName,
  streetViewPanoId,
  lat,
  lng
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { getImages } = useImageCache();

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      try {
        const imageUrls = await getImages(preschoolId);
        const allImages = [...imageUrls];
        
        // Add Street View image if available
        if (streetViewPanoId && lat && lng) {
          const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${lat},${lng}&fov=90&pitch=0&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY || 'demo'}`;
          allImages.push(streetViewUrl);
        }
        
        setImages(allImages);
      } catch (error) {
        console.error('Error loading images:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, [preschoolId, streetViewPanoId, lat, lng, getImages]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const openStreetView = () => {
    if (lat && lng) {
      const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
      window.open(streetViewUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Bilder
        </h4>
        <div className="w-full h-48 bg-muted rounded-lg animate-pulse flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Laddar bilder...</span>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Bilder
        </h4>
        <div className="w-full h-32 bg-muted/30 rounded-lg flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Inga bilder tillgängliga</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Bilder
          </h4>
          {images.length > 1 && (
            <Badge variant="secondary" className="text-xs">
              {currentIndex + 1} / {images.length}
            </Badge>
          )}
        </div>

        <div className="relative group">
          <div 
            className="w-full h-48 bg-muted rounded-lg overflow-hidden cursor-pointer"
            onClick={openFullscreen}
          >
            <img
              src={images[currentIndex]}
              alt={`${preschoolName} - Bild ${currentIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                console.error('Failed to load image:', images[currentIndex]);
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </div>

          {/* Navigation Controls */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Street View Badge */}
          {streetViewPanoId && currentIndex === images.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-2 right-2 bg-black/50 text-white hover:bg-black/70 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                openStreetView();
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Street View
            </Button>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="flex gap-1 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                  index === currentIndex 
                    ? 'border-primary' 
                    : 'border-transparent hover:border-muted-foreground/50'
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={closeFullscreen}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[currentIndex]}
                alt={`${preschoolName} - Fullscreen`}
                className="max-w-full max-h-full object-contain"
              />
              
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={closeFullscreen}
              >
                <X className="h-6 w-6" />
              </Button>

              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};