import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Building, Database, Star } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';

interface EnhancedSwedenAnimationProps {
  onComplete: () => void;
}

// 🇸🇪 RIKTIG SVERIGE SVG PATH (från SWE-Map_Rike.svg)
const SWEDEN_PATH = "m 145.3125,527.5 0.5,3.75 -0.5,2.75 -1.4375,-1.1875 -2.125,-0.4375 -1.625,2.4375 2.125,3.0625 1.8125,1.25 0.0625,2.25 -1.4375,0.875 -0.6875,1.8125 0.875,1.1875 1.625,-0.625 0,1.5 -0.875,0.8125 -2.25,0.25 2.25,2.6875 0.5625,1.6875 -0.8125,2.75 -0.9375,2.5 -1.75,0.0625 0.3125,2.5 -1.9375,1.5 0.4375,2.25 -0.875,1.8125 0.9375,3 2.125,1 -2.25,3.375 -0.875,2.5 0.125,2.0625 -0.5625,2.5 -0.75,4.1875 0.9375,-0.5625 0.6875,1.1875 -0.8125,0.9375 -1.0625,-0.9375 -1.0625,4.6875 -1.875,0.4375 -1.125,2.25 -0.3125,1.375 0.0625,2.1875 -0.9375,0.375 -0.625,2.125 -1.0625,1.125 -0.9375,3.125 -0.8125,3.6875 -1.0625,4.0625 -1.375,2.875 -1.125,0.75 -1.5625,3.4375 -1.6875,-1.5 -2,1.1875 -1.1875,-0.4375 1.625,-1.5625 0.4375,-1.375 -1.3125,-1.125 -2.5625,0.4375 -0.875,-0.625 -1.6875,0.625 -1,1 -1.1875,-1.3125 -0.625,1.1875 -1.8125,1 -0.5625,-2 -1.0625,0.375 -2.3125,0.375 -1.75,-0.0625 -0.9375,-1.125 -1,1.125 -1.8125,0.0625 -2.625,0.125 -1.9375,0.25";

