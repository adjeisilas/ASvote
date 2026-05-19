import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Shield, Clock, User, Info } from 'lucide-react';
import { formatSafeDate } from '../../lib/utils';

interface SystemLog {
  id: string;
  admin_id: string;
  action: string;
  details: any;
  target_id: string;
  created_at: string;
  profiles: {
    display_name: string;
  };
}

interface SystemLogsTableProps {
  logs: SystemLog[];
}

export default function SystemLogsTable({ logs }: SystemLogsTableProps) {
  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('update') || a.includes('edit')) return 'bg-blue-100 text-blue-700';
    if (a.includes('delete') || a.includes('remove')) return 'bg-red-100 text-red-700';
    if (a.includes('approve') || a.includes('create')) return 'bg-emerald-100 text-emerald-700';
    if (a.includes('broadcast')) return 'bg-purple-100 text-purple-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="rounded-xl border border-slate-100 overflow-x-auto bg-white shadow-sm no-scrollbar">
      <Table className="min-w-[700px] md:min-w-0">
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="w-[180px]">Timestamp</TableHead>
            <TableHead className="w-[150px]">Admin</TableHead>
            <TableHead className="w-[180px]">Action</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-40 text-center text-slate-400 italic">
                No system logs recorded yet.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-slate-50/30 transition-colors">
                <TableCell className="text-xs text-slate-500 font-mono">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-300" />
                    {formatSafeDate(log.created_at, 'MMM d, HH:mm:ss')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                      {log.profiles?.display_name?.charAt(0) || 'A'}
                    </div>
                    <span className="text-xs font-medium text-slate-700">
                      {log.profiles?.display_name || 'System Admin'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`border-none px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${getActionColor(log.action)}`}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-slate-600 font-medium">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </p>
                    {log.target_id && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Target ID: {log.target_id}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
