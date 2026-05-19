import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { databaseService } from '../services/database';
import { Event, Withdrawal } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Plus, LayoutGrid, Calendar, Wallet, Settings, Activity, AlertCircle, Loader2, Mail, RefreshCw, CheckCircle2, Clock, XCircle, Rocket, Target, Users, Share2, ArrowRight } from 'lucide-react';
import OrganizerEvents from '../components/dashboard/OrganizerEvents';
import CreateEvent from '../components/dashboard/CreateEvent';
import OrganizerWithdrawals from '../components/dashboard/OrganizerWithdrawals';
import ManageNominees from '../components/dashboard/ManageNominees';
import EventAnalytics from '../components/dashboard/EventAnalytics';
import UserSettings from '../components/dashboard/UserSettings';
import TicketManagement from '../components/dashboard/TicketManagement';
import ManagePromoCodes from '../components/dashboard/ManagePromoCodes';
import GlobalTicketScanner from '../components/dashboard/GlobalTicketScanner';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import VotingTrendChart from '../components/dashboard/VotingTrendChart';

export default function OrganizerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({ 
    totalEvents: 0, 
    grossEarnings: 0,
    totalEarnings: 0, 
    totalCommissions: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    totalCategories: 0,
    totalNominees: 0
  });
  const [eventStats, setEventStats] = useState([
    { name: 'Approved', value: 0, color: '#10b981' },
    { name: 'Pending', value: 0, color: '#f59e0b' },
    { name: 'Rejected', value: 0, color: '#ef4444' }
  ]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const dashboardStats = await databaseService.getOrganizerStats(user.uid);
      setStats({
        totalEvents: dashboardStats.totalEvents,
        grossEarnings: dashboardStats.grossEarnings,
        totalEarnings: dashboardStats.totalEarnings,
        totalCommissions: dashboardStats.totalCommissions,
        pendingPayouts: dashboardStats.pendingPayouts,
        completedPayouts: dashboardStats.completedPayouts,
        totalCategories: dashboardStats.totalCategories || 0,
        totalNominees: dashboardStats.totalNominees || 0
      });
      setEventStats([
        { name: 'Approved', value: dashboardStats.approvedCount, color: '#10b981' },
        { name: 'Pending', value: dashboardStats.pendingCount, color: '#f59e0b' },
        { name: 'Rejected', value: dashboardStats.rejectedCount, color: '#ef4444' }
      ]);

      const withdrawalsData = await databaseService.getWithdrawals(user.uid);
      setWithdrawals(withdrawalsData || []);

      const trendDataResult = await databaseService.getVotingTrends(user.uid);
      setTrendData(trendDataResult || []);

    } catch (error) {
      console.error("Error fetching organizer data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!user) return;

    // Real-time listener for events, transactions, and withdrawals
    const eventsSub = supabase.channel(`events-org-${user.uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `organizer_id=eq.${user.uid}` }, () => fetchData())
      .subscribe();

    const transSub = supabase.channel(`trans-org-${user.uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `organizer_id=eq.${user.uid}` }, () => fetchData())
      .subscribe();

    const withdrawalsSub = supabase.channel(`withdrawals-org-${user.uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals', filter: `organizer_id=eq.${user.uid}` }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(eventsSub);
      supabase.removeChannel(transSub);
      supabase.removeChannel(withdrawalsSub);
    };
  }, [user]);

  const handleResendLink = async () => {
    if (!user || resendCooldown > 0) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      if (error) throw error;
      toast.success("Verification link sent! Please check your inbox and spam folder.");
      setResendCooldown(60); 
    } catch (error: any) {
      toast.error(error.message || "Failed to resend link");
    } finally {
      setResending(false);
    }
  };

  const handleReloadStatus = async () => {
    setResending(true);
    try {
      // Refresh session to get latest confirmation status
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (data.user?.email_confirmed_at) {
        toast.success("Email verified successfully!");
      } else {
        toast.info("Email not verified yet. Please check your inbox.");
      }
    } catch (error: any) {
      toast.error("Failed to reload status");
    } finally {
      setResending(false);
    }
  };

  if (authLoading || loading) {
    return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  }

  // Get original user from supabase directly for confirmed_at check
  const isVerified = user?.emailVerified; // This comes from our transformed User object in Context
  const isPending = user?.status === 'pending';
  const isRejected = user?.status === 'rejected';

  const isOverview = location.pathname === '/organizer' || location.pathname === '/organizer/';

  const availableBalance = Math.max(0, stats.totalEarnings - stats.pendingPayouts - stats.completedPayouts);

  return (
    <DashboardLayout role="organizer">
      <div className="container mx-auto px-4 md:px-8 py-4">
        {/* Alerts Section */}
        <div className="space-y-4 md:space-y-6 mb-8 md:mb-10">
          {eventStats.find(s => s.name === 'Pending' && s.value > 0) && (
            <Card className="border-indigo-500/20 bg-indigo-500/5 shadow-none overflow-hidden">
              <CardContent className="p-4 md:p-6 flex gap-3 md:gap-4 items-start">
                <div className="bg-indigo-500/10 p-2 md:p-3 rounded-xl text-indigo-500 shrink-0">
                  <Clock className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h3 className="text-sm md:text-lg font-bold text-indigo-900 dark:text-indigo-100">Events Awaiting Approval</h3>
                  <p className="text-indigo-800/80 dark:text-indigo-200/60 text-[10px] md:text-sm leading-relaxed max-w-xl">
                    You have {eventStats.find(s => s.name === 'Pending')?.value} event(s) currently under review.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
  
          {isPending && (
            <Card className="border-amber-500/20 bg-amber-500/5 shadow-none overflow-hidden">
              <CardContent className="p-4 md:p-6 flex gap-3 md:gap-4 items-start">
                <div className="bg-amber-500/10 p-2 md:p-3 rounded-xl text-amber-500 shrink-0">
                  <AlertCircle className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h3 className="text-sm md:text-lg font-bold text-amber-900 dark:text-amber-100">Admin Review Pending</h3>
                  <p className="text-amber-800/80 dark:text-amber-200/60 text-[10px] md:text-sm leading-relaxed max-w-xl">
                    Our administrators are reviewing your application. This usually takes 24-48 hours.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
  
          {isRejected && (
            <Card className="border-red-500/20 bg-red-500/5 shadow-none overflow-hidden">
              <CardContent className="p-4 md:p-6 flex gap-3 md:gap-4 items-start text-red-900 dark:text-red-100">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                <div>
                  <h3 className="text-base md:text-lg font-bold">Application Rejected</h3>
                  <p className="text-xs md:text-sm text-red-800/80 dark:text-red-200/60">Contact support for further assistance regarding your application status.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {isOverview ? (
          <div className="space-y-8 md:space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h1 className="text-xl md:text-3xl font-extrabold text-foreground tracking-tight">Organizer Dashboard</h1>
                  <p className="text-[10px] md:text-sm text-muted-foreground mt-1">Quick summary of your platform performance.</p>
                </div>
                {!isPending && !isRejected && (
                  <Link to="/organizer/new-event" className="w-full md:w-auto">
                    <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 h-10 md:h-11 px-6 gap-2 shadow-lg shadow-indigo-500/20 font-bold transition-all hover:scale-105 active:scale-95">
                      <Plus size={18} /> Create New Event
                    </Button>
                  </Link>
                )}
              </div>
  
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {[
                  { label: "Gross Sales", value: `${(stats.grossEarnings || 0).toLocaleString()} GHS`, icon: <Wallet className="text-blue-500" />, desc: "Total transaction value" },
                  { label: "Commission Fee", value: `${(stats.totalCommissions || 0).toLocaleString()} GHS`, icon: <Activity className="text-rose-500" />, desc: "Platform processing fees" },
                  { label: "Available Balance", value: `${availableBalance.toLocaleString()} GHS`, icon: <Wallet className="text-indigo-500" />, desc: "Ready for withdrawal", highlight: true },
                  { label: "Total Net Earnings", value: `${stats.totalEarnings.toLocaleString()} GHS`, icon: <CheckCircle2 className="text-green-500" />, desc: "Balance + History" }
                ].map((stat, i) => (
                  <Card key={i} className={cn("border-none shadow-sm hover:shadow-md transition-all duration-300 group", stat.highlight && "ring-2 ring-indigo-500/20")}>
                    <CardContent className="p-3 xs:p-4 md:p-6 flex flex-col gap-2 md:gap-4">
                      <div className="flex justify-between items-center">
                        <div className={cn("w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 bg-accent", stat.highlight && "bg-indigo-500/10")}>
                          {stat.icon && (stat.icon as any).type ? React.cloneElement(stat.icon as any, { size: 16, className: cn((stat.icon as any).props.className, "md:w-5 md:h-5") }) : stat.icon}
                        </div>
                        <Badge variant="outline" className={cn("text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-border", stat.highlight && "text-indigo-500 border-indigo-500/30")}>
                          {stat.highlight ? "Primary" : "Stats"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[10px] md:text-sm font-bold text-muted-foreground mb-0.5 truncate">{stat.label}</p>
                        <p className={cn("text-lg xs:text-xl md:text-3xl font-black text-foreground truncate", stat.highlight && "text-indigo-500")}>{stat.value}</p>
                        <p className="text-[8px] md:text-[10px] text-muted-foreground/60 mt-1 truncate">{stat.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
  
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Voting Velocity Chart */}
                <div className="lg:col-span-2 overflow-hidden min-h-[300px]">
                  <VotingTrendChart transactions={trendData} days={7} />
                </div>
  
                {/* Status Distribution */}
                <Card className="lg:col-span-1 border-none shadow-sm overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2">
                      <Activity size={18} className="text-indigo-500" />
                      Status Distribution
                    </CardTitle>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Overview of event statuses</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-64 w-full flex items-center justify-center">
                      {stats.totalEvents > 0 ? (
                        <ResponsiveContainer width="99%" height={240}>
                          {/* ... PieChart ... */}
                          <PieChart>
                            <Pie
                              data={eventStats}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {eventStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                backgroundColor: 'var(--card)',
                                color: 'var(--foreground)',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                              }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 bg-accent rounded-2xl border border-dashed border-border">
                          <LayoutGrid size={32} className="text-muted-foreground/30 mb-2" />
                          <p className="text-[10px] font-medium text-muted-foreground/60">No events found.</p>
                        </div>
                      )}
                    </div>
                    {stats.totalEvents > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        {eventStats.map((stat, i) => (
                          <div key={i} className="bg-accent p-2 rounded-lg text-center border border-border">
                            <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase">{stat.name}</p>
                            <p className="text-base md:text-lg font-black text-foreground">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
  
                {/* Getting Started Guide */}
                <Card className="lg:col-span-3 border-none shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5 hidden md:block">
                    <Rocket size={120} />
                  </div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2">
                      <Rocket size={18} className="text-orange-500" />
                      Getting Started
                    </CardTitle>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Launch your first successful voting event</p>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                      {[
                        { 
                          step: "01", 
                          title: "Create Event", 
                          desc: "Set up basic details.", 
                          icon: <Calendar size={16} className="text-blue-500" />,
                          status: stats.totalEvents > 0 ? 'Finished' : 'Start Now',
                          link: stats.totalEvents > 0 ? null : "/organizer/new-event"
                        },
                        { 
                          step: "02", 
                          title: "Add Categories", 
                          desc: "Define voting categories.", 
                          icon: <Target size={16} className="text-purple-500" />,
                          status: stats.totalCategories > 0 ? 'Finished' : (stats.totalEvents > 0 ? 'Start Now' : 'Waiting'),
                          link: (stats.totalEvents > 0 && stats.totalCategories === 0) ? "/organizer/events" : null
                        },
                        { 
                          step: "03", 
                          title: "Register Participants", 
                          desc: "Add candidates or nominations.", 
                          icon: <Users size={16} className="text-indigo-500" />,
                          status: stats.totalNominees > 0 ? 'Finished' : (stats.totalCategories > 0 ? 'Start Now' : 'Waiting'),
                          link: (stats.totalCategories > 0 && stats.totalNominees === 0) ? "/organizer/events" : null
                        },
                        { 
                          step: "04", 
                          title: "Wait for Approval", 
                          desc: "Admins will review.", 
                          icon: <CheckCircle2 size={16} className="text-green-500" />,
                          status: (stats.totalNominees > 0 && (eventStats.find(s => s.name === 'Approved')?.value || 0) > 0) ? 'Finished' : (stats.totalNominees > 0 ? 'In Review' : 'Waiting'),
                          link: null
                        }
                      ].map((item, i) => (
                        <div key={i} className="group p-3 md:p-4 bg-accent rounded-2xl border border-border hover:border-indigo-500/30 transition-all flex flex-col">
                          <div className="flex justify-between items-start mb-2 md:mb-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-background flex items-center justify-center shadow-sm shrink-0">
                              {item.icon}
                            </div>
                            <span className="text-[10px] md:text-xs font-black text-muted-foreground/20 group-hover:text-indigo-500/20 transition-colors">{item.step}</span>
                          </div>
                          <h4 className="font-bold text-foreground text-[10px] md:text-sm mb-1 line-clamp-1">{item.title}</h4>
                          <p className="text-[9px] md:text-xs text-muted-foreground leading-tight md:leading-relaxed mb-auto line-clamp-2">{item.desc}</p>
                          {item.link ? (
                            <Link to={item.link} className="mt-2 inline-flex items-center text-[9px] md:text-[10px] font-bold text-indigo-500 hover:gap-2 transition-all">
                              {item.status} <ArrowRight size={8} className="ml-1" />
                            </Link>
                          ) : (
                            <div className={cn(
                              "mt-2 text-[9px] md:text-[10px] font-bold",
                              item.status === 'Finished' ? "text-green-500 flex items-center gap-1" : "text-muted-foreground/60"
                            )}>
                              {item.status === 'Finished' && <CheckCircle2 size={10} />}
                              {item.status}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
  
              {/* Context Action */}
              <div className="mt-4 md:mt-8 bg-indigo-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-200">
                <div className="relative z-10 max-w-xl">
                  <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Expand Your Audience</h2>
                  <p className="text-indigo-100 text-xs md:text-sm leading-relaxed mb-4 md:mb-6">
                    Ready to launch your next big campaign? Create categories, set up participants or ticket tiers, and start engaging your audience.
                  </p>
                  <Button 
                    className="bg-white text-indigo-900 hover:bg-slate-100 font-bold px-6 md:px-8 h-10 md:h-12 w-full sm:w-auto"
                    onClick={() => navigate('/organizer/new-event')}
                  >
                    Get Started Now
                  </Button>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 hidden md:block">
                  <Activity size={320} />
                </div>
              </div>
          </div>
        ) : (
          <div className="focus-in">
             <Routes>
                <Route path="/events" element={<OrganizerEvents />} />
                <Route path="/new-event" element={<CreateEvent />} />
                <Route path="/edit/:eventId" element={<CreateEvent />} />
                <Route path="/manage/:eventId" element={<ManageNominees />} />
                <Route path="/promo/:eventId" element={<ManagePromoCodes />} />
                <Route path="/analytics/:eventId" element={<EventAnalytics />} />
                <Route path="/tickets/:eventId" element={<TicketManagement />} />
                <Route path="/scanner" element={<GlobalTicketScanner />} />
                <Route path="/withdrawals" element={<OrganizerWithdrawals />} />
                <Route path="/settings" element={<UserSettings />} />
              </Routes>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