// Animerad Sveriges-karta komponent
const AnimatedSweden: React.FC<{ 
  phase: 'hidden' | 'drawing' | 'filling' | 'markers' | 'complete';
  progress: number;
  markerCount: number;
}> = ({ phase, progress, markerCount }) => {
  
  // Generera förskole-markörer inom Sveriges gränser
  const [markers] = useState(() => {
    const markerList = [];
    for (let i = 0; i < 120; i++) {
      // Approximativa koordinater inom Sveriges form (baserat på 290x660 viewBox)
      const x = 50 + Math.random() * 190; // Bredden av Sverige
      const y = 50 + Math.random() * 500; // Höjden av Sverige
      
      // Justera för Sveriges form (smalare i norr, bredare i söder)
      let adjustedX = x;
      if (y < 200) adjustedX = 100 + Math.random() * 90; // Norr - smalare
      if (y > 400) adjustedX = 70 + Math.random() * 150; // Söder - bredare
      
      markerList.push({
        id: i,
        x: adjustedX,
        y: y,
        size: 1.2 + Math.random() * 0.8,
        delay: Math.random() * 0.8
      });
    }
    return markerList;
  });

  const markersToShow = Math.floor((progress / 100) * markers.length);

  return (
    <div className="relative w-32 h-72 mx-auto">
      <svg 
        viewBox="0 0 290 660" 
        className="w-full h-full drop-shadow-xl"
        style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.15))' }}
      >
        {/* Sveriges gräns - ritas upp progressivt */}
        <motion.path
          d={SWEDEN_PATH}
          fill="none"
          stroke="url(#swedenBorderGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2000"
          initial={{ strokeDashoffset: 2000 }}
          animate={{ 
            strokeDashoffset: phase === 'drawing' ? 2000 - (progress * 20) : 0
          }}
          transition={{ 
            duration: 0, // Ingen transition - kontrolleras av JS för 60fps
            ease: "linear"
          }}
          style={{ 
            willChange: 'stroke-dashoffset',
            transform: 'translateZ(0)' // GPU acceleration
          }}
          filter="url(#borderGlow)"
        />
        
        {/* Sveriges yta - fylls i när gränsen är klar */}
        <motion.path
          d={SWEDEN_PATH}
          fill="url(#swedenFillGradient)"
          stroke="none"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: phase === 'filling' || phase === 'markers' || phase === 'complete' ? 0.2 : 0,
            scale: phase === 'filling' || phase === 'markers' || phase === 'complete' ? 1 : 0.95
          }}
          transition={{ 
            duration: 0.6,
            ease: "easeOut"
          }}
          filter="url(#innerGlow)"
        />

        {/* Förskole-markörer - 60fps optimerade */}
        {phase === 'markers' && markers.slice(0, markersToShow).map((marker) => (
          <motion.g 
            key={marker.id}
            style={{ 
              willChange: 'transform, opacity',
              transform: 'translateZ(0)' // GPU acceleration
            }}
          >
            {/* Röd kartnål - optimerad för 60fps */}
            <motion.circle
              cx={marker.x}
              cy={marker.y}
              r={marker.size}
              fill="hsl(0, 80%, 60%)"
              initial={{ 
                scale: 0, 
                opacity: 0,
                y: marker.y + 8 
              }}
              animate={{ 
                scale: 1, 
                opacity: 0.9,
                y: marker.y
              }}
              transition={{
                delay: marker.delay * 0.02, // Snabbare för bättre flöde
                duration: 0.25, // Kortare för snappier känsla
                type: "spring",
                stiffness: 800,
                damping: 30
              }}
              style={{ 
                willChange: 'transform, opacity',
                transform: 'translateZ(0)'
              }}
              filter="url(#markerGlow)"
            />
            
            {/* Puls-effekt - optimerad */}
            <motion.circle
              cx={marker.x}
              cy={marker.y}
              r="0"
              fill="none"
              stroke="hsl(0, 75%, 65%)"
              strokeWidth="1"
              opacity="0.6"
              initial={{ r: 0, opacity: 0 }}
              animate={{ 
                r: [0, marker.size * 4, 0],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                delay: marker.delay * 0.02 + 0.15,
                duration: 1,
                ease: "easeOut"
              }}
              style={{ 
                willChange: 'transform, opacity',
                transform: 'translateZ(0)'
              }}
            />
          </motion.g>
        ))}

        {/* SVG Gradienter och Effekter */}
        <defs>
          {/* Blå gradient för Sveriges gräns */}
          <linearGradient id="swedenBorderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(210, 100%, 50%)" />
            <stop offset="50%" stopColor="hsl(220, 90%, 55%)" />
            <stop offset="100%" stopColor="hsl(230, 80%, 60%)" />
          </linearGradient>
          
          {/* Ljusblå fyllning */}
          <linearGradient id="swedenFillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(210, 50%, 75%)" />
            <stop offset="50%" stopColor="hsl(220, 40%, 80%)" />
            <stop offset="100%" stopColor="hsl(230, 30%, 85%)" />
          </linearGradient>

          {/* Glöd-effekt för gränsen */}
          <filter id="borderGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Glöd för markörer */}
          <filter id="markerGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Inner glöd för fyllning */}
          <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      {/* Live förskole-räknare */}
      {phase === 'markers' && (
        <motion.div
          className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-red-100"
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
        >
          <motion.span
            className="text-sm font-bold text-red-600"
            key={markerCount}
            initial={{ opacity: 0.8, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            {markerCount.toLocaleString('sv-SE')} förskolor
          </motion.span>
        </motion.div>
      )}
    </div>
  );
};

// Moderna progress-steg
const ProgressStep: React.FC<{
  step: { label: string; detail: string; icon: any; color: string };
  isActive: boolean;
  isCompleted: boolean;
  index: number;
}> = ({ step, isActive, isCompleted, index }) => {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.08,
        duration: 0.5,
        type: "spring",
        stiffness: 400
      }}
      className="text-center relative"
    >
      <motion.div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 mx-auto relative overflow-hidden"
        style={{
          backgroundColor: isCompleted 
            ? step.color 
            : isActive 
              ? `${step.color}15` 
              : 'hsl(0, 0%, 96%)',
          border: isActive ? `2px solid ${step.color}` : '2px solid transparent',
        }}
        animate={{
          boxShadow: isActive 
            ? [`0 4px 20px ${step.color}25`, `0 8px 30px ${step.color}35`, `0 4px 20px ${step.color}25`]
            : '0 2px 8px rgba(0,0,0,0.05)',
          scale: isActive ? [1, 1.05, 1] : 1
        }}
        transition={{ 
          boxShadow: { duration: 2, repeat: Infinity },
          scale: { duration: 0.6 }
        }}
      >
        <motion.div
          animate={{
            rotate: isActive ? [0, 5, -5, 0] : 0,
            scale: isCompleted ? 1.1 : 1
          }}
          transition={{ 
            rotate: { duration: 1, repeat: isActive ? Infinity : 0 },
            scale: { duration: 0.3 }
          }}
        >
          <Icon 
            className="w-5 h-5" 
            style={{ 
              color: isCompleted 
                ? 'white' 
                : isActive 
                  ? step.color 
                  : 'hsl(0, 0%, 60%)'
            }}
          />
        </motion.div>

        {/* Checkmark */}
        {isCompleted && !isActive && (
          <motion.div
            className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 600 }}
          >
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        )}
      </motion.div>

      <motion.p 
        className="text-xs font-medium mb-1"
        animate={{ 
          color: isCompleted || isActive ? 'hsl(0, 0%, 20%)' : 'hsl(0, 0%, 60%)'
        }}
      >
        {step.label}
      </motion.p>
      <motion.p 
        className="text-xs opacity-70"
        animate={{ 
          opacity: isActive ? 1 : 0.5
        }}
      >
        {step.detail}
      </motion.p>
    </motion.div>
  );
};

