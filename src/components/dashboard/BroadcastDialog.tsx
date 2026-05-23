import React, { useState } from 'react';
import { notificationService } from '../../services/notificationService';
import { databaseService } from '../../services/database';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { 
  Megaphone, 
  Send, 
  Loader2, 
  AlertTriangle, 
  Info, 
  CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';
import { Notification } from '../../types';

export default function BroadcastDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<Notification['type']>('info');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Please provide both title and message");
      return;
    }

    setIsSending(true);
    try {
      const result = await notificationService.broadcastToOrganizers(title, message, type);
      await databaseService.logAction('BROADCAST_SENT', {
        title,
        type,
        recipient_count: result?.count || 0
      });
      
      toast.success(`Broadcast sent successfully to ${result?.count} organizers`);
      setIsOpen(false);
      setTitle('');
      setMessage('');
      setType('info');
    } catch (error: any) {
      console.error("Broadcast error:", error);
      toast.error(error.message || "An unexpected error occurred during broadcast");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl shadow-none h-10 px-6">
            <Megaphone size={18} />
            <span className="hidden xs:inline">Broadcast to Organizers</span>
            <span className="xs:hidden">Broadcast</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Megaphone className="text-indigo-600" />
            Global Broadcast
          </DialogTitle>
          <DialogDescription>
            Send a notification to all registered organizers on the platform.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-bold">Message Title</Label>
            <Input 
              id="title" 
              placeholder="e.g., Scheduled Maintenance" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border-slate-200"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-bold">Content</Label>
            <Textarea 
              id="message" 
              placeholder="Write your announcement here..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-xl border-slate-200 min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">Priority Level</Label>
            <div className="flex gap-2">
              {[
                { id: 'info', label: 'Info', icon: <Info size={14} />, color: 'text-blue-600' },
                { id: 'success', label: 'Success', icon: <CheckCircle2 size={14} />, color: 'text-emerald-600' },
                { id: 'warning', label: 'Alert', icon: <AlertTriangle size={14} />, color: 'text-amber-600' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setType(item.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 transition-all duration-200 ${
                    type === item.id 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-100 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <span className={item.color}>{item.icon}</span>
                  <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Preview</p>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Megaphone size={14} className="text-indigo-600" />
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-bold text-slate-900">{title || "Your Title Here"}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{message || "Your message content will appear here..."}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => setIsOpen(false)}
            className="rounded-xl font-bold"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSend}
            disabled={isSending || !title || !message}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold min-w-[120px]"
          >
            {isSending ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} className="mr-2" />
                Send Broadcast
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
