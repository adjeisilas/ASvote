import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, checkSupabaseConfigured } from '../lib/supabase';
import { databaseService } from '../services/database';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { PlusCircle, Mail, User, Info, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const isIframe = typeof window !== 'undefined' && (window.self !== window.top || window.location.search.includes('showPreview=true'));
      
      if (isIframe) {
        // Activate sandbox mode for the iframe to bypass Google's cross-origin frame restriction (X-Frame-Options DENY)
        localStorage.setItem('asvote_sandbox_mode', 'true');
        
        // Let the proxy know it's in sandbox mode, and trigger the mock sign-in handler
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`,
          }
        });
        
        toast.success('Google Registration: Sandboxed preview iframe detected. Created Google profile and logged in under Silas Google Demo. (For live Google signup, test in a new tab)');
        return;
      }

      const isConfigured = checkSupabaseConfigured();
      if (!isConfigured) {
        // Mock client handles storing local mock user and triggers session refresh automatically
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`,
          }
        });
        toast.success('Successfully registered & logged in via Google (Demo Mode).');
        return;
      }

      // Live Supabase OAuth integration (handles both sign-in and sign-up dynamically)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Sign Up Error:', err);
      toast.error(err.message || 'Google registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName || !phone || !confirmPassword) {
      toast.error('All registration fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password key must contain at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Supabase Auth signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('Failed to register user account.');

      const userId = data.user.id;

      // 2. Initialize corresponding database profile
      await databaseService.updateProfile(userId, {
        displayName,
        email,
        phoneNumber: phone,
        role: 'organizer',
        status: 'pending', // Pending admin audit validation
        emailVerified: false,
      });

      toast.success('Registration successful! Please confirm your email before logging in. Your application will be assessed by admins.', {
        duration: 12000
      });
      navigate('/login');
    } catch (err: any) {
      console.error('Registration Exception:', err);
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-950/20">
      <Card className="w-full max-w-lg border border-border/80 shadow-xl shadow-slate-200/50 dark:shadow-none bg-card text-card-foreground rounded-3xl overflow-hidden p-6 md:p-8">
        <CardHeader className="space-y-1.5 pb-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
            <PlusCircle size={28} />
          </div>
          <CardTitle className="text-2xl font-black text-foreground tracking-tight">Become an Organizer</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Launch competition voting, set up pageants, or sell ticketing passes in minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Company / Name</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User size={16} />
                </span>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="AS Media Group"
                  className="pl-10 h-11 border-border bg-background text-foreground focus-visible:ring-indigo-500 rounded-xl"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Business Email</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail size={16} />
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder="asmedia@business.com"
                  className="pl-10 h-11 border-border bg-background text-foreground focus-visible:ring-indigo-500 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Contact Phone</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Phone size={16} />
                </span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+233 54 123 4567"
                  className="pl-10 h-11 border-border bg-background text-foreground focus-visible:ring-indigo-500 rounded-xl"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Set Secure Key (Password)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                className="h-11 border-border bg-background text-foreground focus-visible:ring-indigo-500 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Confirm Secure Key (Password)</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••••••"
                className="h-11 border-border bg-background text-foreground focus-visible:ring-indigo-500 rounded-xl"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="bg-muted/30 border border-border p-3.5 rounded-2xl flex items-start gap-2.5 mt-2">
              <Info size={16} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-normal">
                By registering, your account will enter <b>Pending Audit status</b>. Administrator verification is required before starting public digital currency collections.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 rounded-xl shadow-none font-bold transition-all text-sm mt-3 flex items-center justify-center gap-2 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Requesting Account...
                </>
              ) : (
                'Create Organizer Account'
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/80" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-extrabold tracking-wider">Or register with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2.5 border-border bg-background hover:bg-accent/60 dark:hover:bg-accent/20 cursor-pointer text-foreground text-sm shadow-sm transition-all"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
          >
            <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Google account
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 hover:underline">
              Log In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
