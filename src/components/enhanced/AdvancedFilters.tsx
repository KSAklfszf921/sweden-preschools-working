import React, { useState } from 'react';
import { Filter, Star, Users, GraduationCap, Building2, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';

interface AdvancedFiltersProps {
  className?: string;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ className }) => {
  const { searchFilters, setSearchFilters, clearFilters } = useMapStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleRatingChange = (value: number[]) => {
    setSearchFilters({ minRating: value[0] });
  };

  const handleChildrenRangeChange = (values: number[]) => {
    setSearchFilters({ 
      minChildren: values[0], 
      maxChildren: values[1] 
    });
  };

  const handleStaffDensityChange = (values: number[]) => {
    setSearchFilters({ 
      minPersonaltäthet: values[0], 
      maxPersonaltäthet: values[1] 
    });
  };

  const handleTeacherQualificationChange = (values: number[]) => {
    setSearchFilters({ 
      minExamen: values[0], 
      maxExamen: values[1] 
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchFilters.minRating) count++;
    if (searchFilters.minChildren || searchFilters.maxChildren) count++;
    if (searchFilters.minPersonaltäthet || searchFilters.maxPersonaltäthet) count++;
    if (searchFilters.minExamen || searchFilters.maxExamen) count++;
    if (searchFilters.hasGoogleRating) count++;
    if (searchFilters.hasContact) count++;
    return count;
  };

  const clearAdvancedFilters = () => {
    setSearchFilters({
      minRating: undefined,
      maxRating: undefined,
      minChildren: undefined,
      maxChildren: undefined,
      minPersonaltäthet: undefined,
      maxPersonaltäthet: undefined,
      minExamen: undefined,
      maxExamen: undefined,
      hasGoogleRating: undefined,
      hasContact: undefined,
    });
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className={`glass-card border-0 shadow-lg ${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <span className="font-medium">Avancerade filter</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </Button>
        </CollapsibleTrigger>
        
        <AnimatePresence>
          {isOpen && (
            <CollapsibleContent forceMount>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="p-4 pt-0 space-y-6">
                  {/* Rating Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <Label className="text-sm font-medium">Minst betyg</Label>
                    </div>
                    <div className="px-3">
                      <Slider
                        value={[searchFilters.minRating || 0]}
                        onValueChange={handleRatingChange}
                        max={5}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0</span>
                        <span className="font-medium">
                          {searchFilters.minRating ? searchFilters.minRating.toFixed(1) : '0.0'} stjärnor
                        </span>
                        <span>5</span>
                      </div>
                    </div>
                  </div>

                  {/* Children Count Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <Label className="text-sm font-medium">Antal barn</Label>
                    </div>
                    <div className="px-3">
                      <Slider
                        value={[
                          searchFilters.minChildren || 0, 
                          searchFilters.maxChildren || 200
                        ]}
                        onValueChange={handleChildrenRangeChange}
                        max={200}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{searchFilters.minChildren || 0}</span>
                        <span className="font-medium">
                          {searchFilters.minChildren || 0} - {searchFilters.maxChildren || 200} barn
                        </span>
                        <span>{searchFilters.maxChildren || 200}</span>
                      </div>
                    </div>
                  </div>

                  {/* Staff Density Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-500" />
                      <Label className="text-sm font-medium">Personaltäthet (barn/heltid)</Label>
                    </div>
                    <div className="px-3">
                      <Slider
                        value={[
                          searchFilters.minPersonaltäthet || 5, 
                          searchFilters.maxPersonaltäthet || 25
                        ]}
                        onValueChange={handleStaffDensityChange}
                        max={25}
                        min={5}
                        step={0.5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{searchFilters.minPersonaltäthet || 5}</span>
                        <span className="font-medium">
                          {(searchFilters.minPersonaltäthet || 5).toFixed(1)} - {(searchFilters.maxPersonaltäthet || 25).toFixed(1)}
                        </span>
                        <span>{searchFilters.maxPersonaltäthet || 25}</span>
                      </div>
                    </div>
                  </div>

                  {/* Teacher Qualification Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-500" />
                      <Label className="text-sm font-medium">Andel förskollärare med examen (%)</Label>
                    </div>
                    <div className="px-3">
                      <Slider
                        value={[
                          searchFilters.minExamen || 0, 
                          searchFilters.maxExamen || 100
                        ]}
                        onValueChange={handleTeacherQualificationChange}
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{searchFilters.minExamen || 0}%</span>
                        <span className="font-medium">
                          {searchFilters.minExamen || 0}% - {searchFilters.maxExamen || 100}%
                        </span>
                        <span>{searchFilters.maxExamen || 100}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Quality switches */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        <Label className="text-sm">Endast med Google-betyg</Label>
                      </div>
                      <Switch
                        checked={searchFilters.hasGoogleRating || false}
                        onCheckedChange={(checked) => 
                          setSearchFilters({ hasGoogleRating: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        <Label className="text-sm">Endast med kontaktuppgifter</Label>
                      </div>
                      <Switch
                        checked={searchFilters.hasContact || false}
                        onCheckedChange={(checked) => 
                          setSearchFilters({ hasContact: checked })
                        }
                      />
                    </div>
                  </div>

                  {/* Sorting */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Sortera efter</Label>
                    <Select 
                      value={searchFilters.sortBy || 'namn'} 
                      onValueChange={(value: any) => setSearchFilters({ sortBy: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="namn">Namn</SelectItem>
                        <SelectItem value="google_rating">Google-betyg</SelectItem>
                        <SelectItem value="antal_barn">Antal barn</SelectItem>
                        <SelectItem value="andel_med_förskollärarexamen">Lärarkvalitet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action buttons */}
                  {activeFilterCount > 0 && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAdvancedFilters}
                        className="flex-1"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Rensa filter
                      </Button>
                    </div>
                  )}
                </CardContent>
              </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>
      </Collapsible>
    </Card>
  );
};