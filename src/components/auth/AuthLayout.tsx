import React from 'react';
import { motion } from 'motion/react';
import { Vote, ShieldCheck, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  type: 'login' | 'register';
}

export default function AuthLayout({ children, title, subtitle, type }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background selection:bg-indigo-100 selection:text-indigo-600 transition-colors duration-300">
      {/* Left Pane - Atmospheric & Branding */}
      <div className="hidden lg:flex flex-col lg:sticky lg:top-0 lg:h-screen relative overflow-hidden bg-slate-950 dark:bg-[#050505] border-r border-border">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]"></div>
          {/* Texture Overlay - Using a subtle gradient instead of an external PNG to avoid 404s */}
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 opacity-40"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-8 lg:p-12 justify-between">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* LOGO SECTION - Change the Vote icon or span text here */}
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center text-slate-900 shadow-xl shadow-white/10 transform -rotate-6 group-hover:rotate-0 transition-transform duration-300">
                <Vote size={24} />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase italic">ASVote</span>
            </Link>
          </motion.div>

          <div>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-4xl lg:text-6xl font-black text-white leading-[0.9] tracking-tighter mb-4">
                THE POWER <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">OF CHOICE.</span>
              </h2>
              <p className="text-slate-400 text-base lg:text-lg font-medium max-w-md leading-relaxed">
                Join a community of forward-thinking organizers leveraging data-driven decision making and secure voting.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-800/50"
            >
              <div>
                <div className="flex gap-1 mb-2 text-amber-400">
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                </div>
                <p className="text-white font-bold text-sm mb-1">10k+ Events</p>
                <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest leading-loose">Managed globally</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-black tracking-widest text-indigo-300">Enterprise Ready</span>
                </div>
                <p className="text-white font-bold text-sm mb-1">99.9% Uptime</p>
                <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest leading-loose">Secure & Reliable</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]"
          >
            <span>&copy; 2026 ASVOTE</span>
            <span>SECURE SOLUTIONS</span>
          </motion.div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="flex flex-col relative overflow-hidden bg-background">
        {/* Mobile Logo */}
        <div className="lg:hidden p-6 flex justify-center">
           {/* LOGO SECTION - Same as above for mobile */}
           <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground shadow-xl transform -rotate-6 group-hover:rotate-0 transition-transform duration-300">
                <Vote size={24} />
              </div>
              <span className="text-xl font-black tracking-tighter text-foreground uppercase italic">ASVote</span>
            </Link>
        </div>

        <div className="flex-grow flex items-center justify-center p-6 sm:p-8 lg:p-12 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-sm sm:max-w-md"
          >
            <div className={`${title || subtitle ? 'mb-8' : 'mb-0'}`}>
              {title && <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground mb-2">{title}</h1>}
              {subtitle && <p className="text-muted-foreground text-sm font-medium leading-relaxed">{subtitle}</p>}
            </div>

            {children}

            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between gap-4">
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {type === 'login' ? "NEW TO ASVOTE?" : "ALREADY HAVE AN ACCOUNT?"}
              </p>
              <Link 
                to={type === 'login' ? "/register" : "/login"} 
                className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-all px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-full"
              >
                {type === 'login' ? "CREATE ACCOUNT" : "SIGN IN"}
              </Link>
            </div>
            
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
              <Link to="/help-center" className="hover:text-indigo-600 transition-colors">Help</Link>
              <Link to="/legal-terms" className="hover:text-indigo-600 transition-colors">Terms</Link>
              <Link to="/privacy-hub" className="hover:text-indigo-600 transition-colors">Privacy</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
