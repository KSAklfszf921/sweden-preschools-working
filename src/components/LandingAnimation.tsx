import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { MapPin, Database, Download, Users, Star, Building } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';

interface LandingAnimationProps {
  onComplete: () => void;
}

// 🎯 FÖRBÄTTRING 1: Mer realistisk och detaljerad Sverige-karta med städer
const AnimatedSwedenMap: React.FC<{ progress: number }> = ({ progress }) => {
  const majorCities = [
    { name: 'Stockholm', x: 70, y: 60, delay: 0.5 },
    { name: 'Göteborg', x: 45, y: 80, delay: 0.7 },
    { name: 'Malmö', x: 50, y: 135, delay: 0.9 },
    { name: 'Uppsala', x: 68, y: 50, delay: 1.1 },
    { name: 'Linköping', x: 62, y: 85, delay: 1.3 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.8, ease: "easeOutCubic" }}
      className="mb-8 relative"
      style={{ perspective: '1000px' }}
    >
      <svg viewBox="0 0 120 160" className="w-20 h-28 mx-auto drop-shadow-lg">
        {/* 🎯 FÖRBÄTTRING 2: Mer realistisk Sverige-outline */}
        <motion.path
          d="M45,20 C50,15 55,12 60,15 L65,18 C75,22 82,35 85,45 C88,55 92,65 95,75 C97,85 94,95 90,105 C87,115 84,125 80,132 C75,138 70,142 60,145 C55,147 50,145 45,140 C40,135 35,125 32,115 C28,105 26,95 25,85 C24,75 26,65 30,55 C33,45 38,35 42,25 C43,22 44,21 45,20 Z"
          fill="none"
          stroke="url(#swedenStroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="400"
          initial={{ strokeDashoffset: 400 }}
          animate={{ strokeDashoffset: 400 - (progress * 4) }}
          transition={{ 
            duration: 0.1,
            ease: [0.0, 0.0, 0.2, 1]
          }}
          filter="url(#glow)"
        />
        
        {/* 🎯 FÖRBÄTTRING 3: Gradient med mer djup och liv */}
        <motion.path
          d="M45,20 C50,15 55,12 60,15 L65,18 C75,22 82,35 85,45 C88,55 92,65 95,75 C97,85 94,95 90,105 C87,115 84,125 80,132 C75,138 70,142 60,145 C55,147 50,145 45,140 C40,135 35,125 32,115 C28,105 26,95 25,85 C24,75 26,65 30,55 C33,45 38,35 42,25 C43,22 44,21 45,20 Z"
          fill="url(#swedenGradient)"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: progress > 30 ? 0.4 : 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          filter="url(#innerShadow)"
        />

        {/* 🎯 FÖRBÄTTRING 4: Animerade städer som prickar */}
        {majorCities.map((city, index) => (
          <motion.g key={city.name}>
            <motion.circle
              cx={city.x}
              cy={city.y}
              r="2.5"
              fill="hsl(45, 85%, 55%)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: progress > 50 ? 1 : 0, 
                opacity: progress > 50 ? 1 : 0 
              }}
              transition={{ 
                delay: city.delay,
                duration: 0.4,
                ease: "easeOutBack"
              }}
              filter="url(#cityGlow)"
            />
            {/* Pulserande effekt */}
            <motion.circle
              cx={city.x}
              cy={city.y}
              r="0"
              fill="none"
              stroke="hsl(45, 75%, 65%)"
              strokeWidth="1"
              initial={{ r: 0, opacity: 0 }}
              animate={{ 
                r: progress > 70 ? [0, 6, 0] : 0,
                opacity: progress > 70 ? [0, 0.6, 0] : 0
              }}
              transition={{
                delay: city.delay + 0.5,
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          </motion.g>
        ))}
        
        <defs>
          {/* 🎯 FÖRBÄTTRING 5: Mer sofistikerade gradienter och effekter */}
          <linearGradient id="swedenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(85, 60%, 62%)" />
            <stop offset="25%" stopColor="hsl(80, 55%, 58%)" />
            <stop offset="50%" stopColor="hsl(75, 50%, 54%)" />
            <stop offset="75%" stopColor="hsl(70, 45%, 50%)" />
            <stop offset="100%" stopColor="hsl(65, 40%, 46%)" />
          </linearGradient>
          
          <linearGradient id="swedenStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(85, 70%, 45%)" />
            <stop offset="50%" stopColor="hsl(75, 65%, 40%)" />
            <stop offset="100%" stopColor="hsl(65, 60%, 35%)" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="cityGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feOffset dx="1" dy="2"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite operator="over"/>
          </filter>
        </defs>
      </svg>
    </motion.div>
  );
};

