import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import OrganizerEvents from '../components/dashboard/OrganizerEvents';
import CreateEvent from '../components/dashboard/CreateEvent';
import GlobalTicketScanner from '../components/dashboard/GlobalTicketScanner';
import OrganizerWithdrawals from '../components/dashboard/OrganizerWithdrawals';
import UserSettings from '../components/dashboard/UserSettings';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowRight, Trophy, Plus, Wallet, Ticket, CheckCircle2 } from 'lucide-react';
import { databaseService } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { formatSafeDate } from '../lib/utils';

function OrganizerOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    eventsCount: 0,
    ticketSales: 0,
    balance: 0,
    votesCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const organizerId = user.uid;

    async function loadStats() {
      try {
        const events = await databaseService.getEvents({ organizerId });
        const withdrawals = await databaseService.getWithdrawals(organizerId);
        
        let totalRevenue = 0;
        let totalVotes = 0;

        events.forEach((e: any) => {
          totalVotes += e.votes || 0;
          totalRevenue += (e.earnings || 0); // Accumulate earnings
        });

        const pendingWithdrawalAmount = withdrawals
          .filter(w => w.status === 'pending' || w.status === 'approved')
          .reduce((acc, curr) => acc + curr.amount, 0);

        const completedWithdrawalAmount = withdrawals
          .filter(w => w.status === 'completed')
          .reduce((acc, curr) => acc + curr.amount, 0);

        // Standard formula: Balance = Lifetime Earnings - (Pending + Completed Withdrawals)
        const balance = Math.max(0, totalRevenue - (pendingWithdrawalAmount + completedWithdrawalAmount));

        setStats({
          eventsCount: events.length,
          ticketSales: totalRevenue,
          balance,
          votesCount: totalVotes
        });
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
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-750 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-indigo-900/10 border border-indigo-700/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-indigo-550/10 to-transparent pointer-events-none rounded-r-3xl"></div>
        <div className="relative z-10 max-w-xl">
          <span className="bg-indigo-500/30 text-indigo-300 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/20">
            ASVote Workspace
          </span>
          <h1 className="text-xl md:text-3xl font-black tracking-tight mt-3">
            Akwaaba, {user?.displayName}!
          </h1>
          <p className="text-sm text-indigo-200 mt-2 leading-relaxed font-medium">
            Manage your digital contest nominations, parse instant ballot volumes, validation tickets and schedule withdrawals effortlessly.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Button 
              onClick={() => navigate('/organizer/events')}
              variant="default"
              className="bg-white hover:bg-slate-100 text-indigo-900 hover:text-indigo-900 rounded-xl font-bold font-sans text-xs h-10 px-4"
            >
              Configure Nominees
            </Button>
            <Button 
              onClick={() => navigate('/organizer/withdrawals')}
              variant="outline"
              className="border-indigo-500 text-indigo-300 hover:bg-indigo-500/15 rounded-xl font-bold text-xs h-10 px-4"
            >
              Request Withdrawal
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-none shadow-sm dark:bg-slate-900/40">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Trophy size={20} />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-tight mb-1">My Events & Polls</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
              {loading ? '...' : stats.eventsCount}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-slate-900/40">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Ticket size={20} />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-tight mb-1">Gross Earnings</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
              {loading ? '...' : `${stats.ticketSales.toLocaleString()} GHS`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-slate-900/40">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
                <Wallet size={20} />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-tight mb-1">Withdrawable Balance</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
              {loading ? '...' : `${stats.balance.toLocaleString()} GHS`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-slate-900/40">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-tight mb-1">Total Dynamic Votes</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
              {loading ? '...' : stats.votesCount}
            </p>
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
            <div className="bg-white dark:bg-slate-900/20 p-5 rounded-2xl border border-border flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">QR Admission Scanner</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
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

            <div className="bg-white dark:bg-slate-900/20 p-5 rounded-2xl border border-border flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Momo Config Settings</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 w-full font-bold h-10 text-xs mt-6 flex items-center justify-center gap-1.5"
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
        <Route path="/scanner" element={<GlobalTicketScanner />} />
        <Route path="/withdrawals" element={<OrganizerWithdrawals />} />
        <Route path="/settings" element={<UserSettings />} />
      </Routes>
    </DashboardLayout>
  );
}
