import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, checkSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { KeyRound, Mail, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if logged in already
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/organizer');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please input email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('Successfully logged in.');
      // Wait for AuthContext routing to process, or redirect manually based on metadata
    } catch (err: any) {
      console.error('Authentication Error:', err);
      let errMsg = err.message || 'Login failed. Please check your credentials.';
      const isConfigured = checkSupabaseConfigured();
      if (isConfigured && (email.toLowerCase() === 'organizer@test.com' || email.toLowerCase() === 'admin@test.com' || email.toLowerCase() === 'organizer@asvote.com')) {
        errMsg = `Invalid login credentials. Since your custom live Supabase database is connected, default developer accounts do not exist in your user catalog yet. Please register a brand-new account first, or toggle Offline Demo Mode below to use demo credentials!`;
      } else if (errMsg.includes('Invalid login credentials')) {
        errMsg = `Invalid login credentials. Please verify your email and secure key, or register a new administrator/organizer profile.`;
      }
      toast.error(errMsg, { duration: 8000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      toast.error(err.message || 'Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-950/20">
      <Card className="w-full max-w-md border border-border/80 shadow-xl shadow-slate-200/50 dark:shadow-none bg-card text-card-foreground rounded-3xl overflow-hidden p-6 md:p-8">
        <CardHeader className="space-y-1.5 pb-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
            <ShieldCheck size={28} />
          </div>
          <CardTitle className="text-2xl font-black text-foreground tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Sign in to manage your events, ticket orders, or tournament polls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Email Address</Label>
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

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline"
                >
                  Forgot Key?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <KeyRound size={16} />
                </span>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  className="pl-10 h-11 border-border bg-background text-foreground focus-visible:ring-indigo-500 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 rounded-xl shadow-none font-bold transition-all text-sm mt-2 flex items-center justify-center gap-2 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Identity...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/80" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-extrabold tracking-wider">Or login with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2.5 border-border bg-background hover:bg-accent/60 dark:hover:bg-accent/20 cursor-pointer text-foreground text-sm shadow-sm transition-all"
            onClick={handleGoogleSignIn}
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

          <p className="mt-8 text-center text-xs text-slate-500 font-medium pb-2">
            Don't have an ASVote account?{' '}
            <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline">
              Register as Organizer
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
