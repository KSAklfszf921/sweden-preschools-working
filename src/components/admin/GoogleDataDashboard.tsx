import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Database, 
  RefreshCw, 
  Activity,
  MapPin,
  Star,
  Image,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEnhancedGoogleData } from '@/hooks/useEnhancedGoogleData';
import { useGoogleDataEnrichment } from '@/hooks/useGoogleDataEnrichment';

export const GoogleDataDashboard: React.FC = () => {
  const { stats, isLoading, refreshStats, triggerEnrichment } = useEnhancedGoogleData();
  const { progress, enrichMissingData } = useGoogleDataEnrichment();
  const [isEnriching, setIsEnriching] = useState(false);

  const handleStartEnrichment = async () => {
    setIsEnriching(true);
    try {
      await enrichMissingData();
      await refreshStats();
    } catch (error) {
      console.error('Enrichment error:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('sv-SE').format(num);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (percentage >= 50) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!progress.isRunning) {
        refreshStats();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshStats, progress.isRunning]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">Google API Integration</h2>
          <p className="text-muted-foreground">
            Övervaka och hantera Google Places data för förskolor
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshStats}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
          <Button
            onClick={handleStartEnrichment}
            disabled={isEnriching || progress.isRunning}
          >
            <Database className="h-4 w-4 mr-2" />
            {isEnriching || progress.isRunning ? 'Pågår...' : 'Starta berikning'}
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total täckning</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {stats.coveragePercentage}%
              </div>
              {getStatusIcon(stats.coveragePercentage)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={stats.coveragePercentage} className="flex-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatNumber(stats.enrichedPreschools)} av {formatNumber(stats.totalPreschools)} förskolor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Uppdaterade (7 dagar)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(stats.recentlyUpdated)}
            </div>
            <p className="text-xs text-muted-foreground">
              Nyligen berikade förskolor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Behöver uppdatering</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatNumber(stats.needingUpdate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Äldre än 30 dagar eller saknar data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {progress.isRunning ? (
                <>
                  <div className="text-sm font-medium text-blue-600">Pågår</div>
                  <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                </>
              ) : (
                <>
                  <div className="text-sm font-medium text-green-600">Inaktiv</div>
                  <div className="h-2 w-2 bg-green-600 rounded-full" />
                </>
              )}
            </div>
            {progress.isRunning && (
              <div className="mt-2">
                <div className="text-xs text-muted-foreground">
                  {progress.processed} / {progress.total} ({progress.errors} fel)
                </div>
                <Progress 
                  value={progress.total > 0 ? (progress.processed / progress.total) * 100 : 0} 
                  className="mt-1" 
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Quality */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Datakvalitet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Plats-ID</span>
                </div>
                <Badge variant="secondary">
                  {Math.round((stats.enrichedPreschools / Math.max(stats.totalPreschools, 1)) * 100)}%
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Betyg</span>
                </div>
                <Badge variant="secondary">
                  ~{Math.round((stats.enrichedPreschools * 0.7) / Math.max(stats.totalPreschools, 1) * 100)}%
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Bilder</span>
                </div>
                <Badge variant="secondary">
                  ~{Math.round((stats.enrichedPreschools * 0.6) / Math.max(stats.totalPreschools, 1) * 100)}%
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Recensioner</span>
                </div>
                <Badge variant="secondary">
                  ~{Math.round((stats.enrichedPreschools * 0.5) / Math.max(stats.totalPreschools, 1) * 100)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Senaste aktivitet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progress.isRunning ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                    <span className="text-sm">Berikar förskoledata...</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Bearbetat: {progress.processed} / {progress.total}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Fel: {progress.errors}
                  </div>
                  <Progress value={progress.total > 0 ? (progress.processed / progress.total) * 100 : 0} />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-600 rounded-full" />
                    <span className="text-sm">Systemet är inaktivt</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Senaste uppdatering: {new Date().toLocaleString('sv-SE')}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Åtgärder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => triggerEnrichment()}
              disabled={progress.isRunning}
            >
              <Database className="h-4 w-4 mr-2" />
              Berika alla utan data
            </Button>
            <Button
              variant="outline"
              onClick={refreshStats}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Uppdatera statistik
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Trigger priority enrichment for top preschools
                console.log('Starting priority enrichment...');
              }}
              disabled={progress.isRunning}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Prioriterad berikning
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};