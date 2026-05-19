import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, Mail, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function VerificationBanner() {
  const { supabaseUser } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  // If no user, or email is confirmed, or user dismissed it
  if (!supabaseUser || supabaseUser.email_confirmed_at || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 bg-indigo-600 text-white z-[9999] shadow-2xl border-b border-indigo-400/30"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2 rounded-xl flex-shrink-0 animate-pulse hidden sm:flex">
              <Mail className="w-6 h-6" />
            </div>
            <div className="text-xs sm:text-sm font-black tracking-tight leading-normal">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="bg-amber-400 text-indigo-950 px-2 py-0.5 rounded text-[9px] uppercase font-black">Verify Email</span>
                <span className="font-bold text-indigo-100">{supabaseUser.email}</span>
              </div>
              <span className="block opacity-90 text-[10px] sm:text-[11px] uppercase tracking-wider font-bold">
                Check <span className="underline">Inbox</span> & <span className="underline text-white">Spam / Junk</span> folder now!
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hidden md:block"
            >
              Refresh Status
            </button>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
