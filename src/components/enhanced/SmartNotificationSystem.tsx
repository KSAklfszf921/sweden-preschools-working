import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMapStore } from '@/stores/mapStore';
interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  actions?: {
    label: string;
    action: () => void;
  }[];
}
export const SmartNotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const {
    preschools,
    filteredPreschools,
    searchFilters
  } = useMapStore();
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    setIsVisible(true);

    // Auto-hide after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration || 5000);
    }
  };
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Smart notifications based on context
  useEffect(() => {
    // Filter change notifications
    if (Object.keys(searchFilters).length > 0) {
      const resultCount = filteredPreschools.length;
      const originalCount = preschools.length;
      if (resultCount === 0) {
        addNotification({
          type: 'warning',
          title: 'Inga resultat',
          message: 'Inga förskolor matchar dina sökkriterier. Prova att justera filtren.',
          actions: [{
            label: 'Rensa filter',
            action: () => {
              // This would clear filters
            }
          }]
        });
      } else if (resultCount < originalCount * 0.1) {
        addNotification({
          type: 'info',
          title: 'Få resultat',
          message: `Endast ${resultCount} förskolor matchar dina kriterier av ${originalCount} totalt.`,
          duration: 3000
        });
      }
    }
  }, [searchFilters, filteredPreschools.length, preschools.length]);

  // Quality insights notifications
  useEffect(() => {
    if (filteredPreschools.length > 0) {
      const highQualityCount = filteredPreschools.filter(p => p.google_rating && p.google_rating >= 4.5 && p.andel_med_förskollärarexamen && p.andel_med_förskollärarexamen >= 80).length;
      if (highQualityCount > 5) {
        addNotification({
          type: 'success',
          title: 'Högkvalitativa förskolor',
          message: `${highQualityCount} förskolor har både högt Google-betyg (≥4.5) och hög andel förskollärarexamen (≥80%).`,
          duration: 4000,
          actions: [{
            label: 'Visa dessa',
            action: () => {
              // Filter to show only high quality preschools
            }
          }]
        });
      }
    }
  }, [filteredPreschools]);
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Nu';
    if (minutes < 60) return `${minutes}m sedan`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h sedan`;
  };
  if (!isVisible || notifications.length === 0) {
    return;
  }
  return <motion.div initial={{
    opacity: 0,
    x: 100
  }} animate={{
    opacity: 1,
    x: 0
  }} exit={{
    opacity: 0,
    x: 100
  }} className="fixed top-4 right-4 z-50 w-80 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifikationer
        </h3>
        <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm" className="h-6 w-6 p-0">
          <X className="w-3 h-3" />
        </Button>
      </div>

      <AnimatePresence>
        {notifications.map(notification => <motion.div key={notification.id} initial={{
        opacity: 0,
        y: -20,
        scale: 0.95
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        x: 100,
        scale: 0.95
      }} className="relative">
            <Card className="bg-card/95 backdrop-blur-sm border-border/50 p-3">
              <div className="flex items-start gap-3">
                {getIcon(notification.type)}
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  
                  {notification.actions && <div className="flex gap-2 mt-2">
                      {notification.actions.map((action, index) => <Button key={index} onClick={action.action} variant="outline" size="sm" className="h-6 text-xs">
                          {action.label}
                        </Button>)}
                    </div>}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(notification.timestamp)}
                    </span>
                    <Button onClick={() => removeNotification(notification.id)} variant="ghost" size="sm" className="h-4 w-4 p-0">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>)}
      </AnimatePresence>
    </motion.div>;
};