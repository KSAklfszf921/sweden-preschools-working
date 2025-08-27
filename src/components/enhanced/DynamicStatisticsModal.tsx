import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, TrendingUp, Users, GraduationCap, Star, Building, MapPin, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatisticData {
  label: string;
  current: number;
  national: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  description: string;
}

export const DynamicStatisticsModal: React.FC<StatisticsModalProps> = ({ isOpen, onClose }) => {
  const { filteredPreschools, searchTerm, selectedCommune } = useMapStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Determine context for statistics
  const context = useMemo(() => {
    if (selectedCommune) {
      return { type: 'kommun', name: selectedCommune, title: `Statistik för ${selectedCommune}` };
    }
    if (searchTerm && searchTerm.trim()) {
      return { type: 'search', name: searchTerm.trim(), title: `Statistik för "${searchTerm.trim()}"` };
    }
    return { type: 'national', name: 'Sverige', title: 'Riksstatistik för förskolor' };
  }, [selectedCommune, searchTerm]);

  // Calculate current statistics from filtered data
  const currentStats = useMemo(() => {
    if (filteredPreschools.length === 0) return null;

    const validPreschools = filteredPreschools.filter(p => p.antal_barn && p.antal_barn > 0);
    
    const totalChildren = validPreschools.reduce((sum, p) => sum + (p.antal_barn || 0), 0);
    const validGroupCounts = validPreschools.filter(p => p.antal_barngrupper && p.antal_barngrupper > 0);
    const totalGroups = validGroupCounts.reduce((sum, p) => sum + (p.antal_barngrupper || 0), 0);
    
    const avgChildrenPerPreschool = validPreschools.length > 0 ? totalChildren / validPreschools.length : 0;
    const avgChildrenPerGroup = validGroupCounts.length > 0 && totalGroups > 0 ? totalChildren / totalGroups : 0;
    
    const validStaffDensity = validPreschools.filter(p => p.personaltäthet && p.personaltäthet > 0);
    const avgStaffDensity = validStaffDensity.length > 0 
      ? validStaffDensity.reduce((sum, p) => sum + (p.personaltäthet || 0), 0) / validStaffDensity.length 
      : 0;
    
    const validTeacherRatio = validPreschools.filter(p => p.andel_med_förskollärarexamen && p.andel_med_förskollärarexamen > 0);
    const avgTeacherRatio = validTeacherRatio.length > 0 
      ? validTeacherRatio.reduce((sum, p) => sum + (p.andel_med_förskollärarexamen || 0), 0) / validTeacherRatio.length 
      : 0;
    
    const validRatings = validPreschools.filter(p => p.google_rating && p.google_rating > 0);
    const avgRating = validRatings.length > 0 
      ? validRatings.reduce((sum, p) => sum + (p.google_rating || 0), 0) / validRatings.length 
      : 0;

    return {
      totalPreschools: filteredPreschools.length,
      totalChildren,
      avgChildrenPerPreschool,
      avgChildrenPerGroup,
      avgStaffDensity,
      avgTeacherRatio,
      avgRating,
      validRatings: validRatings.length
    };
  }, [filteredPreschools]);

  // National averages (hardcoded realistic values)
  const nationalStats = {
    avgChildrenPerPreschool: 55.1,
    avgChildrenPerGroup: 16.8,
    avgStaffDensity: 5.1,
    avgTeacherRatio: 40.8,
    avgRating: 4.1
  };

  // Create comparison data
  const comparisonData: StatisticData[] = useMemo(() => {
    if (!currentStats) return [];

    return [
      {
        label: 'Barn per förskola',
        current: currentStats.avgChildrenPerPreschool,
        national: nationalStats.avgChildrenPerPreschool,
        unit: 'barn',
        trend: currentStats.avgChildrenPerPreschool > nationalStats.avgChildrenPerPreschool ? 'up' : 
               currentStats.avgChildrenPerPreschool < nationalStats.avgChildrenPerPreschool ? 'down' : 'stable',
        description: 'Genomsnittligt antal barn per förskola'
      },
      {
        label: 'Barn per grupp',
        current: currentStats.avgChildrenPerGroup,
        national: nationalStats.avgChildrenPerGroup,
        unit: 'barn',
        trend: currentStats.avgChildrenPerGroup > nationalStats.avgChildrenPerGroup ? 'up' : 
               currentStats.avgChildrenPerGroup < nationalStats.avgChildrenPerGroup ? 'down' : 'stable',
        description: 'Genomsnittlig barngruppsstorlek'
      },
      {
        label: 'Personaltäthet',
        current: currentStats.avgStaffDensity,
        national: nationalStats.avgStaffDensity,
        unit: 'barn/personal',
        trend: currentStats.avgStaffDensity < nationalStats.avgStaffDensity ? 'up' : 
               currentStats.avgStaffDensity > nationalStats.avgStaffDensity ? 'down' : 'stable',
        description: 'Antal barn per personal (lägre är bättre)'
      },
      {
        label: 'Förskollärare',
        current: currentStats.avgTeacherRatio,
        national: nationalStats.avgTeacherRatio,
        unit: '%',
        trend: currentStats.avgTeacherRatio > nationalStats.avgTeacherRatio ? 'up' : 
               currentStats.avgTeacherRatio < nationalStats.avgTeacherRatio ? 'down' : 'stable',
        description: 'Andel personal med förskollärarexamen'
      },
      {
        label: 'Google Betyg',
        current: currentStats.avgRating,
        national: nationalStats.avgRating,
        unit: '/5',
        trend: currentStats.avgRating > nationalStats.avgRating ? 'up' : 
               currentStats.avgRating < nationalStats.avgRating ? 'down' : 'stable',
        description: `Genomsnittligt Google-betyg (${currentStats.validRatings} förskolor)`
      }
    ];
  }, [currentStats, nationalStats]);

  // Create chart data for size distribution
  const sizeDistributionData = useMemo(() => {
    if (!currentStats) return [];

    const sizeBuckets = [
      { range: 'Små (1-20)', min: 1, max: 20, count: 0 },
      { range: 'Medel (21-50)', min: 21, max: 50, count: 0 },
      { range: 'Stora (51-100)', min: 51, max: 100, count: 0 },
      { range: 'Mycket stora (>100)', min: 101, max: 9999, count: 0 }
    ];

    filteredPreschools.forEach(p => {
      if (!p.antal_barn) return;
      
      sizeBuckets.forEach(bucket => {
        if (p.antal_barn >= bucket.min && p.antal_barn <= bucket.max) {
          bucket.count++;
        }
      });
    });

    return sizeBuckets;
  }, [filteredPreschools]);

  // Create ownership distribution data
  const ownershipData = useMemo(() => {
    const ownership = {
      'Kommunal': 0,
      'Privat': 0,
      'Kooperativ': 0,
      'Övrigt': 0
    };

    filteredPreschools.forEach(p => {
      if (!p.huvudman) {
        ownership['Övrigt']++;
        return;
      }

      const huvudman = p.huvudman.toLowerCase();
      if (huvudman.includes('kommun')) {
        ownership['Kommunal']++;
      } else if (huvudman.includes('privat') || huvudman.includes('aktiebolag') || huvudman.includes('ab')) {
        ownership['Privat']++;
      } else if (huvudman.includes('kooperativ') || huvudman.includes('ekonomisk förening')) {
        ownership['Kooperativ']++;
      } else {
        ownership['Övrigt']++;
      }
    });

    return Object.entries(ownership).map(([name, value]) => ({ name, value }));
  }, [filteredPreschools]);

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDifferenceText = (current: number, national: number, unit: string) => {
    const diff = Math.abs(current - national);
    const percentage = national > 0 ? ((diff / national) * 100) : 0;
    const isHigher = current > national;
    
    if (percentage < 1) return "≈ rikssnitt";
    
    return `${isHigher ? '+' : '-'}${diff.toFixed(1)}${unit} (${percentage.toFixed(0)}%)`;
  };

  const COLORS = ['hsl(142, 76%, 36%)', 'hsl(200, 85%, 45%)', 'hsl(35, 100%, 55%)', 'hsl(215, 20%, 65%)'];

  if (!isOpen || !currentStats) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <Card className="h-full bg-white/95 backdrop-blur-sm border border-border/50 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold">{context.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    Visar data för {currentStats.totalPreschools.toLocaleString()} förskolor
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mx-6 mt-6">
                  <TabsTrigger value="overview">📊 Översikt</TabsTrigger>
                  <TabsTrigger value="comparison">📈 Jämförelse</TabsTrigger>
                  <TabsTrigger value="distribution">📋 Fördelning</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="p-6 space-y-6">
                  {/* Quick stats cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Building className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">Förskolor</span>
                      </div>
                      <div className="text-2xl font-bold">{currentStats.totalPreschools.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">st</div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">Totalt barn</span>
                      </div>
                      <div className="text-2xl font-bold">{currentStats.totalChildren.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">barn</div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium">⌀ Barn/förskola</span>
                      </div>
                      <div className="text-2xl font-bold">{currentStats.avgChildrenPerPreschool.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">barn</div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">⌀ Betyg</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {currentStats.avgRating > 0 ? currentStats.avgRating.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">/5.0</div>
                    </Card>
                  </div>

                  {/* Key metrics comparison */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Nyckeltal vs Rikssnitt</h3>
                    {comparisonData.slice(0, 3).map((stat, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getTrendIcon(stat.trend)}
                            <div>
                              <div className="font-medium">{stat.label}</div>
                              <div className="text-sm text-muted-foreground">{stat.description}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {stat.current.toFixed(1)}{stat.unit}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Rikssnitt: {stat.national.toFixed(1)}{stat.unit}
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {getDifferenceText(stat.current, stat.national, stat.unit)}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="comparison" className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold">Detaljerad Jämförelse med Rikssnitt</h3>
                  
                  {comparisonData.map((stat, index) => (
                    <Card key={index} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getTrendIcon(stat.trend)}
                          <div>
                            <h4 className="text-lg font-semibold">{stat.label}</h4>
                            <p className="text-sm text-muted-foreground">{stat.description}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={stat.trend === 'up' ? 'default' : stat.trend === 'down' ? 'destructive' : 'secondary'}
                        >
                          {getDifferenceText(stat.current, stat.national, stat.unit)}
                        </Badge>
                      </div>

                      <div className="h-16">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: context.name, value: stat.current },
                              { name: 'Rikssnitt', value: stat.national }
                            ]}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}${stat.unit}`, '']} />
                            <Bar 
                              dataKey="value" 
                              fill={stat.trend === 'up' ? '#22c55e' : stat.trend === 'down' ? '#ef4444' : '#94a3b8'}
                              radius={4}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="distribution" className="p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Size distribution */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">📏 Förskolor per Storlek</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sizeDistributionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="range" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="hsl(142, 76%, 36%)" radius={4} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Ownership distribution */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">🏢 Huvudmansfördelning</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={ownershipData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {ownershipData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Legend */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {ownershipData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm">{entry.name}: {entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Summary stats table */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">📋 Sammanfattning av urval</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <tbody className="space-y-2">
                          <tr>
                            <td className="font-medium">Sammanhang:</td>
                            <td>{context.title}</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Antal förskolor:</td>
                            <td>{currentStats.totalPreschools.toLocaleString()} st</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Totalt antal barn:</td>
                            <td>{currentStats.totalChildren.toLocaleString()} barn</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Genomsnittlig förskolestorlek:</td>
                            <td>{currentStats.avgChildrenPerPreschool.toFixed(1)} barn/förskola</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Förskolor med betyg:</td>
                            <td>{currentStats.validRatings} st ({((currentStats.validRatings / currentStats.totalPreschools) * 100).toFixed(1)}%)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};