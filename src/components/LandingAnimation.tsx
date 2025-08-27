import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Database, Download } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';

interface LandingAnimationProps {
  onComplete: () => void;
}

// Animated Sweden map SVG with olive green colors
const AnimatedSwedenMap: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <svg viewBox="0 0 120 160" className="w-16 h-24 mx-auto">
        {/* Sweden outline */}
        <motion.path
          d="M60,15 L75,25 L85,40 L90,55 L95,75 L90,95 L85,110 L80,125 L70,140 L60,145 L50,140 L40,125 L35,110 L30,95 L25,75 L30,55 L35,40 L45,25 Z"
          fill="none"
          stroke="hsl(85, 40%, 45%)"
          strokeWidth="2"
          strokeDasharray="300"
          initial={{ strokeDashoffset: 300 }}
          animate={{ strokeDashoffset: 300 - (progress * 3) }}
          transition={{ duration: 0.8 }}
        />
        
        {/* Fill animation */}
        <motion.path
          d="M60,15 L75,25 L85,40 L90,55 L95,75 L90,95 L85,110 L80,125 L70,140 L60,145 L50,140 L40,125 L35,110 L30,95 L25,75 L30,55 L35,40 L45,25 Z"
          fill="url(#swedenGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: progress > 30 ? 0.3 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Gradient definition - olive green */}
        <defs>
          <linearGradient id="swedenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(85, 50%, 55%)" />
            <stop offset="50%" stopColor="hsl(75, 45%, 50%)" />
            <stop offset="100%" stopColor="hsl(65, 40%, 45%)" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
};

export const LandingAnimation: React.FC<LandingAnimationProps> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const { preschools } = useMapStore();
  
  // Get actual preschool count or use default, with real-time updates
  const totalPreschools = preschools.length > 0 ? preschools.length : 8739;
  
  // Watch for real data loading
  useEffect(() => {
    if (preschools.length > 0) {
      console.log(`📊 Real preschool data loaded: ${preschools.length} förskolor available`);
    }
  }, [preschools.length]);

  // Simplified progress indicators (3 items only)
  const progressSteps = [
    { label: 'Hämtar data', icon: Database, color: 'hsl(85, 50%, 45%)' },
    { label: 'Laddar karta', icon: MapPin, color: 'hsl(75, 45%, 40%)' },
    { label: 'Förbereder', icon: Download, color: 'hsl(65, 40%, 35%)' }
  ];

  const [activeStep, setActiveStep] = useState(0);

  // Continuous counter animation over exactly 2 seconds
  useEffect(() => {
    const duration = 2000; // Exactly 2 seconds total
    const increment = totalPreschools / (duration / 16); // Update every 16ms (60fps)
    
    let currentCount = 0;
    const timer = setInterval(() => {
      currentCount += increment;
      if (currentCount >= totalPreschools) {
        setCount(totalPreschools);
        clearInterval(timer);
        // Complete animation immediately when reaching full count
        setTimeout(onComplete, 100);
      } else {
        setCount(currentCount);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [totalPreschools, onComplete]);

  // Progress step animation - adjusted for 2 seconds total
  useEffect(() => {
    const stepDuration = 650; // 0.65 seconds per step (1.95s total for 3 steps)
    
    const stepTimer = setInterval(() => {
      setActiveStep(prev => {
        if (prev < progressSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepTimer);
        return prev;
      });
    }, stepDuration);

    return () => clearInterval(stepTimer);
  }, []);

  const progress = Math.min((count / totalPreschools) * 100, 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1, backgroundColor: '#ffffff' }}
        animate={{ 
          opacity: 1,
          backgroundColor: 'hsl(85, 15%, 95%)'
        }}
        exit={{ opacity: 0 }}
        transition={{ 
          backgroundColor: { duration: 0.8, ease: "easeOut" },
          opacity: { duration: 0.5 }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, 
            hsl(0, 0%, 100%) 0%, 
            hsl(85, 20%, 96%) 30%, 
            hsl(75, 15%, 94%) 70%, 
            hsl(65, 10%, 92%) 100%)`
        }}
      >
        {/* Main content with smooth entrance */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.8,
            ease: "easeOut",
            delay: 0.3
          }}
          className="text-center"
        >
          {/* Animated Sweden map */}
          <AnimatedSwedenMap progress={progress} />

          {/* Title with delayed entrance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: 0.5,
              duration: 0.6,
              ease: "easeOut"
            }}
            className="mb-8"
          >
            <h1 
              className="text-3xl md:text-5xl font-bold mb-3" 
              style={{
                background: `linear-gradient(135deg, 
                  hsl(85, 60%, 35%) 0%, 
                  hsl(75, 55%, 30%) 50%, 
                  hsl(65, 50%, 25%) 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent'
              }}
            >
              Förskolor i Sverige
            </h1>
            <p className="text-base text-gray-600">
              Upptäck och jämför alla förskolor
            </p>
          </motion.div>

          {/* Progress indicators - only 3 items */}
          <div className="flex justify-center gap-8 mb-8">
            {progressSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep >= index;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0.3, scale: 0.9 }}
                  animate={{
                    opacity: isActive ? 1 : 0.4,
                    scale: isActive ? 1 : 0.9
                  }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <motion.div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 mx-auto"
                    style={{
                      backgroundColor: isActive ? step.color : 'hsl(0, 0%, 88%)',
                      boxShadow: isActive ? `0 4px 12px ${step.color}30` : 'none'
                    }}
                  >
                    <Icon 
                      className="w-6 h-6" 
                      style={{ color: isActive ? 'white' : 'hsl(0, 0%, 60%)' }}
                    />
                  </motion.div>
                  <p 
                    className="text-xs font-medium"
                    style={{ color: isActive ? 'hsl(85, 40%, 35%)' : 'hsl(0, 0%, 60%)' }}
                  >
                    {step.label}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Loading bar */}
          <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden mb-6">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, 
                  hsl(85, 50%, 50%) 0%, 
                  hsl(75, 45%, 45%) 50%, 
                  hsl(65, 40%, 40%) 100%)`
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "easeOut" }}
            />
          </div>

          {/* Preschool counter with smooth entrance */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: 0.7,
              duration: 0.5,
              ease: "easeOut"
            }}
            className="text-center"
          >
            <motion.div 
              className="text-2xl md:text-3xl font-bold mb-1"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(85, 60%, 40%) 0%, 
                  hsl(65, 50%, 35%) 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent'
              }}
            >
              {Math.floor(count).toLocaleString('sv-SE')}
            </motion.div>
            <p className="text-sm text-gray-600 font-medium">
              förskolor
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};