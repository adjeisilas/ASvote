import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { databaseService } from '../services/database';
import { notificationService } from '../services/notificationService';
import { User, Event, Withdrawal } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Users, LayoutGrid, Wallet, BarChart3, CheckCircle, Search, Loader2, Activity, Eye, Trash2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn, formatSafeDate, formatSafeDistanceToNow } from '../lib/utils';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import UserSettings from '../components/dashboard/UserSettings';
import VotingTrendChart from '../components/dashboard/VotingTrendChart';
import RecentActivityFeed from '../components/dashboard/RecentActivityFeed';
import TopPerformersLeaderboard from '../components/dashboard/TopPerformersLeaderboard';
import BroadcastDialog from '../components/dashboard/BroadcastDialog';
import SystemLogsTable from '../components/dashboard/SystemLogsTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";

export default function AdminDashboard() {
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  
  const [organizers, setOrganizers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<{
    totalOrganizers: number;
    totalEvents: number;
    activeEvents: number;
    totalVolume: number;
    totalCommissions: number;
    totalPendingPayouts: number;
    totalCompletedPayouts: number;
    totalVotes: number;
  } | null>(null);
  const [globalTrends, setGlobalTrends] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<{ topEvents: any[], topOrganizers: any[] }>({ topEvents: [], topOrganizers: [] });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCommissionEvent, setEditingCommissionEvent] = useState<Event | null>(null);
  const [newCommission, setNewCommission] = useState<string>('');
  const [isUpdatingCommission, setIsUpdatingCommission] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string, type: 'user' | 'event' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [eventStatusFilter, setEventStatusFilter] = useState<'all' | 'active' | 'pending' | 'ended'>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'voting' | 'ticketing'>('all');
  const [organizerSearch, setOrganizerSearch] = useState('');

  const filteredOrganizers = organizers.filter(org => 
    org.displayName?.toLowerCase().includes(organizerSearch.toLowerCase()) ||
    org.email?.toLowerCase().includes(organizerSearch.toLowerCase()) ||
    org.uid.toLowerCase().includes(organizerSearch.toLowerCase())
  );
  const fetchData = async () => {
    if (!user) return;
    if (user.role !== 'admin') {
      console.warn("Unauthorized access attempt to admin data");
      return;
    }

    try {
      setLoading(true);
      const [orgsData, eventsData, withdrawalsData, statsData, trendsData, activitiesData, performersData, logsData] = await Promise.all([
        databaseService.getOrganizers(),
        databaseService.getEvents(),
        databaseService.getAllWithdrawals(),
        databaseService.getAdminStats(),
        databaseService.getGlobalVotingTrends(),
        databaseService.getRecentActivities(),
        databaseService.getTopPerformers(),
        databaseService.getSystemLogs()
      ]);

      setOrganizers(orgsData || []);
      setEvents(eventsData || []);
      setWithdrawals(withdrawalsData || []);
      setStats(statsData);
      setGlobalTrends(trendsData || []);
      setActivities(activitiesData || []);
      setTopPerformers(performersData);
      setLogs(logsData || []);
    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      // Only show error if it's not a background refresh failure
      if (organizers.length === 0) {
        toast.error(`Failed to load dashboard data: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const organizersSub = supabase.channel('profiles-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .subscribe();

    const eventsSub = supabase.channel('events-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchData())
      .subscribe();
      
    const withdrawalsSub = supabase.channel('withdrawals-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => fetchData())
      .subscribe();

    const transactionsSub = supabase.channel('transactions-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(organizersSub);
      supabase.removeChannel(eventsSub);
      supabase.removeChannel(withdrawalsSub);
      supabase.removeChannel(transactionsSub);
    };
  }, [user]);

  const handleStatusUpdate = async (type: 'user' | 'event' | 'withdrawal', id: string, status: string) => {
    try {
      if (type === 'user') {
        await databaseService.updateProfile(id, { status } as any);
      } else if (type === 'event') {
        await databaseService.updateEvent(id, { status });
      } else if (type === 'withdrawal') {
        await databaseService.updateWithdrawalStatus(id, status);
      }

      // Create notification for the target user
      let targetUserId = '';
      let title = '';
      let message = '';
      let nType: 'info' | 'success' | 'warning' | 'error' = 'info';

      if (type === 'user') {
        targetUserId = id;
        title = status === 'approved' ? 'Account Approved!' : 'Account Update';
        message = status === 'approved' 
          ? 'Your organizer account has been approved. You can now create and manage events.' 
          : `Your account status has been updated to ${status}.`;
        nType = status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info';
      } else if (type === 'event') {
        const eventData = events.find(e => e.id === id);
        if (eventData) {
          targetUserId = eventData.organizerId;
          title = status === 'approved' || status === 'active' ? 'Event Approved!' : 'Event Update';
          message = status === 'approved' || status === 'active'
            ? `Your event "${eventData.title}" has been approved and is now active.`
            : status === 'rejected'
            ? `Your event "${eventData.title}" has been rejected by the admin.`
            : `Status for "${eventData.title}" updated to ${status}.`;
          nType = (status === 'approved' || status === 'active') ? 'success' : status === 'rejected' ? 'error' : 'info';
        }
      } else if (type === 'withdrawal') {
        const withdrawalData = withdrawals.find(w => w.id === id);
        if (withdrawalData) {
          targetUserId = withdrawalData.organizerId;
          title = status === 'approved' ? 'Withdrawal Approved!' : 'Withdrawal Update';
          message = status === 'approved'
            ? `Your withdrawal request for GHS ${withdrawalData.amount.toLocaleString()} has been approved.`
            : `Your withdrawal request for GHS ${withdrawalData.amount.toLocaleString()} was ${status}.`;
          nType = status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info';
        }
      }

      if (targetUserId) {
        await notificationService.createNotification(targetUserId, title, message, nType);
      }

      await databaseService.logAction(`${type.toUpperCase()}_STATUS_UPDATE`, {
        target: type,
        id: id,
        new_status: status
      }, id, type);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} ${status} successfully.`);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Status update error:', error);
      toast.error(`Failed to update status: ${error.message || 'Unknown error'}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    try {
      if (deleteConfirm.type === 'user') {
        if (!user) throw new Error("No admin session found");
        // Deep delete: auth + DB profile
        await databaseService.deleteUserAuth(deleteConfirm.id, user.uid);
      } else {
        await databaseService.deleteEvent(deleteConfirm.id);
      }
      toast.success(`${deleteConfirm.type === 'user' ? 'Organizer' : 'Event'} deleted successfully.`);
      setDeleteConfirm(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateCommission = async () => {
    if (!editingCommissionEvent || newCommission === "") return;
    
    setIsUpdatingCommission(true);
    try {
      await databaseService.updateEvent(editingCommissionEvent.id, {
        commission: Number(newCommission)
      });
      await databaseService.logAction('UPDATE_COMMISSION', {
        event: editingCommissionEvent.title,
        old_rate: editingCommissionEvent.commission ?? 0,
        new_rate: Number(newCommission)
      }, editingCommissionEvent.id);
      
      toast.success("Commission updated successfully!");
      setEditingCommissionEvent(null);
      setNewCommission("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update commission.");
    } finally {
      setIsUpdatingCommission(false);
    }
  };

  if (authLoading || loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  const pendingOrganizers = organizers.filter(o => o.status === 'pending').length;
  const pendingEvents = events.filter(e => e.status === 'pending').length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;

  return (
    <DashboardLayout role="admin">
      <div className="container mx-auto px-4 md:px-8 py-4">
        {/* Header Section */}
        <div className="mb-6 md:mb-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="w-full lg:w-auto">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className="bg-indigo-600 text-white border-none py-1">Admin Central</Badge>
                <h1 className="text-xl md:text-3xl font-extrabold text-foreground tracking-tight">System Control</h1>
              </div>
              <p className="text-[13px] md:text-base text-muted-foreground max-w-2xl">
                Oversee platform health, approve organizers, and moderate active events. Use the sidebar to navigate detailed sections.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 md:gap-4 w-full lg:w-auto items-center">
              <div className="flex-1 sm:flex-none">
                <BroadcastDialog />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 px-4 rounded-xl border-border hover:bg-accent transition-all font-bold gap-2 flex-1 sm:flex-none"
                onClick={() => {
                  setLoading(true);
                  fetchData();
                  toast.success("Dashboard data refreshed");
                }}
              >
                <Loader2 className={cn("w-4 h-4", loading && "animate-spin")} />
                <span className="hidden xs:inline">Refresh Data</span>
                <span className="xs:hidden">Refresh</span>
              </Button>
              <Card className="bg-card border-none shadow-sm px-4 md:px-6 py-2 flex flex-col items-center hidden sm:flex shrink-0">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold whitespace-nowrap">Health</span>
                <span className="text-green-500 font-bold flex items-center gap-1 text-xs md:text-sm">
                  <CheckCircle size={14} /> Operational
                </span>
              </Card>
            </div>
          </div>
        </div>

        {currentTab === 'overview' && (
          <>
            {/* Action Alerts */}
            {(pendingOrganizers > 0 || pendingEvents > 0 || pendingWithdrawals > 0) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-10">
                {pendingOrganizers > 0 && (
                  <div className="bg-card border-l-2 md:border-l-4 border-amber-400 rounded-xl p-3 md:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border border-border">
                    <div className="flex items-center gap-2 md:gap-4 w-full">
                      <div className="bg-amber-500/10 p-2 md:p-2.5 rounded-lg text-amber-500 shrink-0">
                        <Users size={18} className="md:w-5 md:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] md:text-sm font-bold text-foreground truncate">Pending Organizers</p>
                        <p className="text-[9px] md:text-xs text-muted-foreground truncate"><span className="font-bold text-amber-500">{pendingOrganizers}</span> review</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-indigo-500 font-bold group h-7 text-[9px] md:text-sm px-2 w-full sm:w-auto" onClick={() => navigate('/admin?tab=organizers')}>
                      <span className="xs:inline hidden">Review</span> <ArrowRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                )}
                {pendingEvents > 0 && (
                  <div className="bg-card border-l-2 md:border-l-4 border-indigo-400 rounded-xl p-3 md:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border border-border">
                    <div className="flex items-center gap-2 md:gap-4 w-full">
                      <div className="bg-indigo-500/10 p-2 md:p-2.5 rounded-lg text-indigo-500 shrink-0">
                        <LayoutGrid size={18} className="md:w-5 md:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] md:text-sm font-bold text-foreground truncate">New Events</p>
                        <p className="text-[9px] md:text-xs text-muted-foreground truncate"><span className="font-bold text-indigo-500">{pendingEvents}</span> review</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-indigo-500 font-bold group h-7 text-[9px] md:text-sm px-2 w-full sm:w-auto" onClick={() => navigate('/admin?tab=events')}>
                      <span className="xs:inline hidden">Review</span> <ArrowRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                )}
                {pendingWithdrawals > 0 && (
                  <div className="bg-card border-l-2 md:border-l-4 border-emerald-400 rounded-xl p-3 md:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 col-span-2 md:col-span-1 border border-border">
                    <div className="flex items-center gap-2 md:gap-4 w-full">
                      <div className="bg-emerald-500/10 p-2 md:p-2.5 rounded-lg text-emerald-500 shrink-0">
                        <Wallet size={18} className="md:w-5 md:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] md:text-sm font-bold text-foreground truncate">Payout Requests</p>
                        <p className="text-[9px] md:text-xs text-muted-foreground truncate"><span className="font-bold text-emerald-500">{pendingWithdrawals}</span> processing</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-indigo-500 font-bold group h-7 text-[9px] md:text-sm px-2 w-full sm:w-auto" onClick={() => navigate('/admin?tab=payouts')}>
                      <span className="xs:inline hidden">Review</span> <ArrowRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-10">
              {[
                { label: "Total Organizers", value: stats?.totalOrganizers || organizers.length, icon: <Users size={18} />, trend: "Verified Agents" },
                { label: "Gross Volume", value: `${(stats?.totalVolume || 0).toLocaleString()} GHS`, icon: <Wallet size={18} />, trend: "Total Revenue" },
                { label: "Platform Revenue", value: `${(stats?.totalCommissions || 0).toLocaleString()} GHS`, icon: <Activity size={18} />, trend: "Net Commission" },
                { label: "Total Engagement", value: (stats?.totalVotes || 0).toLocaleString(), icon: <BarChart3 size={18} />, trend: "Votes/Tickets" }
              ].map((stat, i) => (
                <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                  <CardContent className="p-3 xs:p-4 md:pt-6">
                    <div className="flex justify-between items-start mb-3 md:mb-4">
                      <div className="p-1.5 md:p-2 bg-accent rounded-lg text-muted-foreground group-hover:text-indigo-500 transition-colors">
                        {stat.icon}
                      </div>
                      <span className="text-[7px] xs:text-[8px] md:text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 xs:px-2 py-0.5 rounded-full whitespace-nowrap">{stat.trend}</span>
                    </div>
                    <p className="text-[10px] md:text-sm text-muted-foreground font-medium mb-0.5 md:mb-1 truncate">{stat.label}</p>
                    <p className="text-sm xs:text-base md:text-2xl font-bold text-foreground truncate">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mb-10 min-h-[300px]">
              <VotingTrendChart transactions={globalTrends} days={7} />
            </div>

            <div className="mb-10">
              <TopPerformersLeaderboard 
                topEvents={topPerformers.topEvents} 
                topOrganizers={topPerformers.topOrganizers} 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-8">
                  <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Recent Organizers</CardTitle>
                        <CardDescription>Latest registrations needing review.</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" className="text-indigo-600" onClick={() => navigate('/admin?tab=organizers')}>View All</Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {organizers.slice(0, 5).map(org => (
                          <div key={org.uid} className="flex items-center justify-between border-b border-border pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold font-mono text-muted-foreground">
                                {org.displayName?.charAt(0)}
                              </div>
                              <div className="flex flex-col cursor-pointer group" onClick={() => navigate(`/admin/organizer/${org.uid}`)}>
                                <span className="text-sm font-bold text-foreground group-hover:text-indigo-500 transition-colors">{org.displayName}</span>
                                <span className="text-[10px] text-muted-foreground">{org.email}</span>
                              </div>
                            </div>
                            <Badge variant={org.status === 'approved' ? 'default' : 'secondary'} className="scale-90 capitalize">
                              {org.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Active Payouts</CardTitle>
                          <CardDescription>Recent volume being processed.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-indigo-600" onClick={() => navigate('/admin?tab=payouts')}>View All</Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {withdrawals.slice(0, 5).map(w => (
                            <div key={w.id} className="flex items-center justify-between border-b border-border pb-4 text-sm">
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground">{w.organizerName}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{formatSafeDate(w.createdAt, 'MMM d, h:mm a')}</span>
                              </div>
                              <span className="font-mono font-bold text-indigo-500">+{w.amount} GHS</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                  </Card>
                </div>
              </div>

              <div className="lg:col-span-1">
                <RecentActivityFeed activities={activities} />
              </div>
            </div>
          </>
        )}

        {currentTab === 'organizers' && (
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-card border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 md:py-6">
              <div>
                <CardTitle className="text-lg md:text-xl">Organizer Verification</CardTitle>
                <CardDescription>Review and manage access for event organizers.</CardDescription>
              </div>
              <div className="relative w-full sm:w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search organizers..." 
                  className="pl-10 w-full bg-accent border-none rounded-lg text-sm h-9" 
                  value={organizerSearch}
                  onChange={(e) => setOrganizerSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-accent/50">
                    <TableRow>
                      <TableHead className="min-w-[200px]">Organizer</TableHead>
                      <TableHead className="hidden md:table-cell">Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Management</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizers.length > 0 ? filteredOrganizers.map((org) => (
                      <TableRow key={org.uid} className="hover:bg-accent/50 transition-colors">
                        <TableCell className="cursor-pointer group" onClick={() => navigate(`/admin/organizer/${org.uid}`)}>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground group-hover:text-indigo-500 transition-colors text-sm md:text-base">{org.displayName}</span>
                            <div className="flex items-center gap-2 text-[10px] md:text-xs">
                              <span className="text-muted-foreground font-mono italic truncate max-w-[120px] md:max-w-none">{org.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs md:text-sm text-muted-foreground hidden md:table-cell">
                          {formatSafeDate(org.createdAt, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${
                            org.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                            org.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                          } border-none capitalize px-2 py-0 md:px-3 text-[10px] md:text-xs`}>
                            {org.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 md:gap-2">
                            {org.status !== 'approved' && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 h-8 md:h-9 px-2 md:px-3 text-[10px] md:text-sm" 
                                onClick={() => handleStatusUpdate('user', org.uid, 'approved')}
                              >
                                {org.status === 'pending' ? 'Approve' : (
                                  <span className="hidden xs:inline">Approve</span>
                                )}
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                              onClick={() => setDeleteConfirm({ id: org.uid, name: org.displayName || 'Unnamed Organizer', type: 'user' })}
                              title="Delete Organizer"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">No organizers registered yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {currentTab === 'events' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl shadow-sm border border-border transition-colors">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2">Status:</span>
                {(['all', 'active', 'pending', 'ended'] as const).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={eventStatusFilter === s ? 'default' : 'ghost'}
                    className={cn(
                      "capitalize h-8 px-4 rounded-full font-bold transition-all",
                      eventStatusFilter === s ? "bg-indigo-600 shadow-md shadow-indigo-500/10" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    onClick={() => setEventStatusFilter(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2">Type:</span>
                {(['all', 'voting', 'ticketing'] as const).map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={eventTypeFilter === t ? 'default' : 'ghost'}
                    className={cn(
                      "capitalize h-8 px-4 rounded-full font-bold transition-all",
                      eventTypeFilter === t ? "bg-indigo-600 shadow-md shadow-indigo-500/10" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    onClick={() => setEventTypeFilter(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-card border-b border-border py-4 md:py-6">
                <CardTitle className="text-lg md:text-xl">Platform Events</CardTitle>
                <CardDescription>Active and pending events across the platform.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-accent/50">
                      <TableRow>
                        <TableHead className="min-w-[180px]">Event Info</TableHead>
                        <TableHead className="hidden sm:table-cell">Volume</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events
                        .filter(e => eventStatusFilter === 'all' || e.status === eventStatusFilter)
                        .filter(e => eventTypeFilter === 'all' || e.type === eventTypeFilter)
                        .length > 0 ? (
                        events
                          .filter(e => eventStatusFilter === 'all' || e.status === eventStatusFilter)
                          .filter(e => eventTypeFilter === 'all' || e.type === eventTypeFilter)
                          .map((event) => (
                        <TableRow key={event.id} className="hover:bg-accent/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-accent overflow-hidden shrink-0 shadow-sm border border-border">
                                {event.coverImage ? (
                                  <img src={event.coverImage} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                                    <Activity size={16} />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-foreground truncate text-xs md:text-sm">{event.title}</span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge variant="outline" className="text-[7px] md:text-[9px] uppercase h-4 px-1 shadow-none font-black tracking-widest border-border text-muted-foreground">
                                    {event.type}
                                  </Badge>
                                  {event.type === 'ticketing' && (
                                    <span className="text-[8px] md:text-[10px] text-muted-foreground font-medium truncate flex items-center gap-1">
                                       {event.venue && <span>• {event.venue}</span>}
                                       {event.startDate && (
                                         <>
                                           <span className="text-muted-foreground/30 hidden md:inline">•</span>
                                           <span className="hidden md:inline">{formatSafeDate(event.startDate, 'MMM d, yyyy')}</span>
                                         </>
                                       )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-col">
                              <span className="text-xs md:text-sm font-mono font-bold text-indigo-500">
                                {event.totalVotes || 0} {event.type === 'ticketing' ? 'Tickets' : 'Votes'}
                              </span>
                              <span className="text-[9px] md:text-[10px] text-muted-foreground font-bold tracking-tight uppercase">FEES: {event.commission}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "border-none capitalize px-2 py-0 md:px-3 text-[10px] md:text-xs",
                              event.status === 'active' ? 'bg-green-500/10 text-green-500' : 
                              event.status === 'pending' ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'
                            )}>
                              {event.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex justify-end items-center gap-1 shrink-0">
                               {event.status === 'pending' && (
                                 <div className="flex gap-1">
                                   <Button size="sm" className="bg-indigo-600 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs font-bold" onClick={() => handleStatusUpdate('event', event.id, 'active')}>
                                     Activate
                                   </Button>
                                 </div>
                               )}
  
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-indigo-500 hover:bg-accent transition-colors" 
                                 onClick={() => {
                                   setEditingCommissionEvent(event);
                                   setNewCommission((event.commission ?? 0).toString());
                                 }}
                                 title="Set Commission"
                               >
                                 <BarChart3 size={14} />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-indigo-500 hover:bg-accent transition-colors hidden sm:flex" 
                                  onClick={() => navigate(`/event/${event.id}`)}
                                  title="Public View"
                                >
                                  <Eye size={14} />
                                </Button>
                              </div>
                           </TableCell>
                        </TableRow>
                      ))) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">No events match the selected filters.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'settings' && (
          <UserSettings />
        )}

        {currentTab === 'payouts' && (
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-card border-b border-border py-4 md:py-6">
              <CardTitle className="text-lg md:text-xl">Withdrawal Requests</CardTitle>
              <CardDescription>Review and process payout requests from organizers.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-accent/50">
                    <TableRow>
                      <TableHead className="min-w-[150px]">Organizer</TableHead>
                      <TableHead>Amount (GHS)</TableHead>
                      <TableHead className="hidden md:table-cell">Request Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.length > 0 ? withdrawals.map((w) => (
                      <TableRow key={w.id} className="hover:bg-accent/50 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-xs md:text-sm">{w.organizerName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono italic truncate max-w-[100px] md:max-w-none">{w.organizerEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-indigo-500 text-xs md:text-sm whitespace-nowrap">
                          {Number(w.amount).toLocaleString()} GHS
                        </TableCell>
                        <TableCell className="text-[10px] md:text-sm text-muted-foreground hidden md:table-cell">
                          {formatSafeDate(w.createdAt, 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${
                            w.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                            w.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                          } border-none capitalize px-2 md:px-3 text-[10px] md:text-xs`}>
                            {w.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {w.status === 'pending' && (
                            <div className="flex justify-end gap-1 md:gap-2">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs font-bold" 
                                onClick={() => handleStatusUpdate('withdrawal', w.id, 'completed')}
                              >
                                Approve <span className="hidden sm:inline">Payout</span>
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground/40">
                            <Wallet className="w-12 h-12 mb-3 opacity-10" />
                            <p>No withdrawal requests found.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {currentTab === 'logs' && (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-black text-foreground tracking-tight">System Audit Trail</h2>
                <p className="text-xs md:text-sm text-muted-foreground">Chronological log of administrative actions.</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData} className="gap-2 rounded-xl h-9 md:h-10 px-4 font-bold border-border bg-card w-full sm:w-auto hover:bg-accent transition-colors">
                <Activity size={14} className={loading ? "animate-spin" : ""} /> Refresh Logs
              </Button>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <SystemLogsTable logs={logs} />
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!editingCommissionEvent} onOpenChange={(open) => !open && setEditingCommissionEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Commission Rate</DialogTitle>
            <DialogDescription>
              Adjust the platform commission rate for "{editingCommissionEvent?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commission">Commission Percentage (%)</Label>
              <Input 
                id="commission" 
                type="number" 
                value={newCommission} 
                onChange={(e) => setNewCommission(e.target.value)}
                min="0"
                max="100"
                step="0.1"
              />
              <p className="text-xs text-slate-500">The percentage of revenue deducted from each vote/ticket.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCommissionEvent(null)}>Cancel</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700" 
              onClick={handleUpdateCommission}
              disabled={isUpdatingCommission}
            >
              {isUpdatingCommission && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Confirm Permanent Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you absolutely sure you want to delete <strong>{deleteConfirm?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground bg-destructive/10 p-4 rounded-lg border border-destructive/20 transition-colors">
            <p className="font-bold text-destructive mb-1">Warning:</p>
            <p>This action is irreversible. All data associated with this {deleteConfirm?.type} will be permanently removed from the system.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// End of file
