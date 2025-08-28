import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, School, Search, BarChart3, Sparkles, Heart } from 'lucide-react';
import preschoolIcon from '@/assets/preschool-icon.jpg';

interface MagicalPageLoaderProps {
  onComplete: () => void;
  isVisible: boolean;
}

export const MagicalPageLoader: React.FC<MagicalPageLoaderProps> = ({ onComplete, isVisible }) => {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showSparkles, setShowSparkles] = useState(false);

  // Steg i byggnadssekvensen
  const stages = [
    { title: "Startar Sverige Kartmotor...", icon: MapPin, duration: 800 },
    { title: "Laddar 8,739 Förskolor...", icon: School, duration: 600 },
    { title: "Aktiverar Smart Sökning...", icon: Search, duration: 500 },
    { title: "Konfigurerar Statistik...", icon: BarChart3, duration: 400 },
    { title: "Slutför Magisk Upplevelse...", icon: Sparkles, duration: 300 }
  ];

  useEffect(() => {
    if (!isVisible) return;

    let progressInterval: NodeJS.Timeout;
    let stageTimeout: NodeJS.Timeout;

    const startStage = (stageIndex: number) => {
      if (stageIndex >= stages.length) {
        setShowSparkles(true);
        setTimeout(() => {
          onComplete();
        }, 800);
        return;
      }

      setStage(stageIndex);
      const currentStage = stages[stageIndex];
      let currentProgress = 0;
      
      progressInterval = setInterval(() => {
        currentProgress += 2;
        const stageProgress = (stageIndex / stages.length) * 100;
        const withinStageProgress = (currentProgress / 100) * (100 / stages.length);
        setProgress(Math.min(100, stageProgress + withinStageProgress));
        
        if (currentProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => startStage(stageIndex + 1), 200);
        }
      }, currentStage.duration / 50);
    };

    startStage(0);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stageTimeout);
    };
  }, [isVisible, onComplete]);

  // Sparkle positions för magisk effekt
  const sparklePositions = [
    { top: '20%', left: '15%', delay: 0 },
    { top: '70%', left: '85%', delay: 0.2 },
    { top: '45%', left: '10%', delay: 0.4 },
    { top: '25%', left: '75%', delay: 0.6 },
    { top: '80%', left: '30%', delay: 0.8 },
    { top: '35%', left: '60%', delay: 1.0 },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-50 overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at center, 
              hsl(var(--primary)) 0%, 
              hsl(var(--primary) / 0.9) 30%,
              hsl(var(--primary) / 0.7) 60%, 
              hsl(var(--background)) 100%)`
          }}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full"
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: Math.random() * window.innerHeight,
                  opacity: 0 
                }}
                animate={{ 
                  y: [null, -100],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "linear"
                }}
              />
            ))}
          </div>

          {/* Main loader content */}
          <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center relative">
            
            {/* Logo med cool entrée */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 1, 
                ease: "easeOut",
                type: "spring",
                stiffness: 200 
              }}
              className="mb-8"
            >
              <div className="relative">
                <img 
                  src={preschoolIcon} 
                  alt="Sveriges Förskolor" 
                  className="w-24 h-24 rounded-3xl shadow-2xl mx-auto"
                />
                {/* Glowing ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-white/20 rounded-3xl"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-4px] border-2 border-white/10 rounded-3xl"
                />
              </div>
            </motion.div>

            {/* Main title */}
            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight"
            >
              Sveriges Förskolor
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-xl md:text-2xl text-white/90 mb-12 font-light"
            >
              Hitta och jämför förskolor – i hela landet
            </motion.p>

            {/* Stage indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                {stages[stage] && (
                  <>
                    <motion.div
                      key={stage}
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="p-3 bg-white/20 rounded-full backdrop-blur-sm"
                    >
                      {React.createElement(stages[stage].icon, { 
                        className: "w-6 h-6 text-white" 
                      })}
                    </motion.div>
                    <motion.p
                      key={`text-${stage}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="text-lg font-medium text-white/95"
                    >
                      {stages[stage].title}
                    </motion.p>
                  </>
                )}
              </div>
            </motion.div>

            {/* Elegant progress bar */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "300px" }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="relative mb-6"
            >
              {/* Background track */}
              <div className="h-2 bg-white/20 rounded-full backdrop-blur-sm overflow-hidden">
                {/* Progress fill */}
                <motion.div
                  className="h-full bg-gradient-to-r from-white to-white/80 rounded-full relative"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    animate={{ x: [-50, 300] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />
                </motion.div>
              </div>
              
              {/* Progress percentage */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-center mt-2"
              >
                <span className="text-white/90 font-mono text-sm">
                  {Math.round(progress)}%
                </span>
              </motion.div>
            </motion.div>

            {/* Loading dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="flex space-x-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-white/60 rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>

            {/* Sparkles för final effect */}
            <AnimatePresence>
              {showSparkles && sparklePositions.map((pos, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 180, 360]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 1.2,
                    delay: pos.delay,
                    ease: "easeOut"
                  }}
                  className="absolute text-white/80"
                  style={{ top: pos.top, left: pos.left }}
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
              ))}
            </AnimatePresence>

          </div>

          {/* Subtle gradient overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};