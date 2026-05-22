import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Mail, Phone, MapPin, Loader2, Send, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error('Please input all ticket fields.');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate ticket generation
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success('Your support ticket has been registered. Our help desk will contact you shortly.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      toast.error('Failed to submit. Please check parameters.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-16 max-w-6xl">
      <div className="text-center mb-10 md:mb-14">
        <span className="bg-indigo-50 border border-indigo-150 px-3.5 py-1 rounded-full text-[10px] font-black uppercase text-indigo-600 tracking-wider">
          ASVOTE HELP DESK
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mt-3">
          Contact Support Desk
        </h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto mt-2 leading-relaxed">
          Need help launching a pageant poll or buying nominee ticket passes? Drop a message below or contact us through channels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detail details */}
        <div className="space-y-4 md:space-y-6 lg:col-span-1">
          <Card className="border-none shadow-sm p-6 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Direct Channels</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-black text-slate-400">Email Address</p>
                  <p className="text-xs font-bold text-slate-900 font-mono mt-0.5 select-all">support@asvote.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600 shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-black text-slate-400">Phone Hotline</p>
                  <p className="text-xs font-bold text-slate-900 font-mono mt-0.5 select-all">+233 54 876 5432</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-black text-slate-400">Headquarters</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5 leading-normal">Accra, Greater Accra Palace Way, Ghana</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm p-6 bg-indigo-900 text-indigo-100">
            <h4 className="font-extrabold text-sm text-white mb-2 flex items-center gap-1.5">
              <HelpCircle size={16} className="text-indigo-300" /> Need Instant Help?
            </h4>
            <p className="text-[11px] leading-relaxed text-indigo-200">
              Check our Help Center page before submitting tickets. 90% of voter and payout FAQs are fully solved instantly online.
            </p>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm p-6 md:p-8 bg-white rounded-3xl">
            <h3 className="text-base font-extrabold text-slate-900 mb-6">Dispatch a support ticket</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="t-name" className="text-slate-700 font-bold text-[10px] uppercase tracking-wider">Your Name</Label>
                  <Input
                    id="t-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enoch Mensah"
                    className="border-slate-200 rounded-xl h-10"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="t-email" className="text-slate-700 font-bold text-[10px] uppercase tracking-wider">Email Address</Label>
                  <Input
                    id="t-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="enoch@domain.com"
                    className="border-slate-200 rounded-xl h-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-subject" className="text-slate-700 font-bold text-[10px] uppercase tracking-wider">Ticket Subject</Label>
                <Input
                  id="t-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Inquiry on Voting Settlement Schedule"
                  className="border-slate-200 rounded-xl h-10"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-message" className="text-slate-700 font-bold text-[10px] uppercase tracking-wider">Describe your ticket details</Label>
                <Textarea
                  id="t-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Input detailed background, event nominee IDs or transaction references here..."
                  className="border-slate-200 rounded-xl min-h-[120px]"
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 font-bold h-10 px-6 text-xs mt-2 flex items-center justify-center gap-1.5 w-full md:w-auto"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Dispatch Support Ticket
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
