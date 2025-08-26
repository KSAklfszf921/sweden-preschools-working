import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MapPin, User, Phone, Globe, Clock, Award, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PreschoolImageGallery } from '@/components/PreschoolImageGallery';
import { PreschoolReviews } from '@/components/PreschoolReviews';
import { useEnhancedGoogleData } from '@/hooks/useEnhancedGoogleData';
import type { Preschool } from '@/stores/mapStore';

interface PreschoolDetailsPanelProps {
  preschool: Preschool;
  onBack: () => void;
  nationalAverage?: {
    avgChildren: number;
    avgStaff: number;
    avgTeacherExam: number;
    avgRating: number;
  };
}

export const PreschoolDetailsPanel: React.FC<PreschoolDetailsPanelProps> = ({
  preschool,
  onBack,
  nationalAverage
}) => {
  const [googleData, setGoogleData] = useState<any>(null);
  const { getGoogleData } = useEnhancedGoogleData();

  useEffect(() => {
    const loadGoogleData = async () => {
      const data = await getGoogleData(preschool.id);
      setGoogleData(data);
    };
    
    loadGoogleData();
  }, [preschool.id, getGoogleData]);

  const getHuvudmanInfo = (huvudman: string) => {
    switch (huvudman) {
      case 'Kommunal':
        return {
          label: 'Kommunal förskola',
          color: 'bg-blue-500/10 text-blue-700 border-blue-200',
          icon: <Building className="h-3 w-3" />
        };
      case 'Enskild':
        return {
          label: 'Fristående förskola',
          color: 'bg-green-500/10 text-green-700 border-green-200',
          icon: <Building className="h-3 w-3" />
        };
      default:
        return {
          label: huvudman,
          color: 'bg-gray-500/10 text-gray-700 border-gray-200',
          icon: <Building className="h-3 w-3" />
        };
    }
  };

  const getQualityLevel = (percentage?: number) => {
    if (!percentage) return 'Ingen data';
    if (percentage >= 80) return 'Utmärkt';
    if (percentage >= 65) return 'Bra';
    if (percentage >= 50) return 'Medel';
    return 'Under medel';
  };

  const getRatingDisplay = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="font-medium">{rating.toFixed(1)}</span>
        {preschool.google_reviews_count && (
          <span className="text-sm text-muted-foreground">
            ({preschool.google_reviews_count} recensioner)
          </span>
        )}
      </div>
    );
  };

  const huvudmanInfo = getHuvudmanInfo(preschool.huvudman);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-4 top-4 z-30 w-80 max-h-[calc(100vh-2rem)]"
    >
      <Card className="glass-card border-0 shadow-lg h-full flex flex-col">
        {/* Header */}
        <CardHeader className="p-4 border-b border-border/20">
          <div className="flex items-center gap-3">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-heading truncate">
                {preschool.namn}
              </CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{preschool.kommun}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={huvudmanInfo.color}>
                {huvudmanInfo.icon}
                <span className="ml-1">{huvudmanInfo.label}</span>
              </Badge>
              {(googleData?.google_rating || preschool.google_rating) && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{(googleData?.google_rating || preschool.google_rating)?.toFixed(1)}</span>
                </div>
              )}
            </div>

            {preschool.adress && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{preschool.adress}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Google Rating */}
          {(googleData?.google_rating || preschool.google_rating) && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Betyg</h4>
              {getRatingDisplay(googleData?.google_rating || preschool.google_rating)}
              {nationalAverage && (googleData?.google_rating || preschool.google_rating) > nationalAverage.avgRating && (
                <p className="text-xs text-green-600">
                  Över riksgenomsnittet ({nationalAverage.avgRating.toFixed(1)})
                </p>
              )}
            </div>
          )}

          {/* Children Info */}
          {preschool.antal_barn && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Barn och personal
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Antal barn:</span>
                  <span className="font-medium">{preschool.antal_barn}</span>
                </div>
                {preschool.antal_barngrupper && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Barngrupper:</span>
                    <span className="font-medium">{preschool.antal_barngrupper}</span>
                  </div>
                )}
                {preschool.personaltäthet && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Personaltäthet:</span>
                    <span className="font-medium">{preschool.personaltäthet.toFixed(1)} barn/tjänst</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quality Info */}
          {preschool.andel_med_förskollärarexamen && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Award className="h-4 w-4" />
                Kvalitet
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Förskollärare:</span>
                  <span className="font-medium">
                    {Math.round(preschool.andel_med_förskollärarexamen)}%
                  </span>
                </div>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, preschool.andel_med_förskollärarexamen)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Kvalitetsnivå: {getQualityLevel(preschool.andel_med_förskollärarexamen)}
                </p>
                {nationalAverage && preschool.andel_med_förskollärarexamen > nationalAverage.avgTeacherExam && (
                  <p className="text-xs text-green-600">
                    Över riksgenomsnittet ({nationalAverage.avgTeacherExam}%)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Contact Info */}
          {(googleData?.contact_phone || googleData?.website_url || preschool.contact_phone || preschool.website_url) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Kontakt</h4>
                <div className="space-y-2">
                  {(googleData?.contact_phone || preschool.contact_phone) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`tel:${googleData?.contact_phone || preschool.contact_phone}`}
                        className="text-primary hover:underline"
                      >
                        {googleData?.contact_phone || preschool.contact_phone}
                      </a>
                    </div>
                  )}
                  {(googleData?.website_url || preschool.website_url) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={googleData?.website_url || preschool.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        Webbsida
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Opening Hours */}
          {(googleData?.opening_hours || preschool.opening_hours) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Öppettider
                </h4>
                <div className="text-sm">
                  {typeof (googleData?.opening_hours || preschool.opening_hours) === 'object' ? (
                    <div className="space-y-1">
                      {Object.entries(googleData?.opening_hours || preschool.opening_hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{day}:</span>
                          <span>{hours as string}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{(googleData?.opening_hours || preschool.opening_hours) as string}</p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Image Gallery */}
          <PreschoolImageGallery
            preschoolId={preschool.id}
            preschoolName={preschool.namn}
            streetViewPanoId={googleData?.street_view_pano_id}
            lat={preschool.latitud}
            lng={preschool.longitud}
          />

          <Separator />

          {/* Reviews */}
          <PreschoolReviews
            reviews={googleData?.reviews}
            rating={googleData?.google_rating || preschool.google_rating}
            reviewsCount={googleData?.google_reviews_count || preschool.google_reviews_count}
          />

          <Separator />

          {/* Quick Stats Summary */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <h4 className="font-medium text-sm">Sammanfattning</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Typ</span>
                <span className="font-medium">{preschool.huvudman}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Barn</span>
                <span className="font-medium">{preschool.antal_barn || 'Ej angivet'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Betyg</span>
                <span className="font-medium">
                  {(googleData?.google_rating || preschool.google_rating) ? `${(googleData?.google_rating || preschool.google_rating).toFixed(1)} ⭐` : 'Inget betyg'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Kvalitet</span>
                <span className="font-medium">
                  {preschool.andel_med_förskollärarexamen 
                    ? getQualityLevel(preschool.andel_med_förskollärarexamen)
                    : 'Ingen data'
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};