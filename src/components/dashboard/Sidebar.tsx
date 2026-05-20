import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { 
  Users, 
  LayoutGrid, 
  Wallet, 
  Settings, 
  Home, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  UserCircle,
  Scan,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface SidebarProps {
  role: 'admin' | 'organizer';
  className?: string;
  hideBrand?: boolean;
  onItemClick?: () => void;
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function Sidebar({ role, className, hideBrand, onItemClick }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const adminSections: MenuSection[] = [
    {
      title: 'DASHBOARD',
      items: [
        { label: 'Overview', href: '/admin', icon: Home },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { label: 'Organizers', href: '/admin?tab=organizers', icon: Users },
        { label: 'All Events', href: '/admin?tab=events', icon: LayoutGrid },
        { label: 'Payouts', href: '/admin?tab=payouts', icon: Wallet },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Audit Trail', href: '/admin?tab=logs', icon: ShieldCheck },
        { label: 'Settings', href: '/admin?tab=settings', icon: Settings },
      ]
    }
  ];

  const organizerSections: MenuSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Overview', href: '/organizer', icon: Home },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { label: 'My Events', href: '/organizer/events', icon: LayoutGrid },
        { label: 'Entry Scanner', href: '/organizer/scanner', icon: Scan },
        { label: 'Withdrawals', href: '/organizer/withdrawals', icon: Wallet },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Settings', href: '/organizer/settings', icon: Settings },
      ]
    }
  ];

  const sections = role === 'admin' ? adminSections : organizerSections;

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const isActive = (href: string) => {
    if (href.includes('?tab=')) {
      const [path, tab] = href.split('?tab=');
      const params = new URLSearchParams(location.search);
      return location.pathname === path && params.get('tab') === tab;
    }
    return location.pathname === href && !location.search;
  };

  return (
    <aside className={cn("w-68 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-900 flex flex-col shrink-0 transition-all duration-300 shadow-md shadow-slate-100/10", className)}>
      {/* Brand */}
      {!hideBrand && (
        <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-100 dark:shadow-none">
              {role === 'admin' ? <ShieldCheck size={18} className="animate-pulse" /> : <Sparkles size={18} />}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-900 dark:text-white tracking-tight text-base">ASVote</span>
              <span className="text-[9px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-extrabold -mt-0.5">
                {role === 'admin' ? 'Admin panel' : 'Organizer portal'}
              </span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/40">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest">LIVE</span>
          </div>
        </div>
      )}

      {/* Profile Summary */}
      <div className="p-4 mx-4 mt-6 mb-2 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-100/85 dark:border-slate-900/60 relative overflow-hidden group hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-all duration-300">
        <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none opacity-50"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px] shadow-sm">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            </div>
            {/* Online Status Badge Dot */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-950"></span>
            </span>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tight leading-normal">
              {user?.displayName || 'Guest User'}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate leading-none">
              {user?.email}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            {/* Section Header */}
            <p className="text-[9px] font-black tracking-[0.15em] text-slate-400/80 dark:text-slate-600 px-3 uppercase">
              {section.title}
            </p>
            
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <NavLink
                    key={item.label}
                    to={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 relative group overflow-hidden",
                      active 
                        ? "bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-l-[3px] border-indigo-600 dark:border-indigo-500 pl-4.5" 
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-white hover:pl-4"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "transition-all duration-300 group-hover:scale-110",
                        active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                      )}>
                        <item.icon size={16} strokeWidth={2.2} />
                      </div>
                      <span className="tracking-tight">{item.label}</span>
                    </div>

                    {/* Arrow Accent or Badge */}
                    {active ? (
                      <ChevronRight size={12} className="text-indigo-500 dark:text-indigo-400 opacity-100" />
                    ) : (
                      <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Action */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-950">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 active:scale-95"
        >
          <LogOut size={16} strokeWidth={2.5} className="transition-transform group-hover:-translate-x-1" />
          Sign Out Portal
        </button>
      </div>
    </aside>
  );
}

