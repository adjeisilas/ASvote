import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, UserCircle, ShieldCheck, Home as HomeIcon, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import { ThemeToggle } from '../layout/ThemeToggle';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'organizer';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, supabaseUser } = useAuth();
  const avatarUrl = supabaseUser?.user_metadata?.avatar_url || 
                    supabaseUser?.user_metadata?.picture || 
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.displayName || 'User')}&backgroundColor=4f46e5&color=fff&bold=true`;

  return (
    <div className="flex min-h-screen bg-background font-sans transition-colors duration-300">
      {/* Desktop Sidebar */}
      <Sidebar role={role} className="hidden md:flex h-screen sticky top-0" />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Content */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-72 bg-card z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full text-card-foreground">
          <div className="p-5 flex items-center justify-between border-b border-border">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
                {role === 'admin' ? <ShieldCheck size={16} /> : <UserCircle size={16} />}
              </div>
              <span className="font-black text-foreground text-base md:text-lg tracking-tight">ASVote</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors">
              <X size={18} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto pt-4">
            <div className="px-6 mb-4">
              <div className="bg-indigo-500/10 rounded-2xl p-4 border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <NotificationDropdown />
                  <div>
                    <p className="text-xs font-black text-foreground leading-none">Notifications</p>
                    <p className="text-[10px] font-bold text-indigo-500 mt-1 uppercase tracking-wider">Tap the bell to view</p>
                  </div>
                </div>
              </div>
            </div>
            <Sidebar 
              role={role} 
              className="w-full border-r-0 h-auto relative" 
              hideBrand={true} 
              onItemClick={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 md:h-20 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-30 px-3 md:px-10 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-2 md:gap-6">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-9 w-9 rounded-xl bg-accent hover:bg-accent/80" 
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={18} />
            </Button>
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-accent rounded-xl border border-border group transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/30">
              <Search size={18} className="text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search everything..." 
                className="bg-transparent border-none outline-none text-sm font-medium text-foreground w-48 xl:w-64"
              />
            </div>
            <div className="h-8 w-px bg-border hidden lg:block"></div>
            <h2 className="text-[9px] md:text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] hidden xs:block bg-indigo-500/10 px-3 py-1 rounded-full whitespace-nowrap">
              {role === 'admin' ? 'Administration' : 'Organizer Workspace'}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-8">
            <nav className="hidden xl:flex items-center gap-6 mr-4">
              <Link to="/" className="text-xs font-bold text-muted-foreground hover:text-indigo-500 transition-colors flex items-center gap-2 uppercase tracking-widest">
                <HomeIcon size={14} /> Public Site
              </Link>
            </nav>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <NotificationDropdown />
              <div className="h-8 w-px bg-border hidden xs:block"></div>
              <div className="flex items-center gap-2 sm:gap-3 pl-0 sm:pl-2">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-black text-foreground tracking-tight">{user?.displayName}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{user?.role}</span>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-indigo-600 overflow-hidden flex items-center justify-center text-white font-black text-xs md:text-sm shadow-lg shadow-indigo-500/20 transform transition-transform hover:rotate-6">
                  <img 
                    src={avatarUrl} 
                    referrerPolicy="no-referrer"
                    alt={user?.displayName || 'User'} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden pt-6 px-4 md:px-10 pb-20">
          {children}
        </main>
      </div>
    </div>
  );
}
