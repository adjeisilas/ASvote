import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  PlusCircle, 
  ArrowUpRight, 
  Wallet, 
  AlertCircle, 
  TrendingUp, 
  Clock,
  ChevronRight
} from 'lucide-react';
import { cn, formatSafeDistanceToNow } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useNavigate } from 'react-router-dom';

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'event_created':
        return <PlusCircle className="text-indigo-600" size={18} />;
      case 'large_payment':
        return <TrendingUp className="text-emerald-600" size={18} />;
      case 'withdrawal_request':
        return <Wallet className="text-amber-600" size={18} />;
      default:
        return <AlertCircle className="text-slate-600" size={18} />;
    }
  };

  const getActivityBg = (type: string) => {
    switch (type) {
      case 'event_created':
        return 'bg-indigo-50';
      case 'large_payment':
        return 'bg-emerald-50';
      case 'withdrawal_request':
        return 'bg-amber-50';
      default:
        return 'bg-slate-50';
    }
  };

  const handleNavigate = (activity: Activity) => {
    const { type, details } = activity;
    if (!details.id && !details.organizerId) return;

    if (type === 'event_created') {
      navigate(`/admin/organizer/${details.organizerId}`);
    } else if (type === 'large_payment') {
      navigate(`/event/${details.id}`);
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
            <p className="text-sm text-slate-900 font-bold group-hover:text-indigo-600 transition-colors">
              New Event Created <span className="font-medium text-slate-500">by</span> {details.organizer}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">
              "{details.title}"
            </p>
            <span className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
              <Clock size={10} /> {timeAgo}
            </span>
          </div>
        );
      case 'large_payment':
        return (
          <div className="flex flex-col">
            <p className="text-sm text-slate-900 font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
              Payment Recorded: {details.amount?.toLocaleString()} GHS
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              For event: <span className="font-bold text-slate-700">{details.event}</span>
            </p>
            <span className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
              <Clock size={10} /> {timeAgo}
            </span>
          </div>
        );
      case 'withdrawal_request':
        return (
          <div className="flex flex-col">
            <p className="text-sm text-slate-900 font-bold group-hover:text-indigo-600 transition-colors">
              Withdrawal Requested <span className="font-medium text-slate-500 text-amber-600 ml-1">{details.amount?.toLocaleString()} GHS</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Organizer: <span className="font-medium text-slate-700">{details.organizer}</span>
            </p>
            <span className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
              <Clock size={10} /> {timeAgo}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-none shadow-sm h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Platform Live Feed</CardTitle>
            <CardDescription>Real-time updates across the system.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Clock size={40} className="mb-2 opacity-10" />
            <p className="text-sm">No recent activity detected</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
            {activities.map((activity, index) => (
              <div 
                key={activity.id} 
                className="relative pl-12 group transition-all duration-300 cursor-pointer"
                onClick={() => handleNavigate(activity)}
              >
                <div className={cn(
                  "absolute left-0 top-0 w-10 h-10 rounded-xl flex items-center justify-center z-10 ring-2 ring-white shadow-sm transition-transform group-hover:scale-110",
                  getActivityBg(activity.type)
                )}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex justify-between items-start">
                  {renderActivityContent(activity)}
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-50 rounded-lg transition-all translate-x-1 group-hover:translate-x-0">
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
