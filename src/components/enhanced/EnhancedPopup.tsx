import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Users, 
  GraduationCap, 
  Star, 
  Navigation, 
  Heart,
  ExternalLink,
  Building2,
  Phone,
  Clock,
  Globe,
  MessageSquare
} from 'lucide-react';
import { Preschool } from '@/stores/mapStore';

interface EnhancedPopupProps {
  preschool: Preschool;
  onClose: () => void;
  onViewDetails: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  nationalAverage?: {
    avgChildren: number;
    avgStaff: number;
    avgTeacherExam: number;
    avgRating: number;
  };
  className?: string;
}

export const EnhancedPopup: React.FC<EnhancedPopupProps> = ({
  preschool,
  onClose,
  onViewDetails,
  onFavorite,
  isFavorite = false,
  nationalAverage,
  className
}) => {
  const getComparisonBadge = (value: number, average: number, unit: string = '') => {
    const diff = ((value - average) / average) * 100;
    if (Math.abs(diff) < 5) return null;
    
    const isPositive = diff > 0;
    return (
      <Badge 
        variant={isPositive ? "default" : "destructive"} 
        className="text-xs ml-2"
      >
        {isPositive ? '+' : ''}{diff.toFixed(0)}% {unit}
      </Badge>
    );
  };

  const getDirectionsUrl = () => {
    const query = encodeURIComponent(`${preschool.adress}, ${preschool.kommun}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < Math.floor(rating) 
                ? 'text-yellow-400 fill-yellow-400' 
                : i < rating 
                  ? 'text-yellow-400 fill-yellow-400/50'
                  : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">
          ({preschool.google_reviews_count || 0})
        </span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-md w-full mx-4 ${className}`}
    >
      <Card className="bg-card/98 backdrop-blur-lg shadow-nordic border-border/50 overflow-hidden">
        {/* Header */}
        <div className="relative p-4 bg-gradient-to-r from-primary/10 to-primary-glow/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground leading-tight">
                {preschool.namn}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {preschool.huvudman}
                </Badge>
                {preschool.google_rating && preschool.google_rating > 4 && (
                  <Badge variant="default" className="text-xs">
                    Top betyg
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {onFavorite && (
                <Button
                  onClick={onFavorite}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Heart 
                    className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} 
                  />
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
          </div>
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

          <Separator />

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            {/* Children Count */}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">{preschool.antal_barn || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">Barn</p>
                {nationalAverage && preschool.antal_barn && 
                  getComparisonBadge(preschool.antal_barn, nationalAverage.avgChildren)}
              </div>
            </div>

            {/* Staff Density */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {preschool.personaltäthet ? preschool.personaltäthet.toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">Personal</p>
                {nationalAverage && preschool.personaltäthet && 
                  getComparisonBadge(preschool.personaltäthet, nationalAverage.avgStaff)}
              </div>
            </div>

            {/* Teacher Qualification */}
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {preschool.andel_med_förskollärarexamen ? `${preschool.andel_med_förskollärarexamen}%` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">Lärarexamen</p>
                {nationalAverage && preschool.andel_med_förskollärarexamen && 
                  getComparisonBadge(preschool.andel_med_förskollärarexamen, nationalAverage.avgTeacherExam, '%')}
              </div>
            </div>

            {/* Google Rating */}
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <div className="flex-1">
                {preschool.google_rating ? (
                  <>
                    <p className="text-sm font-medium">{preschool.google_rating.toFixed(1)}</p>
                    {renderStarRating(preschool.google_rating)}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen data</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info Preview (if available from Google) */}
          {(preschool.contact_phone || preschool.website_url) && (
            <>
              <Separator />
              <div className="grid grid-cols-1 gap-2">
                {preschool.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-primary" />
                    <a 
                      href={`tel:${preschool.contact_phone}`}
                      className="text-xs text-nordic-blue hover:underline"
                    >
                      {preschool.contact_phone}
                    </a>
                  </div>
                )}
                {preschool.website_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3 text-primary" />
                    <a 
                      href={preschool.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-nordic-blue hover:underline"
                    >
                      Hemsida
                    </a>
                  </div>
                )}
                {preschool.google_reviews_count && preschool.google_reviews_count > 0 && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {preschool.google_reviews_count} recensioner
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Group Info */}
          {preschool.antal_barngrupper && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {preschool.antal_barngrupper} barngrupper
                {preschool.antal_barn && (
                  <span className="ml-2">
                    (~ {Math.round(preschool.antal_barn / preschool.antal_barngrupper)} barn/grupp)
                  </span>
                )}
              </span>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={onViewDetails}
              className="flex-1 h-9"
              variant="default"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Mer detaljer
            </Button>
            <Button 
              onClick={() => window.open(getDirectionsUrl(), '_blank')}
              variant="outline"
              className="h-9 px-3"
            >
              <Navigation className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Quality Indicator Bar */}
        {preschool.andel_med_förskollärarexamen && (
          <div className="px-4 pb-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all duration-500"
                style={{ width: `${preschool.andel_med_förskollärarexamen}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Kvalitetsindikator baserat på lärarexamen
            </p>
          </div>
        )}
      </Card>

      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
        onClick={onClose}
      />
    </motion.div>
  );
};