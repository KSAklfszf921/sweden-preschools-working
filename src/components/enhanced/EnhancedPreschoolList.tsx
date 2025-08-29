import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Star, User, MapPin, Phone, Globe, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMapStore } from '@/stores/mapStore';
import { PreschoolDetailsPanel } from './PreschoolDetailsPanel';


interface EnhancedPreschoolListProps {
  className?: string;
  onShowDetails?: (preschool: any) => void;
}

export const EnhancedPreschoolList: React.FC<EnhancedPreschoolListProps> = ({ className }) => {
  const { filteredPreschools, searchFilters, setSelectedPreschool, setMapCenter, setMapZoom, preschools } = useMapStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedPreschoolForDetails, setSelectedPreschoolForDetails] = useState<any>(null);

  // Sort preschools by rating, then by name - UNLIMITED LIST
  const sortedPreschools = useMemo(() => {
    return [...filteredPreschools]
      .filter(p => p.latitud && p.longitud) // Only show preschools with coordinates
      .sort((a, b) => {
        // First sort by Google rating (if available)
        const ratingA = a.google_rating || 0;
        const ratingB = b.google_rating || 0;
        if (ratingA !== ratingB) {
          return ratingB - ratingA; // Higher rating first
        }
        // Then sort by name
        return a.namn.localeCompare(b.namn);
      }); // Removed limit - show all filtered preschools
  }, [filteredPreschools]);

  const handlePreschoolClick = (preschool: any) => {
    if (preschool.longitud && preschool.latitud) {
      setSelectedPreschool(preschool);
      setMapCenter([preschool.longitud, preschool.latitud]);
      setMapZoom(15);
    }
  };

  const getContextTitle = () => {
    if (searchFilters.kommuner && searchFilters.kommuner.length > 0) {
      return `Förskolor i ${searchFilters.kommuner.join(', ')}`;
    }
    if (searchFilters.nearbyMode) {
      return 'Närliggande förskolor';
    }
    if (searchFilters.query) {
      return `Sökresultat för "${searchFilters.query}"`;
    }
    return 'Alla förskolor';
  };

  const getRatingCircle = (rating?: number) => {
    if (!rating) return null;
    
    const color = rating >= 4.5 ? 'text-bubble-high-rating' : 
                  rating >= 4.0 ? 'text-bubble-kommunal' : 
                  'text-bubble-enskild';
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Star className="h-3 w-3 fill-current" />
        <span className="text-xs font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getHuvudmanColor = (huvudman: string) => {
    return huvudman === 'Kommunal' ? 'bg-bubble-kommunal/10 text-bubble-kommunal border-bubble-kommunal/20' :
           'bg-bubble-enskild/10 text-bubble-enskild border-bubble-enskild/20';
  };

  // Calculate national averages for comparisons
  const nationalAverage = useMemo(() => {
    if (preschools.length === 0) return undefined;
    const validChildren = preschools.filter(p => p.antal_barn).map(p => p.antal_barn!);
    const validStaff = preschools.filter(p => p.personaltäthet).map(p => p.personaltäthet!);
    const validExam = preschools.filter(p => p.andel_med_förskollärarexamen).map(p => p.andel_med_förskollärarexamen!);
    const validRating = preschools.filter(p => p.google_rating).map(p => p.google_rating!);
    return {
      avgChildren: validChildren.length > 0 ? Math.round(validChildren.reduce((a, b) => a + b, 0) / validChildren.length) : 0,
      avgStaff: validStaff.length > 0 ? validStaff.reduce((a, b) => a + b, 0) / validStaff.length : 0,
      avgTeacherExam: validExam.length > 0 ? Math.round(validExam.reduce((a, b) => a + b, 0) / validExam.length) : 0,
      avgRating: validRating.length > 0 ? validRating.reduce((a, b) => a + b, 0) / validRating.length : 0
    };
  }, [preschools]);

  // Show details panel if a preschool is selected
  if (selectedPreschoolForDetails) {
    return (
      <PreschoolDetailsPanel
        preschool={selectedPreschoolForDetails}
        onBack={() => setSelectedPreschoolForDetails(null)}
        nationalAverage={nationalAverage}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`absolute right-4 top-4 z-30 w-80 max-h-[calc(100vh-2rem)] ${className}`}
    >
      <Card className="glass-card border-0 shadow-lg h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-sm text-foreground">
                {getContextTitle()}
              </h3>
              <p className="text-xs text-muted-foreground">
                {sortedPreschools.length} förskolor
              </p>
            </div>
            <Button
              onClick={() => setIsCollapsed(!isCollapsed)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* List */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="flex-1 overflow-hidden"
            >
              <div className="p-2 overflow-y-auto max-h-[calc(100vh-12rem)]">
                <div className="space-y-2">
                  {sortedPreschools.map((preschool, index) => (
                    <motion.div
                      key={preschool.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover-lift-subtle cursor-pointer border border-border/30 bg-background/50">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            {/* Header row */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 
                                  className="font-medium text-sm text-foreground truncate hover:text-primary cursor-pointer"
                                  onClick={() => handlePreschoolClick(preschool)}
                                  title={preschool.namn}
                                >
                                  {preschool.namn}
                                </h4>
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground truncate">
                                    {preschool.kommun}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Rating circle */}
                              {getRatingCircle(preschool.google_rating)}
                            </div>

                            {/* Details row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs px-1.5 py-0.5 ${getHuvudmanColor(preschool.huvudman)}`}
                                >
                                  {preschool.huvudman === 'Enskild' ? 'Fristående' : preschool.huvudman}
                                </Badge>
                                
                                {preschool.antal_barn && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span className="text-xs">{preschool.antal_barn}</span>
                                  </div>
                                )}
                              </div>
                              
              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                  onClick={() => setSelectedPreschoolForDetails(preschool)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
                            </div>

                            {/* Quality indicator */}
                            {preschool.andel_med_förskollärarexamen && (
                              <div className="flex items-center gap-1">
                                <div className="flex-1 bg-muted rounded-full h-1.5">
                                  <div 
                                    className="bg-bubble-high-rating h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, preschool.andel_med_förskollärarexamen)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(preschool.andel_med_förskollärarexamen)}% förskollärare
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  
                  {sortedPreschools.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">
                        Inga förskolor hittades med de valda filtren.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};