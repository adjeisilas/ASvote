import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { databaseService } from '../../services/database';
import { useAuth } from '../../contexts/AuthContext';
import { Withdrawal } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Wallet, Plus, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { notificationService } from '../../services/notificationService';

export default function OrganizerWithdrawals() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState('');
  const [momoNumber, setMomoNumber] = useState('');
  const [momoName, setMomoName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    try {
      const stats = await databaseService.getOrganizerStats(user.uid);
      setTotalEarnings(stats.totalEarnings);

      // Fetch fresh profile too for Momo details sync
      const profile = await databaseService.getUserProfile(user.uid);
      if (profile && profile.phoneNumber) {
        const parts = profile.phoneNumber.split('||');
        // parts[0] is standard phone, parts[1] is momo number, parts[2] is momo name
        setMomoNumber(prev => prev || parts[1] || '');
        setMomoName(prev => prev || parts[2] || '');
      }

      const data = await databaseService.getWithdrawals(user.uid);
      setWithdrawals((data || []).map((w: any) => ({
        id: w.id,
        organizerId: w.organizerId || w.organizer_id,
        amount: w.amount,
        status: w.status,
        createdAt: w.createdAt,
        organizerName: user.displayName,
        organizerEmail: user.email,
        momoNumber: w.momoNumber,
        momoName: w.momoName
      })));
    } catch (error) {
      console.error("Error fetching withdrawal data:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!user) return;

    const channel = supabase.channel(`withdrawals-mgt-${user.uid}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'withdrawals',
        filter: `organizer_id=eq.${user.uid}`
      }, () => fetchData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `organizer_id=eq.${user.uid}`
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed' || w.status === 'approved')
    .reduce((acc, w) => acc + (w.amount || 0), 0);
    
  const totalPending = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((acc, w) => acc + (w.amount || 0), 0);

  const availableBalance = Math.max(0, totalEarnings - totalWithdrawn - totalPending);

  const handleWithdrawClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const withdrawalAmount = parseFloat(amount);
    
    if (!amount || isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (withdrawalAmount < 100) {
      toast.error("Minimum withdrawal amount is 100 GHS.");
      return;
    }

    if (withdrawalAmount > 30000) {
      toast.error("Maximum withdrawal amount per request is 30,000 GHS.");
      return;
    }

    if (withdrawalAmount > availableBalance) {
      toast.error(`Insufficient balance. Your available balance is ${availableBalance.toLocaleString()} GHS.`);
      return;
    }

    if (!momoNumber.trim()) {
      toast.error("Please enter a Mobile Money number.");
      return;
    }

    if (!momoName.trim()) {
      toast.error("Please enter the registered Mobile Money name.");
      return;
    }

    setConfirmOpen(true);
  };

  const confirmWithdraw = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Persist the Momo details securely in user Profile phone string (delimited)
      const profile = await databaseService.getUserProfile(user.uid);
      const standardPhone = (profile?.phoneNumber || '').split('||')[0] || profile?.phoneNumber || '';
      const serializedValue = `${standardPhone}||${momoNumber.trim()}||${momoName.trim()}`;
      await databaseService.updateProfile(user.uid, { phoneNumber: serializedValue });

      await databaseService.requestWithdrawalOnServer(user.uid, parseFloat(amount));

      // Send notification
      await notificationService.createNotification(
        user.uid,
        "Withdrawal Requested",
        `Your request for GHS ${parseFloat(amount).toLocaleString()} has been submitted and is awaiting administrator approval.`,
        "info"
      );

      // Notify Admin
      await notificationService.notifyAdmin(
        "New Payout Request",
        `Org: ${user.displayName} | Amount: GHS ${parseFloat(amount).toLocaleString()} | Email: ${user.email}`,
        "warning"
      );

      toast.success("Withdrawal request submitted successfully.");
      setAmount('');
      setConfirmOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const formatSafeDate = (dateString: string | undefined | null, formatStr: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, formatStr);
    } catch (e) {
      return 'N/A';
    }
  };

  const statusMap: Record<string, { color: string, icon: any }> = {
    pending: { color: 'bg-amber-100 text-amber-700', icon: <Clock size={12} className="mr-1" /> },
    approved: { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} className="mr-1" /> },
    completed: { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} className="mr-1" /> },
    rejected: { color: 'bg-red-100 text-red-700', icon: <XCircle size={12} className="mr-1" /> }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 border-none shadow-sm h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus size={20} className="text-indigo-600" /> Request Payout
          </CardTitle>
          <CardDescription>Withdraw your earnings to your bank account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Available Balance</p>
             <p className="text-3xl font-black text-slate-900">{availableBalance.toLocaleString()} GHS</p>
             <div className="flex gap-4 mt-3 pt-3 border-t border-slate-200/50">
                <div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase">Min</p>
                   <p className="text-xs font-bold text-slate-600">100 GHS</p>
                </div>
                <div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase">Max</p>
                   <p className="text-xs font-bold text-slate-600">30,000 GHS</p>
                </div>
             </div>
          </div>

          <form onSubmit={handleWithdrawClick} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount to Withdraw</Label>
              <div className="relative">
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-4 pr-12 h-12 text-lg font-bold rounded-xl"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">GHS</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="momoNumber" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Momo Mobile Number</Label>
              <Input 
                id="momoNumber" 
                type="tel" 
                placeholder="e.g. 0241234567" 
                value={momoNumber}
                onChange={(e) => setMomoNumber(e.target.value)}
                className="h-11 rounded-xl font-mono font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="momoName" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Momo Name</Label>
              <Input 
                id="momoName" 
                type="text" 
                placeholder="e.g. John Doe" 
                value={momoName}
                onChange={(e) => setMomoName(e.target.value)}
                className="h-11 rounded-xl font-bold"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-slate-900 hover:bg-indigo-600 h-12 rounded-xl font-bold transition-all mt-3" disabled={loading || availableBalance < 100}>
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Submit Payout Request
            </Button>
            {availableBalance < 100 && (
              <p className="text-[10px] text-center text-amber-600 font-bold">You need at least 100 GHS to withdraw.</p>
            )}
          </form>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Payout Destination"
        description={
          <div className="space-y-3 text-left">
            <p className="text-slate-600 text-sm">Are you sure you want to request a withdrawal of <b className="text-slate-950 font-black">{parseFloat(amount).toLocaleString()} GHS</b>? This request will be reviewed by an administrator for approval.</p>
            <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-500/10 p-3.5 rounded-2xl flex flex-col gap-1 text-[11px]">
              <span className="font-extrabold uppercase tracking-widest text-[9px] text-emerald-600">Mobile Money Payout Destination</span>
              <span><b>Momo Number:</b> <span className="font-mono text-xs">{momoNumber}</span></span>
              <span><b>Momo Name:</b> <span className="font-semibold">{momoName}</span></span>
            </div>
          </div>
        }
        confirmText="Confirm Request"
        cancelText="Cancel"
        onConfirm={confirmWithdraw}
        isLoading={loading}
      />

      <Card className="lg:col-span-2 border-none shadow-sm pb-6">
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="min-w-[150px]">Date</TableHead>
                  <TableHead>Momo Recipient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fetching ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">Loading...</TableCell>
                  </TableRow>
                ) : withdrawals.length > 0 ? (
                  withdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-[11px] md:text-sm text-slate-500 whitespace-nowrap">
                        {formatSafeDate(w.createdAt, 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-[11px] md:text-sm text-slate-700 whitespace-nowrap">
                        {w.momoNumber ? (
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-slate-900">{w.momoNumber}</span>
                            <span className="text-[10px] text-slate-400 font-sans">{w.momoName}</span>
                          </div>
                        ) : (
                          <span className="italic text-slate-400 text-xs">Self (Profile Phone)</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 text-[11px] md:text-sm whitespace-nowrap">{w.amount.toLocaleString()} GHS</TableCell>
                      <TableCell>
                        <Badge className={`${statusMap[w.status]?.color || 'bg-slate-100'} border-none capitalize flex items-center w-fit text-[10px] md:text-xs px-2 py-0.5`}>
                          {statusMap[w.status]?.icon}
                          {w.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-slate-500 text-xs md:text-sm">
                      No withdrawal history.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
