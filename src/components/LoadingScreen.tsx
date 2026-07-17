import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Wallet, Landmark, Cpu } from 'lucide-react';

const LOADING_PHRASES = [
  'Establishing secure encryption key...',
  'Hydrating offline sandbox environment...',
  'Synchronizing ledger ledger caches...',
  'Compiling balance sheets...',
  'Securing cryptographic session...',
  'Readying DevFint workspace...'
];

export default function LoadingScreen() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Cycle through loading phrases
    const phraseInterval = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 1200);

    // Increment progress bar naturally with variance
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 98; // hold near end until actual load completes
        const increment = Math.floor(Math.random() * 15) + 5;
        return Math.min(prev + increment, 98);
      });
    }, 400);

    return () => {
      clearInterval(phraseInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden theme-transition">
      {/* Decorative background grid and ambient lighting */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a10_1px,transparent_1px),linear-gradient(to_bottom,#0f172a10_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Dynamic ambient gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      <div className="relative flex flex-col items-center max-w-sm px-6 w-full text-center">
        {/* Animated Brand Mark */}
        <div className="relative mb-8">
          {/* Rotating outer rings */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 blur-md opacity-30 animate-pulse" />
          
          <div className="relative w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 shadow-2xl flex items-center justify-center overflow-hidden">
            {/* Spinning/pulsing abstract nodes */}
            <div className="absolute inset-1 rounded-2xl bg-gradient-to-br from-blue-500/5 to-indigo-500/10 dark:from-blue-500/10 dark:to-indigo-500/20" />
            
            {/* Custom geometric premium vector overlay */}
            <svg className="absolute w-full h-full text-blue-600/10 dark:text-blue-400/10 animate-[spin_20s_linear_infinite]" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" fill="none" />
              <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" strokeDasharray="10 5" fill="none" />
            </svg>

            {/* Central glowing brand emblem */}
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center">
              <Wallet className="w-5.5 h-5.5 text-white" />
            </div>
          </div>
        </div>

        {/* Brand Name Typography */}
        <div className="mb-8 select-none">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-1">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Dev</span>
            <span className="text-slate-800 dark:text-slate-100">Fint</span>
          </h1>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1.5 font-mono">
            Next-Gen Personal Capital
          </p>
        </div>

        {/* Loading Progress Bar Container */}
        <div className="w-full bg-slate-200/80 dark:bg-slate-800/60 h-1.5 rounded-full overflow-hidden mb-4 p-[1px] border border-slate-300/20 dark:border-slate-700/10">
          <div 
            className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 h-full rounded-full transition-all duration-300 ease-out shadow-inner" 
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Cycling Text Description Block */}
        <div className="h-5 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={phraseIdx}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono tracking-wide"
            >
              {LOADING_PHRASES[phraseIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Trust and security footer indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 tracking-widest uppercase">
        <Shield className="w-3.5 h-3.5 text-emerald-500" />
        <span>End-to-End Cryptographic Ledger</span>
      </div>
    </div>
  );
}
