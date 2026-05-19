import React from 'react';
import { Trophy, Medal, Crown, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface Performer {
  id?: string;
  name: string;
  revenue: number;
  count: number;
}

interface TopPerformersLeaderboardProps {
  topEvents: Performer[];
  topOrganizers: Performer[];
}

export default function TopPerformersLeaderboard({ topEvents, topOrganizers }: TopPerformersLeaderboardProps) {
  const navigate = useNavigate();

  const handleNavigate = (item: Performer, type: 'event' | 'organizer') => {
    if (!item.id) return;
    if (type === 'event') {
      navigate(`/event/${item.id}`);
    } else {
      navigate(`/admin/organizer/${item.id}`);
    }
  };

  const renderItem = (item: Performer, index: number, type: 'event' | 'organizer') => {
    const isFirst = index === 0;
    const isSecond = index === 1;
    const isThird = index === 2;

    return (
      <div 
        key={item.id || item.name} 
        className={cn(
          "flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:bg-slate-50 cursor-pointer group",
          isFirst && "bg-indigo-50/30 border border-indigo-100"
        )}
        onClick={() => handleNavigate(item, type)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black",
            isFirst ? "bg-amber-100 text-amber-600" : 
            isSecond ? "bg-slate-200 text-slate-600" : 
            isThird ? "bg-orange-100 text-orange-600" :
            "bg-slate-100 text-slate-400"
          )}>
            {isFirst ? <Crown size={14} /> : index + 1}
          </div>
          <div className="flex flex-col">
            <span className={cn("text-sm font-bold truncate max-w-[150px] group-hover:text-indigo-600 transition-colors", isFirst ? "text-indigo-900" : "text-slate-700")}>
              {item.name}
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              {item.count} Transactions
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-black text-slate-900">
            {item.revenue.toLocaleString()} <span className="text-[10px] text-slate-400">GHS</span>
          </div>
          <div className="flex items-center justify-end gap-1 text-emerald-500">
            <TrendingUp size={10} />
            <span className="text-[10px] font-bold">Top performer</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-none shadow-sm h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500" size={20} />
            <CardTitle className="text-lg">Top Events</CardTitle>
          </div>
          <CardDescription>Highest grossing events this month.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {topEvents.length > 0 ? (
             topEvents.map((e, i) => renderItem(e, i, 'event'))
          ) : (
            <p className="text-center py-6 text-slate-400 text-sm italic">No data yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="text-indigo-600" size={20} />
            <CardTitle className="text-lg">Star Organizers</CardTitle>
          </div>
          <CardDescription>Most successful account holders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {topOrganizers.length > 0 ? (
             topOrganizers.map((o, i) => renderItem(o, i, 'organizer'))
          ) : (
            <p className="text-center py-6 text-slate-400 text-sm italic">No data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
