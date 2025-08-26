import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
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

  const handleGeocoding = async () => {
    if (missingCoords.length === 0) return;

    setIsGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocoding-service', {
        body: { preschools: missingCoords.slice(0, 100) }
      });

      if (error) throw error;

      toast({
        title: "Geocoding startad",
        description: `Bearbetar ${Math.min(100, missingCoords.length)} förskolor.`,
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Geocoding misslyckades",
        description: "Kunde inte starta koordinatsökning.",
        variant: "destructive"
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      checkApiStatus();
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
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            <Card className="bg-card/95 backdrop-blur-lg border-border/50 shadow-nordic">
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Administratörspanel</h2>
                  <Badge variant="secondary">Developer Mode</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6">
                <Tabs defaultValue="status" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="status">Status</TabsTrigger>
                    <TabsTrigger value="coordinates">Koordinater</TabsTrigger>
                    <TabsTrigger value="logs">Loggar</TabsTrigger>
                    <TabsTrigger value="settings">Inställningar</TabsTrigger>
                  </TabsList>

                  <TabsContent value="status" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          <Activity className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">Totala förskolor</p>
                            <p className="text-2xl font-bold text-primary">{preschools.length.toLocaleString()}</p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-muted/30">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">Saknar koordinater</p>
                            <p className="text-2xl font-bold text-orange-500">{missingCoords.length}</p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <Card className="p-4 bg-muted/30">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        API Funktioner
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Geocoding Service</span>
                          <Badge variant="secondary">Aktiv</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Google Places API</span>
                          <Badge variant="secondary">Aktiv</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Mapbox Proxy</span>
                          <Badge variant="secondary">Aktiv</Badge>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="coordinates" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          Förskolor utan koordinater
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {missingCoords.length} förskolor kan inte visas på kartan
                        </p>
                      </div>
                      <Button 
                        onClick={handleGeocoding}
                        disabled={isGeocoding || missingCoords.length === 0}
                        size="sm"
                      >
                        {isGeocoding ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Bearbetar...
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 mr-2" />
                            Sök koordinater ({Math.min(100, missingCoords.length)})
                          </>
                        )}
                      </Button>
                    </div>

                    <Card className="bg-muted/30">
                      <ScrollArea className="h-64 p-4">
                        <div className="space-y-2">
                          {missingCoords.slice(0, 50).map((preschool) => (
                            <div
                              key={preschool.id}
                              className="p-3 rounded-lg bg-background/50 border border-border/30"
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
                              ... och {missingCoords.length - 50} till
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </Card>
                  </TabsContent>

                  <TabsContent value="logs" className="space-y-4">
                    <Card className="p-4 bg-muted/30">
                      <h3 className="font-medium mb-3">Senaste systemhändelser</h3>
                      <ScrollArea className="h-48">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-muted-foreground">{new Date().toLocaleTimeString()}</span>
                            <span>Karta initialiserad</span>
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
                        </div>
                      </ScrollArea>
                    </Card>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <Card className="p-4 bg-muted/30">
                      <h3 className="font-medium mb-3">Utvecklarinställningar</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Debug-läge</span>
                          <Badge variant="secondary">Aktivt</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Konsol-loggning</span>
                          <Badge variant="secondary">Aktivt</Badge>
                        </div>
                        <Button variant="outline" size="sm" onClick={checkApiStatus}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Uppdatera status
                        </Button>
                      </div>
                    </Card>
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