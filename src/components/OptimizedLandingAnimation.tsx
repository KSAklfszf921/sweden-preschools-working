import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { MapPin, Database, Download, Users, Star, Building, Zap } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';

interface OptimizedLandingAnimationProps {
  onComplete: () => void;
}

// 🎯 ULTRASNABB: Minimalistisk Sverige-karta med GPU-acceleration
const OptimizedSwedenMap: React.FC<{ progress: number }> = ({ progress }) => {
  const scale = useSpring(0);
  const opacity = useSpring(0);
  
  useEffect(() => {
    scale.set(1);
    opacity.set(1);
  }, []);

  return (
    <motion.div
      className="mb-6 relative will-change-transform"
      style={{ 
        scale,
        opacity,
        transform: "translateZ(0)", // GPU-acceleration
      }}
    >
      <svg viewBox="0 0 120 160" className="w-16 h-24 mx-auto drop-shadow-xl">
        {/* Ultrasnabb SVG med mindre komplexa paths */}
        <motion.path
          d="M45,20 C50,15 60,15 65,18 C75,22 85,45 88,75 C90,105 80,132 60,145 C40,145 25,85 30,55 C33,35 42,25 45,20 Z"
          fill="none"
          stroke="url(#fastStroke)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="300"
          strokeDashoffset={300 - (progress * 3)}
          className="will-change-transform"
          filter="url(#fastGlow)"
        />
        
        <motion.path
          d="M45,20 C50,15 60,15 65,18 C75,22 85,45 88,75 C90,105 80,132 60,145 C40,145 25,85 30,55 C33,35 42,25 45,20 Z"
          fill="url(#fastGradient)"
          opacity={progress > 30 ? 0.5 : 0}
          className="will-change-transform"
        />

        {/* Snabba städer - färre, mer effektiva */}
        {[
          { x: 70, y: 60 }, // Stockholm
          { x: 45, y: 80 }, // Göteborg
          { x: 50, y: 135 } // Malmö
        ].map((city, i) => (
          <motion.circle
            key={i}
            cx={city.x}
            cy={city.y}
            r="3"
            fill="hsl(45, 90%, 60%)"
            initial={{ scale: 0 }}
            animate={{ scale: progress > 60 ? 1 : 0 }}
            className="will-change-transform"
            filter="url(#cityGlow)"
          />
        ))}
        
        <defs>
          <linearGradient id="fastGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(85, 70%, 55%)" />
            <stop offset="100%" stopColor="hsl(65, 50%, 35%)" />
          </linearGradient>
          
          <linearGradient id="fastStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(85, 80%, 45%)" />
            <stop offset="100%" stopColor="hsl(65, 70%, 25%)" />
          </linearGradient>

          <filter id="fastGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="cityGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
    </motion.div>
  );
};

// 🚀 SNABBARE: Simplified progress step med mindre animationer
const FastProgressStep: React.FC<{
  step: { label: string; icon: any; color: string };
  isActive: boolean;
  isCompleted: boolean;
}> = ({ step, isActive, isCompleted }) => {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isActive ? 1.1 : 1,
        rotateY: isActive ? [0, 5, 0] : 0
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
      className="text-center will-change-transform"
    >
      <motion.div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 mx-auto relative overflow-hidden"
        style={{
          backgroundColor: isCompleted 
            ? step.color 
            : isActive 
              ? `${step.color}25` 
              : 'hsl(0, 0%, 95%)',
          boxShadow: isActive 
            ? `0 6px 20px ${step.color}30` 
            : isCompleted
              ? `0 4px 12px ${step.color}25`
              : 'none'
        }}
        whileHover={{ scale: 1.05 }}
      >
        {/* Minimal shimmer effect för aktiv state */}
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
            animate={{ x: [-100, 100] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
        
        <Icon 
          className="w-6 h-6 relative z-10" 
          style={{ 
            color: isCompleted 
              ? 'white' 
              : isActive 
                ? step.color 
                : 'hsl(0, 0%, 60%)'
          }}
        />

        {/* Snabb checkmark */}
        {isCompleted && (
          <motion.div
            className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        )}
      </motion.div>

      <motion.p 
        className="text-xs font-medium"
        style={{ color: isCompleted || isActive ? 'hsl(85, 60%, 25%)' : 'hsl(0, 0%, 50%)' }}
      >
        {step.label}
      </motion.p>
    </motion.div>
  );
};

// 🎯 COOLA PARTIKLAR: GPU-optimerade sparkles
const OptimizedSparkles: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
        style={{
          left: `${30 + Math.random() * 40}%`,
          top: `${30 + Math.random() * 40}%`,
          transform: "translateZ(0)", // GPU-acceleration
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.5, 0],
          opacity: [0, 1, 0],
          y: [0, -30],
          rotate: [0, 180]
        }}
        transition={{
          duration: 1,
          delay: i * 0.08,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      />
    ))}
  </div>
);

