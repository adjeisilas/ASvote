import React, { useState, useEffect } from 'react';
import { databaseService } from '../../services/database';
import { Ticket } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Search, QrCode, CheckCircle2, XCircle, Loader2, Calendar, Mail, User, Clock, MapPin, Camera, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';

export default function TicketManagement() {
  const { eventId } = useParams<{ eventId: string }>();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const fetchTickets = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const data = await databaseService.getTickets({ eventId });
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [eventId]);

  useEffect(() => {
    let scanner: any = null;
    if (isScannerOpen) {
      setTimeout(async () => {
        try {
          const { Html5QrcodeScanner } = await import('html5-qrcode');
          scanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
          );
          scanner.render((result) => {
            setSearchQuery(result);
            setIsScannerOpen(false);
            scanner?.clear();
            toast.success("Code scanned successfully!");
          }, (error) => {
            // ignore
          });
        } catch (err) {
          console.error("Failed to load scanner:", err);
        }
      }, 300);
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [isScannerOpen]);

  const handleCheckIn = async (ticketId: string) => {
    setIsCheckingIn(ticketId);
    try {
      await databaseService.checkInTicket(ticketId);
      toast.success("Ticket checked in successfully!");
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, checkedIn: true, checkedInAt: new Date().toISOString() } : t));
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Check-in failed");
    } finally {
      setIsCheckingIn(null);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.qrCode?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.voterEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ticket Management</h1>
          <p className="text-slate-500 text-sm mt-1">Check-in attendees and manage individual tickets.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
            <DialogTrigger
              render={
                <Button className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shrink-0">
                  <Camera size={18} />
                  <span className="hidden sm:inline">Camera Scan</span>
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Scan Ticket QR Code</DialogTitle>
                <DialogDescription>
                  Align the guest's QR code within the frame to verify it automatically.
                </DialogDescription>
              </DialogHeader>
              <div id="qr-reader" className="w-full overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50 min-h-[300px]" />
              <div className="mt-4 flex justify-center">
                 <Button variant="secondary" onClick={() => setIsScannerOpen(false)} className="rounded-xl">
                   Cancel Scanning
                 </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="relative flex-1 md:w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Search code or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-200"
            />
          </div>
          <Button onClick={fetchTickets} variant="outline" className="h-11 rounded-xl" title="Refresh List">
             <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="font-bold text-slate-400">Loading tickets...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
          <CardContent className="py-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
              <QrCode size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Tickets Found</h3>
            <p className="text-slate-500 text-sm max-w-xs mt-1">
              Either no tickets have been sold yet or your search didn't match any record.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden group">
              <div className={cn(
                "h-2 w-full",
                ticket.checkedIn ? "bg-emerald-500" : "bg-indigo-500"
              )} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">QR CODE</p>
                    <p className="text-lg font-black text-slate-900 font-mono">{ticket.qrCode}</p>
                  </div>
                  <Badge className={cn(
                    "rounded-full px-3 py-1 font-bold text-[9px] uppercase tracking-widest border-none",
                    ticket.checkedIn ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                  )}>
                    {ticket.checkedIn ? 'CHECKED IN' : 'VALID'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <QrCode size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Ticket Tier</p>
                      <p className="text-xs font-bold text-slate-900">{ticket.tierName || 'Standard'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Mail size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Purchased By</p>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{ticket.voterEmail || 'Anonymous'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Purchase Date</p>
                      <p className="text-xs font-bold text-slate-900">{format(new Date(ticket.createdAt), 'MMM d, yyyy • HH:mm')}</p>
                    </div>
                  </div>

                  {ticket.checkedIn && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Clock size={14} />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-emerald-600 uppercase">Check-in Time</p>
                        <p className="text-xs font-bold text-emerald-700">{format(new Date(ticket.checkedInAt), 'HH:mm:ss')}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50">
                  {ticket.checkedIn ? (
                    <div className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-xs">
                      <CheckCircle2 size={16} /> Verified & Admitted
                    </div>
                  ) : (
                    <Button 
                      className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] tracking-widest shadow-lg shadow-indigo-100"
                      onClick={() => handleCheckIn(ticket.id)}
                      disabled={isCheckingIn === ticket.id}
                    >
                      {isCheckingIn === ticket.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'CHECK-IN NOW'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
