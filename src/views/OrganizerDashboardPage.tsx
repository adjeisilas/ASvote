import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import OrganizerEvents from '../components/dashboard/OrganizerEvents';
import CreateEvent from '../components/dashboard/CreateEvent';
import GlobalTicketScanner from '../components/dashboard/GlobalTicketScanner';
import OrganizerWithdrawals from '../components/dashboard/OrganizerWithdrawals';
import UserSettings from '../components/dashboard/UserSettings';
import EventAnalytics from '../components/dashboard/EventAnalytics';
import ManageNominees from '../components/dashboard/ManageNominees';
import TicketManagement from '../components/dashboard/TicketManagement';
import ManagePromoCodes from '../components/dashboard/ManagePromoCodes';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowRight, Trophy, Plus, Wallet, Ticket, CheckCircle2, Percent, Coins } from 'lucide-react';
import { databaseService } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { formatSafeDate } from '../lib/utils';
import VotingTrendChart from '../components/dashboard/VotingTrendChart';

function OrganizerOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    eventsCount: 0,
    ticketSales: 0,
    balance: 0,
    votesCount: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    totalEvents: 0,
    totalEarnings: 0,
    totalCommissions: 0
  });
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const organizerId = user.uid;

    async function loadStats() {
      try {
        const [events, organizerStats, votingTrends] = await Promise.all([
          databaseService.getEvents({ organizerId }),
          databaseService.getOrganizerStats(organizerId),
          databaseService.getVotingTrends(organizerId)
        ]);

        let totalVotes = 0;
        events.forEach((e: any) => {
          totalVotes += e.totalVotes || 0;
        });

        const grossEarnings = organizerStats.grossEarnings || 0;
        const totalEarnings = organizerStats.totalEarnings || 0;
        const totalCommissions = organizerStats.totalCommissions || 0;
        const balance = Math.max(0, totalEarnings - (organizerStats.pendingPayouts || 0) - (organizerStats.completedPayouts || 0));

        setStats({
          eventsCount: events.length,
          ticketSales: grossEarnings,
          balance,
          votesCount: totalVotes,
          approvedCount: organizerStats.approvedCount || 0,
          pendingCount: organizerStats.pendingCount || 0,
          rejectedCount: organizerStats.rejectedCount || 0,
          totalEvents: organizerStats.totalEvents || events.length,
          totalEarnings,
          totalCommissions
        });
        setTrends(votingTrends || []);
      } catch (err) {
        console.error("Error calculating organizer stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-indigo-900 dark:bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-indigo-800/30 dark:border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="bg-indigo-800/40 text-indigo-200 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-700/20">
            ASVote Workspace
          </span>
          <h1 className="text-base sm:text-xl md:text-3xl font-black tracking-tight mt-3">
            Akwaaba, {user?.displayName}!
          </h1>
          <p className="text-[11px] sm:text-sm text-indigo-200 mt-2 leading-relaxed font-semibold">
            Organizer Dashboard
          </p>
          <p className="text-[10px] sm:text-xs text-indigo-200/85 leading-relaxed mt-1">
            Quick summary of your platform performance.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-5 max-w-sm">
            <Button 
              onClick={() => navigate('/organizer/new-event')}
              variant="default"
              className="bg-white hover:bg-slate-100 text-indigo-900 hover:text-indigo-900 rounded-xl font-bold font-sans text-[10px] sm:text-xs h-10 px-1 sm:px-4 shadow-none w-full"
            >
              Create New Event
            </Button>
            <Button 
              onClick={() => navigate('/organizer/withdrawals')}
              variant="outline"
              className="border-indigo-500 text-indigo-300 hover:bg-indigo-500/15 rounded-xl font-bold text-[10px] sm:text-xs h-10 px-1 sm:px-4 shadow-none w-full"
            >
              Request Withdrawal
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
        <Card className="border-none shadow-none dark:bg-slate-900/40">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Trophy size={18} />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-tight mb-1">My Events & Polls</p>
            <p className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
              {loading ? '...' : stats.eventsCount}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-none dark:bg-slate-900/40">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Ticket size={18} />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-tight mb-1">Gross Earnings</p>
            <p className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
              {loading ? '...' : `${stats.ticketSales.toLocaleString()} GHS`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-none dark:bg-slate-900/40">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600 dark:text-rose-400">
                <Percent size={18} />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-tight mb-1">Commission Fee</p>
            <p className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
              {loading ? '...' : `${stats.totalCommissions.toLocaleString()} GHS`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-none dark:bg-slate-900/40">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-sky-50 dark:bg-sky-950/40 rounded-xl text-sky-600 dark:text-sky-400">
                <Coins size={18} />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-tight mb-1">Total Net Earnings</p>
            <p className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
              {loading ? '...' : `${stats.totalEarnings.toLocaleString()} GHS`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-none dark:bg-slate-900/40">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
                <Wallet size={18} />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-tight mb-1">Withdrawable Balance</p>
            <p className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
              {loading ? '...' : `${stats.balance.toLocaleString()} GHS`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-none dark:bg-slate-900/40">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-tight mb-1">Total Dynamic Votes</p>
            <p className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white leading-none">
              {loading ? '...' : stats.votesCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Voting Velocity Chart (cols 2) */}
        <div className="lg:col-span-2">
          {loading ? (
            <Card className="border-none shadow-sm h-full flex items-center justify-center p-12">
              <span className="text-sm font-medium text-muted-foreground animate-pulse">Loading analytics...</span>
            </Card>
          ) : (
            <VotingTrendChart transactions={trends} days={7} label="Voting" unit="Votes" />
          )}
        </div>

        {/* Status Distribution Overview (col 1) */}
        <Card className="border-none shadow-sm dark:bg-slate-900/40 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
              Status Distribution
            </CardTitle>
            <p className="text-xs text-slate-500">Overview of competition and pageant event stages</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-500/10 dark:bg-emerald-950/20 p-3 rounded-2xl">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Approved</p>
                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{stats.approvedCount}</p>
                  </div>
                  <div className="bg-amber-500/10 dark:bg-amber-950/20 p-3 rounded-2xl">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Pending</p>
                    <p className="text-xl font-black text-amber-700 dark:text-amber-400 mt-1">{stats.pendingCount}</p>
                  </div>
                  <div className="bg-rose-500/10 dark:bg-rose-950/20 p-3 rounded-2xl">
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">Rejected</p>
                    <p className="text-xl font-black text-rose-700 dark:text-rose-400 mt-1">{stats.rejectedCount}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Approved Bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-700 dark:text-slate-300">Approved & Active</span>
                      <span className="text-slate-500">{stats.totalEvents > 0 ? Math.round((stats.approvedCount / stats.totalEvents) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${stats.totalEvents > 0 ? (stats.approvedCount / stats.totalEvents) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Pending Bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-700 dark:text-slate-300">Pending Review</span>
                      <span className="text-slate-500">{stats.totalEvents > 0 ? Math.round((stats.pendingCount / stats.totalEvents) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${stats.totalEvents > 0 ? (stats.pendingCount / stats.totalEvents) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Rejected Bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-700 dark:text-slate-300">Rejected / Revoked</span>
                      <span className="text-slate-500">{stats.totalEvents > 0 ? Math.round((stats.rejectedCount / stats.totalEvents) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${stats.totalEvents > 0 ? (stats.rejectedCount / stats.totalEvents) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional UI Elements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Workspace Quick Guides</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-foreground text-sm">QR Admission Scanner</h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Validate voter admission, pageant tickets, or venue passes instantly on-site using your system camera device.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/organizer/scanner')}
                variant="ghost" 
                className="text-indigo-600 dark:text-indigo-400 font-bold p-0 mt-4 hover:bg-transparent text-xs justify-start gap-1"
              >
                Launch QR Camera <ArrowRight size={14} />
              </Button>
            </div>

            <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-foreground text-sm">Momo Config Settings</h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Persist Mobile Money payout numbers and recipient names for automated withdrawals on completed ticket clearances.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/organizer/settings')}
                variant="ghost" 
                className="text-indigo-600 dark:text-indigo-400 font-bold p-0 mt-4 hover:bg-transparent text-xs justify-start gap-1"
              >
                Adjust Momo Profile <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick action card */}
        <div className="bg-indigo-50/40 dark:bg-slate-900/40 p-6 rounded-3xl border border-indigo-100/50 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <span className="p-1 px-2.5 bg-indigo-50 border border-indigo-150 rounded text-[9px] font-black uppercase text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400">
              Action Panel
            </span>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base mt-2.5">Schedule Competition</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Define pricing thresholds, nominate entry candidates, construct event visual cards, and publish instantly.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/organizer/events')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-none w-full font-bold h-10 text-xs mt-6 flex items-center justify-center gap-1.5"
          >
            <Plus size={16} /> Schedule Live Event
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrganizerDashboardPage() {
  return (
    <DashboardLayout role="organizer">
      <Routes>
        <Route path="/" element={<OrganizerOverview />} />
        <Route path="/events" element={<OrganizerEvents />} />
        <Route path="/new-event" element={<CreateEvent />} />
        <Route path="/edit/:eventId" element={<CreateEvent />} />
        <Route path="/analytics/:eventId" element={<EventAnalytics />} />
        <Route path="/manage/:eventId" element={<ManageNominees />} />
        <Route path="/tickets/:eventId" element={<TicketManagement />} />
        <Route path="/promo/:eventId" element={<ManagePromoCodes />} />
        <Route path="/scanner" element={<GlobalTicketScanner />} />
        <Route path="/withdrawals" element={<OrganizerWithdrawals />} />
        <Route path="/settings" element={<UserSettings />} />
      </Routes>
    </DashboardLayout>
  );
}
