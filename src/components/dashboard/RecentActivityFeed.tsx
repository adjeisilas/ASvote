import React, { useState } from 'react';
import { 
  PlusCircle, 
  ArrowUpRight, 
  Wallet, 
  AlertCircle, 
  TrendingUp, 
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn, formatSafeDistanceToNow, slugify } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

interface Activity {
  id: string;
  type: 'event_created' | 'large_payment' | 'withdrawal_request';
  timestamp: string;
  details: {
    id?: string;
    title?: string;
    organizer?: string;
    organizerId?: string;
    amount?: number;
    event?: string;
    status?: string;
  };
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

export default function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const displayedActivities = showAll ? activities : activities.slice(0, 3);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'event_created':
        return <PlusCircle className="text-indigo-600 dark:text-indigo-400" size={18} />;
      case 'large_payment':
        return <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={18} />;
      case 'withdrawal_request':
        return <Wallet className="text-amber-600 dark:text-amber-400" size={18} />;
      default:
        return <AlertCircle className="text-slate-600 dark:text-slate-400" size={18} />;
    }
  };

  const getActivityBg = (type: string) => {
    switch (type) {
      case 'event_created':
        return 'bg-indigo-50 dark:bg-indigo-950/45';
      case 'large_payment':
        return 'bg-emerald-50 dark:bg-emerald-950/45';
      case 'withdrawal_request':
        return 'bg-amber-50 dark:bg-amber-950/45';
      default:
        return 'bg-slate-50 dark:bg-slate-900/40';
    }
  };

  const handleNavigate = (activity: Activity) => {
    const { type, details } = activity;
    if (!details.id && !details.organizerId) return;

    if (type === 'event_created') {
      navigate(`/admin/organizer/${details.organizerId}`);
    } else if (type === 'large_payment') {
      navigate(`/event/${slugify(details.event || '')}`);
    } else if (type === 'withdrawal_request') {
      navigate(`/admin/organizer/${details.id}`);
    }
  };

  const renderActivityContent = (activity: Activity) => {
    const { type, details, timestamp } = activity;
    const timeAgo = formatSafeDistanceToNow(timestamp);

    switch (type) {
      case 'event_created':
        return (
          <div className="flex flex-col">
            <p className="text-sm text-slate-950 dark:text-slate-100 font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              New Event Created <span className="font-medium text-slate-500 dark:text-slate-400 animate-none">by</span> {details.organizer}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 italic">
              "{details.title}"
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 flex items-center gap-1">
              <Clock size={10} /> {timeAgo}
            </span>
          </div>
        );
      case 'large_payment':
        return (
          <div className="flex flex-col">
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-bold group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
              Payment Recorded: {details.amount?.toLocaleString()} GHS
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              For event: <span className="font-bold text-slate-700 dark:text-slate-300">{details.event}</span>
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 flex items-center gap-1">
              <Clock size={10} /> {timeAgo}
            </span>
          </div>
        );
      case 'withdrawal_request':
        return (
          <div className="flex flex-col flex-1">
            <p className="text-sm text-slate-950 dark:text-slate-100 font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Withdrawal Requested <span className="font-medium text-amber-600 dark:text-amber-400 ml-1">{details.amount?.toLocaleString()} GHS</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organizer: <span className="font-medium text-slate-700 dark:text-slate-300">{details.organizer}</span>
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 flex items-center gap-1">
              <Clock size={10} /> {timeAgo}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-none shadow-sm h-full bg-card text-card-foreground">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-foreground">Platform Live Feed</CardTitle>
            <CardDescription className="text-muted-foreground">Real-time updates across the system.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-full justify-between pb-6">
        <div>
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Clock size={40} className="mb-2 opacity-10" />
              <p className="text-sm">No recent activity detected</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100 dark:before:bg-slate-800">
              {displayedActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="relative pl-12 group transition-all duration-300 cursor-pointer"
                  onClick={() => handleNavigate(activity)}
                >
                  <div className={cn(
                    "absolute left-0 top-0 w-10 h-10 rounded-xl flex items-center justify-center z-10 ring-2 ring-background shadow-xs transition-transform group-hover:scale-110",
                    getActivityBg(activity.type)
                  )}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex justify-between items-start">
                    {renderActivityContent(activity)}
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-lg transition-all translate-x-1 group-hover:translate-x-0">
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activities.length > 3 && (
          <div className="mt-6 pt-4 border-t border-border flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 group flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all h-8"
            >
              {showAll ? (
                <>
                  Show Less <ChevronUp size={14} className="transition-transform group-hover:-translate-y-0.5" />
                </>
              ) : (
                <>
                  View More ({activities.length - 3} more) <ChevronDown size={14} className="transition-transform group-hover:translate-y-0.5" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
