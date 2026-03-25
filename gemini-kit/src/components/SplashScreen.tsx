import React from 'react';
import { motion } from 'motion/react';
import { Button } from './UI';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-neutral-900 flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/10 blur-[120px] rounded-full" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center space-y-8"
      >
        <div className="relative">
          <motion.div 
            initial={{ rotate: -10, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="w-32 h-32 bg-gradient-to-br from-gold-light via-gold to-gold-dark rounded-3xl shadow-2xl shadow-gold/30 flex items-center justify-center"
          >
            <span className="text-6xl font-display font-bold text-white">A</span>
          </motion.div>
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -inset-4 border border-gold/30 rounded-[40px]"
          />
        </div>

        <div className="space-y-2">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-3xl font-display font-bold text-white tracking-tight"
          >
            Amit Excellence
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-neutral-400 text-sm max-w-[240px]"
          >
            Premium Property Management & Real Estate Solutions
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="w-full pt-8"
        >
          <Button 
            variant="gold" 
            className="w-full py-4 rounded-2xl text-lg"
            onClick={onComplete}
          >
            Get Started
          </Button>
          <p className="mt-6 text-xs text-neutral-500">
            By continuing, you agree to our <span className="text-gold">Terms of Service</span>
          </p>
        </motion.div>
      </motion.div>

      {/* Decorative Elements */}
      <motion.div 
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] left-[-10%] w-64 h-64 border border-white/5 rounded-full" 
      />
      <motion.div 
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-5%] right-[-5%] w-48 h-48 border border-white/5 rounded-full" 
      />
    </div>
  );
};
