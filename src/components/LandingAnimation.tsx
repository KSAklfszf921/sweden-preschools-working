import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Database, Download, Map, BarChart3, CheckCircle, X } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';

interface LandingAnimationProps {
  onComplete: () => void;
}

// Floating particles component
const FloatingParticles: React.FC = () => {
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: `linear-gradient(45deg, 
              hsl(${Math.random() * 60 + 200}, 70%, 60%), 
              hsl(${Math.random() * 60 + 280}, 70%, 70%))`
          }}
          animate={{
            y: [-20, -100],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Animated Sweden map SVG
const AnimatedSwedenMap: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -45 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 1, delay: 0.3 }}
      className="mb-6"
    >
      <svg viewBox="0 0 120 160" className="w-20 h-28 mx-auto">
        {/* Sweden outline */}
        <motion.path
          d="M60,15 L75,25 L85,40 L90,55 L95,75 L90,95 L85,110 L80,125 L70,140 L60,145 L50,140 L40,125 L35,110 L30,95 L25,75 L30,55 L35,40 L45,25 Z"
          fill="none"
          stroke="hsl(220, 70%, 50%)"
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
          animate={{ opacity: progress > 50 ? 0.3 : 0 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="swedenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(220, 80%, 60%)" />
            <stop offset="50%" stopColor="hsl(260, 70%, 65%)" />
            <stop offset="100%" stopColor="hsl(300, 60%, 70%)" />
          </linearGradient>
        </defs>
        
        {/* Pulsing dots for major cities */}
        {progress > 30 && (
          <>
            <motion.circle cx="60" cy="50" r="2" fill="hsl(45, 100%, 60%)" 
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }} />
            <motion.circle cx="45" cy="110" r="2" fill="hsl(45, 100%, 60%)"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
            <motion.circle cx="75" cy="90" r="2" fill="hsl(45, 100%, 60%)"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
          </>
        )}
      </svg>
    </motion.div>
  );
};

