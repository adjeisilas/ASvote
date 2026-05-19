import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format, parseISO, startOfHour, eachHourOfInterval, subDays, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Activity, Info } from 'lucide-react';

interface VotingTrendChartProps {
  transactions: any[];
  days?: number;
  label?: string;
  unit?: string;
}

export default function VotingTrendChart({ transactions, days = 7, label = "Voting", unit = "Votes" }: VotingTrendChartProps) {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const now = new Date();
    const startDate = subDays(now, days);

    // Create a map of all hours in the interval to ensure we have zero-points
    const hoursInInterval = eachHourOfInterval({
      start: startOfHour(startDate),
      end: startOfHour(now)
    });

    const hourlyDataMap = new Map();
    hoursInInterval.forEach(hour => {
      hourlyDataMap.set(format(hour, 'yyyy-MM-dd HH:00'), 0);
    });

    // Fill map with actual transaction data
    transactions.forEach(tx => {
      const txDate = parseISO(tx.created_at);
      if (isWithinInterval(txDate, { start: startDate, end: now })) {
        const hourKey = format(startOfHour(txDate), 'yyyy-MM-dd HH:00');
        if (hourlyDataMap.has(hourKey)) {
          hourlyDataMap.set(hourKey, hourlyDataMap.get(hourKey) + (tx.votes || 0));
        }
      }
    });

    // Convert map to sorted array
    return Array.from(hourlyDataMap.entries()).map(([time, votes]) => ({
      time,
      votes,
      displayTime: format(parseISO(time), days > 1 ? 'MMM d, HH:00' : 'HH:00')
    }));
  }, [transactions, days]);

  const totalVotes = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.votes, 0);
  }, [chartData]);

  const peakVotes = useMemo(() => {
    return Math.max(...chartData.map(d => d.votes), 0);
  }, [chartData]);

  if (transactions.length === 0) {
    return (
      <Card className="border-none shadow-sm h-full">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity size={18} className="text-indigo-500" />
            {label} Velocity
          </CardTitle>
          <p className="text-xs text-slate-500">Hourly {unit.toLowerCase()} trends over the last {days} days</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center bg-accent rounded-2xl border border-dashed border-border text-center p-6">
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-3 shadow-sm">
              <Activity size={24} className="text-muted-foreground/30" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">No {unit.toLowerCase()} activity found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Activity trends will appear once {label.toLowerCase()} starts.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity size={18} className="text-indigo-500" />
              {label} Velocity
            </CardTitle>
            <p className="text-xs text-muted-foreground">Hourly {unit.toLowerCase()} trends over the last {days} days</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Peak Activity</p>
            <p className="text-xl font-black text-foreground">{peakVotes} <span className="text-[10px] text-muted-foreground">{unit.charAt(0).toUpperCase()}PH</span></p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis 
                dataKey="displayTime" 
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)' }}
                labelStyle={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '4px', fontWeight: 'bold' }}
                cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="votes" 
                name={unit}
                stroke="#4f46e5" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorVotes)" 
                animationDuration={1500}
              />
              {peakVotes > 0 && (
                <ReferenceLine y={peakVotes} stroke="#4f46e5" strokeDasharray="3 3" opacity={0.2} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex items-center justify-between p-3 bg-accent/50 rounded-xl border border-border transition-colors">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Live Analytics</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Info size={12} className="text-muted-foreground/40" />
                <span className="text-[10px] font-medium text-muted-foreground/60">Data aggregated every 60 minutes</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
