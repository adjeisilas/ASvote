import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Nominee, Event, Category } from '../../types';
import PaystackPop from '@paystack/inline-js';
import { toast } from 'sonner';
import { databaseService } from '../../services/database';
import axios from 'axios';
import { Loader2, CreditCard, ShieldCheck, Plus, Minus, CheckCircle2, Ticket, Tag, Download, QrCode as QrIcon } from 'lucide-react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  nominee: Nominee | null;
  event: Event;
  categories: Category[];
  onVoteSuccess?: () => void;
  onOptimisticVote?: (voteCount: number, nomineeId: string) => void;
}

const DEFAULT_VOTE_PRICE = 1;

export default function PaymentModal({ isOpen, onClose, nominee, event, categories, onVoteSuccess, onOptimisticVote }: PaymentModalProps) {
  const [voteCount, setVoteCount] = useState(1);
  const [email, setEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchedTickets, setFetchedTickets] = useState<any[]>([]);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('idle');
      setIsProcessing(false);
      setErrorMessage(null);
      setFetchedTickets([]);
    }
  }, [isOpen]);

  const downloadTicket = async (ticket: any, index: number) => {
    setIsDownloading(ticket.id);
    try {
      const qrDataUrl = await QRCode.toDataURL(ticket.qrCode, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150]
      });

      // Design the ticket PDF
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 0, 100, 150, 'F');
      
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, 100, 40, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text('EVENT TICKET', 50, 15, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text(event.title.toUpperCase(), 50, 25, { align: 'center' });

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(14);
      pdf.text(recipientName || 'VALUED GUEST', 50, 52, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(nominee?.name || 'GENERIC ACCESS', 50, 58, { align: 'center' });
      
      pdf.setFontSize(8);
      pdf.text('CATEGORY', 50, 68, { align: 'center' });
      pdf.setTextColor(30, 41, 59);
      pdf.text(categories.find(c => c.id === ticket.categoryId)?.name || 'General', 50, 73, { align: 'center' });

      // QR Code
      pdf.addImage(qrDataUrl, 'PNG', 20, 80, 60, 60);

      pdf.setFontSize(10);
      pdf.setFont('courier', 'bold');
      pdf.text(ticket.qrCode, 50, 145, { align: 'center' });

      pdf.save(`Ticket-${ticket.qrCode}.pdf`);
      toast.success("Ticket downloaded successfully!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to generate ticket PDF.");
    } finally {
      setIsDownloading(null);
    }
  };

  const downloadAllTicketsAsPDF = async (tickets: any[]) => {
    if (!tickets || tickets.length === 0) return;
    setIsDownloading('all');
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150]
      });

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (i > 0) pdf.addPage([100, 150], 'portrait');

        const qrDataUrl = await QRCode.toDataURL(ticket.qrCode, {
          width: 400,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });

        // Design
        pdf.setFillColor(248, 250, 252);
        pdf.rect(0, 0, 100, 150, 'F');
        pdf.setFillColor(79, 70, 229);
        pdf.rect(0, 0, 100, 40, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text('EVENT TICKET', 50, 15, { align: 'center' });
        pdf.setFontSize(10);
        pdf.text(event.title.toUpperCase(), 50, 25, { align: 'center' });

        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(14);
        pdf.text(recipientName || 'VALUED GUEST', 50, 52, { align: 'center' });
        
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text(nominee?.name || 'GENERIC ACCESS', 50, 58, { align: 'center' });
        
        pdf.setFontSize(8);
        pdf.text('CATEGORY', 50, 68, { align: 'center' });
        pdf.setTextColor(30, 41, 59);
        pdf.text(categories.find(c => c.id === ticket.categoryId)?.name || 'General', 50, 73, { align: 'center' });

        pdf.addImage(qrDataUrl, 'PNG', 20, 80, 60, 60);
        pdf.setFontSize(10);
        pdf.setFont('courier', 'bold');
        pdf.text(ticket.qrCode, 50, 145, { align: 'center' });
      }

      pdf.save(`Tickets-${event.title.replace(/\s+/g, '-')}.pdf`);
      toast.success("All tickets downloaded successfully!");
    } catch (err) {
      console.error("Batch download error:", err);
      toast.error("Failed to generate combined PDF.");
    } finally {
      setIsDownloading(null);
    }
  };

  const getVotePrice = () => {
    if (!nominee) return DEFAULT_VOTE_PRICE;
    const category = categories.find(c => c.id === nominee.categoryId);
    // Support both 'votePrice' (voting) and 'price' (ticketing)
    return category?.price ?? category?.votePrice ?? event.votePrice ?? DEFAULT_VOTE_PRICE;
  };

  const votePrice = getVotePrice();
  const rawTotal = voteCount * votePrice;
  
  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    if (appliedPromo.discountType === 'percentage') {
      return (rawTotal * appliedPromo.discountValue) / 100;
    }
    return Math.min(rawTotal, appliedPromo.discountValue);
  };

  const discount = calculateDiscount();
  const finalTotal = Math.max(0, rawTotal - discount);

  const incrementVote = () => setVoteCount(prev => prev + 1);
  const decrementVote = () => setVoteCount(prev => Math.max(1, prev - 1));

  const voteDataForMetadata = {
    voter_email: email,
    event_id: event.id,
    organizer_id: event.organizerId,
    commission: event.commission || 0,
    category_id: nominee?.categoryId || (nominee as any)?.category_id || null,
    nominee_id: nominee?.id || null,
    amount: finalTotal,
    votes: voteCount,
    discount_applied: discount,
    promo_code_id: appliedPromo?.id || null,
    recipient_name: recipientName || null,
    type: event.type === 'ticketing' ? 'ticket' : 'vote'
  };

  const [showEscapeHatch, setShowEscapeHatch] = useState(false);

  useEffect(() => {
    let timer: any;
    if (paymentStatus === 'verifying') {
      setShowEscapeHatch(false);
      timer = setTimeout(() => {
        setShowEscapeHatch(true);
      }, 15000); // Show escape hatch after 15 seconds
    }
    return () => clearTimeout(timer);
  }, [paymentStatus]);

  const handleSuccess = async (response: any) => {
    setIsProcessing(true);
    setPaymentStatus('verifying');

    // Optimistic Update
    if (onOptimisticVote && nominee?.id) {
      onOptimisticVote(voteCount, nominee.id);
    }
    
    const paystackRef = response.reference || response.trxref || (typeof response === 'string' ? response : null);
    
    console.log('Payment successful, verifying ref:', paystackRef);

    if (!paystackRef) {
      setPaymentStatus('error');
      toast.error("Invalid payment reference received.");
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Record Vote via Secure Server Endpoint (Verifies & Records Atomically)
      console.log('Requesting secure vote recording...');
      
      const voteData = {
        voter_email: email,
        event_id: event.id,
        organizer_id: event.organizerId,
        commission: event.commission || 0,
        category_id: nominee?.categoryId || (nominee as any)?.category_id || null,
        nominee_id: nominee?.id || null,
        amount: finalTotal,
        votes: voteCount,
        discount_applied: discount,
        promo_code_id: appliedPromo?.id || null,
        recipient_name: recipientName || null,
        type: event.type === 'ticketing' ? 'ticket' : 'vote'
      };

      const result = await databaseService.recordVoteOnServer(voteData, paystackRef);
      
      console.log('Server-side processing result:', result);

      if (result.success || result.error?.includes('already processed')) {
        const transactionId = result.transaction?.id;
        
        if (event.type === 'ticketing' && transactionId) {
          try {
            // Priority 1: Use tickets returned directly from server response
            let tickets = result.transaction?.tickets || [];
            
            // Priority 2: If server didn't include them (legacy or unexpected), or if it was already processed without returning them
            if (tickets.length === 0) {
              let attempts = 0;
              while (attempts < 5 && (!tickets || tickets.length === 0)) {
                if (attempts > 0) await new Promise(r => setTimeout(r, 800)); // Wait between retries
                tickets = await databaseService.getTickets({ transactionId });
                attempts++;
              }
            }

            if (tickets && tickets.length > 0) {
              setFetchedTickets(tickets);
              // Automatically trigger batch download
              setTimeout(() => downloadAllTicketsAsPDF(tickets), 800);
            } else {
              console.warn("Tickets not found after multiple attempts");
            }
          } catch (e) {
            console.error("Failed to fetch tickets after purchase", e);
          }
        }

        setPaymentStatus('success');
        toast.success(event.type === 'ticketing' ? `Success! ${voteCount} tickets purchased.` : `Success! ${voteCount} votes cast for ${nominee?.name}`);
        
        if (onVoteSuccess) {
            onVoteSuccess();
        }
        
        // Increase delay if we are showing ticket details
        const closeDelay = event.type === 'ticketing' ? 10000 : 3000;
        
        setTimeout(() => {
          setPaymentStatus('idle');
          setIsProcessing(false);
          onClose();
        }, closeDelay);
      } else {
        console.warn('Server-side processing failed:', result);
        
        // Extract string message from potential error object
        let errResult = result.error || "Payment processing failed.";
        if (typeof errResult !== 'string') {
          errResult = errResult.message || errResult.details || JSON.stringify(errResult);
        }
        
        setErrorMessage(errResult);
        setPaymentStatus('error');
        toast.error(errResult);
        setIsProcessing(false);
        // Rollback optimistic UI by refreshing data
        if (onVoteSuccess) onVoteSuccess();
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      
      const responseData = error.response?.data;
      let msg = "An unexpected error occurred during verification";

      if (typeof responseData === 'string') {
        msg = responseData;
      } else if (responseData && typeof responseData === 'object') {
        msg = responseData.message || responseData.details || responseData.error || JSON.stringify(responseData);
      } else {
        msg = error.message || msg;
      }
      
      setErrorMessage(msg);
      setPaymentStatus('error');
      toast.error(`Verification error: ${msg}`);
      setIsProcessing(false);
      // Rollback optimistic UI by refreshing data
      if (onVoteSuccess) onVoteSuccess();
    }
  };

  const handleClose = () => {
    onClose();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    if (voteCount < 1) {
      toast.error("Please enter at least 1 vote.");
      return;
    }
    
    try {
      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
        email: email,
        amount: Math.round(finalTotal * 100),
        currency: 'GHS',
        reference: (new Date()).getTime().toString(),
        metadata: {
          custom_fields: [],
          voteData: voteDataForMetadata
        } as any,
        onSuccess: (transaction: any) => {
          handleSuccess(transaction);
        },
        onCancel: () => {
          handleClose();
        }
      });
    } catch (error) {
      console.error("Paystack initialization error:", error);
      toast.error("Failed to initialize payment gateway.");
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsCheckingPromo(true);
    setPromoError(null);
    try {
      const result = await databaseService.validatePromoCode(event.id, promoCode.trim());
      if (result) {
        setAppliedPromo(result);
        toast.success(`Promo code applied: ${result.discountType === 'percentage' ? result.discountValue + '%' : result.discountValue + ' GHS'} off!`);
      } else {
        setPromoError("Invalid or expired promo code");
      }
    } catch (error) {
      setPromoError("Error validating promo code");
    } finally {
      setIsCheckingPromo(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] bg-background/95 backdrop-blur-2xl transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
        
        <div className="p-6 md:p-10 relative flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="mb-4 md:mb-8 shrink-0">
            <div className="flex justify-between items-start">
              <div className="min-w-0 pr-4">
                <DialogTitle className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-1 md:mb-2 truncate">
                  {event.type === 'ticketing' ? 'Secure Ticket' : 'Cast Vote'}
                </DialogTitle>
                <DialogDescription className="text-[11px] md:text-sm font-medium text-muted-foreground leading-relaxed line-clamp-2">
                  {event.type === 'ticketing' ? (
                    <>Booking <span className="text-indigo-600 font-bold">{nominee?.name}</span> card</>
                  ) : (
                    <>Supporting <span className="text-indigo-600 font-bold">{nominee?.name}</span></>
                  )}
                </DialogDescription>
              </div>
              <div className="bg-indigo-500/10 p-2.5 md:p-3 rounded-2xl shrink-0">
                <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
              </div>
            </div>
          </DialogHeader>

          {paymentStatus !== 'idle' ? (
            <div className="py-8 md:py-16 flex flex-col items-center justify-center space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-500 min-h-[300px] overflow-y-auto">
              {paymentStatus === 'verifying' && (
                <>
                  <div className="relative">
                    <div className="w-24 h-24 border-b-4 border-l-4 border-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-black text-2xl text-foreground tracking-tight">
                      {event.type === 'ticketing' ? 'Processing Transaction' : 'Securing Your Vote'}
                    </h3>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Connecting to secure gateway...</p>
                    {showEscapeHatch ? (
                      <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <p className="text-xs text-muted-foreground font-medium px-6">
                          Verification is taking longer than expected. Your vote is likely being processed in the background.
                        </p>
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl border-border text-indigo-600 font-bold"
                            onClick={() => {
                              toast.info("Refreshing to check status...");
                              if (onVoteSuccess) onVoteSuccess();
                            }}
                          >
                            Refresh Status
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[10px] uppercase font-black tracking-widest text-muted-foreground"
                            onClick={onClose}
                          >
                            Close and return
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 flex gap-1 justify-center">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              {paymentStatus === 'success' && (
                <>
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20"
                  >
                    <CheckCircle2 size={56} />
                  </motion.div>
                  <div className="text-center">
                    <h3 className="font-black text-3xl text-foreground tracking-tight">
                      {event.type === 'ticketing' ? 'Ticket Secured' : 'Vote Confirmed'}
                    </h3>
                    <p className="text-base font-medium text-muted-foreground mt-3 leading-relaxed px-4">
                      {event.type === 'ticketing' ? (
                        <>Your reservation for the <span className="font-bold text-foreground">{nominee?.name}</span> tier has <br /> been confirmed successfully.</>
                      ) : (
                        <>Your support for <span className="font-bold text-foreground">{nominee?.name}</span> has <br /> been recorded successfully.</>
                      )}
                    </p>
                    <div className="mt-6 w-full space-y-3">
                      <div className="px-6 py-4 bg-accent rounded-2xl border border-border flex flex-col gap-1 items-center">
                         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                           {event.type === 'ticketing' ? 'Total Tickets Issued' : 'Total Votes Added'}
                         </span>
                         <span className="text-2xl font-black text-indigo-500">+{voteCount}</span>
                      </div>

                      {event.type === 'ticketing' && (
                        <div className="space-y-3 max-h-[320px] overflow-y-auto px-1 mt-6">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center mb-2">
                            {fetchedTickets.length > 0 ? "Your Digital Tickets" : "Preparing your tickets..."}
                          </p>
                          
                          {fetchedTickets.length === 0 ? (
                            <div className="py-10 flex flex-col items-center justify-center bg-accent rounded-2xl border border-dashed border-border">
                              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                              <p className="text-xs font-bold text-muted-foreground">Generating digital passes...</p>
                            </div>
                          ) : (
                            <>
                              {fetchedTickets.length > 1 && (
                                <Button 
                                  onClick={() => downloadAllTicketsAsPDF(fetchedTickets)}
                                  disabled={isDownloading === 'all'}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl py-6 shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 mb-4 border-none"
                                >
                                  {isDownloading === 'all' ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <><Download className="w-4 h-4" /> Download All Tickets (PDF)</>
                                  )}
                                </Button>
                              )}
                              
                              <div className="space-y-3 pb-4">
                                {fetchedTickets.map((t, idx) => (
                                  <div key={t.id} className="flex flex-col p-4 bg-accent border border-border rounded-2xl gap-3">
                                    <div className="flex justify-between items-center">
                                      <div className="flex flex-col items-start">
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Ticket #{idx + 1}</span>
                                        <span className="font-mono font-black text-foreground tracking-tighter text-sm">{t.qrCode}</span>
                                      </div>
                                      <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        onClick={() => downloadTicket(t, idx)}
                                        disabled={isDownloading === t.id || isDownloading === 'all'}
                                        className="rounded-xl bg-background text-foreground hover:bg-accent font-bold h-9 border-border"
                                      >
                                        {isDownloading === t.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <><Download className="w-3.5 h-3.5 mr-1.5" /> PDF</>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[9px] text-muted-foreground text-center mt-4 font-medium italic pb-2">
                                Your tickets have been automatically downloaded. An email with PDF attachments has also been sent.
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-6 animate-pulse">This window will close automatically...</p>
                  </div>
                </>
              )}
              {paymentStatus === 'error' && (
                <>
                  <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 border-2 border-rose-500/20">
                    <ShieldCheck size={48} className="rotate-180" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-black text-2xl text-foreground tracking-tight">
                      {errorMessage ? "Recording Failed" : "Status Unknown"}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground mt-3 max-w-[250px] mx-auto leading-relaxed px-4">
                      {errorMessage ? (
                        <span className="text-rose-500 font-bold block mb-2">Error: {errorMessage}</span>
                      ) : (
                        <>If you've completed payment but see this, <span className="text-indigo-600 font-bold">don't worry</span>. Your vote is processing in the background. </>
                      )}
                    </p>
                    <div className="mt-8 flex flex-col gap-3 px-4 w-full">
                      <Button variant="outline" className="w-full h-14 rounded-2xl border-2 border-border font-bold hover:bg-accent transition-all" onClick={() => setPaymentStatus('idle')}>
                        TRY AGAIN
                      </Button>
                      <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground" onClick={onClose}>
                        CLOSE MODAL
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col min-h-0 flex-1">
              <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-6 space-y-5 min-h-0">
                {event.type === 'ticketing' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-4 duration-500">
                    <Label htmlFor="recipientName" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Recipient Name</Label>
                    <Input 
                      id="recipientName" 
                      type="text" 
                      placeholder="Enter the name of the attendee" 
                      required 
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="h-11 rounded-xl border-border bg-accent/50 focus:bg-background transition-all font-bold shadow-none text-xs"
                    />
                    <p className="text-[8px] text-muted-foreground ml-1 italic">This name will be verified during ticket scanning.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Receipt Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter email for ticket" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-xl border-border bg-accent/50 focus:bg-background transition-all font-bold shadow-none text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="votes" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      {event.type === 'ticketing' ? 'QUANTITY' : 'VOTE MULTIPLIER'}
                    </Label>
                    <div className="flex items-center bg-primary rounded-xl h-11 shadow-sm overflow-hidden px-2">
                      <button 
                        type="button" 
                        onClick={decrementVote}
                        className="text-primary-foreground hover:text-indigo-400 transition-colors p-1.5"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <input 
                        id="votes" 
                        type="number" 
                        min="1" 
                        value={voteCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setVoteCount(isNaN(val) ? 1 : Math.max(1, val));
                        }}
                        className="flex-grow text-center font-black text-base bg-transparent text-primary-foreground border-none focus:ring-0 outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button 
                        type="button" 
                        onClick={incrementVote}
                        className="text-primary-foreground hover:text-indigo-400 transition-colors p-1.5"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-accent border border-border rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground text-[8px]">Price/Unit</span>
                      <span className="text-xs font-bold text-foreground opacity-80">{votePrice} GHS</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Calculation</span>
                      <span className="text-xl font-black text-foreground">{(voteCount * votePrice).toLocaleString()} <span className="text-[10px]">GHS</span></span>
                    </div>
                  </div>

                  {event.type === 'ticketing' && (
                    <div className="pt-3 border-t border-border/50">
                      {appliedPromo ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center gap-2.5">
                            <Tag size={10} className="text-emerald-500" />
                            <div>
                              <p className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">{appliedPromo.code}</p>
                              <p className="text-[9px] font-bold text-emerald-600">-{discount.toLocaleString()} GHS Discount</p>
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            variant="link" 
                            size="sm" 
                            onClick={() => {
                              setAppliedPromo(null);
                              setPromoCode('');
                            }}
                            className="text-emerald-500 font-bold h-fit p-0 text-[10px]"
                          >
                            REMOVE
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input 
                            placeholder="PROMO CODE" 
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            className="h-9 rounded-lg border-border bg-background font-bold uppercase tracking-widest text-[8px]"
                          />
                          <Button 
                            type="button"
                            onClick={handleApplyPromo}
                            disabled={isCheckingPromo || !promoCode.trim()}
                            className="bg-primary text-primary-foreground border-none rounded-lg h-9 px-3 font-black text-[8px] tracking-widest"
                          >
                            {isCheckingPromo ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'APPLY'}
                          </Button>
                        </div>
                      )}
                      {promoError && <p className="text-[8px] font-bold text-rose-500 mt-1 ml-1">{promoError}</p>}
                    </div>
                  )}
                </div>

                {appliedPromo && (
                  <div className="bg-indigo-600 rounded-2xl p-4 flex justify-between items-center shadow-md">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-200">PAYABLE</span>
                      <span className="text-[9px] font-bold text-indigo-200/50 line-through">{(voteCount * votePrice).toLocaleString()} GHS</span>
                    </div>
                    <span className="text-2xl font-black text-white">{finalTotal.toLocaleString()} <span className="text-xs font-bold opacity-80">GHS</span></span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 justify-center">
                  <ShieldCheck size={10} className="text-emerald-500" />
                  Secured by Paystack
                </div>
              </div>

              <div className="p-6 md:p-10 pt-4 bg-background shrink-0 border-t border-border">
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={onClose}
                    disabled={isProcessing}
                    className="flex-1 h-12 rounded-xl font-black text-muted-foreground hover:text-foreground transition-all text-[9px] tracking-widest uppercase border border-transparent hover:bg-accent"
                  >
                    ABORT
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl shadow-lg shadow-indigo-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] font-black tracking-[0.1em] text-[10px] border-none"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>{event.type === 'ticketing' ? 'BUY TICKET NOW' : 'SECURE MY VOTE'}</>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
