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
import { Html5Qrcode } from 'html5-qrcode';
import { cn } from '../../lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';

export default function GlobalTicketScanner() {
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedTicket, setScannedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    
    const startScanner = async () => {
      try {
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
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Entry Scanner</h1>
        <p className="text-slate-500 text-sm">Verify guest tickets instantly via camera or manual code entry.</p>
      </div>

      <Card className="border-none shadow-xl shadow-indigo-100/50 rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-8 md:p-12">
          <div className="flex flex-col gap-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input 
                  placeholder="Enter ticket code manually..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50 text-lg font-mono font-bold tracking-widest focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                />
              </div>
              
              <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                <DialogTrigger
                  render={
                    <Button className="h-14 w-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 shrink-0">
                      <Camera size={24} />
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
              className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode size={18} className="mr-2" />}
              VERIFY TICKET
            </Button>
          </div>

          <div className="mt-12">
            {!scannedTicket && !loading && (
              <div className="py-20 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <QrCode size={40} className="opacity-30" />
                </div>
                <p className="text-sm font-bold text-slate-400">Ready to scan guest ticket</p>
                <p className="text-[10px] uppercase tracking-widest mt-1 text-slate-300">Enter a code or use the camera</p>
              </div>
            )}

            {loading && (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                <p className="text-sm font-bold text-indigo-600">Checking ticket records...</p>
              </div>
            )}

            {scannedTicket && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className={cn(
                  "p-8 rounded-[2rem] border-2 transition-all",
                  scannedTicket.justAdmitted
                    ? "bg-emerald-50 border-emerald-400 shadow-lg shadow-emerald-100/50"
                    : scannedTicket.checkedIn 
                      ? "bg-amber-50/50 border-amber-200" 
                      : "bg-indigo-50/30 border-indigo-100"
                )}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">Ticket Validated</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                        {scannedTicket.eventTitle}
                      </h3>
                      <p className="text-indigo-600 font-bold text-sm uppercase tracking-wider">{scannedTicket.tierName || 'General Entry'}</p>
                    </div>
                    <Badge className={cn(
                      "rounded-full px-4 py-2 font-black text-[10px] uppercase tracking-widest border-none shadow-sm",
                      scannedTicket.justAdmitted
                        ? "bg-emerald-600 text-white animate-bounce"
                        : scannedTicket.checkedIn 
                          ? "bg-amber-100 text-amber-700 ring-4 ring-amber-50" 
                          : "bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50"
                    )}>
                      {scannedTicket.justAdmitted ? 'CHECKED IN SUCCESS' : scannedTicket.checkedIn ? 'ALREADY USED' : 'READY TO ADMIT'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-50">
                      <div className="flex items-center gap-2 mb-2">
                        <User size={12} className="text-indigo-500" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recipient Name</p>
                      </div>
                      <p className="text-base font-black text-slate-900 truncate uppercase tracking-tight">{scannedTicket.holderName || 'VALUED GUEST'}</p>
                      <p className="text-[10px] text-slate-500 font-bold truncate opacity-60 flex items-center gap-1">
                        <Mail size={10} /> {scannedTicket.voterEmail || 'No email'}
                      </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-50">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode size={12} className="text-slate-400" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ticket Code</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 font-mono tracking-wider">{scannedTicket.qrCode}</p>
                    </div>
                  </div>

                  {scannedTicket.checkedIn && !scannedTicket.justAdmitted && (
                    <div className="mt-6 flex items-center gap-3 p-4 bg-amber-100/50 rounded-2xl text-amber-700 border border-amber-200">
                      <AlertTriangle size={20} className="shrink-0" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight">Warning: Second Entry Attempt</p>
                        <p className="text-[10px] font-bold opacity-80">
                          Checked in at: {scannedTicket.checkedInAt ? format(new Date(scannedTicket.checkedInAt), 'MMM d, HH:mm:ss') : 'Unknown Time'}
                        </p>
                      </div>
                    </div>
                  )}

                  {scannedTicket.justAdmitted && (
                    <div className="mt-6 flex items-center gap-3 p-4 bg-emerald-100 rounded-2xl text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={24} className="shrink-0" />
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight">Access Granted</p>
                        <p className="text-[10px] font-bold opacity-80">The guest is now admitted to the event.</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-10 flex flex-col sm:flex-row gap-3">
                    {!scannedTicket.checkedIn ? (
                      <Button 
                        onClick={handleCheckIn}
                        disabled={isCheckingIn}
                        className="flex-1 h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm tracking-[0.2em] shadow-xl shadow-emerald-100"
                      >
                        {isCheckingIn ? <Loader2 className="animate-spin" /> : "ADMIT GUEST (CHECK-IN)"}
                      </Button>
                    ) : (
                      <div className={cn(
                        "flex-1 h-16 flex items-center justify-center gap-2 rounded-2xl font-black text-sm uppercase tracking-widest",
                        scannedTicket.justAdmitted ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        <CheckCircle2 size={20} /> {scannedTicket.justAdmitted ? 'GUEST ADMITTED' : 'ALREADY USED'}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={handleReset}
                      className="h-16 px-8 rounded-2xl border-slate-200 font-bold text-slate-500 hover:bg-slate-50"
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
      
      <div className="flex justify-center gap-6">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Real-time sync active</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <RefreshCw size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Auto-validation enabled</span>
        </div>
      </div>
    </div>
  );
}
