import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, List, BarChart3 } from 'lucide-react';

interface LandingAnimationProps {
  onComplete: () => void;
}

export const LandingAnimation: React.FC<LandingAnimationProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);
  const [preschoolCount, setPreschoolCount] = useState(0);
  const totalPreschools = 8739;

  // Stage progression effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stage < 4) {
        setStage(stage + 1);
      } else {
        // Ensure final count is shown for at least 1 second before completing
        setTimeout(onComplete, preschoolCount === totalPreschools ? 1000 : 300);
      }
    }, stage === 0 ? 600 : 500);

    return () => clearTimeout(timer);
  }, [stage, onComplete, preschoolCount, totalPreschools]);

  // Counting animation effect - starts exactly at stage 2 (when loading preschools)
  useEffect(() => {
    if (stage === 2 && preschoolCount === 0) {
      const duration = 2000; // 2 seconds to count up (matches progress bar timing)
      const startTime = Date.now();

      const countTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function: slow start, fast end (cubic ease-in)
        const easedProgress = progress * progress * progress;
        
        const newCount = Math.floor(easedProgress * totalPreschools);
        setPreschoolCount(newCount);
        
        if (progress >= 1) {
          clearInterval(countTimer);
          setPreschoolCount(totalPreschools);
        }
      }, 16); // ~60fps for smooth animation

      return () => clearInterval(countTimer);
    }
  }, [stage, preschoolCount, totalPreschools]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="fixed inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 z-50 flex items-center justify-center backdrop-blur-sm"
      >
        {/* Welcome message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              Sveriges Förskolor
            </h1>
            <p className="text-lg text-muted-foreground">
              Upptäck och jämför alla förskolor i Sverige
            </p>
          </motion.div>

          {/* Progress indicators */}
          <div className="flex items-center justify-center gap-8 mb-8">
            {[
              { icon: MapPin, label: 'Laddar karta', delay: 0 },
              { icon: Search, label: 'Förbereder sökfilter', delay: 0.8 },
              { icon: List, label: 'Hämtar förskolor', delay: 1.6 },
              { icon: BarChart3, label: 'Beräknar statistik', delay: 2.4 }
            ].map(({ icon: Icon, label, delay }, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0.3, scale: 0.9 }}
                animate={{
                  opacity: stage >= index ? 1 : 0.3,
                  scale: stage >= index ? 1 : 0.9
                }}
                transition={{ delay, duration: 0.3 }}
                className="text-center"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 mx-auto ${
                  stage >= index ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Loading bar */}
          <div className="w-64 h-2 bg-muted rounded-full mx-auto overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${(stage / 4) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 2 ? 1 : 0 }}
            transition={{ delay: stage >= 2 ? 0.2 : 3 }}
            className="text-sm text-muted-foreground mt-4"
          >
            {preschoolCount.toLocaleString('sv-SE')} förskolor laddade
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};