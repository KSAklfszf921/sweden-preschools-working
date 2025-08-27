import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { MapPin, Database, Download, Users, Star, Building } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';

interface LandingAnimationProps {
  onComplete: () => void;
}

// 🎯 NYTT: Animerad Sverige-karta med progressiv gräns-ritning och förskole-markörer
const AnimatedSwedenMap: React.FC<{ progress: number; loadingPhase: 'border' | 'markers' | 'complete' }> = ({ progress, loadingPhase }) => {
  
  // Mer realistisk Sverige-kontur med fler detaljer
  const swedenPath = "M60,8 C65,6 70,8 75,12 L82,18 C88,25 92,35 95,45 C98,55 102,65 105,75 C108,85 106,95 102,105 C98,115 94,125 88,135 C82,142 75,148 65,152 C58,155 52,154 45,150 C38,145 32,137 28,125 C24,115 22,105 21,95 C20,85 22,75 26,65 C30,55 36,45 42,35 C48,25 55,15 60,8 Z";
  
  // Generera slumpmässiga förskole-positioner över Sverige
  const generatePreschoolMarkers = (count: number) => {
    const markers = [];
    for (let i = 0; i < count; i++) {
      // Generera positioner inom Sveriges gränser (approximation)
      const x = 25 + Math.random() * 80; // Bredd på Sverige i SVG
      const y = 8 + Math.random() * 144; // Höjd på Sverige i SVG
      
      // Justera för att hålla markers inom landsgränserna
      let adjustedX = x;
      let adjustedY = y;
      
      // Enkel logik för att hålla markers inom ungefärliga Sveriges gränser
      if (y < 40) adjustedX = 50 + Math.random() * 30; // Norr - smalare
      if (y > 120) adjustedX = 35 + Math.random() * 40; // Söder - bredare
      
      markers.push({
        id: i,
        x: adjustedX,
        y: adjustedY,
        delay: Math.random() * 2, // Slumpmässig delay
        size: 1.5 + Math.random() * 1 // Varierande storlek
      });
    }
    return markers;
  };

  const [preschoolMarkers] = useState(() => generatePreschoolMarkers(150)); // 150 visuella markörer
  
  // Beräkna hur många markörer som ska visas baserat på progress
  const markersToShow = Math.floor((progress / 100) * preschoolMarkers.length);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOutCubic" }}
      className="mb-8 relative"
    >
      <svg viewBox="0 0 130 160" className="w-24 h-32 mx-auto drop-shadow-lg">
        {/* STEG 1: Animerad gräns-ritning */}
        <motion.path
          d={swedenPath}
          fill="none"
          stroke="url(#swedenBorderStroke)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="500"
          initial={{ strokeDashoffset: 500 }}
          animate={{ 
            strokeDashoffset: loadingPhase === 'border' ? 500 - (progress * 5) : 0
          }}
          transition={{ 
            duration: 0.05,
            ease: "linear"
          }}
          filter="url(#borderGlow)"
        />
        
        {/* STEG 2: Fyll Sverige med subtil bakgrund när gränsen är klar */}
        <motion.path
          d={swedenPath}
          fill="url(#swedenFillGradient)"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: loadingPhase !== 'border' ? 0.15 : 0
          }}
          transition={{ duration: 0.8, delay: 0.2 }}
          filter="url(#innerGlow)"
        />

        {/* STEG 3: Förskole-markörer som "ploppar" upp */}
        {loadingPhase === 'markers' && preschoolMarkers.slice(0, markersToShow).map((marker, index) => (
          <motion.g key={marker.id}>
            {/* Huvudmarkör (röd kartnål) */}
            <motion.circle
              cx={marker.x}
              cy={marker.y}
              r={marker.size}
              fill="hsl(0, 75%, 55%)"
              initial={{ 
                scale: 0, 
                opacity: 0,
                y: marker.y + 10 
              }}
              animate={{ 
                scale: 1, 
                opacity: 0.8,
                y: marker.y
              }}
              transition={{ 
                delay: marker.delay * 0.05,
                duration: 0.3,
                ease: "easeOutBack",
                type: "spring",
                stiffness: 400
              }}
              filter="url(#markerGlow)"
            />
            
            {/* Liten "bounce" ring-effekt när marker visas */}
            <motion.circle
              cx={marker.x}
              cy={marker.y}
              r="0"
              fill="none"
              stroke="hsl(0, 70%, 50%)"
              strokeWidth="0.5"
              initial={{ r: 0, opacity: 0 }}
              animate={{ 
                r: [0, marker.size * 3, 0],
                opacity: [0, 0.6, 0]
              }}
              transition={{
                delay: marker.delay * 0.05 + 0.1,
                duration: 0.8,
                ease: "easeOut"
              }}
            />
          </motion.g>
        ))}

        {/* SVG Filters och Gradienter */}
        <defs>
          {/* Gräns-stroke gradient */}
          <linearGradient id="swedenBorderStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(200, 70%, 45%)" />
            <stop offset="50%" stopColor="hsl(220, 75%, 50%)" />
            <stop offset="100%" stopColor="hsl(240, 80%, 55%)" />
          </linearGradient>
          
          {/* Fyll-gradient för Sverige */}
          <linearGradient id="swedenFillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(200, 40%, 70%)" />
            <stop offset="50%" stopColor="hsl(220, 35%, 75%)" />
            <stop offset="100%" stopColor="hsl(240, 30%, 80%)" />
          </linearGradient>

          {/* Glow-effekt för gränsen */}
          <filter id="borderGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Glow för markörer */}
          <filter id="markerGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Inner glow för fyllning */}
          <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      {/* Visuell räknare för markörer med förbättrade animationer */}
      {loadingPhase === 'markers' && (
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
        >
          <motion.div 
            className="text-xs font-semibold text-red-600 bg-white/90 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm border border-red-100"
            animate={{ 
              boxShadow: markersToShow > 75 ? ["0 4px 15px rgba(220,38,38,0.2)", "0 6px 20px rgba(220,38,38,0.3)", "0 4px 15px rgba(220,38,38,0.2)"] : "0 4px 15px rgba(220,38,38,0.2)"
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <motion.span
              key={markersToShow} // Force re-render när count ändras för smooth counter animation
              initial={{ opacity: 0.7, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {Math.floor((markersToShow / 150) * 8739).toLocaleString('sv-SE')} förskolor
            </motion.span>
          </motion.div>
        </motion.div>
      )}
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
  const [loadingPhase, setLoadingPhase] = useState<'border' | 'markers' | 'complete'>('border');
  const [borderProgress, setBorderProgress] = useState(0);
  const [markerProgress, setMarkerProgress] = useState(0);
  const { preschools } = useMapStore();
  
  const totalPreschools = preschools.length > 0 ? preschools.length : 8739;

  // 🎯 UPPDATERAT: Progresssteg för den nya animationen
  const progressSteps = [
    { 
      label: 'Ritar Sverige', 
      detail: 'Animerar landsgränser',
      icon: MapPin, 
      color: 'hsl(200, 70%, 45%)' 
    },
    { 
      label: 'Hämtar förskolor', 
      detail: `${totalPreschools.toLocaleString('sv-SE')} enheter`,
      icon: Building, 
      color: 'hsl(0, 70%, 55%)' 
    },
    { 
      label: 'Förbereder karta', 
      detail: 'Mapbox 3D-rendering',
      icon: Database, 
      color: 'hsl(85, 55%, 45%)' 
    },
    { 
      label: 'Slutför', 
      detail: 'Redo att använda',
      icon: Star, 
      color: 'hsl(45, 75%, 50%)' 
    }
  ];

  // 🎯 NYTT: Tvåfas-animation - först gränser, sedan markörer
  useEffect(() => {
    const borderDuration = 1500; // 1.5s för att rita gränser
    const markerDuration = 2000; // 2s för marker-animation
    const startTime = Date.now();
    let animationFrame: number;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < borderDuration) {
        // FAS 1: Rita gränser
        const progress = Math.min(elapsed / borderDuration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
        setBorderProgress(easedProgress * 100);
        
        if (progress >= 1) {
          setLoadingPhase('markers');
          setActiveStep(1); // Gå till nästa steg
        }
      } else {
        // FAS 2: Visa markörer och räkna upp förskolor
        const markerElapsed = elapsed - borderDuration;
        const markerProgressRatio = Math.min(markerElapsed / markerDuration, 1);
        
        // Exponentiell easing för marker-uppräkning
        let easedMarkerProgress;
        if (markerProgressRatio < 0.8) {
          easedMarkerProgress = 1 - Math.pow(2, -10 * (markerProgressRatio / 0.8));
        } else {
          // Bounce-effekt på slutet
          const bounceProgress = (markerProgressRatio - 0.8) / 0.2;
          easedMarkerProgress = 1 + (Math.sin(bounceProgress * Math.PI * 4) * (1 - bounceProgress) * 0.05);
        }
        
        setMarkerProgress(easedMarkerProgress * 100);
        const newCount = Math.floor(totalPreschools * Math.min(easedMarkerProgress, 1));
        setCount(newCount);
        
        // Sparkles vid 90%
        if (markerProgressRatio > 0.9 && !showSparkles) {
          setShowSparkles(true);
        }
        
        if (markerProgressRatio >= 1) {
          setLoadingPhase('complete');
          setTimeout(onComplete, 500);
        }
      }
      
      if (elapsed < borderDuration + markerDuration) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [totalPreschools, onComplete, showSparkles]);

  // 🎯 UPPDATERAT: Step-progression baserat på laddningsfaser
  useEffect(() => {
    const stepTimers: NodeJS.Timeout[] = [];
    
    // Steg 0: Ritar Sverige (startar direkt)
    // Steg 1: Hämtar förskolor (efter 1.5s när border är klar)
    stepTimers.push(setTimeout(() => setActiveStep(1), 1500));
    
    // Steg 2: Förbereder karta (när markörer är halvvägs)
    stepTimers.push(setTimeout(() => setActiveStep(2), 2500));
    
    // Steg 3: Slutför (nära slutet)
    stepTimers.push(setTimeout(() => setActiveStep(3), 3200));

    return () => stepTimers.forEach(timer => clearTimeout(timer));
  }, []);

  // Beräkna övergripande progress för progress bar
  const overallProgress = loadingPhase === 'border' 
    ? borderProgress * 0.3 // Border-fasen = 30% av total progress
    : 30 + (markerProgress * 0.7); // Marker-fasen = 70% av total progress

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
          <AnimatedSwedenMap 
            progress={loadingPhase === 'border' ? borderProgress : markerProgress} 
            loadingPhase={loadingPhase} 
          />

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
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              >
                {/* Glowing effect */}
                <motion.div
                  className="absolute inset-0 bg-white opacity-30"
                  animate={{
                    x: overallProgress > 10 ? [-100, 400] : -100
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
                animate={{ opacity: overallProgress > 20 ? 1 : 0 }}
              >
                {Math.round(overallProgress)}%
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
              className="text-base font-medium"
              animate={{
                color: loadingPhase === 'markers' ? 'hsl(0, 70%, 55%)' : 'hsl(0, 0%, 40%)'
              }}
              transition={{ duration: 0.8 }}
            >
              {loadingPhase === 'markers' ? 'förskolor hämtas' : 'registrerade förskolor'}
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
