import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Lock, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required.');
      return;
    }

    setIsLoading(true);
    try {
      // In production/local preview, Supabase takes the recovery flow redirect URL matching original URL routing rules.
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast.success('System has dispatched your password reset links. Please audit your inbox or junk directory.');
      setEmail('');
    } catch (err: any) {
      console.error('Password Solicitor Exception:', err);
      toast.error(err.message || 'Server failed to dispatch resetting requests. Check address accuracy.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-950/20">
      <Card className="w-full max-w-md border border-border/80 shadow-xl shadow-slate-200/50 dark:shadow-none bg-card text-card-foreground rounded-3xl overflow-hidden p-6 md:p-8">
        <CardHeader className="space-y-1.5 pb-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
            <Lock size={26} />
          </div>
          <CardTitle className="text-2xl font-black text-foreground tracking-tight">Recover Secure Key</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Input the email mapped to your profile, and we will dispatch password recovery instructions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetRequest} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">MAPPED EMAIL ADDRESS</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail size={16} />
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder="organizer@asvote.com"
                  className="pl-10 h-11 border-border bg-background text-foreground focus-visible:ring-indigo-500 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 rounded-xl shadow-none font-bold transition-all text-sm mt-2 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Dispatching links...
                </>
              ) : (
                'Request Reset Link'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border flex justify-center">
            <Link to="/login" className="text-muted-foreground hover:text-foreground text-xs font-bold flex items-center gap-2 transition-colors">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
