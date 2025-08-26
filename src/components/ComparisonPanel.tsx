import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useComparisonStore } from '@/stores/comparisonStore';
import { BarChart3, X } from 'lucide-react';

export const ComparisonPanel: React.FC = () => {
  const { selectedPreschools, removeFromComparison, clearComparison, setIsOpen } = useComparisonStore();

  if (selectedPreschools.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="bg-card/95 backdrop-blur-lg shadow-nordic border-border/50 p-4 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Jämförelse
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearComparison}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-2 mb-4">
            {selectedPreschools.map((preschool) => (
              <div key={preschool.id} className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{preschool.namn}</p>
                  <p className="text-xs text-muted-foreground truncate">{preschool.kommun}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromComparison(preschool.id)}
                  className="h-5 w-5 p-0 ml-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {selectedPreschools.length}/5
            </Badge>
            {selectedPreschools.length >= 2 && (
              <Button
                onClick={() => setIsOpen(true)}
                size="sm"
                className="text-xs"
              >
                Jämför {selectedPreschools.length} förskolor
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};