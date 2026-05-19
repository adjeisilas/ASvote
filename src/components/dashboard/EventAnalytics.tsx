import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databaseService } from '../../services/database';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, ArrowLeft, BarChart3, TrendingUp, Users, Target, Activity, CheckCircle2 } from 'lucide-react';
import VotingTrendChart from './VotingTrendChart';
import { Event, Ticket } from '../../types';

export default function EventAnalytics() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || !eventId) return;
      try {
        const [eventData, trendData, ticketData] = await Promise.all([
          databaseService.getEventById(eventId),
          databaseService.getVotingTrends(user.uid, eventId),
          databaseService.getTickets({ eventId })
        ]);
        setEvent(eventData as any);
        setTrends(trendData);
        setTickets(ticketData);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, eventId]);

  if (loading) {
    return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  }

  if (!event) {
    return <div className="text-center p-20">Event not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 md:gap-4 mb-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/organizer/events')}
          className="h-8 w-8 rounded-full border-slate-200"
        >
          <ArrowLeft size={14} />
        </Button>
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 truncate">{event.title} Analytics</h2>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium">Performance breakdown</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {event.type === 'ticketing' ? 'Total Tickets' : 'Total Votes'}
                </p>
                <p className="text-xl md:text-2xl font-black text-slate-900">{event.totalVotes?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {event.type === 'ticketing' ? 'Total Issued' : 'Nominees'}
                </p>
                <p className="text-xl md:text-2xl font-black text-slate-900">
                  {(event as any).categories?.reduce((acc: number, cat: any) => acc + (cat.nominees?.length || 0), 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <Target className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {event.type === 'ticketing' ? 'Ticket Tiers' : 'Categories'}
                </p>
                <p className="text-xl md:text-2xl font-black text-slate-900">{(event as any).categories?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {event.type === 'ticketing' && (
          <Card className="border-none shadow-sm overflow-hidden bg-emerald-50/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase tracking-wider">Check-in Rate</p>
                  <p className="text-xl md:text-2xl font-black text-emerald-900">
                    {tickets.length > 0 ? Math.round((tickets.filter(t => t.checkedIn).length / tickets.length) * 100) : 0}%
                  </p>
                  <p className="text-[9px] text-emerald-600/60 font-medium">
                    {tickets.filter(t => t.checkedIn).length} of {tickets.length} arrived
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="overflow-hidden min-h-[300px]">
        <VotingTrendChart 
          transactions={trends} 
          days={7} 
          label={event.type === 'ticketing' ? 'Sales' : 'Voting'}
          unit={event.type === 'ticketing' ? 'Tickets' : 'Votes'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nominee Performance */}
        <Card className="border-none shadow-sm">
          <CardHeader className="py-4 md:py-6">
            <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2">
              <BarChart3 size={18} className="text-slate-400" />
              {event.type === 'ticketing' ? 'Top Selling Tiers' : 'Top Performing Nominees'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="space-y-3 md:space-y-4">
              {(event as any).categories?.flatMap((cat: any) => cat.nominees || [])
                .sort((a: any, b: any) => (b.voteCount || 0) - (a.voteCount || 0))
                .slice(0, 5)
                .map((nominee: any, i: number) => (
                  <div key={nominee.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] md:text-xs font-black text-slate-300">#{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-bold text-slate-800 truncate">{nominee.name}</p>
                        <p className="text-[9px] md:text-[10px] text-slate-400 font-medium truncate">{(event as any).categories?.find((c: any) => c.id === nominee.categoryId)?.name}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs md:text-sm font-black text-slate-900">{nominee.voteCount?.toLocaleString() || 0}</p>
                      <p className="text-[9px] md:text-[10px] text-slate-400 font-medium uppercase">
                        {event.type === 'ticketing' ? 'Sold' : 'Votes'}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction History Summary */}
        <Card className="border-none shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity size={18} className="text-slate-400" />
              Latest activity
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full">
                <Activity size={40} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">Detailed transaction logs coming soon</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
