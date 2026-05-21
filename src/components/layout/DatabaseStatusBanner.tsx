import React, { useState, useEffect } from 'react';
import { checkSupabaseConfigured } from '../../lib/supabase';
import { Database, Info, X, Sparkles, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DatabaseStatusBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only check on client-side mount
    const isConfigured = checkSupabaseConfigured();
    if (!isConfigured) {
      // Show if not configured
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 relative z-[999]"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500/20 p-1.5 rounded-lg flex-shrink-0 text-amber-600 dark:text-amber-400">
              <Database className="w-4 h-4" />
            </div>
            <div className="leading-tight font-medium">
              <span className="font-bold text-amber-800 dark:text-amber-200">Offline Development Mode Active: </span>
              No Supabase credentials detected. You can test all voting, ticketing, and checkouts seamlessly! Persistent client-side mock-data is saved in your browser storage.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 rounded-md text-[10px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              <KeyRound className="w-3 h-3" /> Connect Supabase in Secrets
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-amber-500/20 rounded-lg transition-colors flex-shrink-0 text-amber-600 dark:text-amber-400"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