// 🎯 FÖRBÄTTRING 6: Mer informativa progress-steg med detaljer
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
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isActive ? 1.05 : 1
      }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 300
      }}
      className="text-center relative"
    >
      {/* 🎯 FÖRBÄTTRING 7: Mer elegant ikon-design med estado */}
      <motion.div 
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 mx-auto relative overflow-hidden"
        style={{
          backgroundColor: isCompleted 
            ? step.color 
            : isActive 
              ? `${step.color}20` 
              : 'hsl(0, 0%, 94%)',
          border: isActive ? `2px solid ${step.color}` : '2px solid transparent',
          boxShadow: isActive 
            ? `0 8px 25px ${step.color}25, 0 4px 10px ${step.color}15` 
            : isCompleted
              ? `0 4px 15px ${step.color}20`
              : 'none'
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Bakgrunds-animation för aktiv state */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ backgroundColor: `${step.color}10` }}
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        
        <motion.div
          animate={{
            rotate: isActive ? 360 : 0,
            scale: isCompleted ? 1.1 : 1
          }}
          transition={{ 
            rotate: { duration: 0.8, ease: "easeInOut" },
            scale: { duration: 0.3 }
          }}
        >
          <Icon 
            className="w-7 h-7 relative z-10" 
            style={{ 
              color: isCompleted 
                ? 'white' 
                : isActive 
                  ? step.color 
                  : 'hsl(0, 0%, 60%)'
            }}
          />
        </motion.div>

        {/* Checkmark för completed */}
        {isCompleted && !isActive && (
          <motion.div
            className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        )}
      </motion.div>

      {/* 🎯 FÖRBÄTTRING 8: Bättre typografi och detaljer */}
      <motion.p 
        className="text-sm font-semibold mb-1"
        style={{ color: isCompleted || isActive ? 'hsl(85, 50%, 30%)' : 'hsl(0, 0%, 50%)' }}
        animate={{ opacity: isCompleted || isActive ? 1 : 0.7 }}
      >
        {step.label}
      </motion.p>
      <motion.p 
        className="text-xs text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0.6 }}
        transition={{ delay: 0.2 }}
      >
        {step.detail}
      </motion.p>
    </motion.div>
  );
};

