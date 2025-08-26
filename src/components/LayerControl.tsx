import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Layers, Map, MapPin, Square } from 'lucide-react';
import { useMapStore, HeatmapType } from '@/stores/mapStore';

interface LayerControlProps {
  className?: string;
}

const LayerControl: React.FC<LayerControlProps> = ({ className }) => {
  const {
    layerVisibility,
    heatmapType,
    heatmapIntensity,
    showHeatmap,
    setLayerVisibility,
    setHeatmapType,
    setHeatmapIntensity,
    setShowHeatmap,
  } = useMapStore();

  const heatmapTypes = [
    { value: 'density', label: 'Täthet', icon: MapPin, description: 'Antal förskolor per område' },
    { value: 'staff', label: 'Personal', icon: Map, description: 'Vuxen-barn ratio' },
    { value: 'quality', label: 'Kvalitet', icon: Square, description: 'Andel med lärarexamen' },
    { value: 'rating', label: 'Betyg', icon: Square, description: 'Google betyg' },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`absolute top-4 right-4 z-10 ${className}`}
    >
      <Card className="p-3 bg-card/80 backdrop-blur-xl border-border/30 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-3 w-3 text-primary" />
          <h3 className="font-medium text-xs text-foreground">Lager</h3>
        </div>

        <div className="space-y-3">
          {/* Heatmap Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="heatmap"
                checked={showHeatmap}
                onCheckedChange={(checked) => setShowHeatmap(checked as boolean)}
              />
              <Label htmlFor="heatmap" className="text-xs font-medium">
                Heatmap
              </Label>
            </div>

            {showHeatmap && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 pl-4"
              >
                <div>
                  <Label className="text-xs mb-1 block">
                    Typ
                  </Label>
                  <Select 
                    value={heatmapType} 
                    onValueChange={(value) => setHeatmapType(value as HeatmapType)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {heatmapTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="text-xs">{type.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs mb-1 block">
                    Intensitet {heatmapIntensity}
                  </Label>
                  <Slider
                    value={[heatmapIntensity]}
                    onValueChange={(values) => setHeatmapIntensity(values[0])}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Layer Visibility Controls */}
          <div className="space-y-1 border-t border-border/30 pt-2">
            <Label className="text-xs">Lager</Label>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="clusters"
                checked={layerVisibility.clusters}
                onCheckedChange={(checked) => setLayerVisibility('clusters', checked as boolean)}
              />
              <Label htmlFor="clusters" className="text-xs">
                Kluster
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="markers"
                checked={layerVisibility.markers}
                onCheckedChange={(checked) => setLayerVisibility('markers', checked as boolean)}
              />
              <Label htmlFor="markers" className="text-sm">
                Individuella Marker
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="communeBorders"
                checked={layerVisibility.communeBorders}
                onCheckedChange={(checked) => setLayerVisibility('communeBorders', checked as boolean)}
              />
              <Label htmlFor="communeBorders" className="text-sm">
                Kommungränser
              </Label>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-border pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLayerVisibility('heatmap', false);
                setLayerVisibility('clusters', true);
                setLayerVisibility('markers', true);
                setLayerVisibility('communeBorders', false);
                setShowHeatmap(false);
              }}
              className="w-full text-xs"
            >
              Återställ Lager
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default LayerControl;