import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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
      toast.error(err.message || 'Login failed. Please check your credentials.');
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 rounded-xl shadow-none font-bold transition-all text-sm mt-2 flex items-center justify-center gap-2"
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

          <p className="mt-8 text-center text-xs text-slate-500 font-medium">
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
