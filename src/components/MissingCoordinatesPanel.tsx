import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MissingCoordinatesPanelProps {
  className?: string;
}

export const MissingCoordinatesPanel: React.FC<MissingCoordinatesPanelProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { preschools } = useMapStore();
  const { toast } = useToast();

  const missingCoords = preschools.filter(p => 
    !p.latitud || !p.longitud || p.latitud === 0 || p.longitud === 0
  );

  const handleStartGeocoding = async () => {
    if (missingCoords.length === 0) return;

    setIsGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocoding-service', {
        body: { preschools: missingCoords.slice(0, 100) } // Process first 100
      });

      if (error) throw error;

      toast({
        title: "Geocoding Started",
        description: `Processing ${Math.min(100, missingCoords.length)} preschools. Check back in a few minutes.`,
      });

      console.log('Geocoding result:', data);
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Geocoding Failed",
        description: "Could not start coordinate lookup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  if (missingCoords.length === 0) return null;

  return (
    <Card className={`bg-card/95 backdrop-blur-sm border-border/50 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-foreground">Missing Coordinates</h3>
            <Badge variant="secondary">{missingCoords.length}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? 'Hide' : 'Show'}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {missingCoords.length} preschools cannot be shown on the map due to missing location data.
        </p>

        <Button 
          onClick={handleStartGeocoding}
          disabled={isGeocoding}
          size="sm"
          className="w-full mb-3"
        >
          {isGeocoding ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              Find Coordinates ({Math.min(100, missingCoords.length)})
            </>
          )}
        </Button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ScrollArea className="h-64 w-full">
                <div className="space-y-2">
                  {missingCoords.slice(0, 50).map((preschool) => (
                    <div
                      key={preschool.id}
                      className="p-3 rounded-lg bg-muted/50 border border-border/30"
                    >
                      <div className="font-medium text-sm">{preschool.namn}</div>
                      <div className="text-xs text-muted-foreground">
                        {preschool.adress}, {preschool.kommun}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {preschool.huvudman}
                      </Badge>
                    </div>
                  ))}
                  {missingCoords.length > 50 && (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      ... and {missingCoords.length - 50} more
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};