export const LandingAnimation: React.FC<LandingAnimationProps> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [showSparkles, setShowSparkles] = useState(false);
  const { preschools } = useMapStore();
  
  const totalPreschools = preschools.length > 0 ? preschools.length : 8739;

  // 🎯 FÖRBÄTTRING 9: Mer informativa och engagerande steg
  const progressSteps = [
    { 
      label: 'Ansluter', 
      detail: 'Kopplar upp till databas',
      icon: Database, 
      color: 'hsl(85, 55%, 45%)' 
    },
    { 
      label: 'Laddar förskolor', 
      detail: `${totalPreschools.toLocaleString('sv-SE')} enheter`,
      icon: Building, 
      color: 'hsl(75, 50%, 40%)' 
    },
    { 
      label: 'Förbereder karta', 
      detail: 'Mapbox 3D-rendering',
      icon: MapPin, 
      color: 'hsl(200, 55%, 45%)' 
    },
    { 
      label: 'Hämtar betyg', 
      detail: 'Google Places data',
      icon: Star, 
      color: 'hsl(45, 75%, 50%)' 
    }
  ];

  // 🎯 FÖRBÄTTRING 10: Mer naturlig och engagerande räknare-animation
  useEffect(() => {
    const duration = 2200; // Lite längre för mer dramatisk effekt
    const startTime = Date.now();
    let animationFrame: number;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 🎯 Förbättrad easing med bounce-effekt
      let easedProgress;
      if (progress < 0.7) {
        // Exponentiell acceleration
        easedProgress = 1 - Math.pow(2, -10 * (progress / 0.7));
      } else {
        // Bounce-effekt på slutet
        const bounceProgress = (progress - 0.7) / 0.3;
        easedProgress = 1 + (Math.sin(bounceProgress * Math.PI * 4) * (1 - bounceProgress) * 0.1);
      }
      
      const newCount = Math.floor(totalPreschools * Math.min(easedProgress, 1));
      setCount(newCount);
      
      // Sparkles vid 90%
      if (progress > 0.9 && !showSparkles) {
        setShowSparkles(true);
      }
      
      if (progress >= 1) {
        setTimeout(onComplete, 300);
      } else {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [totalPreschools, onComplete, showSparkles]);

  // 🎯 FÖRBÄTTRING 11: Mer sofistikerad step-progression
  useEffect(() => {
    const stepDuration = 550;
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

  // 🎯 FÖRBÄTTRING 12: Sparkle-partiklar för extra visuell feedback
  const Sparkles: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          initial={{ scale: 0, rotate: 0 }}
          animate={{
            scale: [0, 1, 0],
            rotate: [0, 180, 360],
            y: [0, -20, -40],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.1,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ 
          opacity: 0,
          scale: 0.95,
          filter: "blur(10px)"
        }}
        transition={{ 
          exit: { duration: 0.8, ease: "easeInOut" }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, 
            hsl(0, 0%, 100%) 0%, 
            hsl(85, 25%, 97%) 20%,
            hsl(80, 20%, 95%) 40%, 
            hsl(75, 15%, 93%) 60%,
            hsl(70, 12%, 91%) 80%,
            hsl(65, 10%, 89%) 100%)`
        }}
      >
        {showSparkles && <Sparkles />}

        {/* 🎯 FÖRBÄTTRING 13: Förbättrad layout och spacing */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 1,
            ease: [0.19, 1.0, 0.22, 1.0], // Custom cubic-bezier
            staggerChildren: 0.1
          }}
          className="text-center max-w-lg mx-auto px-6 relative"
        >
          <AnimatedSwedenMap progress={progress} />

          {/* 🎯 FÖRBÄTTRING 14: Mer expressiv och dynamisk titel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-12"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(85, 70%, 35%) 0%, 
                  hsl(75, 65%, 30%) 30%,
                  hsl(65, 60%, 25%) 60%,
                  hsl(55, 55%, 20%) 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
              animate={{ 
                backgroundPosition: showSparkles ? ['0% 50%', '100% 50%'] : '0% 50%'
              }}
              transition={{ 
                duration: 2, 
                repeat: showSparkles ? Infinity : 0,
                repeatType: "reverse" 
              }}
            >
              Förskolor i Sverige
            </motion.h1>
            
            <motion.p 
              className="text-lg text-gray-600 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Upptäck och jämför alla förskolor med 3D-karta
            </motion.p>
          </motion.div>

          {/* Progress steps med förbättrad layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
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

          {/* 🎯 FÖRBÄTTRING 15: Mer avancerad och visuell progress bar */}
          <div className="mb-8">
            <div className="w-80 h-3 bg-gray-200 rounded-full mx-auto overflow-hidden relative shadow-inner">
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background: `linear-gradient(90deg, 
                    hsl(85, 60%, 50%) 0%, 
                    hsl(75, 55%, 45%) 25%,
                    hsl(65, 50%, 40%) 50%,
                    hsl(55, 45%, 35%) 75%,
                    hsl(45, 75%, 55%) 100%)`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              >
                {/* Glowing effect */}
                <motion.div
                  className="absolute inset-0 bg-white opacity-30"
                  animate={{
                    x: progress > 10 ? [-100, 400] : -100
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                    width: '100px'
                  }}
                />
              </motion.div>
              
              {/* Progress percentage */}
              <motion.div
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs font-semibold text-gray-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: progress > 20 ? 1 : 0 }}
              >
                {Math.round(progress)}%
              </motion.div>
            </div>
          </div>

          {/* Counter med förbättrad styling */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center"
          >
            <motion.div 
              className="text-5xl md:text-6xl font-bold mb-2 font-mono tracking-tight"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(85, 70%, 40%) 0%, 
                  hsl(75, 65%, 35%) 50%,
                  hsl(65, 60%, 30%) 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
              animate={{
                scale: count === totalPreschools ? [1, 1.05, 1] : 1
              }}
              transition={{ duration: 0.3 }}
            >
              {Math.floor(count).toLocaleString('sv-SE')}
            </motion.div>
            
            <motion.p 
              className="text-base text-gray-600 font-medium"
              animate={{
                color: showSparkles ? 'hsl(85, 60%, 35%)' : 'hsl(0, 0%, 40%)'
              }}
            >
              registrerade förskolor
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
