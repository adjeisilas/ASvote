import React, { useState, useEffect } from 'react';
import { databaseService } from '../../services/database';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Calendar, 
  Mail, 
  User, 
  Clock, 
  Camera, 
  Search,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { cn } from '../../lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';

export default function GlobalTicketScanner() {
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedTicket, setScannedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    let html5QrCode: any = null;
    
    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        html5QrCode = new Html5Qrcode("global-qr-reader");
        const qrCodeSuccessCallback = (decodedText: string) => {
          setSearchQuery(decodedText);
          setIsScannerOpen(false);
          handleSearch(decodedText);
          if (html5QrCode) {
            html5QrCode.stop().catch(console.error);
          }
        };
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        await html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, () => {});
      } catch (err: any) {
        console.error("Camera error:", err);
        if (err?.name === 'NotAllowedError' || err === 'NotAllowedError') {
          toast.error("Camera access denied. Please allow camera permissions in your browser settings.");
        } else {
          toast.error("Could not start camera: " + (err?.message || "Unknown error"));
        }
      }
    };

    if (isScannerOpen) {
      setTimeout(startScanner, 500); // Give dialog time to animate
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [isScannerOpen]);

  const handleSearch = async (codeOverride?: string) => {
    const code = codeOverride || searchQuery;
    if (!code || code.length < 4) {
      toast.error("Please enter a valid ticket code");
      return;
    }

    setLoading(true);
    setScannedTicket(null);
    try {
      const ticket = await databaseService.getTicketByQrCode(code);
      if (ticket) {
        setScannedTicket(ticket);
        toast.success("Ticket found!");
      }
    } catch (error: any) {
      console.error("Lookup error:", error);
      toast.error(error.message || "Ticket not found or invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!scannedTicket) return;
    setIsCheckingIn(true);
    try {
      await databaseService.checkInTicket(scannedTicket.id);
      toast.success("Guest checked in successfully!");
      setScannedTicket({ 
        ...scannedTicket, 
        checkedIn: true, 
        checkedInAt: new Date().toISOString(),
        justAdmitted: true // Added flag to distinguish from already-used tickets
      });
    } catch (error: any) {
      console.error("Check-in error:", error);
      toast.error("Check-in failed: " + (error.message || "Unknown error"));
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setScannedTicket(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-2 sm:px-4">
      <div className="text-center space-y-1 md:space-y-2">
        <h1 className="text-xl xs:text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Entry Scanner</h1>
        <p className="text-slate-500 text-[11px] md:text-sm">Verify guest tickets instantly via camera or manual code entry.</p>
      </div>

      <Card className="border-none shadow-xl shadow-indigo-100/50 rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-4 xs:p-6 md:p-12">
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex gap-2 md:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
                <Input 
                  placeholder="Enter ticket code..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 md:pl-12 h-11 md:h-14 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50 text-xs md:text-lg font-mono font-bold tracking-wider md:tracking-widest focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                />
              </div>
              
              <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                <DialogTrigger
                  render={
                    <Button className="h-11 w-11 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 shrink-0 flex items-center justify-center p-0">
                      <Camera className="w-4 h-4 md:w-6 md:h-6" />
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-md bg-white">
                  <DialogHeader>
                    <DialogTitle>Camera Scanner</DialogTitle>
                    <DialogDescription>
                      Point your camera at the guest's ticket QR code.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="relative w-full aspect-square overflow-hidden rounded-2xl border-2 border-slate-100 bg-black">
                    <div id="global-qr-reader" className="w-full h-full" />
                    <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 border-dashed opacity-50" />
                  </div>
                  <div className="mt-4 flex justify-center">
                    <Button variant="secondary" onClick={() => setIsScannerOpen(false)} className="rounded-xl">
                      Close Scanner
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Button 
              onClick={() => handleSearch()} 
              disabled={loading || !searchQuery}
              className="w-full h-11 md:h-14 rounded-xl md:rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs md:text-sm tracking-[0.1em] md:tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 w-4 h-4 md:w-5 md:h-5" />}
              VERIFY TICKET
            </Button>
          </div>

          <div className="mt-6 md:mt-12">
            {!scannedTicket && !loading && (
              <div className="py-10 md:py-20 border-2 border-dashed border-slate-100 rounded-2xl md:rounded-[2rem] flex flex-col items-center justify-center text-slate-300">
                <div className="w-12 h-12 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 md:mb-6">
                  <QrCode className="w-6 h-6 md:w-10 md:h-10 opacity-30" />
                </div>
                <p className="text-xs md:text-sm font-bold text-slate-400">Ready to scan guest ticket</p>
                <p className="text-[9px] md:text-[10px] uppercase tracking-widest mt-1 text-slate-300">Enter a code or use the camera</p>
              </div>
            )}

            {loading && (
              <div className="py-10 md:py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 md:w-16 md:h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                <p className="text-xs md:text-sm font-bold text-indigo-600">Checking ticket records...</p>
              </div>
            )}

            {scannedTicket && (
              <div className="space-y-4 md:space-y-6 animate-in zoom-in-95 duration-300">
                <div className={cn(
                  "p-4 md:p-8 rounded-2xl md:rounded-[2rem] border-2 transition-all",
                  scannedTicket.justAdmitted
                    ? "bg-emerald-50 border-emerald-400 shadow-lg shadow-emerald-100/50"
                    : scannedTicket.checkedIn 
                      ? "bg-amber-50/50 border-amber-200" 
                      : "bg-indigo-50/30 border-indigo-100"
                )}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-6 mb-4 md:mb-8">
                    <div className="space-y-0.5 md:space-y-1">
                      <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">Ticket Validated</p>
                      <h3 className="text-base md:text-2xl font-black text-slate-900 tracking-tight leading-none break-words">
                        {scannedTicket.eventTitle}
                      </h3>
                      <p className="text-indigo-600 font-extrabold text-[10px] md:text-sm uppercase tracking-wider">{scannedTicket.tierName || 'General Entry'}</p>
                    </div>
                    <Badge className={cn(
                      "rounded-full px-2.5 py-1 md:px-4 md:py-2 font-black text-[8px] md:text-[10px] uppercase tracking-widest border-none shadow-sm",
                      scannedTicket.justAdmitted
                        ? "bg-emerald-600 text-white animate-bounce"
                        : scannedTicket.checkedIn 
                          ? "bg-amber-100 text-amber-700 ring-4 ring-amber-50" 
                          : "bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50"
                    )}>
                      {scannedTicket.justAdmitted ? 'CHECKED IN SUCCESS' : scannedTicket.checkedIn ? 'ALREADY USED' : 'READY TO ADMIT'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl shadow-sm border border-slate-50">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                        <User className="text-indigo-500 w-3 h-3 md:w-3.5 md:h-3.5" />
                        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Recipient Name</p>
                      </div>
                      <p className="text-xs md:text-base font-black text-slate-900 truncate uppercase tracking-tight">{scannedTicket.holderName || 'VALUED GUEST'}</p>
                      <p className="text-[9px] md:text-[10px] text-slate-500 font-bold truncate opacity-60 flex items-center gap-1 mt-0.5">
                        <Mail className="w-2.5 h-2.5" /> {scannedTicket.voterEmail || 'No email'}
                      </p>
                    </div>
                    <div className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl shadow-sm border border-slate-50">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                        <QrCode className="text-slate-400 w-3 h-3 md:w-3.5 md:h-3.5" />
                        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Ticket Code</p>
                      </div>
                      <p className="text-xs md:text-sm font-bold text-slate-900 font-mono tracking-wider">{scannedTicket.qrCode}</p>
                    </div>
                  </div>

                  {scannedTicket.checkedIn && !scannedTicket.justAdmitted && (
                    <div className="mt-4 md:mt-6 flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-amber-100/50 rounded-xl md:rounded-2xl text-amber-700 border border-amber-200">
                      <AlertTriangle className="shrink-0 w-4 h-4 md:w-5 md:h-5" />
                      <div>
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-tight animate-pulse">Warning: Second Entry Attempt</p>
                        <p className="text-[8px] md:text-[10px] font-bold opacity-85">
                          Checked in at: {scannedTicket.checkedInAt ? format(new Date(scannedTicket.checkedInAt), 'MMM d, HH:mm:ss') : 'Unknown Time'}
                        </p>
                      </div>
                    </div>
                  )}

                  {scannedTicket.justAdmitted && (
                    <div className="mt-4 md:mt-6 flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-emerald-100 rounded-xl md:rounded-2xl text-emerald-700 border border-emerald-200 animate-pulse">
                      <CheckCircle2 className="shrink-0 w-4 h-4 md:w-6 md:h-6" />
                      <div>
                        <p className="text-xs md:text-sm font-black uppercase tracking-tight">Access Granted</p>
                        <p className="text-[9px] md:text-[10px] font-bold opacity-85">The guest is now admitted to the event.</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 md:mt-10 flex flex-col sm:flex-row gap-2 md:gap-3">
                    {!scannedTicket.checkedIn ? (
                      <Button 
                        onClick={handleCheckIn}
                        disabled={isCheckingIn}
                        className="flex-1 h-11 md:h-16 rounded-xl md:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs md:text-sm tracking-[0.1em] md:tracking-[0.2em] shadow-xl shadow-emerald-100 active:scale-95 transition-all"
                      >
                        {isCheckingIn ? <Loader2 className="animate-spin w-4 h-4" /> : "ADMIT GUEST (CHECK-IN)"}
                      </Button>
                    ) : (
                      <div className={cn(
                        "flex-1 h-11 md:h-16 flex items-center justify-center gap-1.5 md:gap-2 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest",
                        scannedTicket.justAdmitted ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-slate-100 text-slate-400"
                      )}>
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> {scannedTicket.justAdmitted ? 'GUEST ADMITTED' : 'ALREADY USED'}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={handleReset}
                      className="h-11 md:h-16 px-4 md:px-8 rounded-xl md:rounded-2xl border-slate-200 font-bold text-xs md:text-sm text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Clear & New Scan
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center gap-3 md:gap-6">
        <div className="flex items-center gap-1.5 md:gap-2 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Real-time sync</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 text-slate-400">
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Auto-validate</span>
        </div>
      </div>
    </div>
  );
}
