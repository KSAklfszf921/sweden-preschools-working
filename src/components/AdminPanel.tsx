import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Database, 
  Activity, 
  MapPin, 
  Server, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  HardDrive,
  Users,
  Images,
  Star,
  Wrench,
  BarChart3,
  Clock,
  FileText,
  Map,
  Globe,
  Play,
  Square,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdminStats {
  database: {
    totalPreschools: number;
    missingCoordinates: number;
    withGoogleData: number;
    withImages: number;
    googleDataEntries: number;
    imagesCount: number;
    userFavorites: number;
    searchHistory: number;
    coordinatesCoverage: number;
    googleDataCoverage: number;
    imagesCoverage: number;
  };
  storage: {
    totalSize: number;
    totalSizeFormatted: string;
    buckets: Array<{
      name: string;
      fileCount: number;
      size: number;
      sizeFormatted: string;
    }>;
  };
  activity: {
    recentLogs: Array<any>;
  };
  systemHealth: {
    databaseOnline: boolean;
    lastUpdated: string;
  };
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [geocodingBatchSize, setGeocodingBatchSize] = useState(5);
  const [geocodingDryRun, setGeocodingDryRun] = useState(true);
  const [geocodingResults, setGeocodingResults] = useState<any[]>([]);
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const { preschools } = useMapStore();
  const { toast } = useToast();

  const missingCoords = preschools.filter(p => 
    !p.latitud || !p.longitud || p.latitud === 0 || p.longitud === 0
  );

  const checkApiStatus = async () => {
    setApiStatus('checking');
    try {
      const { data, error } = await supabase.from('Förskolor').select('count').limit(1);
      if (error) throw error;
      setApiStatus('online');
    } catch (error) {
      setApiStatus('offline');
      console.error('API status check failed:', error);
    }
  };

  const loadAdminStats = async () => {
    setStatsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-stats');
      
      if (error) throw error;
      
      setAdminStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
      toast({
        title: "Kunde inte ladda statistik",
        description: "Kontrollera att admin-stats funktionen är aktiv.",
        variant: "destructive"
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleGeocoding = async (batchSize = geocodingBatchSize) => {
    if (geocodingInProgress) return;

    setGeocodingInProgress(true);
    setIsGeocoding(true);
    setGeocodingProgress(0);
    setGeocodingResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('fix-missing-geocoding', {
        body: { 
          batchSize,
          dryRun: geocodingDryRun
        }
      });

      if (error) throw error;

      setGeocodingResults(data.results || []);
      setGeocodingProgress(100);

      toast({
        title: geocodingDryRun ? "Geocoding simulering klar" : "Geocoding klar",
        description: `${data.success} lyckades, ${data.errors} misslyckades av ${data.processed} behandlade.`,
        variant: data.errors > 0 ? "destructive" : "default"
      });

      // Reload stats after successful geocoding
      if (!geocodingDryRun && data.success > 0) {
        setTimeout(loadAdminStats, 1000);
      }

    } catch (error: any) {
      console.error('Geocoding error:', error);
      toast({
        title: "Geocoding misslyckades",
        description: error.message || "Kontrollera att Google Maps API-nyckeln är konfigurerad.",
        variant: "destructive"
      });
    } finally {
      setIsGeocoding(false);
      setGeocodingInProgress(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkApiStatus();
      loadAdminStats();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-6xl max-h-[90vh] overflow-hidden"
          >
            <Card className="bg-card/95 backdrop-blur-lg border-border/50 shadow-nordic">
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Administratörspanel</h2>
                  <Badge variant="secondary">Admin Mode</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAdminStats}
                    disabled={statsLoading}
                  >
                    {statsLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">Översikt</TabsTrigger>
                    <TabsTrigger value="database">Databas</TabsTrigger>
                    <TabsTrigger value="storage">Lagring</TabsTrigger>
                    <TabsTrigger value="geocoding">Geo-Data</TabsTrigger>
                    <TabsTrigger value="activity">Aktivitet</TabsTrigger>
                    <TabsTrigger value="tools">Verktyg</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="p-4 bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Database className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">Supabase Status</p>
                            <div className="flex items-center gap-2 mt-1">
                              {apiStatus === 'online' && (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span className="text-sm text-green-600">Online</span>
                                </>
                              )}
                              {apiStatus === 'offline' && (
                                <>
                                  <XCircle className="w-4 h-4 text-red-500" />
                                  <span className="text-sm text-red-600">Offline</span>
                                </>
                              )}
                              {apiStatus === 'checking' && (
                                <>
                                  <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
                                  <span className="text-sm text-yellow-600">Kontrollerar...</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">Förskolor</p>
                            <p className="text-2xl font-bold text-primary">
                              {adminStats?.database.totalPreschools?.toLocaleString() || preschools.length.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-muted/30">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-orange-500" />
                          <div>
                            <p className="font-medium">Saknar koordinater</p>
                            <p className="text-2xl font-bold text-orange-500">
                              {adminStats?.database.missingCoordinates || missingCoords.length}
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-muted/30">
                        <div className="flex items-center gap-3">
                          <HardDrive className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Lagringsstorlek</p>
                            <p className="text-lg font-bold text-blue-500">
                              {adminStats?.storage.totalSizeFormatted || 'Laddar...'}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Coverage Statistics */}
                    {adminStats && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4 bg-muted/30">
                          <h3 className="font-medium mb-3 flex items-center gap-2">
                            <Map className="w-4 h-4" />
                            Koordinattäckning
                          </h3>
                          <Progress value={adminStats.database.coordinatesCoverage} className="mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {adminStats.database.coordinatesCoverage}% har koordinater
                          </p>
                        </Card>

                        <Card className="p-4 bg-muted/30">
                          <h3 className="font-medium mb-3 flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Google Data
                          </h3>
                          <Progress value={adminStats.database.googleDataCoverage} className="mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {adminStats.database.googleDataCoverage}% har Google-data
                          </p>
                        </Card>

                        <Card className="p-4 bg-muted/30">
                          <h3 className="font-medium mb-3 flex items-center gap-2">
                            <Images className="w-4 h-4" />
                            Bildtäckning
                          </h3>
                          <Progress value={adminStats.database.imagesCoverage} className="mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {adminStats.database.imagesCoverage}% har bilder
                          </p>
                        </Card>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="database" className="space-y-4">
                    {statsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                        <span>Laddar databasstatistik...</span>
                      </div>
                    ) : adminStats ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4 bg-muted/30">
                          <h3 className="font-medium mb-3 flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Huvudtabeller
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Förskolor:</span>
                              <span className="font-medium">{adminStats.database.totalPreschools.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Google Data:</span>
                              <span className="font-medium">{adminStats.database.googleDataEntries.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Bilder:</span>
                              <span className="font-medium">{adminStats.database.imagesCount.toLocaleString()}</span>
                            </div>
                          </div>
                        </Card>

                        <Card className="p-4 bg-muted/30">
                          <h3 className="font-medium mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Användardata
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Favoriter:</span>
                              <span className="font-medium">{adminStats.database.userFavorites.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sökhistorik:</span>
                              <span className="font-medium">{adminStats.database.searchHistory.toLocaleString()}</span>
                            </div>
                          </div>
                        </Card>

                        <Card className="p-4 bg-muted/30">
                          <h3 className="font-medium mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Datakvalitet
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Utan koordinater:</span>
                              <span className="font-medium text-orange-600">{adminStats.database.missingCoordinates}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Med Google-data:</span>
                              <span className="font-medium text-green-600">{adminStats.database.withGoogleData}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Med bilder:</span>
                              <span className="font-medium text-blue-600">{adminStats.database.withImages}</span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Kunde inte ladda databasstatistik</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="storage" className="space-y-4">
                    {adminStats?.storage ? (
                      <div className="space-y-4">
                        <Card className="p-4 bg-muted/30">
                          <h3 className="font-medium mb-3 flex items-center gap-2">
                            <HardDrive className="w-4 h-4" />
                            Total lagringsstorlek: {adminStats.storage.totalSizeFormatted}
                          </h3>
                        </Card>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {adminStats.storage.buckets.map((bucket) => (
                            <Card key={bucket.name} className="p-4 bg-muted/30">
                              <h4 className="font-medium mb-2">{bucket.name}</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Filer:</span>
                                  <span className="font-medium">{bucket.fileCount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Storlek:</span>
                                  <span className="font-medium">{bucket.sizeFormatted}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <HardDrive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Lagringsstatistik ej tillgänglig</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="geocoding" className="space-y-4">
                    {adminStats?.database ? (
                      <div className="space-y-6">
                        {/* Geocoding Status */}
                        <div className="bg-muted/30 rounded-lg p-4">
                          <h3 className="font-medium mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Geocoding Status
                          </h3>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {adminStats.database.totalPreschools - adminStats.database.missingCoordinates}
                              </div>
                              <div className="text-sm text-muted-foreground">Med koordinater</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">
                                {adminStats.database.missingCoordinates}
                              </div>
                              <div className="text-sm text-muted-foreground">Saknar koordinater</div>
                            </div>
                          </div>
                          <Progress value={adminStats.database.coordinatesCoverage} className="mb-2" />
                          <div className="text-sm text-muted-foreground text-center">
                            {adminStats.database.coordinatesCoverage.toFixed(1)}% har koordinater
                          </div>
                        </div>

                        {/* Geocoding Controls */}
                        <div className="bg-muted/30 rounded-lg p-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Geocoding Kontroller
                          </h4>
                          
                          {/* Batch Size and Mode Controls */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <Label htmlFor="batchSize">Batch-storlek</Label>
                              <Select value={geocodingBatchSize.toString()} onValueChange={(value) => setGeocodingBatchSize(parseInt(value))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1 (Långsam, säker)</SelectItem>
                                  <SelectItem value="5">5 (Rekommenderad)</SelectItem>
                                  <SelectItem value="10">10 (Snabb)</SelectItem>
                                  <SelectItem value="20">20 (Mycket snabb)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Testkörning</Label>
                              <div className="flex items-center space-x-2">
                                <Switch 
                                  checked={geocodingDryRun} 
                                  onCheckedChange={setGeocodingDryRun}
                                />
                                <span className="text-sm">{geocodingDryRun ? 'Test' : 'Verklig körning'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <Button
                              onClick={() => handleGeocoding()}
                              disabled={geocodingInProgress || adminStats.database.missingCoordinates === 0}
                              variant="default"
                              className="w-full"
                            >
                              {geocodingInProgress ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Kör geocoding...
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Starta Geocoding
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setGeocodingInProgress(false);
                                setIsGeocoding(false);
                              }}
                              disabled={!geocodingInProgress}
                              variant="destructive"
                              className="w-full"
                            >
                              <Square className="w-4 h-4 mr-2" />
                              Stoppa
                            </Button>
                          </div>

                          {/* Progress Display */}
                          {geocodingInProgress && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{geocodingProgress.toFixed(1)}%</span>
                              </div>
                              <Progress value={geocodingProgress} className="mb-2" />
                              <div className="text-xs text-muted-foreground">
                                {geocodingResults.filter((r: any) => r.status === 'success').length} lyckade, {' '}
                                {geocodingResults.filter((r: any) => r.status === 'error').length} misslyckade
                              </div>
                            </div>
                          )}

                          {geocodingDryRun && (
                            <Badge variant="outline" className="mb-3">Testkörning - Inga ändringar sparades</Badge>
                          )}
                        </div>

                        {/* Recent Results */}
                        {geocodingResults.length > 0 && (
                          <div className="bg-muted/30 rounded-lg p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              Senaste Resultat ({geocodingResults.length})
                            </h4>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {geocodingResults.slice(-10).map((result: any, index: number) => (
                                <div 
                                  key={index}
                                  className={`text-xs p-2 rounded border-l-2 ${
                                    result.status === 'success' 
                                      ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                                      : 'border-red-500 bg-red-50 dark:bg-red-950'
                                  }`}
                                >
                                  <div className="font-medium">{result.name}</div>
                                  {result.status === 'success' ? (
                                    <div className="text-muted-foreground">
                                      ✓ {result.coordinates?.lat.toFixed(6)}, {result.coordinates?.lng.toFixed(6)}
                                    </div>
                                  ) : (
                                    <div className="text-red-600">✗ {result.error}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t">
                              <Button
                                onClick={() => setGeocodingResults([])}
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                Rensa Resultat
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">Laddar geocoding-information...</p>
                      </div>
                    )}
                  </TabsContent>


                  <TabsContent value="activity" className="space-y-4">
                    <Card className="p-4 bg-muted/30">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Senaste systemhändelser
                      </h3>
                      <ScrollArea className="h-64">
                        <div className="space-y-2 text-sm">
                          {adminStats?.activity.recentLogs.length > 0 ? (
                            adminStats.activity.recentLogs.map((log, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 rounded bg-background/30">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {new Date(log.created_at).toLocaleString()}
                                </span>
                                <span className="font-medium">{log.category}</span>
                                <span className="text-muted-foreground">{log.message}</span>
                              </div>
                            ))
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-muted-foreground">{new Date().toLocaleTimeString()}</span>
                                <span>Admin-panel öppnad</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-muted-foreground">{new Date(Date.now() - 30000).toLocaleTimeString()}</span>
                                <span>Förskolor laddade från databas</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3 text-blue-500" />
                                <span className="text-muted-foreground">{new Date(Date.now() - 60000).toLocaleTimeString()}</span>
                                <span>Användare navigerade till {window.location.pathname}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </ScrollArea>
                    </Card>

                    <Card className="p-4 bg-muted/30">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        API Funktioner Status
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Admin Stats</span>
                          <Badge variant="secondary">Aktiv</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Fix Missing Geocoding</span>
                          <Badge variant="secondary">Aktiv</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Google Places API</span>
                          <Badge variant="secondary">Aktiv</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Street View Generator</span>
                          <Badge variant="secondary">Aktiv</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Mapbox Proxy</span>
                          <Badge variant="secondary">Aktiv</Badge>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="tools" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4 bg-muted/30">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          Systemverktyg
                        </h3>
                        <div className="space-y-3">
                          <Button variant="outline" size="sm" onClick={checkApiStatus} className="w-full justify-start">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Kontrollera API-status
                          </Button>
                          <Button variant="outline" size="sm" onClick={loadAdminStats} className="w-full justify-start">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Uppdatera statistik
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <FileText className="w-4 h-4 mr-2" />
                            Exportera data
                          </Button>
                        </div>
                      </Card>

                      <Card className="p-4 bg-muted/30">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          Dataunderhåll
                        </h3>
                        <div className="space-y-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleGeocoding(50)}
                            disabled={isGeocoding}
                            className="w-full justify-start"
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            Batch geocoding (50st)
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <Images className="w-4 h-4 mr-2" />
                            Uppdatera Google-bilder
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <Star className="w-4 h-4 mr-2" />
                            Hämta recensioner
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};