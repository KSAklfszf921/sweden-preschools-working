import React, { useState, useMemo } from 'react';
import { Star, Filter, TrendingUp, MessageSquare, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  author_name: string;
  author_url?: string;
  language?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

interface PreschoolReviewsProps {
  reviews?: Review[] | string;
  rating?: number;
  reviewsCount?: number;
}

export const PreschoolReviews: React.FC<PreschoolReviewsProps> = ({
  reviews,
  rating,
  reviewsCount
}) => {
  const [showAll, setShowAll] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const parsedReviews = useMemo(() => {
    if (!reviews) return [];
    
    try {
      return typeof reviews === 'string' ? JSON.parse(reviews) : reviews;
    } catch (error) {
      console.error('Error parsing reviews:', error);
      return [];
    }
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (!parsedReviews.length) return [];
    
    let filtered = parsedReviews;
    
    if (filterRating !== null) {
      filtered = filtered.filter((review: Review) => review.rating === filterRating);
    }
    
    return filtered.sort((a: Review, b: Review) => b.time - a.time);
  }, [parsedReviews, filterRating]);

  const displayedReviews = showAll ? filteredReviews : filteredReviews.slice(0, 3);

  const ratingDistribution = useMemo(() => {
    if (!parsedReviews.length) return {};
    
    const distribution: { [key: number]: number } = {};
    parsedReviews.forEach((review: Review) => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });
    
    return distribution;
  }, [parsedReviews]);

  const averageRating = useMemo(() => {
    if (!parsedReviews.length) return rating || 0;
    
    const sum = parsedReviews.reduce((acc: number, review: Review) => acc + review.rating, 0);
    return sum / parsedReviews.length;
  }, [parsedReviews, rating]);

  const formatRelativeTime = (timeDescription: string) => {
    return timeDescription
      .replace('a day ago', 'för en dag sedan')
      .replace('days ago', 'dagar sedan')
      .replace('a week ago', 'för en vecka sedan')
      .replace('weeks ago', 'veckor sedan')
      .replace('a month ago', 'för en månad sedan')
      .replace('months ago', 'månader sedan')
      .replace('a year ago', 'för ett år sedan')
      .replace('years ago', 'år sedan');
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  if (!parsedReviews.length && !rating) {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Recensioner
        </h4>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-sm text-muted-foreground">Inga recensioner tillgängliga</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Recensioner
        </h4>
        {parsedReviews.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {filteredReviews.length} av {parsedReviews.length}
          </Badge>
        )}
      </div>

      {/* Rating Summary */}
      {(rating || averageRating > 0) && (
        <div className="bg-muted/30 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {renderStars(averageRating, 'md')}
              <span className="font-semibold text-lg">{averageRating.toFixed(1)}</span>
            </div>
            {reviewsCount && (
              <span className="text-sm text-muted-foreground">
                ({reviewsCount} recensioner)
              </span>
            )}
          </div>

          {/* Rating Distribution */}
          {Object.keys(ratingDistribution).length > 0 && (
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingDistribution[stars] || 0;
                const percentage = parsedReviews.length > 0 ? (count / parsedReviews.length) * 100 : 0;
                
                return (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-muted-foreground">{stars}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-6 text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filter Controls */}
      {parsedReviews.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            variant={filterRating === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRating(null)}
            className="flex-shrink-0"
          >
            <Filter className="h-3 w-3 mr-1" />
            Alla
          </Button>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingDistribution[stars] || 0;
            if (count === 0) return null;
            
            return (
              <Button
                key={stars}
                variant={filterRating === stars ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterRating(stars)}
                className="flex-shrink-0"
              >
                {stars} <Star className="h-3 w-3 ml-1 fill-current" />
                <span className="ml-1 text-xs">({count})</span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Reviews List */}
      {filteredReviews.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {displayedReviews.map((review: Review, index: number) => (
              <motion.div
                key={`${review.author_name}-${review.time}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-muted/20 rounded-lg p-3 space-y-2"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {review.profile_photo_url && (
                      <img
                        src={review.profile_photo_url}
                        alt={review.author_name}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm">{review.author_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(review.relative_time_description)}
                      </p>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>

                {/* Review Text */}
                <p className="text-sm leading-relaxed">{review.text}</p>

                {/* Review Actions */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ThumbsUp className="h-3 w-3" />
                  <span>Hjälpsam</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Show More/Less Button */}
          {filteredReviews.length > 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full"
            >
              {showAll ? 'Visa färre' : `Visa alla ${filteredReviews.length} recensioner`}
              <TrendingUp className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      )}

      {filteredReviews.length === 0 && filterRating !== null && (
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-sm text-muted-foreground">
            Inga recensioner med {filterRating} stjärnor
          </p>
        </div>
      )}
    </div>
  );
};