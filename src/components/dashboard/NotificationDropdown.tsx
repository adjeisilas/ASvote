import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Info, CheckCircle2, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { Notification } from '../../types';
import { toast } from 'sonner';

function PortalWrapper({ children, active }: { children: React.ReactNode; active: boolean }) {
  if (active) {
    return createPortal(children, document.body);
  }
  return <>{children}</>;
}

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = notificationService.subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isMobile) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  const markAllAsRead = async () => {
    if (!user) return;
    const hasUnread = notifications.some(n => !n.read);
    if (!hasUnread) {
      toast.info("All notifications are already read");
      return;
    }
    
    try {
      await notificationService.markAllAsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const markAsRead = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.read) return;

    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      // Quiet fail
    }
  };

  const removeNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeAgo = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.abs(Math.round((Date.now() - date.getTime()) / 60000));
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'warning': return <AlertCircle className="text-amber-500" size={16} />;
      case 'error': return <X size={16} className="text-red-500" />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-10 w-10 md:h-11 md:w-11 flex items-center justify-center rounded-xl md:rounded-2xl transition-all relative group",
          isOpen ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none" : "bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
        )}
      >
        <Bell size={isOpen ? 22 : 20} className={cn("transition-all", isOpen && "rotate-[15deg]")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-[9px] font-black text-white items-center justify-center border-2 border-white dark:border-slate-950">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <PortalWrapper active={isMobile}>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[90] md:hidden"
            />
            
            <motion.div
              initial={isMobile ? { opacity: 0, x: '100%' } : { opacity: 0, y: 10 }}
              animate={isMobile ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 }}
              exit={isMobile ? { opacity: 0, x: '100%' } : { opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "bg-white dark:bg-slate-900 z-[100] overflow-hidden flex flex-col shadow-2xl border-l border-slate-100 dark:border-slate-800",
                "fixed inset-y-0 right-0 w-full max-w-[min(400px,calc(100vw-40px))] md:absolute md:inset-auto md:right-0 md:top-full md:mt-3 md:w-[400px] md:h-auto md:max-h-[600px] md:rounded-2xl md:border"
              )}
            >
              {/* Header */}
              <div className="p-6 md:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg md:text-sm tracking-tight flex items-center gap-2">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full ring-4 ring-indigo-50 dark:ring-indigo-950/50">
                        {unreadCount}
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Activity & Updates</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              {notifications.length > 0 && (
                <div className="px-6 py-3 md:px-4 md:py-2 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {notifications.length} Total
                  </span>
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1"
                  >
                    <CheckCircle2 size={12} /> Mark all read
                  </button>
                </div>
              )}

              {/* List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/20 dark:bg-slate-900/10">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={cn(
                          "p-6 md:p-4 flex gap-4 transition-all cursor-pointer group relative",
                          !notification.read 
                            ? "bg-white dark:bg-slate-950 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800/80 my-1 first:mt-0 last:mb-0" 
                            : "opacity-70 grayscale-[0.3] dark:grayscale-[0.5] hover:opacity-100 hover:grayscale-0 hover:bg-white hover:dark:bg-slate-950/50"
                        )}
                      >
                        {!notification.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-lg"></div>
                        )}
                        <div className={cn(
                          "w-12 h-12 md:w-10 md:h-10 rounded-2xl md:rounded-xl flex items-center justify-center shrink-0 border-2 transition-all shadow-sm",
                          !notification.read 
                            ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 font-bold group-hover:scale-105" 
                            : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400"
                        )}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <h4 className={cn(
                              "text-sm md:text-xs leading-tight tracking-tight transition-colors break-words",
                              !notification.read ? "font-black text-slate-900 dark:text-slate-100" : "font-bold text-slate-600 dark:text-slate-400"
                            )}>
                              {notification.title}
                            </h4>
                            <span className={cn(
                              "text-[9px] font-black whitespace-nowrap px-1.5 rounded-full py-0.5",
                              !notification.read ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            )}>
                              {getTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          <p className={cn(
                            "text-sm md:text-[11px] leading-relaxed transition-colors break-words",
                            !notification.read ? "text-slate-700 dark:text-slate-300 font-bold" : "text-slate-500 dark:text-slate-400 font-medium"
                          )}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-4 md:mt-2">
                            <div className="flex items-center gap-1.5 text-[11px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500">
                              <Clock size={14} className="md:w-2.5 md:h-2.5" /> 
                              {formatTimestamp(notification.createdAt)}
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="flex items-center gap-2 text-[12px] md:text-[10px] font-black text-red-500 hover:text-white hover:bg-red-500 px-4 py-2 md:py-1 rounded-2xl md:rounded-lg uppercase tracking-widest ml-auto md:opacity-0 md:group-hover:opacity-100 transition-all border-2 border-red-100 dark:border-red-950 hover:border-red-500 bg-red-50/50 dark:bg-red-950/20"
                            >
                              <Trash2 size={16} className="md:w-3 md:h-3" /> <span className="inline">Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 text-slate-200 dark:text-slate-700 animate-pulse">
                      <Bell size={48} />
                    </div>
                    <h4 className="font-black text-slate-900 dark:text-slate-100 text-xl tracking-tight">All Caught Up!</h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-[260px] font-medium leading-relaxed">
                      Your notification history is empty. We'll alert you as soon as something happens.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-4 md:p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 text-center">
                  <Button variant="ghost" size="sm" className="w-full h-10 md:h-8 text-[11px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
                    View Notification History
                  </Button>
                </div>
              )}
            </motion.div>
          </PortalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}
