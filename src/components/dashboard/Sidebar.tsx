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
  Scan
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
}

export default function Sidebar({ role, className, hideBrand, onItemClick }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const adminMenu: MenuItem[] = [
    { label: 'Overview', href: '/admin', icon: Home },
    { label: 'Organizers', href: '/admin?tab=organizers', icon: Users },
    { label: 'All Events', href: '/admin?tab=events', icon: LayoutGrid },
    { label: 'Payouts', href: '/admin?tab=payouts', icon: Wallet },
    { label: 'Audit Trail', href: '/admin?tab=logs', icon: ShieldCheck },
    { label: 'Settings', href: '/admin?tab=settings', icon: Settings },
  ];

  const organizerMenu: MenuItem[] = [
    { label: 'Overview', href: '/organizer', icon: Home },
    { label: 'My Events', href: '/organizer/events', icon: LayoutGrid },
    { label: 'Entry Scanner', href: '/organizer/scanner', icon: Scan },
    { label: 'Withdrawals', href: '/organizer/withdrawals', icon: Wallet },
    { label: 'Settings', href: '/organizer/settings', icon: Settings },
  ];

  const menuItems = role === 'admin' ? adminMenu : organizerMenu;

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
    <aside className={cn("w-64 bg-card border-r border-border flex flex-col shrink-0 transition-colors duration-300", className)}>
      {/* Brand */}
      {!hideBrand && (
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            {role === 'admin' ? <ShieldCheck size={20} /> : <UserCircle size={20} />}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-none">ASVote</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">
              {role === 'admin' ? 'Admin Panel' : 'Organizer Portal'}
            </span>
          </div>
        </div>
      )}

      {/* Profile Summary */}
      <div className="p-4 mx-4 mt-6 mb-2 bg-accent rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold uppercase">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground truncate">{user?.displayName}</span>
            <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <NavLink
              key={item.label}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center justify-between px-3 py-2 md:py-2.5 rounded-lg text-[13px] md:text-sm font-medium transition-all group",
                active 
                  ? "bg-indigo-500/10 text-indigo-500 shadow-sm shadow-indigo-500/5 transition-all" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
              )}
            >
              <div className="flex items-center gap-2.5 md:gap-3">
                <item.icon size={16} className={cn(active ? "text-indigo-500" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </div>
              {active && <ChevronRight size={12} className="text-indigo-400" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Action */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