export const EnhancedSwedenAnimation: React.FC<EnhancedSwedenAnimationProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'hidden' | 'drawing' | 'filling' | 'markers' | 'complete'>('hidden');
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [markerCount, setMarkerCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0); // Huvudräknare som visas hela tiden
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const { preschools } = useMapStore();
  const totalPreschools = preschools.length > 0 ? preschools.length : 8739;
  
  // 🛡️ ERROR HANDLER: Om något går fel, visa huvudinnehållet direkt
  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('Animation error:', error);
      setHasError(true);
      setTimeout(onComplete, 100);
    };
    
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, [onComplete]);

  // 🛡️ FALLBACK: Säkerställ att animationen alltid avslutas
  useEffect(() => {
    const maxTimer = setTimeout(() => {
      console.warn('Animation taking too long, forcing completion');
      onComplete();
    }, 8000);

    return () => clearTimeout(maxTimer);
  }, [onComplete]);

  // 🎯 Progress-steg med exakt svenska texter
  const progressSteps = [
    { 
      label: 'Hämtar förskolor', 
      detail: `${totalPreschools.toLocaleString('sv-SE')} enheter`,
      icon: Building, 
      color: 'hsl(0, 80%, 60%)' 
    },
    { 
      label: 'Öppnar data', 
      detail: 'Betyg & information',
      icon: Database, 
      color: 'hsl(210, 90%, 55%)' 
    },
    { 
      label: 'Skapar karta', 
      detail: 'Interaktiv visning',
      icon: MapPin, 
      color: 'hsl(85, 60%, 50%)' 
    }
  ];

  // 🎯 PERFEKT 2.5 SEKUNDER TIMING MED 3 STEG
  useEffect(() => {
    try {
      console.log('🚀 Starting loading animation - background data fetching is now active');
      
      const timeline = [
        // Fade in (0.2s)
        { time: 0, action: () => setIsVisible(true) },
        
        // Steg 1: "Hämtar förskolor" - Rita Sverige (0.2s - 0.9s = 0.7s)
        { time: 200, action: () => { setPhase('drawing'); setActiveStep(0); }},
        
        // Steg 2: "Öppnar data" - Fyll Sverige (0.9s - 1.3s = 0.4s)
        { time: 900, action: () => { setPhase('filling'); setActiveStep(1); }},
        
        // Steg 3: "Skapar karta" - Visa markörer (1.3s - 2.1s = 0.8s)
        { time: 1300, action: () => { setPhase('markers'); setActiveStep(2); }},
        
        // Slutför (2.1s - 2.2s = 0.1s)
        { time: 2100, action: () => setPhase('complete') },
        
        // Fade out och complete (2.2s - 2.5s = 0.3s)
        { time: 2200, action: () => setIsVisible(false) },
        { time: 2500, action: () => {
          console.log('✅ Loading animation complete - map should display with preloaded data');
          onComplete();
        }}
      ];

      const timers = timeline.map(({ time, action }) => 
        setTimeout(() => {
          try {
            action();
          } catch (error) {
            console.error('Timeline action error:', error);
            setHasError(true);
            onComplete();
          }
        }, time)
      );

      return () => timers.forEach(clearTimeout);
    } catch (error) {
      console.error('Animation setup error:', error);
      setHasError(true);
      setTimeout(onComplete, 100);
    }
  }, [onComplete]);

  // 🎯 KONTINUERLIG EXPONENTIELL RÄKNARE (0 - 8739) genom hela animationen
  useEffect(() => {
    if (!isVisible) return;
    
    const startTime = Date.now();
    const duration = 2000; // 2 sekunder från start till slut
    let animationFrame: number;
    
    const animateCounter = () => {
      const elapsed = Date.now() - startTime;
      const overallProgress = Math.min(elapsed / duration, 1);
      
      // Exponentiell easing för smooth uppräkning
      let easedProgress;
      if (overallProgress < 0.8) {
        // Snabb exponentiell acceleration
        easedProgress = 1 - Math.pow(1 - overallProgress / 0.8, 2.5);
      } else {
        // Sakta ner mot slutet för precision
        const finalProgress = (overallProgress - 0.8) / 0.2;
        easedProgress = 0.95 + (finalProgress * 0.05);
      }
      
      const newTotalCount = Math.floor(totalPreschools * easedProgress);
      setTotalCount(newTotalCount);
      
      if (overallProgress < 1) {
        animationFrame = requestAnimationFrame(animateCounter);
      } else {
        // Säkerställ att vi når exakt slutnummer
        setTotalCount(totalPreschools);
      }
    };

    animationFrame = requestAnimationFrame(animateCounter);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, totalPreschools]);

  // Progress animation för varje fas
  useEffect(() => {
    let animationFrame: number;
    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      let newProgress = 0;
      let newMarkerCount = 0;

      switch (phase) {
        case 'drawing':
          newProgress = Math.min((elapsed / 700) * 100, 100); // 0.7s för rita Sverige
          break;
        case 'filling':
          newProgress = 100;
          break;
        case 'markers':
          const markerElapsed = elapsed - 0; // Börjar direkt
          const markerProgress = Math.min(markerElapsed / 800, 1); // 0.8s för markörer
          
          // 🎯 EXPONENTIELL UPPRÄKNING för smooth 60fps känsla
          let exponentialProgress;
          if (markerProgress < 0.7) {
            // Exponentiell acceleration för naturlig känsla
            exponentialProgress = 1 - Math.pow(1 - markerProgress / 0.7, 3);
          } else {
            // Slow-down på slutet för precision
            const slowProgress = (markerProgress - 0.7) / 0.3;
            exponentialProgress = 0.99 + (slowProgress * 0.01);
          }
          
          newProgress = exponentialProgress * 100;
          // Säkerställ smooth 60fps räknare
          newMarkerCount = Math.floor(totalPreschools * exponentialProgress);
          setMarkerCount(newMarkerCount);
          break;
        default:
          newProgress = 0;
      }
      
      setProgress(newProgress);
      
      if (phase === 'drawing' || phase === 'markers') {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    if (phase === 'drawing' || phase === 'markers') {
      startTime = Date.now();
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [phase, totalPreschools]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ 
            opacity: 0,
            scale: 0.95,
            filter: "blur(8px)"
          }}
          transition={{ 
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30"
          style={{
            willChange: 'transform, opacity',
            transform: 'translateZ(0)', // GPU acceleration för hela komponenten
            backfaceVisibility: 'hidden', // Prevent flickering
            perspective: '1000px' // 3D rendering context
          }}
        >
          <div className="text-center max-w-sm mx-auto px-6">
            {/* Sveriges karta */}
            <AnimatedSweden 
              phase={phase}
              progress={progress}
              markerCount={markerCount}
            />

            {/* Titel och Huvudräknare */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mb-6 mt-6 text-center"
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Sveriges Förskolor
              </h1>
              
              {/* 🎯 STOR EXPONENTIELL RÄKNARE */}
              <motion.div
                className="mb-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <motion.div 
                  className="text-4xl font-bold font-mono text-blue-700 mb-1"
                  key={totalCount} // Force re-render för smooth animation
                  initial={{ opacity: 0.9, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.1 }}
                  style={{ 
                    willChange: 'transform, opacity',
                    transform: 'translateZ(0)'
                  }}
                >
                  {totalCount.toLocaleString('sv-SE')}
                </motion.div>
                <p className="text-sm text-gray-600 font-medium">
                  förskolor laddade
                </p>
              </motion.div>
              
              <p className="text-xs text-gray-500">
                Interaktiv karta över hela Sverige
              </p>
            </motion.div>

            {/* Progress steps */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              {progressSteps.map((step, index) => (
                <ProgressStep
                  key={index}
                  step={step}
                  isActive={activeStep === index}
                  isCompleted={activeStep > index}
                  index={index}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-64 h-1.5 bg-gray-200 rounded-full mx-auto overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min((activeStep + 1) / progressSteps.length * 100, 100)}%`
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};