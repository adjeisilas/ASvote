import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Vote, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { ThemeToggle } from './ThemeToggle';

import NotificationDropdown from '../dashboard/NotificationDropdown';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      "bg-background/95 backdrop-blur-lg border-b border-border shadow-sm h-16"
    )}>
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-6 transition-transform shadow-lg shadow-indigo-200">
            <Vote className="w-6 h-6 text-white" />
          </div>
          <span className={cn(
            "text-2xl font-black tracking-tighter transition-colors text-foreground"
          )}>
            AS<span className="text-indigo-600">Vote</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10">
          <Link to="/" className={cn(
            "text-sm font-bold uppercase tracking-widest transition-colors text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
          )}>Home</Link>
          <Link to="/events" className={cn(
            "text-sm font-bold uppercase tracking-widest transition-colors text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
          )}>Event</Link>
          <Link to="/about" className={cn(
            "text-sm font-bold uppercase tracking-widest transition-colors text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
          )}>About</Link>
          <Link to="/contact" className={cn(
            "text-sm font-bold uppercase tracking-widest transition-colors text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
          )}>Contact</Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user && (
            <div className="hidden sm:block">
              <NotificationDropdown />
            </div>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <Link to={user?.role === 'admin' ? '/admin' : '/organizer'}>
                <Button variant="ghost" className={cn(
                  "hidden sm:flex items-center gap-2 font-bold rounded-xl text-muted-foreground hover:bg-accent"
                )}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className={cn(
                  "hidden sm:flex items-center gap-2 font-bold rounded-xl border-none text-red-500 hover:bg-red-50"
                )}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className={cn(
                  "font-bold rounded-xl px-6 text-muted-foreground hover:bg-accent"
                )}>Login</Button>
              </Link>
              <Link to="/register">
                <Button className={cn(
                  "font-bold rounded-xl px-8 shadow-xl transition-all hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                )}>
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden rounded-xl bg-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-background border-b border-border p-6 space-y-6 shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-4">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-foreground">Home</Link>
            <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-foreground">Event</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-foreground">About</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-foreground">Contact</Link>
          </div>
          <div className="pt-6 border-t border-border flex flex-col gap-3">
            <div className="flex items-center justify-between bg-accent p-4 rounded-xl mb-2">
              <span className="text-sm font-bold text-muted-foreground">Appearance</span>
              <ThemeToggle />
            </div>
            {user && (
              <div className="flex items-center justify-between bg-accent p-4 rounded-xl mb-2">
                <span className="text-sm font-bold text-muted-foreground">Notifications</span>
                <NotificationDropdown />
              </div>
            )}
            {user ? (
              <>
                <Link to={user?.role === 'admin' ? '/admin' : '/organizer'} onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-indigo-600 font-bold rounded-xl h-12">Dashboard</Button>
                </Link>
                <Button variant="outline" onClick={handleLogout} className="w-full font-bold rounded-xl h-12 text-red-500">Logout</Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full font-bold rounded-xl h-12 border-slate-200">Login</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-slate-900 font-bold rounded-xl h-12">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
