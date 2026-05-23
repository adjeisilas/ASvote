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
        <span className="bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 rounded-full text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
          ASVOTE HELP DESK
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mt-3">
          Contact Support Desk
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto mt-2 leading-relaxed">
          Need help launching a pageant poll or buying nominee ticket passes? Drop a message below or contact us through channels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detail details */}
        <div className="space-y-4 md:space-y-6 lg:col-span-1">
          <Card className="border border-border/80 shadow-sm p-6 bg-card text-card-foreground">
            <h3 className="font-bold text-foreground text-sm mb-4">Direct Channels</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-black text-muted-foreground">Email Address</p>
                  <p className="text-xs font-bold text-foreground font-mono mt-0.5 select-all">support@asvote.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400 shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-black text-muted-foreground">Phone Hotline</p>
                  <p className="text-xs font-bold text-foreground font-mono mt-0.5 select-all">+233 (0) 247558915</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-black text-muted-foreground">Headquarters</p>
                  <p className="text-xs font-bold text-foreground mt-0.5 leading-normal">Accra, Greater Accra Palace Way, Ghana</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm p-6 bg-indigo-900 text-indigo-100">
            <h4 className="font-extrabold text-sm text-white mb-2 flex items-center gap-1.5">
              <HelpCircle size={16} className="text-indigo-300" /> Need Instant Help?
            </h4>
            <p className="text-[11px] leading-relaxed text-indigo-200 mb-4">
              Check our Help Center page before submitting tickets. 90% of voter and payout FAQs are fully solved instantly online.
            </p>
            <a 
              href="https://wa.me/233247558915" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all w-full shadow-md text-center"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="border border-border/80 shadow-sm p-6 md:p-8 bg-card text-card-foreground rounded-3xl">
            <h3 className="text-base font-extrabold text-foreground mb-6">Dispatch a support ticket</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="t-name" className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Your Name</Label>
                  <Input
                    id="t-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enoch Mensah"
                    className="border-border bg-background text-foreground rounded-xl h-10"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="t-email" className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Email Address</Label>
                  <Input
                    id="t-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="enoch@domain.com"
                    className="border-border bg-background text-foreground rounded-xl h-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-subject" className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Ticket Subject</Label>
                <Input
                  id="t-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Inquiry on Voting Settlement Schedule"
                  className="border-border bg-background text-foreground rounded-xl h-10"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-message" className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Describe your ticket details</Label>
                <Textarea
                  id="t-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Input detailed background, event nominee IDs or transaction references here..."
                  className="border-border bg-background text-foreground rounded-xl min-h-[120px]"
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-none font-bold h-10 px-6 text-xs mt-2 flex items-center justify-center gap-1.5 w-full md:w-auto"
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