export const OptimizedLandingAnimation: React.FC<OptimizedLandingAnimationProps> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [showSparkles, setShowSparkles] = useState(false);
  const { preschools } = useMapStore();
  
  const totalPreschools = preschools.length > 0 ? preschools.length : 8739;

  // 🚀 SNABBARE: Mindre steg, snabbare progression
  const progressSteps = [
    { label: 'Kopplar upp', icon: Zap, color: 'hsl(85, 60%, 45%)' },
    { label: 'Laddar data', icon: Database, color: 'hsl(200, 60%, 45%)' },
    { label: 'Förbereder', icon: MapPin, color: 'hsl(45, 80%, 50%)' }
  ];

  // 🎯 30% SNABBARE: Reducerad duration från 2200ms till 1500ms
  useEffect(() => {
    const duration = 1500; // 30% snabbare!
    const startTime = Date.now();
    let animationFrame: number;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Snabbare easing
      const easedProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      const newCount = Math.floor(totalPreschools * easedProgress);
      setCount(newCount);
      
      // Sparkles tidigare för bättre feedback
      if (progress > 0.8 && !showSparkles) {
        setShowSparkles(true);
      }
      
      if (progress >= 1) {
        // Snabbare övergång
        setTimeout(onComplete, 150);
      } else {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const initialDelay = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 100); // Minimal initial delay

    return () => {
      clearTimeout(initialDelay);
      cancelAnimationFrame(animationFrame);
    };
  }, [totalPreschools, onComplete, showSparkles]);

  // 🚀 SNABBARE: Snabbare step-progression
  useEffect(() => {
    const stepDuration = 350; // Snabbare steps
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
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ 
          opacity: 0,
          scale: 0.98,
          filter: "blur(8px)"
        }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed inset-0 z-50 flex items-center justify-center will-change-transform"
        style={{
          background: `radial-gradient(ellipse at center, 
            hsl(0, 0%, 100%) 0%, 
            hsl(85, 20%, 98%) 30%,
            hsl(80, 15%, 96%) 60%, 
            hsl(75, 12%, 94%) 100%)`
        }}
      >
        {showSparkles && <OptimizedSparkles />}

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="text-center max-w-md mx-auto px-6 relative will-change-transform"
        >
          <OptimizedSwedenMap progress={progress} />

          {/* 🎯 COOLARE: Modern glassmorphic titel */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <motion.h1 
              className="text-3xl md:text-5xl font-bold mb-3 leading-tight tracking-tight"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(85, 80%, 30%) 0%, 
                  hsl(75, 70%, 25%) 50%,
                  hsl(65, 60%, 20%) 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
              }}
              animate={{ 
                backgroundPosition: showSparkles ? ['0% 50%', '100% 50%', '0% 50%'] : '0% 50%'
              }}
              transition={{ duration: 2, repeat: showSparkles ? Infinity : 0 }}
            >
              Förskolor i Sverige
            </motion.h1>
            
            <motion.p 
              className="text-sm text-gray-500 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Upptäck alla Sveriges förskolor
            </motion.p>
          </motion.div>

          {/* 🚀 SNABBARE: Kompakt progress steps */}
          <div className="flex justify-center gap-8 mb-8">
            {progressSteps.map((step, index) => (
              <FastProgressStep
                key={index}
                step={step}
                isActive={activeStep === index}
                isCompleted={activeStep > index}
              />
            ))}
          </div>

          {/* 🎯 COOLARE: Modern minimal progress bar */}
          <div className="mb-6">
            <div className="w-72 h-2 bg-gray-100 rounded-full mx-auto overflow-hidden relative">
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background: `linear-gradient(90deg, 
                    hsl(85, 70%, 50%) 0%, 
                    hsl(75, 65%, 45%) 50%,
                    hsl(45, 80%, 60%) 100%)`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
                  animate={{
                    x: progress > 5 ? [-50, 250] : -50
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{ width: '50px' }}
                />
              </motion.div>
            </div>
          </div>

          {/* 🚀 SNABBARE: Compact counter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-center"
          >
            <motion.div 
              className="text-4xl md:text-5xl font-bold mb-1 font-mono tracking-tight"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(85, 80%, 35%) 0%, 
                  hsl(75, 70%, 30%) 50%,
                  hsl(65, 60%, 25%) 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))'
              }}
              animate={{
                scale: count === totalPreschools ? [1, 1.03, 1] : 1
              }}
              transition={{ duration: 0.2 }}
            >
              {Math.floor(count).toLocaleString('sv-SE')}
            </motion.div>
            
            <motion.p 
              className="text-sm text-gray-500 font-medium"
              animate={{
                color: showSparkles ? 'hsl(85, 70%, 30%)' : 'hsl(0, 0%, 40%)'
              }}
            >
              förskolor
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};