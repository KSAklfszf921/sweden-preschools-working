import React, { useState, useEffect } from 'react';
import { Heart, Star, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { supabase } from '@/integrations/supabase/client';

interface FavoritesManagerProps {
  className?: string;
}

interface UserFavorite {
  id: string;
  preschool_id: string;
  created_at: string;
  preschool?: Preschool;
}

export const FavoritesManager: React.FC<FavoritesManagerProps> = ({ className }) => {
  const { setSelectedPreschool, setMapCenter, setMapZoom } = useMapStore();
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      // This would require authentication to work properly
      // For now, we'll use localStorage as a fallback
      const localFavorites = localStorage.getItem('preschool-favorites');
      if (localFavorites) {
        const favoriteIds = JSON.parse(localFavorites);
        // In a real app, we'd fetch the full preschool data here
        setFavorites(favoriteIds.map((id: string) => ({ 
          id: `local-${id}`, 
          preschool_id: id, 
          created_at: new Date().toISOString() 
        })));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      // Remove from local storage
      const localFavorites = localStorage.getItem('preschool-favorites');
      if (localFavorites) {
        const favoriteIds = JSON.parse(localFavorites);
        const updatedIds = favoriteIds.filter((id: string) => `local-${id}` !== favoriteId);
        localStorage.setItem('preschool-favorites', JSON.stringify(updatedIds));
      }
      
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleViewOnMap = (preschool: Preschool) => {
    if (preschool.latitud && preschool.longitud) {
      setMapCenter([preschool.longitud, preschool.latitud]);
      setMapZoom(16);
      setSelectedPreschool(preschool);
    }
  };

  if (isLoading) {
    return (
      <Card className={`glass-card border-0 shadow-lg ${className}`}>
        <CardContent className="p-6 text-center">
          <Heart className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Laddar favoriter...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card border-0 shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-red-500" />
          Mina favoriter
          {favorites.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {favorites.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Inga favoriter sparade än
            </p>
            <p className="text-xs text-muted-foreground">
              Klicka på hjärtat för att spara en förskola som favorit
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {favorites.map((favorite) => (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-border/50 rounded-lg p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm truncate flex-1 pr-2">
                      {favorite.preschool?.namn || `Förskola ${favorite.preschool_id}`}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFavorite(favorite.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {favorite.preschool && (
                    <>
                      <div className="flex items-center gap-1 mb-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {favorite.preschool.kommun}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={favorite.preschool.huvudman === 'Kommunal' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {favorite.preschool.huvudman}
                          </Badge>
                          {favorite.preschool.google_rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-medium">
                                {favorite.preschool.google_rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOnMap(favorite.preschool!)}
                          className="h-6 text-xs px-2"
                        >
                          Visa
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Hook for managing favorites
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const loadFavorites = () => {
      const stored = localStorage.getItem('preschool-favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    };
    loadFavorites();
  }, []);

  const addFavorite = (preschoolId: string) => {
    const updated = [...favorites, preschoolId];
    setFavorites(updated);
    localStorage.setItem('preschool-favorites', JSON.stringify(updated));
  };

  const removeFavorite = (preschoolId: string) => {
    const updated = favorites.filter(id => id !== preschoolId);
    setFavorites(updated);
    localStorage.setItem('preschool-favorites', JSON.stringify(updated));
  };

  const isFavorite = (preschoolId: string) => favorites.includes(preschoolId);

  const toggleFavorite = (preschoolId: string) => {
    if (isFavorite(preschoolId)) {
      removeFavorite(preschoolId);
    } else {
      addFavorite(preschoolId);
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    favoriteCount: favorites.length
  };
};