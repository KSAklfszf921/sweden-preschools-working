import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const SearchSkeleton: React.FC = () => (
  <Card className="glass-search border-0 shadow-lg">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-10 w-full mb-3" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </CardContent>
  </Card>
);

export const PreschoolListSkeleton: React.FC = () => (
  <Card className="glass-card border-0 shadow-lg">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-3">
          <div className="flex justify-between items-start mb-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32 mb-2" />
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export const StatisticsSkeleton: React.FC = () => (
  <Card className="glass-card border-0 shadow-lg">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center p-3 border rounded-lg">
            <Skeleton className="h-6 w-6 mx-auto mb-2 rounded" />
            <Skeleton className="h-6 w-8 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const MapLoadingOverlay: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg"
  >
    <Card className="glass-card border-0 shadow-lg">
      <CardContent className="p-6 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-sm text-muted-foreground">Laddar kartan...</p>
      </CardContent>
    </Card>
  </motion.div>
);

interface PulseDotsProps {
  className?: string;
}

export const PulseDots: React.FC<PulseDotsProps> = ({ className = "" }) => (
  <div className={`flex space-x-1 ${className}`}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-primary rounded-full"
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.2,
        }}
      />
    ))}
  </div>
);

export const BubbleLoadingState: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="absolute inset-0 flex items-center justify-center z-10"
  >
    <Card className="glass-card border-0 shadow-lg">
      <CardContent className="p-4 flex items-center gap-3">
        <PulseDots />
        <span className="text-sm text-muted-foreground">Uppdaterar kartan...</span>
      </CardContent>
    </Card>
  </motion.div>
);