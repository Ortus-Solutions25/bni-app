import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'bni' | 'app' | 'complete'>('bni');
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    // Stage 1: Show BNI DEIRA for 3 seconds (or until user interaction)
    const timer1 = setTimeout(() => {
      if (!userInteracted) {
        setStage('app');
      }
    }, 3000);

    // Stage 2: Slide left BNI DEIRA, show app (4.5s total)
    const timer2 = setTimeout(() => {
      setStage('complete');
    }, 4500);

    // Stage 3: Complete animation (6s total)
    const timer3 = setTimeout(() => {
      onComplete();
    }, 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete, userInteracted]);

  // Handle user interaction (click, tap, or any key press)
  const handleInteraction = () => {
    if (stage === 'bni' && !userInteracted) {
      setUserInteracted(true);
      setStage('app');
    }
  };

  useEffect(() => {
    // Listen for any key press
    const handleKeyPress = () => handleInteraction();
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [stage, userInteracted]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        onClick={handleInteraction}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-bniRed-600 via-bniRed-500 to-bniGold-500 cursor-pointer"
      >
        <div className="relative w-full max-w-4xl px-8 flex items-center justify-center overflow-hidden">
          {/* BNI DEIRA Text */}
          {stage === 'bni' && (
            <div className="absolute text-center">
              <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
                BNI
                <span className="block text-bniGold-300 mt-2">DEIRA</span>
              </h1>
            </div>
          )}

          {/* BNI DEIRA Text - Sliding Out */}
          {stage === 'app' && (
            <motion.div
              initial={{ opacity: 1, x: 0 }}
              animate={{ opacity: 0, x: '-100%' }}
              transition={{
                duration: 0.5,
                ease: [0.43, 0.13, 0.23, 0.96],
              }}
              className="absolute text-center"
            >
              <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
                BNI
                <span className="block text-bniGold-300 mt-2">DEIRA</span>
              </h1>
            </motion.div>
          )}

          {/* App Name */}
          <AnimatePresence>
            {stage === 'app' && (
              <motion.div
                initial={{ opacity: 0, x: '50%' }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.43, 0.13, 0.23, 0.96],
                  delay: 0.2,
                }}
                className="flex flex-col items-center gap-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.4,
                    type: 'spring',
                    stiffness: 200,
                  }}
                >
                  <BarChart3 className="h-20 w-20 text-white" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-center"
                >
                  <h2 className="text-4xl md:text-5xl font-bold text-white">
                    PALMS Analysis
                  </h2>
                  <p className="text-xl text-white/90 mt-3">
                    Professional Business Analytics
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading indicator and hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-white rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
          {stage === 'bni' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-white/70 text-sm"
            >
              Click or press any key to continue
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
