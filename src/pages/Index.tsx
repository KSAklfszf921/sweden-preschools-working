import React from 'react';
import { Map3D } from '@/components/Map3D';
import { SearchFilters } from '@/components/SearchFilters';
import { PreschoolDetails } from '@/components/PreschoolDetails';
import { MissingCoordinatesPanel } from '@/components/MissingCoordinatesPanel';
import { usePreschools } from '@/hooks/usePreschools';
import { motion } from 'framer-motion';

const Index = () => {
  const { isLoading, error } = usePreschools();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Ett fel uppstod</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-40 bg-card/90 backdrop-blur-sm border-b border-border/50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Sveriges Förskolor
              </h1>
              <p className="text-sm text-muted-foreground">Hitta och jämför förskolor i hela Sverige</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live data från 8,739 förskolor
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="relative">
        {/* Search filters - overlay on map */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute left-4 top-4 z-30 w-80"
        >
          <SearchFilters />
        </motion.div>

        {/* Missing coordinates panel - overlay on map */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute right-4 top-4 z-30 w-80"
        >
          <MissingCoordinatesPanel />
        </motion.div>

        {/* 3D Map */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="h-screen"
        >
          <Map3D className="w-full h-full" />
        </motion.div>

        {/* Preschool details panel */}
        <PreschoolDetails />

        {/* Loading overlay */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Laddar Sveriges förskolor...</h2>
              <p className="text-muted-foreground">Hämtar data från Supabase-databasen</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Index;
