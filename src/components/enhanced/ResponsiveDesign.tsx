import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  searchComponent?: React.ReactNode;
  listComponent?: React.ReactNode;
  statisticsComponent?: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  searchComponent,
  listComponent,
  statisticsComponent
}) => {
  const isMobile = useIsMobile();
  const [activeSheet, setActiveSheet] = useState<'search' | 'list' | 'stats' | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  if (!isMobile) {
    // Desktop layout - show all components
    return (
      <div className="relative w-full h-full">
        {children}
        {searchComponent}
        {listComponent}
        {statisticsComponent}
      </div>
    );
  }

  // Mobile layout with bottom navigation
  return (
    <div className="relative w-full h-full">
      {children}
      
      {/* Mobile bottom navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-2 bg-background/95 backdrop-blur-xl border border-border/50 rounded-full px-3 py-2 shadow-lg">
          <Sheet open={activeSheet === 'search'} onOpenChange={(open) => setActiveSheet(open ? 'search' : null)}>
            <SheetTrigger asChild>
              <Button size="sm" variant="ghost" className="rounded-full touch-target">
                <Search className="h-4 w-4" />
                <span className="sr-only">Sök</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
              <div className="mt-4">
                {searchComponent}
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={activeSheet === 'list'} onOpenChange={(open) => setActiveSheet(open ? 'list' : null)}>
            <SheetTrigger asChild>
              <Button size="sm" variant="ghost" className="rounded-full touch-target">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Lista</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
              <div className="mt-4">
                {listComponent}
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={activeSheet === 'stats'} onOpenChange={(open) => setActiveSheet(open ? 'stats' : null)}>
            <SheetTrigger asChild>
              <Button size="sm" variant="ghost" className="rounded-full touch-target">
                <BarChart3 className="h-4 w-4" />
                <span className="sr-only">Statistik</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
              <div className="mt-4">
                {statisticsComponent}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.div>

      {/* Floating action button for landscape orientation */}
      {orientation === 'landscape' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 z-50"
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="default" className="rounded-full w-12 h-12 shadow-lg">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90vw] max-w-md">
              <div className="space-y-6 mt-4">
                <div>
                  <h3 className="font-semibold mb-3">Sök</h3>
                  {searchComponent}
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Förskolor</h3>
                  {listComponent}
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Statistik</h3>
                  {statisticsComponent}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>
      )}
    </div>
  );
};

// Hook for responsive breakpoints
export const useResponsiveBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 480) setBreakpoint('xs');
      else if (width < 640) setBreakpoint('sm');
      else if (width < 768) setBreakpoint('md');
      else if (width < 1024) setBreakpoint('lg');
      else setBreakpoint('xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
};

// Component for responsive text sizing
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({ children, className = "" }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`${isMobile ? 'text-sm' : 'text-base'} ${className}`}>
      {children}
    </div>
  );
};

// Component for responsive spacing
interface ResponsiveSpacingProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveSpacing: React.FC<ResponsiveSpacingProps> = ({ children, className = "" }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`${isMobile ? 'p-3 space-y-3' : 'p-4 space-y-4'} ${className}`}>
      {children}
    </div>
  );
};