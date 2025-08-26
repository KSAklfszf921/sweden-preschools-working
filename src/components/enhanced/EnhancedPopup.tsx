import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Users, Star, TrendingUp, Award, Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { ClickOutside } from '@/components/ui/click-outside';
import { Preschool } from '@/stores/mapStore';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedPopupProps {
  preschool: Preschool;
  onClose: () => void;
  onViewDetails: () => void;
  nationalAverage?: {
    avgChildren: number;
    avgStaff: number;
    avgTeacherExam: number;
    avgRating: number;
  };
}

export const EnhancedPopup: React.FC<EnhancedPopupProps> = ({
  preschool,
  onClose,
  onViewDetails,
  nationalAverage
}) => {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    fetchImages();
  }, [preschool.id]);

  const fetchImages = async () => {
    try {
      const { data: imageData, error } = await supabase
        .from('preschool_images')
        .select('image_url')
        .eq('preschool_id', preschool.id)
        .eq('image_type', 'google_places')
        .limit(2)
        .order('created_at');

      if (error) {
        console.error('Error fetching images:', error);
        return;
      }

      if (imageData && imageData.length > 0) {
        setImages(imageData.map(img => img.image_url));
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const getComparisonBadge = (value: number, average: number, isHigherBetter: boolean = true) => {
    const diff = value - average;
    const percentDiff = (diff / average) * 100;
    
    if (Math.abs(percentDiff) < 5) return null;
    
    const isPositive = isHigherBetter ? diff > 0 : diff < 0;
    
    return (
      <Badge 
        variant={isPositive ? "default" : "secondary"} 
        className="text-xs ml-1"
      >
        {isPositive ? "↑" : "↓"} {Math.abs(percentDiff).toFixed(0)}%
      </Badge>
    );
  };

  return (
    <ClickOutside onClickOutside={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
      >
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-lg">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground">
                  {preschool.namn}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {preschool.huvudman === 'Enskild' ? 'Fristående' : preschool.huvudman}
                  </Badge>
                  {preschool.google_rating && preschool.google_rating >= 4.5 && (
                    <Badge variant="default" className="text-xs">
                      Toppenbetyg
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Google Rating */}
            {preschool.google_rating && (
              <div className="mt-3">
                <StarRating 
                  rating={preschool.google_rating} 
                  reviewCount={preschool.google_reviews_count || 0}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{preschool.adress}</p>
                <p className="text-xs text-muted-foreground">{preschool.kommun}</p>
              </div>
            </div>
          
          {/* Images Preview */}
          {images.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Bilder</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {images.map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`${preschool.namn} bild ${index + 1}`}
                    className="w-full h-20 object-cover rounded-md"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          )}
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Children Count */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{preschool.antal_barn || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">Barn</p>
                  {nationalAverage && preschool.antal_barn && 
                    getComparisonBadge(preschool.antal_barn, nationalAverage.avgChildren)}
                </div>
              </div>

              {/* Staff Density */}
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {preschool.personaltäthet ? preschool.personaltäthet.toFixed(1) : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Personal</p>
                  {nationalAverage && preschool.personaltäthet && 
                    getComparisonBadge(preschool.personaltäthet, nationalAverage.avgStaff, false)}
                </div>
              </div>

              {/* Teacher Qualification */}
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {preschool.andel_med_förskollärarexamen ? `${preschool.andel_med_förskollärarexamen}%` : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Lärarexamen</p>
                  {nationalAverage && preschool.andel_med_förskollärarexamen && 
                    getComparisonBadge(preschool.andel_med_förskollärarexamen, nationalAverage.avgTeacherExam)}
                </div>
              </div>

              {/* Groups */}
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{preschool.antal_barngrupper}</p>
                  <p className="text-xs text-muted-foreground">Grupper</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={onViewDetails}
                className="flex-1"
                variant="default"
                size="sm"
              >
                Mer detaljer
              </Button>
              <Button 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${preschool.adress}, ${preschool.kommun}`)}`, '_blank')}
                variant="outline"
                size="sm"
              >
                Vägbeskrivning
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </ClickOutside>
  );
};