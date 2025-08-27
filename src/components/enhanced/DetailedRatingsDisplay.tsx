import React from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, ExternalLink, Users } from 'lucide-react';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { Card } from '@/components/ui/card';

interface DetailedRatingsDisplayProps {
  preschool: Preschool;
}

export const DetailedRatingsDisplay: React.FC<DetailedRatingsDisplayProps> = ({ preschool }) => {
  // Generate Google Maps link for reviews
  const getGoogleMapsReviewsUrl = (preschool: Preschool) => {
    if (preschool.google_place_id) {
      return `https://www.google.com/maps/place/?q=place_id:${preschool.google_place_id}&hl=sv`;
    }
    // Fallback to search-based URL
    const query = encodeURIComponent(`${preschool.namn} ${preschool.adress || ''} ${preschool.kommun}`);
    return `https://www.google.com/maps/search/${query}/@${preschool.latitud},${preschool.longitud},15z`;
  };

  // Render star rating visualization
  const renderStarRating = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star 
            key={i} 
            className={`${starSize} text-yellow-500 fill-current`}
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className={`${starSize} relative`}>
            <Star className={`${starSize} text-gray-300 fill-current absolute`} />
            <div className="overflow-hidden w-1/2">
              <Star className={`${starSize} text-yellow-500 fill-current`} />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star 
            key={i} 
            className={`${starSize} text-gray-300 fill-current`}
          />
        );
      }
    }

    return (
      <div className="flex items-center space-x-1">
        {stars}
      </div>
    );
  };

  // Get rating quality indicator
  const getRatingQuality = (rating: number, reviewCount?: number) => {
    if (!rating || rating === 0) return null;
    
    const hasReviews = reviewCount && reviewCount > 0;
    
    if (rating >= 4.5 && hasReviews) {
      return {
        label: 'Enastående',
        color: 'text-green-700 bg-green-100',
        icon: '⭐'
      };
    } else if (rating >= 4.0) {
      return {
        label: 'Mycket bra',
        color: 'text-blue-700 bg-blue-100',
        icon: '👍'
      };
    } else if (rating >= 3.5) {
      return {
        label: 'Bra',
        color: 'text-yellow-700 bg-yellow-100',
        icon: '👌'
      };
    } else if (rating >= 3.0) {
      return {
        label: 'Godkänt',
        color: 'text-orange-700 bg-orange-100',
        icon: '⚖️'
      };
    } else {
      return {
        label: 'Under genomsnitt',
        color: 'text-red-700 bg-red-100',
        icon: '⚠️'
      };
    }
  };

  // Don't render if no rating data
  if (!preschool.google_rating || preschool.google_rating === 0) {
    return (
      <Card className="p-4 bg-gray-50/50 border border-gray-200">
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">Inga omdömen tillgängliga</span>
        </div>
      </Card>
    );
  }

  const ratingQuality = getRatingQuality(preschool.google_rating, preschool.google_review_count);
  const mapsUrl = getGoogleMapsReviewsUrl(preschool);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 bg-white border border-border/50 shadow-sm">
        <div className="space-y-4">
          {/* Main rating display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {preschool.google_rating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center mt-1">
                  {renderStarRating(preschool.google_rating, 'lg')}
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                {ratingQuality && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${ratingQuality.color}`}>
                    <span className="mr-1">{ratingQuality.icon}</span>
                    {ratingQuality.label}
                  </span>
                )}
                
                {preschool.google_review_count && preschool.google_review_count > 0 && (
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <MessageSquare className="w-3 h-3" />
                    <span>{preschool.google_review_count} omdömen</span>
                  </div>
                )}
              </div>
            </div>

            {/* External link */}
            <motion.a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Läs omdömen</span>
            </motion.a>
          </div>

          {/* Additional preschool info */}
          {(preschool.antal_barn || preschool.huvudman) && (
            <div className="pt-3 border-t border-border/30">
              <div className="flex items-center justify-between text-sm">
                {preschool.antal_barn && preschool.antal_barn > 0 && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{preschool.antal_barn} barn</span>
                  </div>
                )}
                
                {preschool.huvudman && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">{preschool.huvudman}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rating distribution hint */}
          {preschool.google_review_count && preschool.google_review_count > 5 && (
            <div className="text-xs text-muted-foreground bg-gray-50 rounded-lg p-2">
              💡 Betyget baseras på {preschool.google_review_count} verifierade Google-recensioner från föräldrar och besökare
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};