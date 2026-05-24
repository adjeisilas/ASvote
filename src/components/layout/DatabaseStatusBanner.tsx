import React, { useState, useEffect } from 'react';
import { checkSupabaseConfigured } from '../../lib/supabase';
import { Database, Info, X, Sparkles, KeyRound, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function DatabaseStatusBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSandbox, setIsSandbox] = useState(false);

  useEffect(() => {
    // Check key status on mount
    const isConfigured = checkSupabaseConfigured();
    const sandboxActive = localStorage.getItem('asvote_sandbox_mode') === 'true';
    setIsSandbox(sandboxActive);
    
    if (!isConfigured || sandboxActive) {
      setIsVisible(true);
    }
  }, []);

  const handleExitSandbox = () => {
    localStorage.removeItem('asvote_sandbox_mode');
    toast.success('Exited Google login sandbox mode. Live database is now active!');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

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
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="bg-amber-500/20 p-1.5 rounded-lg flex-shrink-0 text-amber-600 dark:text-amber-400 mt-1 sm:mt-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="leading-tight font-medium">
              {isSandbox ? (
                <>
                  <span className="font-bold text-amber-800 dark:text-amber-200">Google Sandbox Integration Active: </span>
                  Google login redirect was bypassed for standard design testing in the sandbox iframe.
                </>
              ) : (
                <>
                  <span className="font-bold text-amber-800 dark:text-amber-200">Offline Development Mode Active: </span>
                  No Supabase credentials detected. You can test all voting, ticketing, and checkouts seamlessly! Persistent client-side mock-data is saved in your browser storage.
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            {isSandbox ? (
              <button
                onClick={handleExitSandbox}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-600 text-white rounded-lg text-xs font-black shadow-md shadow-amber-600/10 hover:bg-amber-500 transition-colors cursor-pointer border-none uppercase"
              >
                Switch to Live <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 rounded-md text-[10px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                <KeyRound className="w-3 h-3" /> Connect Supabase in Secrets
              </div>
            )}
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
