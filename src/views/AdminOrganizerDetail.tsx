import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databaseService } from '../services/database';
import { User, Event, Withdrawal } from '../types';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Wallet, 
  TrendingUp, 
  ExternalLink,
  Loader2,
  Clock,
  LayoutGrid,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn, formatSafeDate, slugify } from '../lib/utils';
import { toast } from 'sonner';

export default function AdminOrganizerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    profile: User;
    events: Event[];
    withdrawals: Withdrawal[];
    totalVolume: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      try {
        setLoading(true);
        const detail = await databaseService.getOrganizerDetail(id);
        setData(detail);
      } catch (error: any) {
        console.error("Error loading organizer detail:", error);
        toast.error("Failed to load organizer profile");
        navigate('/admin?tab=organizers');
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) return null;

  const { profile, events, withdrawals, totalVolume } = data;

  const phoneParts = (profile.phoneNumber || '').split('||');
  const standardPhone = phoneParts[0] || profile.phoneNumber || '';
  const momoNumber = phoneParts[1] || '';
  const momoName = phoneParts[2] || '';

  return (
    <DashboardLayout role="admin">
      <div className="container mx-auto px-4 md:px-8 py-4">
        {/* Navigation & Header */}
        <div className="mb-6 md:mb-8">
          <Button 
            variant="ghost" 
            size="sm"
            className="mb-4 text-slate-500 hover:text-indigo-600 -ml-2 h-8 px-2"
            onClick={() => navigate('/admin?tab=organizers')}
          >
            <ArrowLeft className="mr-2" size={14} />
            Back to Organizers
          </Button>
  
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4 md:gap-5 w-full md:w-auto">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-indigo-100 flex items-center justify-center text-xl md:text-2xl font-black text-indigo-600 shadow-sm border-2 md:border-4 border-white shrink-0">
                {profile.displayName?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 md:gap-3 flex-wrap">
                  <span className="truncate">{profile.displayName}</span>
                  <Badge className={cn(
                    "border-none text-[10px] md:text-xs",
                    profile.status === 'approved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {profile.status}
                  </Badge>
                </h1>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 mt-1 md:mt-2">
                  <span className="text-xs md:text-sm text-slate-500 flex items-center gap-1.5 font-medium truncate max-w-[200px] md:max-w-none">
                    <Mail size={12} className="text-slate-400" /> {profile.email}
                  </span>
                  <span className="hidden sm:block h-3 w-px bg-slate-200"></span>
                  <span className="text-xs md:text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                    <Clock size={12} className="text-slate-400" /> Joined {formatSafeDate(profile.createdAt, 'MMM d, yyyy')}
                  </span>
                  {standardPhone && (
                    <>
                      <span className="hidden sm:block h-3 w-px bg-slate-200"></span>
                      <span className="text-xs md:text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                        <b>Tel:</b> {standardPhone}
                      </span>
                    </>
                  )}
                </div>
                
                {momoNumber && (
                  <div className="mt-2 text-xs flex flex-wrap items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-500/10 px-3 py-1.5 rounded-xl font-bold text-emerald-600 dark:text-emerald-400 max-w-fit">
                    <span>Momo Account:</span>
                    <span className="font-mono bg-emerald-100/60 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-300 font-black select-all">{momoNumber}</span>
                    <span className="text-emerald-500 font-medium">({momoName})</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
               <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-none font-bold w-full md:w-auto text-sm h-10 px-6">
                 Contact Organizer
               </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
          <Card className="border-none shadow-sm overflow-hidden group">
            <CardContent className="pt-5 md:pt-6 relative">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 hidden sm:block">
                <TrendingUp size={120} />
              </div>
              <div className="flex justify-between items-start mb-2 md:mb-4">
                <div className="p-1.5 md:p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Wallet size={18} />
                </div>
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium mb-0.5 md:mb-1">Lifetime Volume</p>
              <p className="text-xl md:text-3xl font-black text-slate-900">{totalVolume.toLocaleString()} GHS</p>
            </CardContent>
          </Card>
  
          <Card className="border-none shadow-sm overflow-hidden group">
            <CardContent className="pt-5 md:pt-6 relative">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 hidden sm:block">
                <LayoutGrid size={120} />
              </div>
              <div className="flex justify-between items-start mb-2 md:mb-4">
                <div className="p-1.5 md:p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <Activity size={18} />
                </div>
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium mb-0.5 md:mb-1">Total Events</p>
              <p className="text-xl md:text-3xl font-black text-slate-900">{events.length}</p>
            </CardContent>
          </Card>
  
          <Card className="border-none shadow-sm overflow-hidden group sm:col-span-2 lg:col-span-1">
            <CardContent className="pt-5 md:pt-6 relative">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 hidden sm:block">
                <Calendar size={120} />
              </div>
              <div className="flex justify-between items-start mb-2 md:mb-4">
                <div className="p-1.5 md:p-2 bg-amber-50 rounded-lg text-amber-600">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium mb-0.5 md:mb-1">Success Rate</p>
              <p className="text-xl md:text-3xl font-black text-slate-900">100%</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Events List */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-card border-b border-border">
              <div className="flex items-center gap-2">
                <Activity className="text-indigo-600" size={18} />
                <CardTitle className="text-lg">Event History</CardTitle>
              </div>
              <CardDescription>All events organized by this user.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="min-w-[150px]">Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length > 0 ? (
                      events.map((event) => (
                        <TableRow key={event.id} className="hover:bg-slate-50/50">
                          <TableCell>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs md:text-sm font-bold text-slate-900 truncate">{event.title}</span>
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                <Badge variant="outline" className="text-[7px] md:text-[8px] uppercase h-3.5 px-1 shadow-none font-black tracking-widest border-slate-200">
                                  {event.type}
                                </Badge>
                                {event.type === 'ticketing' && event.venue && (
                                  <span className="text-[8px] md:text-[9px] text-slate-400 font-medium truncate max-w-[100px]">
                                    • {event.venue}
                                  </span>
                                )}
                                <span className="text-[8px] md:text-[9px] text-slate-400 font-mono italic">
                                  • {formatSafeDate(event.createdAt, 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-slate-400 px-1.5 md:px-2">
                              {event.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "capitalize border-none text-[10px] md:text-xs px-2 py-0 md:px-3",
                              event.status === 'active' ? "bg-green-100 text-green-700" :
                              event.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            )}>
                              {event.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 md:h-8 md:w-8 text-slate-400 hover:text-indigo-600"
                              onClick={() => navigate(`/event/${slugify(event.title)}`)}
                            >
                              <ExternalLink className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-40 text-center text-slate-400 italic">No events found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawals List */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-card border-b border-border">
              <div className="flex items-center gap-2">
                <Wallet className="text-emerald-600" size={18} />
                <CardTitle className="text-lg">Payout History</CardTitle>
              </div>
              <CardDescription>Withdrawal requests and status records.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead>Momo Recipient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.length > 0 ? (
                      withdrawals.map((w) => (
                        <TableRow key={w.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-[10px] md:text-sm text-slate-600 whitespace-nowrap">
                            {formatSafeDate(w.createdAt, 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-[10px] md:text-sm">
                            {w.momoNumber ? (
                              <div className="flex flex-col text-xs">
                                <span className="font-mono font-bold text-slate-900 select-all">{w.momoNumber}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{w.momoName}</span>
                              </div>
                            ) : (
                              <span className="italic text-slate-400 text-xs">Profile Default</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-indigo-600 text-[10px] md:text-sm whitespace-nowrap">
                            {w.amount.toLocaleString()} GHS
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "capitalize border-none text-[10px] md:text-xs px-2 py-0 md:px-3",
                              w.status === 'completed' || w.status === 'approved' ? "bg-green-100 text-green-700" :
                              w.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            )}>
                              {w.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-40 text-center text-slate-400 italic">No payout history</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
