import React, { useState } from 'react';
import { GitCompare, Plus, X, Star, Users, GraduationCap, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore, Preschool } from '@/stores/mapStore';
import { StarRating } from '@/components/ui/star-rating';

interface ComparisonToolProps {
  className?: string;
}

export const ComparisonTool: React.FC<ComparisonToolProps> = ({ className }) => {
  const { preschools, filteredPreschools } = useMapStore();
  const [comparisonList, setComparisonList] = useState<Preschool[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addToComparison = (preschool: Preschool) => {
    if (comparisonList.length < 4 && !comparisonList.find(p => p.id === preschool.id)) {
      setComparisonList([...comparisonList, preschool]);
    }
  };

  const removeFromComparison = (preschoolId: string) => {
    setComparisonList(comparisonList.filter(p => p.id !== preschoolId));
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  const getMetricColor = (value: number, metric: 'rating' | 'children' | 'staff' | 'exam') => {
    switch (metric) {
      case 'rating':
        if (value >= 4.5) return 'text-emerald-600';
        if (value >= 4.0) return 'text-blue-600';
        if (value >= 3.5) return 'text-amber-600';
        return 'text-orange-600';
      case 'children':
        if (value <= 15) return 'text-emerald-600';
        if (value <= 20) return 'text-blue-600';
        if (value <= 25) return 'text-amber-600';
        return 'text-orange-600';
      case 'staff':
        if (value <= 5) return 'text-emerald-600';
        if (value <= 7) return 'text-blue-600';
        if (value <= 10) return 'text-amber-600';
        return 'text-orange-600';
      case 'exam':
        if (value >= 80) return 'text-emerald-600';
        if (value >= 70) return 'text-blue-600';
        if (value >= 60) return 'text-amber-600';
        return 'text-orange-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getBestValue = (values: (number | undefined)[], metric: 'rating' | 'children' | 'staff' | 'exam') => {
    const validValues = values.filter(v => v !== undefined) as number[];
    if (validValues.length === 0) return undefined;
    
    switch (metric) {
      case 'rating':
      case 'exam':
        return Math.max(...validValues);
      case 'children':
      case 'staff':
        return Math.min(...validValues);
      default:
        return undefined;
    }
  };

  const availablePreschools = filteredPreschools.filter(p => 
    !comparisonList.find(cp => cp.id === p.id)
  );

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="relative">
            <GitCompare className="h-4 w-4 mr-2" />
            Jämför förskolor
            {comparisonList.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5">
                {comparisonList.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Jämför förskolor
              {comparisonList.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearComparison}
                  className="ml-auto"
                >
                  <X className="h-3 w-3 mr-1" />
                  Rensa alla
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add preschool section */}
            {comparisonList.length < 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Lägg till förskola för jämförelse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={(value) => {
                    const preschool = availablePreschools.find(p => p.id === value);
                    if (preschool) addToComparison(preschool);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj en förskola att jämföra..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availablePreschools.map(preschool => (
                        <SelectItem key={preschool.id} value={preschool.id}>
                          {preschool.namn} - {preschool.kommun}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Comparison table */}
            {comparisonList.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Jämförelse ({comparisonList.length} förskolor)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-muted-foreground">
                            Egenskap
                          </th>
                          {comparisonList.map(preschool => (
                            <th key={preschool.id} className="text-center p-3 min-w-[200px]">
                              <div className="space-y-2">
                                <div className="font-medium text-sm">{preschool.namn}</div>
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {preschool.kommun}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromComparison(preschool.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Google Rating */}
                        <tr className="border-b">
                          <td className="p-3 font-medium flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500" />
                            Google-betyg
                          </td>
                          {comparisonList.map(preschool => (
                            <td key={preschool.id} className="p-3 text-center">
                              {preschool.google_rating ? (
                                <div className="flex items-center justify-center gap-1">
                                  <StarRating rating={preschool.google_rating} size="sm" />
                                  <span className={`font-medium ${getMetricColor(preschool.google_rating, 'rating')}`}>
                                    {preschool.google_rating.toFixed(1)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Ej tillgängligt</span>
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Children Count */}
                        <tr className="border-b">
                          <td className="p-3 font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            Antal barn
                          </td>
                          {comparisonList.map(preschool => (
                            <td key={preschool.id} className="p-3 text-center">
                              {preschool.antal_barn ? (
                                <span className={`font-medium ${getMetricColor(preschool.antal_barn, 'children')}`}>
                                  {preschool.antal_barn}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">N/A</span>
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Staff Density */}
                        <tr className="border-b">
                          <td className="p-3 font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-emerald-500" />
                            Personaltäthet
                          </td>
                          {comparisonList.map(preschool => (
                            <td key={preschool.id} className="p-3 text-center">
                              {preschool.personaltäthet ? (
                                <span className={`font-medium ${getMetricColor(preschool.personaltäthet, 'staff')}`}>
                                  {preschool.personaltäthet.toFixed(1)} barn/heltid
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">N/A</span>
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Teacher Qualification */}
                        <tr className="border-b">
                          <td className="p-3 font-medium flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-purple-500" />
                            Förskollärare med examen
                          </td>
                          {comparisonList.map(preschool => (
                            <td key={preschool.id} className="p-3 text-center">
                              {preschool.andel_med_förskollärarexamen ? (
                                <span className={`font-medium ${getMetricColor(preschool.andel_med_förskollärarexamen, 'exam')}`}>
                                  {preschool.andel_med_förskollärarexamen}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">N/A</span>
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Main type */}
                        <tr className="border-b">
                          <td className="p-3 font-medium">Huvudman</td>
                          {comparisonList.map(preschool => (
                            <td key={preschool.id} className="p-3 text-center">
                              <Badge variant={preschool.huvudman === 'Kommunal' ? 'default' : 'secondary'}>
                                {preschool.huvudman}
                              </Badge>
                            </td>
                          ))}
                        </tr>

                        {/* Group count */}
                        <tr>
                          <td className="p-3 font-medium">Barngrupper</td>
                          {comparisonList.map(preschool => (
                            <td key={preschool.id} className="p-3 text-center font-medium">
                              {preschool.antal_barngrupper}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {comparisonList.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <GitCompare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Börja jämföra förskolor</h3>
                  <p className="text-muted-foreground mb-4">
                    Välj upp till 4 förskolor för att jämföra deras betyg, personalstatistik och andra viktiga faktorer.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Använd dropdownen ovan för att lägga till din första förskola.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};