export const LandingAnimation: React.FC<LandingAnimationProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);
  const [count, setCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { preschools } = useMapStore();
  
  // Get actual preschool count or use default
  const totalPreschools = preschools.length || 8739;

  // Enhanced progress steps with better timing and colors
  const progressSteps = [
    { label: 'Ansluter till databas', icon: Database, duration: 1200, color: 'hsl(220, 80%, 60%)' },
    { label: 'Hämtar förskoledata', icon: Download, duration: 2000, color: 'hsl(240, 75%, 65%)' },
    { label: 'Verifierar koordinater', icon: MapPin, duration: 1500, color: 'hsl(260, 70%, 70%)' },
    { label: 'Laddar kartunderlag', icon: Map, duration: 1000, color: 'hsl(280, 65%, 75%)' },
    { label: 'Förbereder visualisering', icon: BarChart3, duration: 800, color: 'hsl(300, 60%, 80%)' },
    { label: 'Redo!', icon: CheckCircle, duration: 500, color: 'hsl(120, 70%, 60%)' }
  ];

  // Dynamic counter animation
  useEffect(() => {
    const currentStep = progressSteps[stage];
    if (!currentStep) return;

    const increment = totalPreschools / (currentStep.duration / 50);
    const targetCount = Math.floor((totalPreschools * (stage + 1)) / progressSteps.length);
    
    const timer = setInterval(() => {
      setCount(prev => {
        const next = prev + increment;
        return next >= targetCount ? targetCount : next;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [stage, totalPreschools]);

  // Stage progression with improved timing
  useEffect(() => {
    const currentStep = progressSteps[stage];
    if (!currentStep) return;

    const timer = setTimeout(() => {
      if (stage < progressSteps.length - 1) {
        setStage(stage + 1);
      } else {
        setIsComplete(true);
        setTimeout(() => {
          if (!isComplete) return; // Prevent double execution
          onComplete();
        }, 800);
      }
    }, currentStep.duration);

    return () => clearTimeout(timer);
  }, [stage, onComplete, isComplete]);

  const progress = ((stage + 1) / progressSteps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, 
            hsl(220, 60%, 12%) 0%, 
            hsl(240, 50%, 8%) 30%, 
            hsl(260, 40%, 6%) 60%, 
            hsl(280, 30%, 4%) 100%)`
        }}
      >
        {/* Floating particles background */}
        <FloatingParticles />
        
        {/* Skip button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.05, backgroundColor: "hsl(0, 50%, 50%)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onComplete}
          transition={{ delay: 1 }}
          className="absolute top-6 right-6 px-4 py-2 text-sm text-white/80 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 transition-all duration-300 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Hoppa över
        </motion.button>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center relative z-10"
        >
          {/* Animated Sweden map */}
          <AnimatedSwedenMap progress={progress} />

          {/* Title with enhanced gradient */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4" 
                style={{
                  background: `linear-gradient(135deg, 
                    hsl(200, 80%, 70%) 0%, 
                    hsl(240, 70%, 75%) 30%, 
                    hsl(280, 60%, 80%) 70%, 
                    hsl(320, 70%, 75%) 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}>
              Förskolor i Sverige
            </h1>
            <motion.p 
              className="text-lg"
              style={{ color: 'hsl(200, 30%, 80%)' }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Upptäck och jämför alla förskolor – i hela Sverige
            </motion.p>
          </motion.div>

          {/* Enhanced progress indicators */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            {progressSteps.slice(0, -1).map((step, index) => {
              const Icon = step.icon;
              const isActive = stage >= index;
              const isAnimating = stage === index;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0.3, scale: 0.9, y: 20 }}
                  animate={{
                    opacity: isActive ? 1 : 0.4,
                    scale: isActive ? 1 : 0.9,
                    y: 0
                  }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="text-center relative"
                >
                  <motion.div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 mx-auto relative overflow-hidden"
                    style={{
                      backgroundColor: isActive ? step.color : 'hsl(220, 20%, 20%)',
                      boxShadow: isActive ? `0 0 20px ${step.color}40` : 'none'
                    }}
                    animate={isAnimating ? {
                      scale: [1, 1.1, 1],
                      boxShadow: [`0 0 20px ${step.color}40`, `0 0 30px ${step.color}60`, `0 0 20px ${step.color}40`]
                    } : {}}
                    transition={{ duration: 1.5, repeat: isAnimating ? Infinity : 0 }}
                  >
                    {isAnimating && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: [-100, 100] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <Icon 
                      className="w-7 h-7 relative z-10" 
                      style={{ color: isActive ? 'white' : 'hsl(220, 20%, 60%)' }}
                    />
                  </motion.div>
                  <p 
                    className="text-sm font-medium"
                    style={{ color: isActive ? 'hsl(200, 30%, 85%)' : 'hsl(200, 20%, 60%)' }}
                  >
                    {step.label}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Enhanced loading bar */}
          <div className="w-80 h-3 bg-white/10 rounded-full mx-auto overflow-hidden mb-6 backdrop-blur-sm">
            <motion.div
              className="h-full rounded-full relative overflow-hidden"
              style={{
                background: `linear-gradient(90deg, 
                  hsl(200, 80%, 60%) 0%, 
                  hsl(240, 70%, 65%) 30%, 
                  hsl(280, 60%, 70%) 70%, 
                  hsl(320, 70%, 75%) 100%)`
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: [-100, 400] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>

          {/* Dynamic counter and statistics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="text-center">
              <motion.div 
                className="text-3xl md:text-4xl font-bold"
                style={{
                  background: `linear-gradient(135deg, 
                    hsl(200, 80%, 70%) 0%, 
                    hsl(280, 60%, 80%) 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
                key={Math.floor(count)} // Re-animate on count change
                animate={{ scale: [0.95, 1, 0.95] }}
                transition={{ duration: 0.5 }}
              >
                {Math.floor(count).toLocaleString('sv-SE')}
              </motion.div>
              <p style={{ color: 'hsl(200, 30%, 70%)' }} className="text-sm font-medium">
                förskolor laddade
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm max-w-xs mx-auto">
              <div className="text-center">
                <div 
                  className="text-xl font-bold"
                  style={{ color: 'hsl(260, 70%, 75%)' }}
                >
                  {Math.floor(count * 0.87).toLocaleString('sv-SE')}
                </div>
                <div style={{ color: 'hsl(200, 25%, 65%)' }}>Med koordinater</div>
              </div>
              <div className="text-center">
                <div 
                  className="text-xl font-bold"
                  style={{ color: 'hsl(300, 60%, 75%)' }}
                >
                  {Math.floor(count * 0.62).toLocaleString('sv-SE')}
                </div>
                <div style={{ color: 'hsl(200, 25%, 65%)' }}>Kommunala</div>
              </div>
            </div>
          </motion.div>

          {/* Completion call-to-action */}
          {isComplete && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                boxShadow: ['0 0 20px hsl(120, 70%, 60%)40', '0 0 40px hsl(120, 70%, 60%)60', '0 0 20px hsl(120, 70%, 60%)40']
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onComplete}
              transition={{ 
                duration: 0.8,
                boxShadow: { duration: 2, repeat: Infinity }
              }}
              className="mt-8 px-8 py-3 rounded-full font-semibold text-white relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(120, 70%, 50%) 0%, 
                  hsl(140, 60%, 55%) 100%)`
              }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: [-100, 200] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="relative z-10 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Utforska Sveriges förskolor
              </span>
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};